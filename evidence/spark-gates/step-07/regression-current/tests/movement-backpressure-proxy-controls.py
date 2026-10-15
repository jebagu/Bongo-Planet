"""Pure buffer/control checks; no network, process, browser or service is opened."""
import runpy
import unittest

module = runpy.run_path('scripts/movement-backpressure-proxy.py', run_name='proxy_source_controls')
Pipe, Commands, CAP = module['Pipe'], module['Commands'], module['QUEUE_CAP']


class Destination:
    def __init__(self, counts):
        self.counts = iter(counts)
        self.bytes = bytearray()

    def send(self, data):
        count = next(self.counts)
        if isinstance(count, Exception):
            raise count
        self.bytes.extend(data[:count])
        return count


class TransparentBufferControls(unittest.TestCase):
    def test_partial_writes_preserve_literal_masked_binary_bytes(self):
        expected = b'\x81\x83\x01\x02\x03\x04\xff\x00\x80'
        pipe = Pipe(); pipe.append(expected)
        destination = Destination([3, BlockingIOError(), 2, 4])
        self.assertEqual(pipe.flush(destination), 3)
        self.assertEqual(pipe.snapshot()['queued'], 6)
        self.assertEqual(pipe.flush(destination), 0)
        pipe.flush(destination); pipe.flush(destination)
        self.assertEqual(bytes(destination.bytes), expected)
        self.assertEqual(pipe.snapshot(), {'received': 9, 'written': 9, 'queued': 0, 'partialWrites': 2, 'poison': None})

    def test_capacity_does_not_overread_or_discard_existing_bytes(self):
        pipe = Pipe(); pipe.append(b'a' * CAP)
        with self.assertRaises(ValueError): pipe.append(b'b')
        self.assertEqual(pipe.received, CAP); self.assertEqual(bytes(pipe.data), b'a' * CAP)

    def test_native_write_failure_poison_prevents_later_false_progress(self):
        pipe = Pipe(); pipe.append(b'abc')
        with self.assertRaises(OSError): pipe.flush(Destination([OSError('native write failed')]))
        with self.assertRaises(RuntimeError): pipe.append(b'd')
        with self.assertRaises(RuntimeError): pipe.flush(Destination([3]))
        self.assertEqual(bytes(pipe.data), b'abc'); self.assertEqual(pipe.written, 0)

    def test_invalid_native_write_count_is_rejected(self):
        for count in [0, 4, True]:
            pipe = Pipe(); pipe.append(b'abc')
            with self.assertRaises(RuntimeError): pipe.flush(Destination([count]))

    def test_pause_resume_sequence_preserves_both_queue_boundaries(self):
        commands = Commands(); a, b = Pipe(), Pipe(); a.append(b'1234'); b.append(b'xyz')
        a.flush(Destination([1])); commands.accept({'sequence': 1, 'type': 'pause'})
        self.assertTrue(commands.paused)
        self.assertEqual((a.snapshot()['queued'], b.snapshot()['queued']), (3, 3))
        commands.accept({'sequence': 2, 'type': 'status'}); self.assertTrue(commands.paused)
        commands.accept({'sequence': 3, 'type': 'resume'}); self.assertFalse(commands.paused)
        self.assertEqual(bytes(a.data), b'234'); self.assertEqual(bytes(b.data), b'xyz')

    def test_control_missing_duplicate_reorder_and_wrong_types_reject(self):
        for value in [{'sequence': 2, 'type': 'pause'}, {'sequence': True, 'type': 'pause'}, {'sequence': 1, 'type': 'inject'}, {'sequence': 1, 'type': 'pause', 'bytes': 'fake'}]:
            with self.assertRaises(ValueError): Commands().accept(value)
        commands = Commands(); commands.accept({'sequence': 1, 'type': 'pause'})
        with self.assertRaises(ValueError): commands.accept({'sequence': 1, 'type': 'resume'})
        self.assertTrue(commands.paused)


if __name__ == '__main__':
    unittest.main()
