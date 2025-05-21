# Monitoring and Orchestration of Job Queues and Workers

## Overview
This document describes how job queues and background workers are managed in the current codebase, how to monitor them, and recommendations for robust orchestration—especially when deploying on Render.com.

---

## How Jobs and Workers Are Managed
- **Job Queue:**
  - The application uses [ARQ](https://arq-docs.helpmanual.io/) (a Python async job queue) with Redis as the broker.
  - Jobs (e.g., document ingestion) are enqueued from the API (see `core/api.py`) and processed by a background worker (`core/workers/ingestion_worker.py`).
- **Worker Process:**
  - The worker is started as a subprocess (see `start_server.py`) and runs continuously, polling Redis for new jobs.
  - Worker concurrency and reliability are configured in `WorkerSettings` in `ingestion_worker.py` (e.g., `max_jobs`, `job_timeout`, `max_tries`).
- **Logging:**
  - Worker logs are written to `logs/worker.log` and job-specific logs to `logs/worker_ingestion.log`.

---

## Where to Monitor Job Queues
- **Redis:**
  - The job queue is backed by Redis. You can inspect queue length and job status directly in Redis using tools like `redis-cli` or a Redis GUI.
  - The ARQ worker's health check logs Redis memory, client, and job stats to `logs/worker_ingestion.log`.
- **Logs:**
  - All worker activity, job lifecycle events, and errors are logged in `logs/worker.log` and `logs/worker_ingestion.log`.
  - API endpoints `/logs/list` and `/logs/{log_path}` allow you to view logs via HTTP (see `core/api.py`).
- **API Endpoints:**
  - There is currently no dedicated admin dashboard for job queue monitoring, but logs and job status can be accessed via the API and log files.

---

## Recommendations for Robust Orchestration
- **Scaling Workers:**
  - The number of concurrent jobs is set in `max_jobs` in `WorkerSettings`. For higher throughput, increase this value and/or run multiple worker processes (e.g., by starting more background workers on Render.com).
  - Render.com supports running multiple background worker instances. You can scale workers up/down via the Render Dashboard.
- **Health Checks:**
  - The ARQ worker includes a periodic health check that logs Redis and job stats. Consider exposing these stats via an API endpoint or admin dashboard for real-time monitoring.
- **Admin Dashboard:**
  - The most straightforward way to monitor job queues and worker health is to build an admin dashboard that:
    - Shows queue length, job status, and worker health (by querying Redis and/or parsing logs)
    - Allows viewing and filtering logs
    - Optionally exposes metrics (e.g., via Prometheus/OpenTelemetry)
- **Render.com Features:**
  - Render provides in-dashboard metrics, logs, and autoscaling for background workers. You can monitor resource usage and scale workers from the Render Dashboard.
  - For advanced monitoring, integrate with third-party tools (e.g., Datadog, OpenTelemetry streaming).

---

## Extending Monitoring and Orchestration
- **Expose Job Stats via API:**
  - Add endpoints to expose ARQ/Redis job stats (queue length, job status, failures, etc.)
- **Admin Dashboard:**
  - Build a simple web UI for admins to view job queues, worker status, and logs in real time.
- **Autoscaling:**
  - Use Render's autoscaling or implement custom logic to scale worker instances based on queue length or resource usage.
- **Alerting:**
  - Add alerting for job failures, queue backlogs, or worker crashes (e.g., via email, Slack, or Render notifications).

---

## Best Practices Table
| Area                | Best Practice                                      | Code Reference                        |
|---------------------|----------------------------------------------------|---------------------------------------|
| Job Queue           | Use Redis-backed ARQ for async jobs                 | `core/api.py`, `ingestion_worker.py`  |
| Worker Management   | Configure concurrency, retries, timeouts            | `WorkerSettings` in `ingestion_worker.py` |
| Monitoring          | Log health/job stats, expose via API/dashboard      | `health_check` in `ingestion_worker.py`, `/logs` endpoints |
| Scaling             | Use Render Dashboard to scale worker instances      | Render.com Dashboard                  |
| Alerting            | Add alerts for failures/backlogs                    | Extend health check, use Render alerts|
| Admin Dashboard     | Build UI for job/worker/log monitoring              | (To be implemented)                   |

---

## References
- [`core/workers/ingestion_worker.py`](../../core/workers/ingestion_worker.py)
- [`start_server.py`](../../start_server.py)
- [`core/api.py`](../../core/api.py)
- [Render.com Background Workers](https://render.com/docs/background-workers)
- [Render.com Monitoring & Logs](https://render.com/docs/logging) 