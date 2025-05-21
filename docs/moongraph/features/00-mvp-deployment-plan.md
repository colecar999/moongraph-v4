# MVP Deployment Plan: Vercel (Frontend) & Render (Backend)

---

## Overview
This document is a working checklist and plan for deploying the Morphik MVP:
- **Frontend:** Vercel (Next.js/React)
- **Backend/API:** Render (FastAPI, ARQ worker, Postgres, Redis)
- **Goal:** Get a live, production-ready MVP with clear separation of local and production environments.

---

## 1. Prerequisites
- [x] GitHub repository connected (done)
- [x] Local development environment working (done)
- [x] Vercel account (for frontend)
- [x] Render account (for backend, Postgres, Redis)

---

## 2. Environment Variables & Configuration
- [x] **List all required env variables for both local and prod**
    - API keys, DB URLs, JWT secrets, etc.
    - Documented in `.env.example` and this file
- [x] **Create `.env` for local development**
- [x] **Set environment variables in Vercel and Render dashboards for production**
- [x] **Ensure `morphik.toml` and other config files support both local and prod overrides**

---

## 3. Backend (Render)
- [x] **Dockerize API if not already**
- [x] **Create Render services:**
    - [x] Web Service: Morphik API (FastAPI)
    - [ ] Background Worker: ARQ worker
    - [x] Managed Postgres (with pgvector)
    - [x] Managed Redis
- [x] **Configure build & start commands**
- [x] **Set environment variables in Render dashboard**
- [x] **Test API health endpoint in Render** (pending verification)
- [ ] **Set up custom domain (optional)**
- [ ] **Enable autoscaling (optional, paid)**

---

## 4. Frontend (Vercel)
- [ ] **Connect GitHub repo to Vercel**
- [ ] **Configure build settings (Next.js, etc.)**
- [ ] **Set environment variables (API URL, etc.)**
- [ ] **Test frontend build and deployment**
- [ ] **Set up custom domain (optional)**

---

## 5. Integration & Testing
- [ ] **Test end-to-end flow (frontend <-> backend <-> DB/Redis)**
- [ ] **Check CORS settings**
- [ ] **Check authentication flow (JWT, etc.)**
- [ ] **Test file uploads, downloads, and other key features**
- [ ] **Monitor logs in Render and Vercel**

---

## 6. Documentation & Handover
- [ ] **Update README with deployment instructions**
- [x] **Document all environment variables and secrets**
- [ ] **Document any manual steps for deployment**
- [ ] **Add links to Render and Vercel dashboards**

---

## 7. Future Enhancements (Post-MVP)
- [ ] Add preview/staging environments
- [ ] Add monitoring/alerting (e.g., health checks, error notifications)
- [ ] Automate cache invalidation, job queue monitoring, etc.
- [ ] Integrate third-party auth provider (Auth0, Clerk, etc.) for production

---

## 8. References
- [08-deployment-infra.md](../architecture/08-deployment-infra.md)
- [authentication.md](./authentication.md)
- [monitoring-and-orchestration.md](./monitoring-and-orchestration.md)

---

**Next Steps:**
- [ ] Deploy and test the ARQ worker on Render
- [ ] Connect and deploy the new frontend (`/frontend`) to Vercel
- [ ] Set environment variables in Vercel for production
- [ ] Test full integration (frontend <-> backend)
- [ ] Document any manual deployment steps and update README

**This is a living document. Update as you go!** 