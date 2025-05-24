# Authentication & RBAC System Implementation

## Overview

**Implementation Date:** January 2025  
**Status:** ✅ **PRODUCTION READY**  
**Testing Status:** ✅ **FULLY TESTED AND VERIFIED**

Moongraph now has a complete, production-ready authentication and Role-Based Access Control (RBAC) system integrating Auth0, NextAuth.js, JWT verification, user provisioning, and granular resource permissions.

## System Architecture

```mermaid
graph TD
    User[User Browser] --> Frontend[Next.js + NextAuth.js]
    Frontend --> Auth0[Auth0 Universal Login]
    Frontend --> APIRoute[/api/test-auth NextJS Route]
    APIRoute --> Backend[Morphik Core FastAPI]
    Backend --> JWT[JWT Verification + JWKS]
    Backend --> DB[(PostgreSQL RBAC Schema)]
    Backend --> UserProv[User Provisioning]
```

## Core Components

### 1. Authentication Flow
- **Auth0**: Identity Provider with Universal Login
- **NextAuth.js**: Client-side session management
- **JWT Verification**: RS256 signature verification with JWKS
- **User Provisioning**: Automatic user creation on first login

### 2. Authorization System  
- **Role-Based Access Control (RBAC)**: Granular permissions system
- **Resource-Specific Permissions**: Folder-level access control
- **Team-Based Permissions**: Team inheritance and role assignments
- **Dynamic Permission Resolution**: Real-time permission checking

## Implementation Details

### Authentication Stack

**Frontend (Next.js):**
```javascript
// NextAuth.js configuration with Auth0 provider
// File: frontend/src/app/api/auth/[...nextauth]/route.js
Auth0Provider({
  clientId: process.env.AUTH0_CLIENT_ID,
  clientSecret: process.env.AUTH0_CLIENT_SECRET,
  issuer: process.env.AUTH0_ISSUER_BASE_URL,
  authorization: {
    params: {
      audience: process.env.AUTH0_API_IDENTIFIER,
    },
  },
})
```

**Backend (FastAPI):**
```python
# JWT verification with JWKS
# File: morphik-core/core/auth_utils.py
async def verify_auth0_jwt(token: str) -> dict:
    # JWKS key retrieval and JWT signature verification
    # Claims validation (iss, aud, exp)
    # Returns decoded payload
```

### RBAC Database Schema

**Core Tables:**
- `users` - User profiles linked to Auth0 IDs
- `teams` - Team ownership and management
- `permissions` - Granular permission definitions
- `roles` - Permission groupings (e.g., FolderViewer, FolderEditor, FolderAdmin)
- `user_folder_roles` - User-specific folder permissions
- `team_folder_roles` - Team-based folder permissions

**Permission Examples:**
- `folder:read` - View folder contents
- `folder:write` - Modify folder contents  
- `folder:admin` - Full administrative control

### User Provisioning Flow

```python
# Automatic user creation on first API call
# File: morphik-core/core/auth_utils.py
async def _get_or_create_db_user(auth0_user_id: str, payload: dict) -> dict:
    # 1. Look up user by Auth0 ID
    # 2. If not found, create new user record
    # 3. Return user data for AuthContext
```

## Key Features Implemented

### ✅ Complete Auth0 Integration
- Universal Login flow
- Social login support (Google configured)
- JWT token generation with proper audience/issuer
- Token refresh handling via NextAuth.js

### ✅ Robust JWT Verification
- JWKS-based signature verification
- Comprehensive claims validation
- Proper error handling for expired/invalid tokens
- Production-ready security standards

### ✅ User Database Integration
- Auth0 ID → Internal user ID mapping
- Profile synchronization (email, name, avatar)
- First-login user provisioning
- Audit timestamps and proper constraints

### ✅ RBAC Permission System
- Hierarchical role definitions
- Granular permission assignments
- Resource-specific access control
- Team-based permission inheritance

### ✅ Frontend Integration
- NextAuth.js session management
- API route proxy pattern for backend calls
- React components with authentication hooks
- Proper error handling and loading states

## Configuration

### Environment Variables

**Frontend (.env.local):**
```bash
AUTH0_CLIENT_ID=your_auth0_client_id
AUTH0_CLIENT_SECRET=your_auth0_client_secret  
AUTH0_ISSUER_BASE_URL=https://dev-bj04f3rw7n8tgam8.us.auth0.com
AUTH0_API_IDENTIFIER=https://api.moongraph.com
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=secure_random_string
NEXT_PUBLIC_API_URL=http://localhost:8000
```

**Backend (docker-compose.override.yml):**
```yaml
AUTH0_DOMAIN=dev-bj04f3rw7n8tgam8.us.auth0.com
AUTH0_API_IDENTIFIER=https://api.moongraph.com
```

**Backend Configuration (morphik.toml):**
```toml
[auth]
dev_mode = false  # Enable real JWT verification
```

## API Endpoints

### Authentication Test Endpoints
- `GET /test/auth-context` - Verify authentication and inspect AuthContext
- `GET /test/permission-check` - Test basic permission validation
- `GET /test/folder-permissions/{folder_id}` - Test resource-specific permissions

### Production Endpoints
All existing Morphik Core API endpoints now support:
- JWT-based authentication via `Authorization: Bearer <token>` header
- User context resolution via `AuthContext = Depends(verify_token)`
- Permission-based authorization checks

## Testing Infrastructure

### Comprehensive Test Coverage
- ✅ Authentication flow testing
- ✅ JWT verification testing  
- ✅ Invalid token handling
- ✅ User provisioning verification
- ✅ RBAC data seeding validation
- ✅ Resource-specific permission checking

### Frontend Test Interface
- Interactive "Test API Call" button on `/home` route
- Real-time verification of end-to-end authentication
- Full AuthContext and permission details display

## Development Workflow

### Docker Development Setup
```bash
# Start backend with hot reload
docker-compose up -d

# Start frontend
cd frontend && npm run dev
```

### Authentication Testing
1. Navigate to `http://localhost:3000`
2. Login via Auth0 (Google OAuth configured)
3. Visit `/home` route
4. Click "Test API Call" button
5. Verify successful authentication response

## Security Considerations

### Implemented Security Measures
- **JWT Signature Verification**: RSA256 with JWKS validation
- **Token Expiration**: Proper exp claim validation
- **Audience/Issuer Validation**: Prevents token misuse
- **Database Constraints**: Unique Auth0 IDs and email addresses
- **Permission Isolation**: Resource-specific access control

### Security Best Practices
- Tokens transmitted via secure HTTP headers only
- No sensitive data in client-side storage
- Proper error handling without information leakage
- Audit trails via database timestamps

## Performance Optimizations

### JWKS Caching
- Public keys cached with TTL to reduce Auth0 API calls
- Efficient key lookup by `kid` header

### Database Indexing
- Indexes on `auth0_user_id` and `email` for fast user lookups
- Foreign key indexes for permission resolution queries

## Troubleshooting

### Common Issues
1. **"Invalid or expired token"** - Check Auth0 configuration and token expiration
2. **"User not found in database"** - Verify user provisioning is working
3. **Permission denied** - Check RBAC role assignments and folder permissions

### Debug Endpoints
- `GET /test/auth-context` - Full authentication status
- Docker logs: `docker logs morphik-core-morphik-1 -f`
- Frontend dev tools: Network tab for API calls

## Future Extensions

### Ready for Implementation
- Team management API endpoints
- User invitation system
- Advanced permission management UI
- Multi-tenant application support

### RBAC Expansion Points
- Custom role creation
- Permission inheritance hierarchies
- Time-based access controls
- Advanced audit logging

## Migration Notes

### From Previous System
- Legacy access control patterns replaced with RBAC
- Existing folder access controls can be migrated to new permission system
- User data migration path established for Auth0 integration

---

**This implementation provides a solid foundation for all future authentication and authorization features in Moongraph.** 