# End User Process Visibility: Structured Telemetry for User-Facing Progress

## Why Current Telemetry Is Not Enough
- The existing telemetry (OpenTelemetry traces/metrics, logs) is designed for backend monitoring and debugging.
- It provides robust analytics for developers and operators, but is not real-time or granular enough for end user progress updates.
- Telemetry data is often batched, delayed, and anonymized, making it unsuitable for per-user, real-time feedback.

## Requirements for User-Facing Progress Tracking
- **Real-time updates**: Users should see live progress as their document is ingested, a graph is built, or an agent is working.
- **Granular state**: Each major step (e.g., parsing, chunking, embedding, storing, graph merging, tool calls) should be tracked.
- **Per-operation visibility**: Progress should be queryable by job/session/operation ID.
- **Extensible**: Easy to add new steps or processes in the future.
- **Separation of concerns**: User-facing progress tracking should be distinct from backend monitoring telemetry.

## Robust Architecture for End User Progress Tracking

### 1. **Progress State Model**
- Add a `progress` or `status` field to the relevant database tables (e.g., `documents`, `jobs`, `graphs`).
- Use a structured object or enum to represent each step (e.g., `parsing`, `embedding`, `completed`, `failed`).
- Optionally, store timestamps and error messages for each step.

### 2. **Event-Driven Updates**
- Emit progress events from service code at each major step (e.g., via a message queue, pub/sub, or websocket).
- UI clients can subscribe to these events for real-time updates.

### 3. **Polling API**
- Provide an endpoint (e.g., `/progress/{job_id}`) that returns the current progress state for a given operation.
- Useful for clients that cannot use websockets or event streams.

### 4. **Instrumentation in Service Code**
- In `DocumentService`, `GraphService`, and `MorphikAgent`, update the progress state at each major step:
  ```python
  # Example: Document Ingestion
  document.status = 'parsing'
  db.save(document)
  # ... parsing logic ...
  document.status = 'embedding'
  db.save(document)
  # ... embedding logic ...
  document.status = 'completed'
  db.save(document)
  ```
- Emit events or update the database as each step completes or fails.

### 5. **Extensibility**
- Use a flexible schema (e.g., JSON field or normalized progress table) to support new steps or processes.
- Design for multiple concurrent operations per user.

## Example: Document Ingestion Progress
- **States:** `queued` → `parsing` → `chunking` → `embedding` → `storing` → `completed`/`failed`
- **API:** `/progress/{document_id}` returns `{ status: 'embedding', step: 3, total_steps: 5 }`
- **Events:** Emit `progress` events on a websocket or pub/sub channel for real-time UI updates.

## Example: Agent Operation Progress
- Track each tool call and loop iteration.
- Expose current tool, arguments, and result (if available) to the user.

## Best Practices Summary Table

| Principle                  | Recommendation                                  |
|----------------------------|-------------------------------------------------|
| Real-time updates          | Use events/websockets or frequent polling       |
| Granular state             | Track each major step, not just start/end       |
| Per-operation visibility   | Use job/session/operation IDs                   |
| Extensible schema          | Support new steps and processes easily          |
| Separate from monitoring   | Do not rely on backend telemetry for user UI    |
| Error handling             | Expose errors and failure states to the user    |

## Conclusion
- For robust end user visibility, build a dedicated progress tracking system, separate from backend telemetry.
- Instrument your service code to update progress at each step, and expose this state to users via APIs or real-time events.
- This approach enables transparent, user-friendly feedback for long-running or complex operations, improving user trust and experience. 