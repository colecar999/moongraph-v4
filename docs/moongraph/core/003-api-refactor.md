# API Refactoring Plan: Breaking Down the Monolithic api.py

## Overview

The current `morphik-core/core/api.py` file is 2,303 lines long and contains all API endpoints in a single monolithic file. This refactoring plan outlines a phased approach to break it down into modular, maintainable routers organized by functional domain.

## Current State Analysis

### Existing Structure
- **Main file**: `morphik-core/core/api.py` (2,303 lines)
- **Placeholder routers**: Already exist in `morphik-core/core/api/` but are empty
- **Enterprise pattern**: `ee/routers/` shows the target pattern with proper router organization
- **Frontend proxy pattern**: Frontend routes in `frontend/src/app/api/` proxy to backend

### Route Categories Identified
1. **Documents** (11 endpoints) - Target for Phase 1
2. **Folders** (7 endpoints)
3. **Graphs** (6 endpoints) 
4. **Ingest** (3 endpoints)
5. **Retrieval** (4 endpoints)
6. **Query/Agent** (2 endpoints)
7. **Cache** (6 endpoints)
8. **Usage/Telemetry** (2 endpoints)
9. **Health/Auth** (3 endpoints)
10. **Unified** (2 endpoints)
11. **Local Development** (1 endpoint)

## Phase 1: Documents Router (Priority)

### Scope
Move all document-related endpoints from `api.py` to `core/api/documents.py`:

#### Endpoints to Move (11 total)
1. `GET /documents` - List documents
2. `GET /documents/{document_id}` - Get document by ID
3. `GET /documents/{document_id}/status` - Get document status
4. `GET /documents/filename/{filename}` - Get document by filename
5. `DELETE /documents/{document_id}` - Delete document
6. `POST /documents/{document_id}/update_text` - Update document text
7. `POST /documents/{document_id}/update_file` - Update document file
8. `POST /documents/{document_id}/update_metadata` - Update document metadata
9. `POST /batch/documents` - Batch get documents
10. `POST /batch/chunks` - Batch get chunks
11. `POST /retrieve/docs` - Retrieve documents (semantic search)

### Implementation Plan

#### Step 1: Create Documents Router
```python
# morphik-core/core/api/documents.py
from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Any, Dict, List, Optional

from core.auth_utils import verify_token
from core.models.auth import AuthContext
from core.models.documents import Document, DocumentResult, ChunkResult
from core.services.telemetry import TelemetryService
from core.services_init import document_service

router = APIRouter(prefix="/documents", tags=["Documents"])
telemetry = TelemetryService()

# All document endpoints will be moved here
```

#### Step 2: Move Dependencies and Imports
- Import all required dependencies from the main api.py
- Ensure telemetry service is properly initialized
- Import document_service from services_init
- Import all required models and types

#### Step 3: Move Endpoint Functions
- Copy each endpoint function with its decorators
- Update route paths (remove `/documents` prefix since router has it)
- Preserve all telemetry tracking decorators
- Maintain exact same functionality and error handling

#### Step 4: Update Main API File
- Remove moved endpoints from `api.py`
- Add router inclusion:
```python
from core.api.documents import router as documents_router
app.include_router(documents_router)
```

#### Step 5: Frontend Compatibility
- **No changes required** - Frontend proxies will continue to work
- Frontend routes in `frontend/src/app/api/documents/` proxy to backend
- Backend URL structure remains the same (`/documents/*`)

#### Step 6: Testing Strategy
- Run existing test suite to ensure no regressions
- Test all document endpoints individually
- Verify telemetry tracking still works
- Test RBAC and authentication flows
- Validate frontend integration

### Dependencies and Shared Components

#### Shared Services (No Changes Required)
- `document_service` - Already imported from `services_init`
- `telemetry` - TelemetryService singleton pattern
- `verify_token` - Authentication dependency
- `get_redis_pool` - Redis dependency for background jobs

#### Models (No Changes Required)
- All Pydantic models remain in their current locations
- Import paths stay the same

#### Database Layer (No Changes Required)
- PostgresDatabase methods remain unchanged
- RBAC logic stays in database layer
- No changes to database schema or queries

### Risk Assessment

#### Low Risk Areas
- **Frontend Impact**: Zero - proxy pattern shields frontend from backend changes
- **Database**: No schema or query changes
- **Authentication**: Uses same auth patterns
- **Telemetry**: Preserves existing tracking

#### Medium Risk Areas
- **Import Dependencies**: Need to ensure all imports are correctly moved
- **Shared State**: Document service and other singletons must be properly shared
- **Error Handling**: Must preserve exact same error responses

#### Mitigation Strategies
- **Incremental Testing**: Test each moved endpoint individually
- **Rollback Plan**: Keep original code commented until verification complete
- **Monitoring**: Watch for any performance or functionality regressions

## Implementation Steps for Phase 1

### Step 1: Preparation (Day 1)
1. Create feature branch: `feature/api-refactor-documents`
2. Backup current `api.py` file
3. Set up testing environment
4. Document current endpoint behavior for comparison

### Step 2: Router Creation (Day 1-2)
1. Implement `core/api/documents.py` with router setup
2. Move first endpoint (`GET /documents`) as proof of concept
3. Test single endpoint thoroughly
4. Verify telemetry and auth work correctly

### Step 3: Batch Migration (Day 2-3)
1. Move remaining 10 endpoints in logical groups:
   - Basic CRUD: `GET /{id}`, `DELETE /{id}`, `GET /filename/{filename}`
   - Status: `GET /{id}/status`
   - Updates: `POST /{id}/update_*` (3 endpoints)
   - Batch operations: `POST /batch/*` (2 endpoints)
   - Retrieval: `POST /retrieve/docs`

### Step 4: Integration (Day 3-4)
1. Update main `api.py` to include documents router
2. Remove moved code from `api.py`
3. Run full test suite
4. Test frontend integration end-to-end

### Step 5: Validation (Day 4-5)
1. Performance testing - ensure no regressions
2. Load testing on moved endpoints
3. Verify all telemetry data is captured correctly
4. Test error scenarios and edge cases

## Future Phases (Post-Documents)

### Phase 2: Folders Router
- 7 endpoints including the newly created `/folders/stats`
- Similar complexity to documents
- Estimated: 3-4 days

### Phase 3: Graphs Router  
- 6 endpoints for graph operations
- Moderate complexity
- Estimated: 3-4 days

### Phase 4: Ingest Router
- 3 endpoints for file/text ingestion
- High complexity due to background jobs
- Estimated: 4-5 days

### Phase 5: Remaining Routers
- Retrieval, Query/Agent, Cache, Usage, Health, Unified, Local
- Lower complexity, mostly straightforward moves
- Estimated: 2-3 days each

## Benefits of This Approach

### Immediate Benefits (Phase 1)
- **Reduced Complexity**: Main api.py file reduced by ~500 lines
- **Better Organization**: Document endpoints logically grouped
- **Easier Maintenance**: Smaller, focused files
- **Improved Testing**: Can test document functionality in isolation

### Long-term Benefits (All Phases)
- **Modular Architecture**: Each domain has its own router
- **Team Productivity**: Multiple developers can work on different routers
- **Code Reusability**: Routers can be reused in different contexts
- **Better Documentation**: Each router can have focused documentation

### Technical Benefits
- **Faster Development**: Smaller files are easier to navigate and modify
- **Reduced Merge Conflicts**: Multiple developers can work simultaneously
- **Better IDE Performance**: Smaller files load and parse faster
- **Cleaner Git History**: Changes are more focused and easier to review

## Rollback Strategy

### If Issues Arise During Phase 1
1. **Immediate Rollback**: Revert router inclusion in main `api.py`
2. **Partial Rollback**: Move specific problematic endpoints back to main file
3. **Full Rollback**: Restore original `api.py` from backup

### Monitoring and Alerts
- Set up monitoring for endpoint response times
- Track error rates for moved endpoints
- Monitor telemetry data completeness
- Watch for any authentication/authorization issues

## Success Criteria

### Phase 1 Success Metrics
- [ ] All 11 document endpoints moved successfully
- [ ] Zero functionality regressions
- [ ] Frontend continues to work without changes
- [ ] All tests pass
- [ ] Telemetry data is complete and accurate
- [ ] Performance is maintained or improved
- [ ] Code review approval from team

### Quality Gates
- [ ] 100% test coverage maintained
- [ ] No new linting errors
- [ ] Documentation updated
- [ ] Performance benchmarks met
- [ ] Security review passed

## Questions for Clarification

1. **Testing Strategy**: Do you have existing automated tests for the document endpoints that we should run to validate the refactor?

2. **Deployment Strategy**: Should we deploy Phase 1 independently, or wait until multiple phases are complete?

3. **Performance Requirements**: Are there specific performance benchmarks we need to maintain during the refactor?

4. **Team Coordination**: Will multiple developers be working on this refactor simultaneously, or should it be done by a single developer?

5. **Enterprise Edition**: Should we coordinate this refactor with any planned changes to the Enterprise Edition routers?

6. **Monitoring**: Do you have existing monitoring/alerting that we should be aware of during the refactor?

This plan provides a structured, low-risk approach to breaking down the monolithic API file while maintaining full functionality and compatibility. The documents router is an ideal starting point due to its clear boundaries and well-defined functionality. 