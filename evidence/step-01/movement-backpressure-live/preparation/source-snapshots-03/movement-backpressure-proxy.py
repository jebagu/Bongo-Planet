#!/usr/bin/env python3
"""Owned byte-transparent TCP impairment. Importing this file opens no sockets."""
import argparse
import json
import os
import selectors
import socket
import sys
import time
from pathlib import Path

QUEUE_CAP = 65536
RAW_CAP = 8 * 1024 * 1024
COMMAND_CAP = 4096


class Pipe:
    def __init__(self):
        self.data = bytearray()
        self.received = 0
        self.written = 0
        self.partial_writes = 0
        self.poison = None

    def append(self, data):
        if self.poison:
            raise RuntimeError(self.poison)
        if len(self.data) + len(data) > QUEUE_CAP:
            raise ValueError('Proxy queue capacity exceeded')
        self.data.extend(data)
        self.received += len(data)

    def flush(self, destination):
        if self.poison:
            raise RuntimeError(self.poison)
        if not self.data:
            return 0
        try:
            count = destination.send(self.data)
            if type(count) is not int or count <= 0 or count > len(self.data):
                raise RuntimeError('Invalid native partial-write count')
        except BlockingIOError:
            return 0
        except Exception as error:
            self.poison = str(error)
            raise
        if count < len(self.data):
            self.partial_writes += 1
        del self.data[:count]
        self.written += count
        return count

    def snapshot(self):
        return {'received': self.received, 'written': self.written,
                'queued': len(self.data), 'partialWrites': self.partial_writes,
                'poison': self.poison}


class Commands:
    def __init__(self):
        self.sequence = 0
        self.paused = False
        self.stopping = False

    def accept(self, value):
        if set(value) != {'sequence', 'type'} or type(value['sequence']) is not int:
            raise ValueError('Malformed proxy control')
        if value['sequence'] != self.sequence + 1:
            raise ValueError('Proxy control sequence gap/duplicate')
        if value['type'] not in ('pause', 'resume', 'status', 'stop'):
            raise ValueError('Unknown proxy control')
        self.sequence = value['sequence']
        if value['type'] == 'pause':
            self.paused = True
        if value['type'] == 'resume':
            self.paused = False
        if value['type'] == 'stop':
            self.stopping = True
        return value['type']


def run(args):
    output = Path(args.output)
    output.mkdir()  # Never reuse an existing artifact directory.
    raw = {name: (output / (name + '.tcp')).open('wb') for name in ('client-to-upstream', 'upstream-to-client')}
    journal = (output / 'proxy-events.jsonl').open('w')
    selector = selectors.DefaultSelector()
    commands = Commands()
    pipes = {'client-to-upstream': Pipe(), 'upstream-to-client': Pipe()}
    sockets = {}
    eof = {'client': False, 'upstream': False}
    shutdown_sent = {'client': False, 'upstream': False}
    start = time.monotonic_ns()
    report = {'status': 'preparing', 'errors': [], 'events': 0, 'rawBytes': 0, 'options': {}, 'cleanup': {}}

    def emit(kind, **fields):
        if report['events'] >= 32768:
            raise RuntimeError('Proxy event capacity exceeded')
        row = {'index': report['events'], 'monotonicNs': str(time.monotonic_ns()), 'type': kind, **fields}
        text = json.dumps(row, separators=(',', ':'))
        if len(text.encode()) > COMMAND_CAP:
            raise RuntimeError('Proxy event payload too large')
        report['events'] += 1
        journal.write(text + '\n')
        journal.flush()
        # stdout is reserved for bounded readiness/control/error/terminal ACKs.
        if kind in ('ready', 'ack', 'failure', 'closed'):
            print(text, flush=True)
        return row

    def snapshot():
        return {'readsPaused': commands.paused, 'pipes': {name: p.snapshot() for name, p in pipes.items()},
                'eof': dict(eof), 'rawBytes': report['rawBytes']}

    listener = None
    pending_control = bytearray()
    connected = False
    try:
        listener = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        listener.setsockopt(socket.SOL_SOCKET, socket.SO_RCVBUF, 1024)
        listener.setblocking(False)
        listener.bind(('127.0.0.1', args.port))
        listener.listen(1)
        report['options']['listenerReceiveBuffer'] = listener.getsockopt(socket.SOL_SOCKET, socket.SO_RCVBUF)
        selector.register(listener, selectors.EVENT_READ, 'listener')
        os.set_blocking(sys.stdin.fileno(), False)
        selector.register(sys.stdin, selectors.EVENT_READ, 'control')
        emit('ready', port=args.port, upstream=args.upstream, options=report['options'])
        report['status'] = 'running'
        while not commands.stopping:
            if time.monotonic_ns() - start > int(args.seconds * 1e9):
                raise RuntimeError('Proxy independent lifetime expired')
            # Writes of previously read bytes continue during read pause. They
            # are included in ACK boundary queues and subsequent write records.
            for source, destination, direction in [('client', 'upstream', 'client-to-upstream'), ('upstream', 'client', 'upstream-to-client')]:
                sock = sockets.get(source)
                if sock is None:
                    continue
                mask = 0
                if connected and not commands.paused and not eof[source] and len(pipes[direction].data) < QUEUE_CAP:
                    mask |= selectors.EVENT_READ
                opposite = 'upstream-to-client' if source == 'client' else 'client-to-upstream'
                if not connected and source == 'upstream' or pipes[opposite].data:
                    mask |= selectors.EVENT_WRITE
                try:
                    selector.unregister(sock)
                except KeyError:
                    pass
                if mask:
                    selector.register(sock, mask, source)
                if eof[destination] and not pipes[opposite].data and not shutdown_sent[source]:
                    sock.shutdown(socket.SHUT_WR)
                    shutdown_sent[source] = True
                    emit('half-close', endpoint=source)
            ready = selector.select(.01)
            # Control is serviced first: pause ACK has an exact single-loop
            # boundary even if a socket had been readable in this select result.
            ready.sort(key=lambda pair: pair[0].data != 'control')
            for key, mask in ready:
                endpoint = key.data
                if endpoint == 'control':
                    data = os.read(sys.stdin.fileno(), COMMAND_CAP)
                    if not data:
                        raise RuntimeError('Control owner disappeared')
                    pending_control.extend(data)
                    if len(pending_control) > COMMAND_CAP:
                        raise RuntimeError('Control input capacity exceeded')
                    while b'\n' in pending_control:
                        line, _, tail = pending_control.partition(b'\n')
                        pending_control = bytearray(tail)
                        kind = commands.accept(json.loads(line))
                        emit('ack', command=kind, sequence=commands.sequence, boundary=snapshot())
                    continue
                if commands.stopping:
                    break
                if endpoint == 'listener':
                    client, address = listener.accept()
                    if sockets or address[0] != '127.0.0.1':
                        client.close()
                        raise RuntimeError('Unexpected additional proxy client')
                    client.setsockopt(socket.SOL_SOCKET, socket.SO_RCVBUF, 1024)
                    client.setblocking(False)
                    upstream = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                    upstream.setsockopt(socket.SOL_SOCKET, socket.SO_RCVBUF, 1024)
                    upstream.setblocking(False)
                    upstream.connect_ex(('127.0.0.1', args.upstream))
                    sockets.update(client=client, upstream=upstream)
                    report['options'].update(clientReceiveBuffer=client.getsockopt(socket.SOL_SOCKET, socket.SO_RCVBUF), upstreamReceiveBuffer=upstream.getsockopt(socket.SOL_SOCKET, socket.SO_RCVBUF))
                    emit('accepted', address=address, options=report['options'])
                    continue
                sock = sockets[endpoint]
                if endpoint == 'upstream' and not connected and mask & selectors.EVENT_WRITE:
                    error = sock.getsockopt(socket.SOL_SOCKET, socket.SO_ERROR)
                    if error:
                        raise OSError(error, 'Upstream connection failed')
                    connected = True
                    emit('connected')
                if mask & selectors.EVENT_WRITE:
                    direction = 'upstream-to-client' if endpoint == 'client' else 'client-to-upstream'
                    before = pipes[direction].snapshot()
                    count = pipes[direction].flush(sock)
                    if count:
                        emit('write', direction=direction, bytes=count, before=before, after=pipes[direction].snapshot())
                if mask & selectors.EVENT_READ and not commands.paused:
                    direction = 'client-to-upstream' if endpoint == 'client' else 'upstream-to-client'
                    capacity = QUEUE_CAP - len(pipes[direction].data)
                    if capacity <= 0:
                        continue
                    data = sock.recv(min(8192, capacity))
                    if not data:
                        eof[endpoint] = True
                        emit('eof', endpoint=endpoint, boundary=snapshot())
                    else:
                        if report['rawBytes'] + len(data) > RAW_CAP:
                            raise RuntimeError('Raw proxy retention capacity exceeded')
                        raw[direction].write(data)
                        raw[direction].flush()
                        report['rawBytes'] += len(data)
                        pipes[direction].append(data)
                        emit('read', direction=direction, bytes=len(data), after=pipes[direction].snapshot())
        report['status'] = 'stopped'
    except Exception as error:
        report['status'] = 'failed'
        report['errors'].append(repr(error))
        try:
            emit('failure', error=repr(error), boundary=snapshot())
        except Exception as reporting_error:
            report['errors'].append('failure reporting: ' + repr(reporting_error))
    finally:
        report['finalBoundary'] = snapshot()
        report['elapsedSeconds'] = (time.monotonic_ns() - start) / 1e9
        for sock in sockets.values():
            sock.close()
        if listener:
            listener.close()
        selector.close()
        for stream in raw.values():
            stream.close()
        report['cleanup'] = {'socketsClosed': True, 'listenerClosed': True, 'selectorClosed': True, 'rawClosed': True}
        try:
            emit('closed', status=report['status'], cleanup=report['cleanup'], boundary=report['finalBoundary'])
        except Exception as reporting_error:
            report['status'] = 'failed'
            report['errors'].append('terminal reporting: ' + repr(reporting_error))
        finally:
            journal.close()
            report['cleanup']['journalClosed'] = True
            (output / 'proxy-report.json').write_text(json.dumps(report, indent=2) + '\n')
    return 0 if report['status'] == 'stopped' else 1


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--port', type=int, required=True)
    parser.add_argument('--upstream', type=int, required=True)
    parser.add_argument('--output', required=True)
    parser.add_argument('--seconds', type=float, default=80)
    args = parser.parse_args()
    if not 0 < args.seconds <= 80 or args.port != 5426 or args.upstream != 5427:
        parser.error('Require fixed owned5426→5427 and lifetime≤80seconds')
    sys.exit(run(args))
