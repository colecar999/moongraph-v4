# Project Moongraph v4: Setup and Planning

## 1. Overview

This document outlines the setup, structure, and development plan for Project Moongraph v4. This project aims to build a RAG (Retrieval Augmented Generation) application utilizing the open-source Morphik framework.

- **Core RAG Engine:** Morphik (Open Source: [https://github.com/morphik-org/morphik-core](https://github.com/morphik-org/morphik-core))
- **Project Repository:** [https://github.com/colecar999/moongraph-v4](https://github.com/colecar999/moongraph-v4)

## 2. Project Structure

```
moongraph-v4/
├── .git/
├── .gitmodules
├── morphik-core/          # Git submodule for Morphik
├── frontend/              # Custom application code (Next.js frontend)
│   └── (frontend_structure_tbd)
├── docs/
│   ├── planning/
│   │   └── 001-setup.md   # This document
│   └── morphik/           # Copied Morphik documentation
│       └── site-documentation/
│           ├── 01-getting-started.md
│           ├── 02-configure-morphik.md
│           ├── 04-user-folder-scoping.md
│           ├── 05-rules-processing.md
│           ├── 06-retrieving-images.md
│           ├── 07-knowledge-graphs.md
│           ├── 08-morphik-ui.md
│           └── 09-api-reference.md
├── docker-compose.yml     # For local Morphik backend and DB (likely from morphik-core)
└── README.md
```

## 3. Key Components & Technologies

*   **Backend (Morphik):**
    *   FastAPI application (from `morphik-core`)
    *   Database (PostgreSQL, as per `morphik-core` defaults)
    *   Deployment:
        *   Local: Docker
        *   Production: Render
*   **Frontend (Custom):**
    *   Next.js
    *   Components will be adapted from `morphik-core/ee/frontend` (if applicable) and custom-built.
    *   Deployment:
        *   Production: Vercel
*   **Documentation:**
    *   Located in `/docs`
    *   Planning and progress tracked in `/docs/planning`

## 4. Setup & Development Plan

### Phase 1: Initial Setup & Morphik Integration (Current)

1.  [x] Initialize project directory structure (`/frontend`, `/docs/planning`, `/docs/morphik/site-documentation`).
2.  [x] Create initial planning document (`docs/planning/001-setup.md`).
3.  [x] Initialize Git repository.
4.  [x] Add `morphik-core` as a Git submodule.
5.  [x] Populate `/docs/morphik/site-documentation` with Morphik documentation.
6.  [ ] Review provided documentation for detailed planning (Ongoing).
7.  [ ] Define core feature set based on Morphik capabilities (See "Key Feature Decisions" below).

### Phase 2: Morphik Backend Setup (Local Docker Environment)

1.  [x] **Configure Morphik Core:**
    *   Navigate to `morphik-core/`.
    *   [x] Copy `.env.example` to `.env`. Populate with necessary API keys, especially `OPENAI_API_KEY`.
    *   [x] Review and customize `morphik.toml`:
        *   [x] Ensure `[api]` section has `host = "0.0.0.0"` for Docker accessibility.
        *   [x] Set `[morphik]` `mode = "self_hosted"`.
        *   [x] Configure `[registered_models]` to use OpenAI models.
        *   [x] Update `[completion]`, `[embedding]`, `[rules]`, and `[graph]` sections to reference OpenAI models.
        *   [x] Adjust other sections for Docker (PostgreSQL, pgvector, local storage).
    *   [x] Modify `morphik-core/core/logging_config.py` to respect the `LOG_LEVEL` environment variable (e.g., `DEBUG` from `docker-compose.yml`) for file logging to `logs/morphik.log`.
2.  [x] **Launch Morphik Services using Docker Compose:**
    *   From the `morphik-core/` directory, run: `docker compose up --build -d`.
3.  [x] **Test Morphik API Endpoints:**
    *   [x] API server responding on `http://localhost:8000` (e.g., check `/docs`).
4.  [ ] **Commit Configuration Changes:**
    *   Commit changes to `morphik.toml` and `core/logging_config.py` within the `morphik-core` submodule.
    *   Commit the submodule update in the main `moongraph-v4` project.
5.  [ ] **Rebuild and Restart Docker (if not already done after logging config change):**
    *   `cd morphik-core && docker compose down && docker compose up --build -d`.
6.  [ ] **Verify Enhanced Logging:**
    *   Check `morphik-core/logs/morphik.log` for DEBUG level messages.

### Phase 3: Frontend Development

1.  [ ] Set up Next.js project in `/frontend`.
2.  [ ] Design basic UI/UX.
3.  [ ] Integrate frontend with the local Morphik API.
4.  [ ] Develop core frontend components:
    *   File upload/ingestion interface.
    *   Search/query interface.
    *   Results display.
    *   Adapt components from `morphik-core/ee/ui-component` as needed. This UI runs on `http://localhost:3000` and interacts with the backend at `http://localhost:8000`.

### Phase 4: Deployment

1.  [ ] Deploy Morphik backend (FastAPI app & DB) to Render.
    *   Configure environment variables on Render.
    *   Set up CI/CD for backend if possible.
2.  [ ] Deploy Next.js frontend to Vercel.
    *   Configure environment variables on Vercel (pointing to Render backend).
    *   Set up CI/CD for frontend.

### Phase 5: Testing & Refinement

1.  [ ] End-to-end testing.
2.  [ ] Performance optimization.
3.  [ ] User feedback and iteration.

## 5. Progress Tracking

*(This section will be updated as tasks are completed)*

*   **[YYYY-MM-DD]**: Phase 1 - Initial project structure (`/frontend`, `/docs`) and planning document created. Git repo initialized and `morphik-core` added as submodule. Morphik documentation added.

## 6. Key Feature Decisions

*   **Models:**
    *   [x] Default LLM for general queries: OpenAI (e.g., `gpt-4o` or similar - specific model to be confirmed in `morphik.toml`).
    *   [x] Default embedding model: OpenAI (e.g., `text-embedding-3-small` - specific model to be confirmed in `morphik.toml`).
*   **Core Morphik Capabilities:**
    *   [ ] **Visual Data Handling (ColPali):** Deferred. Will not be implemented initially.
    *   [x] **Rules-Based Processing:** Yes. The application will leverage Morphik's rules engine for metadata extraction and/or content transformation.
    *   [x] **Knowledge Graphs:** Yes. This is a critical feature. The application will build and query knowledge graphs.
    *   [x] **User/Folder Scoping:** Yes. The application will be multi-user and will utilize folder scoping for data organization.

---
*This is a living document and will be updated as the project progresses.* 