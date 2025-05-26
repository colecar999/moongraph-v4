# API Refactoring Plan: Breaking Down the Monolithic api.py

## Overview

The current `morphik-core/core/api.py` file was 2,303 lines long and contained all API endpoints in a single monolithic file. This refactoring plan outlines a phased approach to break it down into modular, maintainable routers organized by functional domain.

## Current State Analysis

### Existing Structure
- **Main file**: `morphik-core/core/api.py` (~~2,303~~ **1,843 lines** - reduced by ~460 lines)
- **New router structure**: `morphik-core/core/api_routers/` (created during Phase 1)
- **Enterprise pattern**: `ee/routers/` shows the target pattern with proper router organization
- **Frontend proxy pattern**: Frontend routes in `frontend/src/app/api/` proxy to backend

### Route Categories Identified
1. **✅ Documents** (11 endpoints) - **COMPLETED in Phase 1**
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

## ✅ Phase 1: Documents Router (COMPLETED)

### Implementation Summary
**Status**: ✅ **COMPLETED** - Successfully deployed and tested
**Date Completed**: May 26, 2025
**Lines Reduced**: ~460 lines moved from main api.py

### What Was Accomplished

#### ✅ File Structure Created
```
morphik-core/
├── core/
│   ├── api.py (1,843 lines, down from 2,303)
│   └── api_routers/
│       ├── __init__.py
│       └── documents.py (458 lines)
```

#### ✅ Endpoints Successfully Moved (11 total)
All document-related endpoints were successfully moved to `core/api_routers/documents.py`:

1. ✅ `GET /documents` - List documents
2. ✅ `GET /documents/{document_id}` - Get document by ID
3. ✅ `GET /documents/{document_id}/status` - Get document status
4. ✅ `GET /documents/filename/{filename}` - Get document by filename
5. ✅ `DELETE /documents/{document_id}` - Delete document
6. ✅ `POST /documents/{document_id}/update_text` - Update document text
7. ✅ `POST /documents/{document_id}/update_file` - Update document file
8. ✅ `POST /documents/{document_id}/update_metadata` - Update document metadata
9. ✅ `POST /batch/documents` - Batch get documents
10. ✅ `POST /batch/chunks` - Batch get chunks
11. ✅ `POST /retrieve/docs` - Retrieve documents (semantic search)

#### ✅ Router Integration
- Router successfully included in main `api.py` with proper error handling
- All imports and dependencies correctly moved
- Telemetry tracking preserved for all endpoints
- RBAC and authentication flows maintained

#### ✅ Testing Results
**Manual Testing Completed**: All endpoints tested and verified working
- ✅ Backend startup successful with documents router
- ✅ All 11 document endpoints respond correctly via curl
- ✅ Frontend integration works without changes
- ✅ Telemetry data captured correctly in logs
- ✅ Authentication and authorization working
- ✅ No functionality regressions detected

### Implementation Details

#### Router Structure
```python
# morphik-core/core/api_routers/documents.py
from fastapi import APIRouter
router = APIRouter(tags=["Documents"])

# All document endpoints with preserved functionality
# - Telemetry tracking maintained
# - RBAC checks preserved  
# - Error handling unchanged
# - Import dependencies correctly resolved
```

#### Main API Integration
```python
# morphik-core/core/api.py
try:
    from core.api_routers.documents import router as documents_router
    app.include_router(documents_router)
    logger.info("Documents router included successfully")
except ImportError as exc:
    logger.error("Failed to import documents router: %s", exc, exc_info=True)
```

### Lessons Learned

#### ✅ What Worked Well
1. **Automated Endpoint Removal**: Python script successfully removed ~20KB of code
2. **Router Pattern**: FastAPI router inclusion worked seamlessly
3. **Dependency Management**: All imports and services properly shared
4. **Zero Frontend Impact**: Proxy pattern completely shielded frontend
5. **Telemetry Preservation**: All tracking decorators moved successfully
6. **RBAC Maintenance**: Authentication and authorization flows unchanged

#### 🔧 Challenges Encountered
1. **Import Path Confusion**: Initially tried `core/api/` but needed `core/api_routers/`
2. **Router Prefix Issues**: Had to remove prefix to avoid double-prefixing paths
3. **Bulk Code Removal**: Manual removal would have been error-prone, script was essential

#### 📝 Best Practices Established
1. **Backup First**: Always backup original file before major changes
2. **Incremental Testing**: Test router inclusion before bulk endpoint removal
3. **Automated Removal**: Use scripts for bulk code removal to avoid errors
4. **Log Monitoring**: Watch backend logs during deployment for issues
5. **Manual Verification**: Thoroughly test all moved endpoints individually

## Future Phases (Remaining Work)

### Phase 2: Folders Router (Next Priority)
**Estimated Effort**: 3-4 days
**Complexity**: Medium (similar to documents)

#### Endpoints to Move (7 total)
1. `POST /folders` - Create folder
2. `GET /folders` - List folders  
3. `GET /folders/stats` - List folders with stats (**newly created in Phase 1**)
4. `GET /folders/{folder_id}` - Get folder by ID
5. `DELETE /folders/{folder_id}` - Delete folder
6. `POST /folders/{folder_id}/documents/{document_id}` - Add document to folder
7. `DELETE /folders/{folder_id}/documents/{document_id}` - Remove document from folder
8. `GET /folders/{folder_id}/documents` - Get folder documents

**Note**: The `/folders/stats` endpoint was created during Phase 1 troubleshooting and should be included in Phase 2.

### Phase 3: Graphs Router  
**Estimated Effort**: 3-4 days
**Complexity**: Medium

#### Endpoints to Move (6 total)
1. `POST /graph/create` - Create graph
2. `GET /graph/{name}` - Get graph by name
3. `GET /graphs` - List graphs
4. `POST /graph/{name}/update` - Update graph by name
5. `GET /graphs/{graph_id}` - Get graph by ID
6. `POST /graphs/{graph_id}/update` - Update graph by ID

### Phase 4: Ingest Router
**Estimated Effort**: 4-5 days  
**Complexity**: High (background jobs, file handling)

#### Endpoints to Move (3 total)
1. `POST /ingest/text` - Ingest text document
2. `POST /ingest/file` - Ingest file document
3. `POST /ingest/files` - Batch ingest files

### Phase 5: Retrieval Router
**Estimated Effort**: 2-3 days
**Complexity**: Medium

#### Endpoints to Move (1 remaining)
1. `POST /retrieve/chunks` - Retrieve chunks

**Note**: `POST /retrieve/docs` was moved to documents router in Phase 1 as it's logically part of document operations.

### Phase 6: Query/Agent Router
**Estimated Effort**: 2-3 days
**Complexity**: Medium

#### Endpoints to Move (2 total)
1. `POST /query` - Query completion
2. `POST /agent` - Agent query

### Phase 7: Cache Router
**Estimated Effort**: 3-4 days
**Complexity**: Medium

#### Endpoints to Move (6 total)
1. `POST /cache/create` - Create cache
2. `GET /cache/{name}` - Get cache
3. `POST /cache/{name}/update` - Update cache
4. `POST /cache/{name}/add_docs` - Add docs to cache
5. `POST /cache/{name}/query` - Query cache

### Phase 8: Usage/Telemetry Router
**Estimated Effort**: 2 days
**Complexity**: Low

#### Endpoints to Move (2 total)
1. `GET /usage/stats` - Get usage stats
2. `GET /usage/recent` - Get recent usage

### Phase 9: Health/Auth Router
**Estimated Effort**: 2 days
**Complexity**: Low

#### Endpoints to Move (3 total)
1. `GET /ping` - Health check
2. `GET /test/auth-context` - Test auth context
3. `GET /test/permission-check` - Test permissions

### Phase 10: Unified Router
**Estimated Effort**: 2 days
**Complexity**: Low

#### Endpoints to Move (2 total)
1. `GET /unified/content` - List unified content
2. `GET /unified/stats` - Get unified stats

### Phase 11: Local Development Router
**Estimated Effort**: 1 day
**Complexity**: Low

#### Endpoints to Move (1 total)
1. `POST /local/generate_uri` - Generate local URI

## Benefits Achieved (Phase 1)

### Immediate Benefits
- ✅ **Reduced Complexity**: Main api.py file reduced by 460 lines (20% reduction)
- ✅ **Better Organization**: Document endpoints logically grouped in dedicated file
- ✅ **Easier Maintenance**: Smaller, focused files easier to navigate and modify
- ✅ **Independent Deployment**: Phase 1 deployed successfully without waiting for other phases
- ✅ **Zero Downtime**: Refactoring completed without service interruption

### Technical Benefits
- ✅ **Faster Development**: Document-related changes now isolated to single file
- ✅ **Better IDE Performance**: Smaller files load and parse faster
- ✅ **Cleaner Git History**: Document changes now focused in dedicated file
- ✅ **Modular Architecture**: Established pattern for remaining phases

## Success Metrics (Phase 1)

### ✅ Completed Success Criteria
- [x] All 11 document endpoints moved successfully
- [x] Zero functionality regressions (verified manually)
- [x] Frontend continues to work without changes
- [x] All manual tests pass
- [x] Telemetry data is complete and accurate (verified in logs)
- [x] Independent deployment successful
- [x] Backend starts successfully with new router structure

### ✅ Quality Gates Met
- [x] No new linting errors
- [x] Documentation updated (this document)
- [x] Manual testing checklist completed
- [x] All endpoints respond correctly via curl
- [x] Frontend document functionality works end-to-end

## Rollback Strategy

### Phase 1 Rollback (if needed)
1. **Immediate Rollback**: Comment out router inclusion in main `api.py`
2. **Full Rollback**: Restore original `api.py` from backup (`core/api.py.backup`)
3. **Partial Rollback**: Move specific problematic endpoints back to main file

### Monitoring During Future Phases
- Watch backend logs for any errors after deployment
- Monitor frontend functionality manually
- Check for any authentication/authorization issues
- Verify telemetry data is being logged correctly

## Updated Implementation Timeline

### ✅ Phase 1: Documents Router
**Status**: COMPLETED ✅
**Duration**: 1 day
**Outcome**: Successful deployment, all tests passing

### 🔄 Next Phase: Folders Router
**Estimated Start**: Ready to begin
**Estimated Duration**: 3-4 days
**Priority**: High (includes newly created `/folders/stats` endpoint)

### Remaining Phases
**Total Estimated Time**: 20-25 days for complete refactoring
**Approach**: Continue incremental, independent deployments
**Risk Level**: Low (Phase 1 proved the approach works)

## Conclusion

Phase 1 of the API refactoring has been successfully completed, demonstrating that the modular router approach works effectively. The documents router is now fully operational with:

- ✅ 460 lines of code moved to dedicated router
- ✅ All 11 document endpoints working correctly  
- ✅ Zero impact on frontend functionality
- ✅ Preserved telemetry and RBAC functionality
- ✅ Successful independent deployment

The established patterns and lessons learned provide a solid foundation for the remaining phases. The refactoring approach has proven to be safe, effective, and maintainable. 