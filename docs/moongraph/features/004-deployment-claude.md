# Deployment Plan: Moongraph v4 to Production

## Overview

This document outlines the complete deployment strategy for Moongraph v4, transitioning from local development to production with:
- **Frontend**: Vercel hosting with custom domain `moongraph.io`
- **Backend**: Render.com hosting with custom domain `api.moongraph.io`
- **Authentication**: Auth0 with invitation-based user onboarding
- **Email**: SendGrid integration for invitations and notifications
- **Monitoring**: Free tier solutions

## Current Architecture Analysis

### Frontend (Next.js)
- **Framework**: Next.js 15.3.2 with React 19
- **Authentication**: NextAuth.js with Auth0 integration
- **UI**: Tailwind CSS with Radix UI components
- **Current State**: Development-ready with Auth0 authentication configured

### Backend (Morphik Core)
- **Framework**: FastAPI with Python 3.11
- **Authentication**: JWT-based with Auth0 integration
- **Database**: PostgreSQL with pgvector extension
- **Cache/Queue**: Redis with ARQ worker
- **Current State**: Dockerized with comprehensive configuration

### External Services
- **Embedding Model**: Already hosted on Modal.com (ColPali service)
- **Auth Provider**: Auth0 configured for both frontend and backend

## Phase 1: Infrastructure Setup

### 1.1 Backend Deployment (Render.com)

**Services to Create:**

1. **PostgreSQL Database**
   - Create managed PostgreSQL instance with pgvector extension
   - Note the connection string for environment variables

2. **Redis Instance**
   - Create managed Redis instance
   - Note the connection string

3. **Web Service (API)**
   - Deploy from GitHub repository: `morphik-core/`
   - Docker-based deployment using existing Dockerfile
   - Custom domain: `api.moongraph.io`

4. **Background Worker Service**
   - Separate service for ARQ worker
   - Uses same Docker image with different command: `arq core.workers.ingestion_worker.WorkerSettings`

**Environment Variables for Render:**
```bash
# Core Configuration
JWT_SECRET_KEY=<generate-strong-secret-256-bit>
POSTGRES_URI=<render-postgres-connection-string>
HOST=0.0.0.0
PORT=8000
LOG_LEVEL=INFO

# Redis Configuration
REDIS_HOST=<render-redis-host>
REDIS_PORT=<render-redis-port>

# Auth0 Configuration
AUTH0_DOMAIN=dev-bj04f3rw7n8tgam8.us.auth0.com
AUTH0_API_IDENTIFIER=https://api.moongraph.com

# API Keys
OPENAI_API_KEY=<your-openai-key>
ANTHROPIC_API_KEY=<your-anthropic-key>
ASSEMBLYAI_API_KEY=<your-assemblyai-key>
UNSTRUCTURED_API_KEY=<your-unstructured-key>
MORPHIK_EMBEDDING_API_KEY=825FFC5CF77FF7376BF748BFE9FA1

# SendGrid Configuration
SENDGRID_API_KEY=<your-sendgrid-api-key>
FROM_EMAIL=noreply@moongraph.io
SUPPORT_EMAIL=support@moongraph.io

# Storage (start with local, migrate to S3 later)
STORAGE_PROVIDER=local
STORAGE_PATH=/app/storage
```

### 1.2 Frontend Deployment (Vercel)

**Project Setup:**
- Connect GitHub repository: `frontend/` directory
- Custom domain: `moongraph.io`
- Build command: `npm run build`
- Output directory: `.next`

**Environment Variables for Vercel:**
```bash
# API Configuration
NEXT_PUBLIC_API_BASE_URL=https://api.moongraph.io

# Auth0 Configuration
AUTH0_CLIENT_ID=IMnAxuDkn02IO6Liytg9fzVADV6QRhC2
AUTH0_CLIENT_SECRET=<your-auth0-client-secret>
AUTH0_ISSUER_BASE_URL=https://dev-bj04f3rw7n8tgam8.us.auth0.com
AUTH0_API_IDENTIFIER=https://api.moongraph.com
NEXTAUTH_URL=https://moongraph.io
NEXTAUTH_SECRET=<generate-strong-secret-256-bit>

# SendGrid Configuration (for frontend contact forms)
SENDGRID_API_KEY=<your-sendgrid-api-key>
FROM_EMAIL=noreply@moongraph.io
```

## Phase 2: Invitation-Based User Onboarding System

### 2.1 Request Access Landing Page

**Create new pages:**
- `/request-access` - Public page for requesting access
- `/admin/invitations` - Admin panel for managing invitations
- `/invite/[token]` - Invitation acceptance page

**Features to implement:**
1. **Request Access Form**:
   - Name, email, company, use case
   - Spam protection (reCAPTCHA or similar)
   - Email notification to admin

2. **Admin Invitation Management**:
   - Review access requests
   - Send invitations via SendGrid
   - Track invitation status

3. **Invitation Flow**:
   - Unique invitation tokens
   - Email templates with SendGrid
   - Account creation upon acceptance

### 2.2 Database Schema Updates

**Add invitation tables to backend:**
```sql
-- Access requests table
CREATE TABLE access_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    company VARCHAR(255),
    use_case TEXT,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT NOW(),
    reviewed_at TIMESTAMP,
    reviewed_by UUID REFERENCES users(id)
);

-- Invitations table
CREATE TABLE invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    used_at TIMESTAMP,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW()
);
```

### 2.3 SendGrid Email Templates

**Templates to create:**
1. **Access Request Notification** (to admin)
2. **Invitation Email** (to user)
3. **Welcome Email** (after signup)
4. **Password Reset** (if needed)

## Phase 3: Configuration Updates

### 3.1 Backend Configuration Updates

**Update `morphik-core/morphik.toml` for production:**
```toml
[auth]
jwt_algorithm = "HS256"
dev_mode = false  # Disable dev mode for production

[api]
host = "0.0.0.0"
port = 8000
reload = false  # Disable reload in production

[redis]
host = "redis"  # Will be overridden by environment variable
port = 6379
```

**Add CORS configuration for production domains:**
```python
# In core/api.py
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://moongraph.io",
        "https://www.moongraph.io",
        "http://localhost:3000",  # Keep for local development
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### 3.2 Frontend Configuration Updates

**Update environment handling:**
- Ensure production environment variables are properly loaded
- Add error boundaries for production
- Configure proper error logging

## Phase 4: Authentication & Domain Configuration

### 4.1 Auth0 Configuration Updates

**Update Auth0 Application Settings:**
- **Allowed Callback URLs**:
  - `https://moongraph.io/api/auth/callback/auth0`
  - `http://localhost:3000/api/auth/callback/auth0` (for development)
- **Allowed Logout URLs**:
  - `https://moongraph.io`
  - `http://localhost:3000` (for development)
- **Allowed Web Origins**:
  - `https://moongraph.io`
  - `http://localhost:3000` (for development)
- **Allowed Origins (CORS)**:
  - `https://moongraph.io`
  - `http://localhost:3000` (for development)

### 4.2 Domain DNS Configuration

**DNS Records to configure:**
1. **Frontend (Vercel)**:
   - `moongraph.io` → Vercel IP/CNAME
   - `www.moongraph.io` → Redirect to `moongraph.io`

2. **Backend (Render)**:
   - `api.moongraph.io` → Render IP/CNAME

## Phase 5: CI/CD Pipeline Setup

### 5.1 GitHub Actions Workflow

**Create `.github/workflows/deploy.yml`:**
```yaml
name: Deploy to Production

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test-backend:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: ./morphik-core
    steps:
      - uses: actions/checkout@v4
      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      - name: Install dependencies
        run: |
          pip install -r requirements.txt
      - name: Run tests
        run: |
          pytest core/tests/ -v

  test-frontend:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: ./frontend
    steps:
      - uses: actions/checkout@v4
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
      - name: Install dependencies
        run: npm ci
      - name: Build
        run: npm run build
      - name: Lint
        run: npm run lint

  deploy-backend:
    needs: [test-backend]
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - name: Deploy to Render
        run: |
          curl -X POST ${{ secrets.RENDER_DEPLOY_HOOK_API }}
          curl -X POST ${{ secrets.RENDER_DEPLOY_HOOK_WORKER }}

  deploy-frontend:
    needs: [test-frontend]
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - name: Deploy to Vercel
        run: echo "Vercel auto-deploys from GitHub"
```

### 5.2 Environment Management

**Environment Strategy:**
- **Development**: Local Docker setup
- **Production**: Vercel + Render
- **Optional Staging**: Can be added later if needed

## Phase 6: Free Tier Monitoring & Logging

### 6.1 Error Tracking

**Sentry Integration (Free Tier):**
- Frontend error tracking
- Backend error tracking
- Performance monitoring
- Release tracking

### 6.2 Uptime Monitoring

**UptimeRobot (Free Tier):**
- Monitor `https://moongraph.io`
- Monitor `https://api.moongraph.io/health`
- Email alerts for downtime

### 6.3 Application Monitoring

**Built-in Monitoring:**
- Render provides basic metrics
- Vercel provides analytics
- Custom health check endpoints

### 6.4 Log Management

**Render Logs:**
- Built-in log aggregation
- Log retention (limited on free tier)
- Real-time log streaming

## Phase 7: Security Hardening

### 7.1 Environment Variables Security

**Security Best Practices:**
- Use Render's environment variable encryption
- Use Vercel's environment variable encryption
- Never commit secrets to repository
- Regular secret rotation schedule

### 7.2 API Security

**Security Measures:**
- Rate limiting implementation
- CORS configuration
- Input validation and sanitization
- SQL injection prevention (already handled by SQLAlchemy)
- XSS protection

### 7.3 SSL/TLS Configuration

**Certificate Management:**
- Automatic SSL certificates via Vercel and Render
- HTTPS enforcement
- HSTS headers

## Phase 8: Production Optimizations

### 8.1 Backend Optimizations

**Performance Improvements:**
- Database connection pooling (already configured)
- Redis caching strategy
- Background job optimization
- API response compression

### 8.2 Frontend Optimizations

**Performance Improvements:**
- Image optimization (Next.js built-in)
- Bundle size optimization
- CDN configuration through Vercel
- Lazy loading implementation

### 8.3 Database Optimizations

**PostgreSQL Tuning:**
- Index optimization for common queries
- Connection pool sizing
- Query performance monitoring

## Implementation Timeline

### Week 1: Infrastructure & Basic Deployment
- [ ] Set up Render services (PostgreSQL, Redis, Web Service, Worker)
- [ ] Configure Vercel project with custom domain
- [ ] Set up environment variables for both platforms
- [ ] Configure DNS records for custom domains
- [ ] Test basic deployment and connectivity

### Week 2: Authentication & Invitation System
- [ ] Update Auth0 configuration for production domains
- [ ] Implement invitation-based onboarding system
- [ ] Create SendGrid email templates
- [ ] Set up admin panel for invitation management
- [ ] Test complete invitation flow

### Week 3: CI/CD & Monitoring
- [ ] Set up GitHub Actions workflow
- [ ] Configure Sentry for error tracking
- [ ] Set up UptimeRobot monitoring
- [ ] Implement health check endpoints
- [ ] Test automated deployment pipeline

### Week 4: Security & Go-Live
- [ ] Security audit and hardening
- [ ] Performance optimization
- [ ] Load testing
- [ ] Documentation completion
- [ ] Go-live and monitoring

## Post-Deployment Checklist

### Immediate (Day 1)
- [ ] Verify all services are running
- [ ] Test authentication flow end-to-end
- [ ] Verify email delivery works
- [ ] Check monitoring alerts are working
- [ ] Test invitation system

### Week 1
- [ ] Monitor error rates and performance
- [ ] Review logs for any issues
- [ ] Test backup and recovery procedures
- [ ] Gather initial user feedback

### Month 1
- [ ] Review usage patterns and scaling needs
- [ ] Optimize based on real usage data
- [ ] Plan for additional features
- [ ] Consider migration to paid tiers if needed

## Rollback Plan

### Emergency Rollback
1. **Frontend**: Revert to previous Vercel deployment
2. **Backend**: Revert to previous Render deployment
3. **Database**: Restore from backup if needed
4. **DNS**: Revert DNS changes if necessary

### Gradual Rollback
1. Route traffic back to development environment
2. Investigate and fix issues
3. Redeploy with fixes
4. Gradually route traffic back to production

## Support & Maintenance

### Regular Maintenance Tasks
- [ ] Weekly security updates
- [ ] Monthly dependency updates
- [ ] Quarterly performance reviews
- [ ] Annual security audits

### Monitoring & Alerts
- [ ] Set up alerts for high error rates
- [ ] Monitor database performance
- [ ] Track user growth and usage patterns
- [ ] Monitor costs and resource usage

## Cost Estimates (Monthly)

### Render.com
- **Web Service**: $7/month (Starter plan)
- **Worker Service**: $7/month (Starter plan)
- **PostgreSQL**: $7/month (Starter plan)
- **Redis**: $3/month (Starter plan)
- **Total**: ~$24/month

### Vercel
- **Hobby Plan**: Free (with custom domain)
- **Pro Plan**: $20/month (if needed for team features)

### External Services
- **Auth0**: Free tier (up to 7,000 active users)
- **SendGrid**: Free tier (100 emails/day)
- **Sentry**: Free tier (5,000 errors/month)
- **UptimeRobot**: Free tier (50 monitors)

### Total Estimated Cost
- **Minimum**: ~$24/month (Render only)
- **Recommended**: ~$44/month (with Vercel Pro)

## Next Steps

1. **Review and approve this plan**
2. **Set up Render and Vercel accounts**
3. **Configure DNS for custom domains**
4. **Begin Phase 1 implementation**
5. **Set up monitoring and alerting**

This plan provides a comprehensive roadmap for deploying Moongraph v4 to production with invitation-based onboarding, custom domains, and proper monitoring while staying within budget constraints. 