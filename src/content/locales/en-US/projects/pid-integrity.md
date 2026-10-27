## What the detector checks

This Go detector checks for cases where Sysmon process events stop lining up. The project looks at PID mutation and kernel tampering, which can make endpoint telemetry unreliable.

A mismatch should trigger an investigation. On its own, it doesn’t prove kernel tampering.

## ProcessGuid mismatch

When the detector sees a Sysmon Process Create event (Event ID 1), it records the ProcessGuid for that PID. If a later event uses the same PID but a different ProcessGuid, it flags the mismatch for review.

The alert includes details an analyst can check: event time, host, image path, parent process, and ingestion order.

## Activity after termination

The second check records process termination events (Event ID 5). If Sysmon later reports network or process-access activity for that same process, it flags the sequence.

Events can arrive late or out of order, so the detector keeps both event time and ingestion time. That helps separate delivery delays from a real inconsistency.

## Limits and next steps

- Windows can reuse PIDs, so PID alone is not a durable identity.
- Event delivery can be delayed or reordered; compare event time and ingestion time.
- Correlate ProcessGuid, host, process image, creation and termination events before escalation.
- Treat findings as anomalies for investigation, not proof that a specific kernel structure was patched.

The detector is still in progress. Next steps are replayable test data for normal process creation, PID reuse, late events, and mismatched identities.
