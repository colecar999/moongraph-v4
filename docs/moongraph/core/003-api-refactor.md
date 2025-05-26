# API Refactoring Plan: Breaking Down the Monolithic api.py

## Overview

The current `morphik-core/core/api.py` file was originally 2,303 lines long and contained all API endpoints in a single monolithic file. This refactoring plan outlines a phased approach to break it down into modular, maintainable routers organized by functional domain.

## Current State Analysis

### Existing Structure
- **Main file**: `morphik-core/core/api.py` (~~2,303~~ **1,824 lines** - reduced by ~479 lines / 21%)
- **New router structure**: `morphik-core/core/api_routers/` (created during Phase 1)
- **Enterprise pattern**: `ee/routers/` shows the target pattern with proper router organization
- **Frontend proxy pattern**: Frontend routes in `frontend/src/app/api/` proxy to backend

### Route Categories Identified
1. **Documents** ✅ - File management, ingestion, retrieval (11 endpoints)
2. **Folders** ✅ - Organization and hierarchy (8 endpoints)  
3. **Graphs** ✅ - Knowledge graph operations (6 endpoints)
4. **Ingest** - Data processing and ingestion (4 endpoints)
5. **Auth** - Authentication and authorization (3 endpoints)
6. **System** - Health checks, metrics, configuration (5 endpoints)
7. **Chat** - Conversational interfaces (3 endpoints)
8. **Search** - Search and discovery (2 endpoints)
9. **Admin** - Administrative functions (3 endpoints)
10. **Unified** - Cross-domain operations (2 endpoints)

## Implementation Progress

### ✅ **COMPLETED PHASES**

#### **Phase 1: Documents Router** ✅ **COMPLETED**
- **Status**: Successfully implemented and deployed
- **Endpoints moved**: 11 endpoints
- **Code removed**: ~20KB from main api.py
- **File**: `morphik-core/core/api_routers/documents.py`
- **Endpoints**:
  - `POST /retrieve/docs` - Document retrieval with filters
  - `POST /batch/documents` - Batch document processing
  - `POST /batch/chunks` - Batch chunk processing
  - `GET /documents` - List documents with pagination
  - `GET /documents/{document_id}` - Get specific document
  - `GET /documents/{document_id}/status` - Document processing status
  - `GET /documents/filename/{filename}` - Get document by filename
  - `DELETE /documents/{document_id}` - Delete document
  - `POST /documents/{document_id}/update_text` - Update document text
  - `POST /documents/bulk-move` - Bulk move documents (added for compatibility)
  - `DELETE /documents/{document_id}/remove-from-folder` - Remove from folder (added for compatibility)

**Key Learnings from Phase 1**:
- Import dependencies must be carefully mapped from main file
- Telemetry decorators need to be preserved
- Authentication patterns work seamlessly with routers
- Frontend proxy routes may need to be created for new endpoints
- Backwards compatibility is critical for existing frontend code

#### **Phase 2: Folders Router** ✅ **COMPLETED**
- **Status**: Successfully implemented and deployed
- **Endpoints moved**: 8 endpoints
- **Code removed**: ~8KB from main api.py
- **File**: `morphik-core/core/api_routers/folders.py`
- **Endpoints**:
  - `POST /folders` - Create new folder
  - `GET /folders` - List folders with pagination
  - `GET /folders/stats` - Get folder statistics
  - `GET /folders/{folder_id}` - Get specific folder
  - `DELETE /folders/{folder_id}` - Delete folder
  - `POST /folders/{folder_id}/documents/{document_id}` - Add document to folder
  - `DELETE /folders/{folder_id}/documents/{document_id}` - Remove document from folder
  - `GET /folders/{folder_id}/documents` - List documents in folder

**Key Learnings from Phase 2**:
- Router inclusion order doesn't matter for functionality
- Database service dependencies transfer cleanly
- RBAC (Role-Based Access Control) works seamlessly with modular routers
- Frontend API proxy pattern scales well

#### **Phase 3: Graphs Router** ✅ **COMPLETED**
- **Status**: Successfully implemented and deployed
- **Endpoints moved**: 6 endpoints
- **Code removed**: ~18.7KB from main api.py
- **File**: `morphik-core/core/api_routers/graphs.py`
- **Endpoints**:
  - `POST /graph/create` - Create new graph
  - `GET /graph/{name}` - Get graph by name
  - `GET /graphs` - List all graphs
  - `POST /graph/{name}/update` - Update graph by name
  - `GET /graphs/{graph_id}` - Get graph by ID
  - `POST /graphs/{graph_id}/update` - Update graph by ID

**Key Learnings from Phase 3**:
- Import path corrections needed during implementation:
  - `core.utils.prompt_validation` → `core.models.prompts`
  - `core.utils.usage_limits` → `core.limits_utils`
  - `core.config.settings` → `core.config.get_settings()`
- Complex business logic (graph operations) transfers successfully
- Usage limits and validation functions work in modular context
- Settings configuration patterns need careful attention

### **📊 Overall Progress Summary**

**Completed Work**:
- ✅ **25 endpoints** successfully moved to modular routers
- ✅ **~46.7KB** of code removed from monolithic `api.py`
- ✅ **File size reduced** from 2,303 lines to 1,824 lines (21% reduction)
- ✅ **Zero downtime** - all functionality maintained during refactoring
- ✅ **Full backwards compatibility** maintained
- ✅ **Frontend integration** working seamlessly

**Router Structure Created**:
```
morphik-core/core/api_routers/
├── __init__.py                 # Package exports
├── documents.py               # 11 endpoints ✅
├── folders.py                 # 8 endpoints ✅
└── graphs.py                  # 6 endpoints ✅
```

## Deployment Strategy

### Single Developer Approach
- **Manual testing** after each phase (no automated tests available)
- **Independent deployment** of each phase
- **Incremental approach** with immediate verification
- **Rollback strategy**: Backup files created before each phase

### Testing Protocol
1. **Backend endpoint verification** via curl
2. **Frontend functionality testing** via browser
3. **Log monitoring** for router inclusion success
4. **Error handling verification** for edge cases

## Technical Implementation Details

### Router Pattern Established
```python
# Standard router structure
from fastapi import APIRouter, Depends
from core.auth_utils import verify_token
from core.services.telemetry import TelemetryService

router = APIRouter(tags=["Domain"])
logger = logging.getLogger(__name__)
telemetry = TelemetryService()

@router.get("/endpoint")
@telemetry.track(operation_type="operation", metadata_resolver=telemetry.resolver)
async def endpoint_function(auth: AuthContext = Depends(verify_token)):
    # Implementation
```

### Main API Integration Pattern
```python
# In main api.py
try:
    from core.api_routers.domain import router as domain_router
    app.include_router(domain_router)
    logger.info("Domain router included successfully")
except ImportError as exc:
    logger.error("Failed to import domain router: %s", exc, exc_info=True)
```

### Frontend Proxy Pattern
```typescript
// Frontend API route structure
export async function GET/POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization') || 'Bearer devtoken';
  const response = await fetch(`${BACKEND_URL}/endpoint`, {
    method: 'METHOD',
    headers: { 'Authorization': authHeader, 'Content-Type': 'application/json' },
    body: request.body
  });
  return NextResponse.json(await response.json());
}
```

## Lessons Learned

### ✅ **What Worked Well**
1. **Incremental approach** - Each phase was independently deployable
2. **Backup strategy** - `api.py.backup` provided safety net
3. **Import mapping** - Systematic approach to dependency resolution
4. **Router pattern** - FastAPI router inclusion works seamlessly
5. **Authentication** - RBAC and auth patterns transfer cleanly
6. **Telemetry** - Monitoring and tracking preserved across routers
7. **Frontend compatibility** - Proxy pattern maintains API contracts

### ⚠️ **Challenges Encountered**
1. **Import path corrections** - Some utility imports needed adjustment
2. **Settings configuration** - Config patterns required careful attention
3. **Dependency resolution** - Complex business logic dependencies needed mapping
4. **Frontend endpoints** - Some new endpoints needed frontend proxy routes

### 🔧 **Solutions Developed**
1. **Systematic import checking** - Verify all imports before router creation
2. **Incremental testing** - Test each endpoint immediately after creation
3. **Backwards compatibility** - Add compatibility endpoints when needed
4. **Error handling** - Comprehensive try/catch for router inclusion

## Next Phases (Remaining Work)

### **Phase 4: Ingest Router** (Next)
- **Endpoints**: 4 ingest-related endpoints
- **Estimated effort**: Medium (similar to folders)
- **Dependencies**: File processing, validation

### **Phase 5: Auth Router**
- **Endpoints**: 3 authentication endpoints
- **Estimated effort**: Low-Medium
- **Dependencies**: Token management, user validation

### **Phase 6: System Router**
- **Endpoints**: 5 system endpoints
- **Estimated effort**: Low
- **Dependencies**: Health checks, metrics

### **Phase 7: Chat Router**
- **Endpoints**: 3 chat endpoints
- **Estimated effort**: Medium
- **Dependencies**: Conversation management

### **Phase 8: Search Router**
- **Endpoints**: 2 search endpoints
- **Estimated effort**: Low
- **Dependencies**: Search algorithms

### **Phase 9: Admin Router**
- **Endpoints**: 3 admin endpoints
- **Estimated effort**: Low-Medium
- **Dependencies**: Administrative functions

### **Phase 10: Unified Router**
- **Endpoints**: 2 unified endpoints
- **Estimated effort**: Medium-High
- **Dependencies**: Cross-domain operations

## Success Metrics

### **Achieved So Far**
- ✅ **21% reduction** in main api.py file size
- ✅ **25 endpoints** successfully modularized
- ✅ **3 functional domains** separated
- ✅ **Zero breaking changes** to existing functionality
- ✅ **Improved maintainability** through separation of concerns

### **Target Goals**
- **Target**: 80%+ reduction in main api.py file size
- **Target**: All endpoints modularized except core infrastructure
- **Target**: Improved development velocity through domain separation
- **Target**: Enhanced testability through isolated routers

## Risk Mitigation

### **Strategies Employed**
1. **Backup files** created before each phase
2. **Incremental deployment** with immediate verification
3. **Manual testing** protocol for each endpoint
4. **Rollback procedures** documented and tested
5. **Frontend compatibility** maintained throughout

### **Monitoring**
- **Log monitoring** for router inclusion success/failure
- **Endpoint testing** via curl and browser
- **Frontend functionality** verification
- **Performance monitoring** (no degradation observed)

## Conclusion

The API refactoring project has been highly successful through the first three phases. The modular router pattern has proven to be:

- **Scalable**: Easy to add new routers following established pattern
- **Maintainable**: Clear separation of concerns by functional domain
- **Reliable**: Zero downtime and no breaking changes
- **Testable**: Individual routers can be tested in isolation

The project is on track to achieve its goals of breaking down the monolithic API into manageable, domain-specific modules while maintaining full backwards compatibility and system reliability.

---

**Last Updated**: May 26, 2025  
**Status**: Phase 1 & 2 Complete, Ready for Phase 3  
**Next Action**: Begin Phase 3 (Graphs Router) implementation 