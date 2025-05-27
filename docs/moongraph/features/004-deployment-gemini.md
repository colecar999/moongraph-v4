# Moongraph Production Deployment Plan

## 1. Overview

This document outlines the plan to deploy the Moongraph application to a production environment. The frontend will be hosted on Vercel, and the backend (Morphik Core) will be hosted on Render.com. Authentication will be managed by Auth0, and email services by SendGrid. The existing embedding model on Modal.com will continue to be used.

## 2. Core Technologies & Services

*   **Frontend:** Next.js (hosted on Vercel)
*   **Backend:** Python/FastAPI (Morphik Core, hosted on Render.com using Docker)
*   **Database:** PostgreSQL with pgvector extension (on Render)
*   **Cache/Queue:** Redis (on Render, for `arq` workers and caching)
*   **Authentication:** Auth0 (using Universal Login, customized)
*   **Email:** SendGrid
*   **Embeddings:** Existing Modal.com service
*   **CI/CD:** GitHub Actions

## 3. Phase 1: Pre-Deployment Configuration & Setup

### 3.1. Auth0 Configuration
1.  **Application Setup:**
    *   Ensure an Auth0 application is configured for the Moongraph frontend.
    *   Note `Client ID`, `Client Secret`, and `Issuer Base URL`.
    *   **Allowed Callback URLs:** Add Vercel production URL (e.g., `https://<your-app>.vercel.app/api/auth/callback/auth0`) and local dev URL (`http://localhost:3000/api/auth/callback/auth0`).
    *   **Allowed Logout URLs:** Add Vercel production URL and local dev URL.
    *   **Allowed Web Origins:** Add Vercel production URL and local dev URL.
    *   **Grant Types:** Ensure "Authorization Code" and "Refresh Token" are enabled.
2.  **API Setup (for Morphik Core Backend):**
    *   Set up an Auth0 API (Resource Server) to represent the Morphik Core backend.
    *   Note the `API Identifier` (Audience).
    *   Define any necessary scopes if not just using standard `openid profile email`.
    *   Ensure "Allow Offline Access" is enabled if refresh tokens will be used by confidential clients (less common for SPA -> API flow where access tokens are renewed).
3.  **Universal Login Customization:**
    *   Customize the appearance and behavior of Auth0's Universal Login pages (login, signup, password reset).
    *   Enable desired social connections (e.g., Google, GitHub).
    *   Configure multi-factor authentication (MFA) policies as needed.
4.  **User Sign-ups:** Ensure public sign-ups are enabled in Auth0.
5.  **Email Templates:** Customize Auth0 email templates (welcome, verification, password reset).

### 3.2. SendGrid Integration
1.  **Account Setup:** Create a SendGrid account.
2.  **API Key:** Generate a SendGrid API key with permissions to send emails.
3.  **Auth0 Custom Email Provider:** Configure Auth0 to use SendGrid as the custom SMTP provider for sending emails (verification, password reset, etc.), using the generated SendGrid API key.
4.  **Application Emails (Optional):** If Morphik Core needs to send emails directly (not via Auth0), integrate the SendGrid SDK into the backend:
    *   Add `sendgrid` to `morphik-core/pyproject.toml`.
    *   Store the SendGrid API key as a secure environment variable on Render for the backend service(s).

### 3.3. Render.com Resource Provisioning
1.  **PostgreSQL:**
    *   Create a new PostgreSQL instance on Render.
    *   Enable the `pgvector` extension (available in Render's Postgres service settings).
    *   Securely store the generated database connection URI.
2.  **Redis:**
    *   Create a new Redis instance on Render.
    *   Securely store the generated Redis connection URL/details.
3.  **Persistent Disks:**
    *   Create a Render Disk for Morphik Core's `/app/storage` directory. This is **required** for persistent storage of user-uploaded files.
    *   Create a Render Disk for Morphik Core's `/root/.cache/huggingface` directory. This is **highly recommended** to persist downloaded models, reducing startup times and Hugging Face API calls.

## 4. Phase 2: Backend Deployment (Morphik Core on Render.com)

The backend will be deployed as Docker containers on Render, based on `morphik-core/dockerfile`.

### 4.1. Service Creation on Render
Create two "Private Service" or "Web Service" instances on Render from the same Git repository (`morphik-core` directory):
1.  **API Service:** For the main FastAPI application.
2.  **Worker Service:** For the `arq` background task processor.

### 4.2. Docker Configuration
*   Render will use the existing `morphik-core/dockerfile`.
*   Ensure the `dockerfile` does not include or rely on Ollama for production builds. The `morphik.toml.default` might need adjustment if it references Ollama, or ensure all such settings are overridden by environment variables.

### 4.3. Build and Start Commands (Render Service Settings)
*   **API Service Start Command:** `/app/docker-entrypoint.sh uv run uvicorn core.api:app --host 0.0.0.0 --port 8000 --loop asyncio --http auto --ws auto --lifespan auto` (or as defined in `docker-entrypoint.sh` default).
*   **Worker Service Start Command:** `/app/docker-entrypoint.sh arq core.workers.ingestion_worker.WorkerSettings`

### 4.4. Environment Variables (Render Services - API & Worker)
Set the following environment variables for both API and Worker services on Render:
*   `POSTGRES_URI`: Connection string for the Render PostgreSQL instance.
*   `PGPASSWORD`: (if part of your local setup, though URI usually includes it).
*   `REDIS_HOST`: Hostname of the Render Redis instance.
*   `REDIS_PORT`: Port of the Render Redis instance.
*   `JWT_SECRET_KEY`: **Generate a strong, unique secret.** This is used for `dev_mode` auth and for signing *internal* JWTs generated by the application.
*   `AUTH0_DOMAIN`: Your Auth0 tenant domain (e.g., `<your-tenant>.auth0.com`).
*   `AUTH0_API_IDENTIFIER`: The Audience/API Identifier for your Morphik Core API in Auth0.
*   `MODAL_EMBEDDING_ENDPOINT_URL` (or similar): URL for your Modal.com embedding service.
*   `COMPLETION_PROVIDER_API_KEY` (or similar): API key for your chosen cloud LLM completion service.
*   `COMPLETION_PROVIDER_BASE_URL` (or similar, if applicable).
*   `LOG_LEVEL`: `INFO` or `DEBUG` for production.
*   `PYTHONUNBUFFERED`: `1` (usually set in Dockerfile).
*   `HOST`: `0.0.0.0` (usually set in Dockerfile).
*   `PORT`: `8000` (or the port Render expects, usually set in Dockerfile).
*   Any other necessary API keys or configuration values.

### 4.5. `morphik.toml` Configuration for Production
The backend's configuration is managed by `morphik.toml`. For production:
*   **Strategy:** The application's `docker-entrypoint.sh` copies `morphik.toml.default` if `morphik.toml` is not found. For production, critical settings should be overridden by environment variables, or a production-specific `morphik.toml` should be securely managed.
*   **Key Settings (to be ensured via env vars or a production `morphik.toml`):**
    *   `[auth]`:
        *   `dev_mode = false` **(Critical for security)**
        *   `jwt_algorithm = "HS256"` (This is for *internal* tokens or `dev_mode`. Auth0 tokens are RS256 and verified differently).
        *   `auth0_domain = <your_auth0_domain>` (via env var)
        *   `auth0_api_identifier = <your_auth0_api_identifier>` (via env var)
    *   `[embedding]`:
        *   `provider = "modal"` (or your custom identifier for Modal).
        *   `base_url = <your_modal_endpoint_url>` (via env var).
        *   Other relevant Modal-specific parameters (e.g., model name if configurable).
    *   `[completion]`:
        *   `provider = "<your_cloud_llm_provider>"` (e.g., "openai", "anthropic").
        *   `api_key = <provider_api_key>` (via env var).
        *   `model_name = "<desired_model_name>"`.
    *   `[database]`:
        *   `provider = "postgres"` (Ensure connection details are from Render env vars).
    *   `[storage]`:
        *   `provider = "local"`
        *   `storage_path = "/app/storage"` (This path will be mounted to a Render Disk).
    *   **Remove or disable any Ollama or Stripe specific sections/configurations.**

### 4.6. Persistent Storage (Render Disk Mounts)
*   **User Uploads:** Mount the Render Disk created for user uploads to `/app/storage` in both the API and Worker service settings on Render.
*   **Hugging Face Cache:** Mount the Render Disk for Hugging Face cache to `/root/.cache/huggingface` (or the equivalent path used by `uv` if different, check Dockerfile `UV_CACHE_DIR`) in both API and Worker services.

### 4.7. Backend Authentication Logic
*   The backend's `core/auth_utils.py` contains `verify_auth0_jwt` which uses RS256 and Auth0's JWKS URI. This is the correct mechanism for validating access tokens from users.
*   Ensure that API endpoints requiring authentication use a dependency that calls this verification logic when `dev_mode` is `false`.

## 5. Phase 3: Frontend Deployment (Next.js on Vercel)

### 5.1. Vercel Project Setup
1.  Connect your GitHub repository to a new Vercel project.
2.  **Framework Preset:** Select "Next.js".
3.  **Root Directory:** Set to `frontend`.
4.  Vercel will typically auto-detect build command (`next build`) and output directory (`.next`).

### 5.2. Environment Variables (Vercel Project Settings)
*   `NEXT_PUBLIC_API_URL`: The production URL of your deployed Morphik Core API on Render (e.g., `https://your-backend-api.onrender.com`).
*   `AUTH0_CLIENT_ID`: From your Auth0 application settings.
*   `AUTH0_CLIENT_SECRET`: From your Auth0 application settings. **Mark as Secret.**
*   `AUTH0_ISSUER_BASE_URL`: Your Auth0 tenant URL (e.g., `https://<your-tenant>.auth0.com`).
*   `AUTH0_API_IDENTIFIER`: The Audience/API Identifier for your Morphik Core API in Auth0 (same as backend).
*   `NEXTAUTH_URL`: Vercel often sets this automatically (e.g., `https://<your-app>.vercel.app`). Verify this.
*   `NEXTAUTH_SECRET`: **Generate a strong, unique secret.** This is used by NextAuth.js to sign session cookies, JWTs etc.

### 5.3. Frontend Auth0 Integration
*   The existing NextAuth.js setup in `frontend/src/app/api/auth/[...nextauth]/route.js` uses Auth0.
*   Ensure custom sign-in (`/auth/signin`) and error pages (`/auth/error`) are styled and function correctly.
*   The frontend will redirect to Auth0 Universal Login for authentication.

## 6. Phase 4: CI/CD with GitHub Actions

1.  **Frontend (Vercel):**
    *   Vercel automatically deploys from the connected GitHub branch (e.g., `main`) on pushes.
    *   A GitHub Actions workflow can be added for the `frontend` directory to run tests, linting, etc., before Vercel picks up the changes.
2.  **Backend (Render):**
    *   Create a GitHub Actions workflow for the `morphik-core` directory, triggered on pushes to `main`.
    *   **Workflow Steps:**
        1.  Checkout code.
        2.  Build the Docker image (e.g., `docker build -t your-registry/morphik-core:$GITHUB_SHA ./morphik-core`).
        3.  Log in to a container registry (e.g., Docker Hub, GitHub Container Registry).
        4.  Push the Docker image (`docker push your-registry/morphik-core:$GITHUB_SHA`).
        5.  Trigger a deploy on Render for both API and Worker services using Render's deploy hook URL. Pass the new image identifier if Render supports deploying a specific image tag from your registry. (Alternatively, Render can rebuild from Git; the deploy hook simply triggers a new deploy).
    *   **Secrets:** Store Render deploy hook URLs and container registry credentials as secrets in GitHub.

## 7. Phase 5: Domain Names & DNS

1.  **Frontend (Vercel):**
    *   Add your custom domain (e.g., `app.yourdomain.com`) to the Vercel project settings.
    *   Update your DNS records at your domain registrar to point to Vercel as per their instructions.
2.  **Backend (Render):**
    *   Add a custom domain for your API service on Render (e.g., `api.yourdomain.com`).
    *   Update your DNS records accordingly.
    *   Ensure the frontend's `NEXT_PUBLIC_API_URL` environment variable uses this custom backend domain.

## 8. Phase 6: Post-Deployment

### 8.1. Local Development
*   Continue using `docker-compose.yml` for local development.
*   Local `.env` files should use local URIs (e.g., `localhost` for Postgres/Redis) and can point to a dev Auth0 application or use the production one with `http://localhost...` URLs added.
*   Local `morphik.toml` should enable `dev_mode` for auth.

### 8.2. Testing
*   **Smoke Testing:** After each deployment, verify basic functionality.
*   **End-to-End Testing:**
    *   User registration via Auth0 Universal Login.
    *   User login and logout.
    *   Core application features (file uploads, processing, retrieval).
    *   Interaction between frontend and backend.
    *   Permissions and authorization.
*   **Cross-browser/Cross-device Testing.**

### 8.3. Monitoring & Logging
*   Utilize Vercel's analytics and logging for the frontend.
*   Utilize Render's logging and metrics for the backend services (API and Worker).
*   Set up external uptime monitoring (optional, e.g., UptimeRobot).

## 9. Future Considerations (Out of Scope for Initial Deployment)
*   Stripe integration for payments.
*   Advanced monitoring and alerting (e.g., Sentry, Datadog).
*   Staging/Preview environments for more robust testing before production. 