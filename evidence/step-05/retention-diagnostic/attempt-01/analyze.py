"""Read-only same-domain diagnostic summary; creates a new analysis JSON only."""
import json
import math
from pathlib import Path

root = Path(__file__).resolve().parent
report = json.loads((root / 'report.json').read_text())


def summary(values):
    values = sorted(value for value in values if isinstance(value, (int, float)) and math.isfinite(value))
    return {'count': len(values), 'median': values[len(values) // 2] if values else None,
            'p95': values[max(0, math.ceil(len(values) * .95) - 1)] if values else None,
            'max': values[-1] if values else None,
            'total': sum(values)}


result = {'diagnosticOnly': True, 'qualificationPassed': False, 'acceptancePassed': False,
          'status': report['status'], 'elapsedMonotonicSeconds': report['elapsedMonotonicSeconds'],
          'scope': 'Same-domain instrumentation; promise lifetime includes all work before settlement. No browser-to-Node transit estimate or unique cause allocation.',
          'stages': []}
for stage in report['stages']:
    directory = root / stage['name']
    trace_file = directory / 'browser-trace.json'
    fallback = directory / 'pre-cleanup-browser-trace.json'
    trace = json.loads((trace_file if trace_file.exists() else fallback).read_text()) if trace_file.exists() or fallback.exists() else []
    node = json.loads((directory / 'node-trace.json').read_text())
    start = stage.get('exposureStart', {}).get('browserMonotonicMs')
    end = stage.get('finalExposureState', {}).get('browserMonotonicMs')
    if end is None:
        end = stage.get('browserObservation', {}).get('exposureEnd', {}).get('browserMonotonicMs')
    def inside(record):
        clock = record.get('browserMonotonicMs', record.get('receiveBrowserMonotonicMs', record.get('startTimeMs')))
        return start is not None and end is not None and clock is not None and start <= clock <= end
    handlers = [record for record in trace if record['kind'] == 'original-handler' and record.get('exposure')]
    row = {'name': stage['name'], 'status': stage['status'], 'errors': stage['errors'],
           'requestedSeconds': stage['requestedSeconds'], 'completedExposureSeconds': stage.get('elapsedMonotonicSeconds'),
           'observedExposureBrowserSpanSeconds': (end - start) / 1000 if start is not None and end is not None else None,
           'originalHandlerDurationMs': summary([record['handlerEndMs'] - record['handlerStartMs'] for record in handlers]),
           'originalHandlerRecords': sum(record['records'] for record in handlers),
           'browserHeartbeatIntervalMs': summary([record['elapsedMs'] for record in trace if record['kind'] == 'heartbeat' and inside(record)]),
           'frameGapMs': summary([record['gapMs'] for record in trace if record['kind'] == 'frame' and inside(record)]),
           'longTaskDurationMs': summary([record['durationMs'] for record in trace if record['kind'] == 'longtask' and inside(record)]),
           'nodeCallbackDurationMs': summary([record['exitMs'] - record['arrivalObservedAtCallbackEntryMs'] for record in node]),
           'nodeRawBytes': sum(record.get('rawBytes', 0) for record in node),
           'nodeJSONLBytes': sum(record.get('metadataBytes', 0) + record.get('jsonBytes', 0) for record in node),
           'browserObservation': stage.get('browserObservation'), 'lastState': stage.get('lastState'),
           'activityGuards': {'observer': stage.get('observerProgression'), 'event': stage.get('eventProgression')},
           'traceRecords': len(trace), 'nodeRecords': len(node)}
    for kind in ['pcm', 'event']:
        dispatches = {record['sequence']: record for record in trace if record['kind'] == kind + '-dispatch'}
        settlements = [record for record in trace if record['kind'] == kind + '-settlement']
        row[kind + 'Retention'] = {
            'dispatches': len(dispatches), 'successfulSettlements': sum(record.get('success') is True for record in settlements),
            'failedSettlements': sum(record.get('success') is False for record in settlements),
            'payloadConstructionMs': summary([record['payloadEndMs'] - record['payloadStartMs'] for record in dispatches.values()]),
            'dispatchIncludingProtocolSerializationMs': summary([record['dispatchEndMs'] - record['dispatchStartMs'] for record in dispatches.values()]),
            'promiseLifetimeMs': summary([record['settledBrowserMonotonicMs'] - dispatches[record['sequence']]['dispatchStartMs'] for record in settlements if record['sequence'] in dispatches]),
        }
    row['nodePhasesMs'] = {}
    for label, first, last in [('conversion', 'conversionStartMs', 'conversionEndMs'),
                               ('json', 'jsonStartMs', 'jsonEndMs'), ('append', 'appendStartMs', 'appendEndMs')]:
        row['nodePhasesMs'][label] = summary([record[last] - record[first] for record in node if first in record and last in record])
    result['stages'].append(row)
heartbeats = json.loads((root / 'node-heartbeat.json').read_text())
result['nodeHeartbeatIntervalMs'] = summary([record['elapsedMs'] for record in heartbeats])
result['limitations'] = report['limitations'] + [
    'Combined has no completed16s/final-state certificate; its observed span is a partial controller-delayed trace, not a completed arm.',
    'Browser dispatch includes hidden bridge serialization and enqueue work; Node entry cannot measure transport or pre-entry queue delay.',
    'Low synchronous original-handler cost does not exonerate deferred UI/GPU/GC work.',
    'Fresh short arms do not reproduce or clear the earlier warm-third-segment failure.',
]
with (root / 'analysis.json').open('x') as stream:
    json.dump(result, stream, indent=2)
    stream.write('\n')
print(json.dumps({'status': result['status'], 'stages': [{
    'name': stage['name'], 'status': stage['status'],
    'handlerMs': stage['originalHandlerDurationMs'], 'heartbeatMs': stage['browserHeartbeatIntervalMs'],
    'pcmDispatchMs': stage['pcmRetention']['dispatchIncludingProtocolSerializationMs'],
    'pcmPromiseMs': stage['pcmRetention']['promiseLifetimeMs'],
    'eventDispatchMs': stage['eventRetention']['dispatchIncludingProtocolSerializationMs'],
    'nodeCallbackMs': stage['nodeCallbackDurationMs'],
} for stage in result['stages']], 'nodeHeartbeatMs': result['nodeHeartbeatIntervalMs']}, indent=2))
