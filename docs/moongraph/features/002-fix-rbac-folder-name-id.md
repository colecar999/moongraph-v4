# Fix RBAC Folder Name vs ID Issue

**Status**: Phase 3 COMPLETED ✅  
**Priority**: CRITICAL - Data Integrity Issue  
**Impact**: Performance, Data Integrity, Maintainability  
**Created**: 2025-05-25  
**Phase 1 Completed**: 2025-05-25  
**Phase 2 Completed**: 2025-05-25  
**Phase 3 Completed**: 2025-05-25  

## 🎉 **PHASE 3 COMPLETED** ✅

### **What Was Fixed in Phase 3:**
1. ✅ **API Parameter Cleanup**: Updated all API endpoints to use `folder_id` instead of `folder_name`:
   - `POST /documents` - Now accepts `folder_id` parameter with UUID validation
   - `GET /documents/filename/{filename}` - Uses `folder_id` for scoping
   - `POST /batch/documents` - Updated request processing for `folder_id`
   - `POST /batch/chunks` - Updated request processing for `folder_id`
   - `GET /graph/{name}` - Uses `folder_id` for system filters
   - `GET /graphs` - Uses `folder_id` for system filters
2. ✅ **UUID Validation**: Added proper UUID validation for all `folder_id` parameters
3. ✅ **Database Layer Updates**: Updated system_filters processing to handle `folder_id`:
   - `get_documents()` - Resolves `folder_id` to folder object for RBAC
   - `get_documents_by_id()` - Clean `folder_id`-only logic
   - `get_document_by_filename()` - No `folder_name` dependencies
4. ✅ **Error Handling**: Proper error responses for invalid `folder_id` formats
5. ✅ **Consistency**: All API endpoints now follow the same `folder_id`-only pattern

### **Combined Impact (Phases 1, 2 & 3):**
- 🚨 **Critical Issue Resolved**: Complete elimination of `folder_name` from the entire system
- 🔒 **Data Integrity**: All document/graph-folder associations use immutable UUIDs
- 🚀 **Performance**: Eliminated N+1 queries from folder name resolution
- 🧹 **Code Simplicity**: Removed complex fallback logic across API, database, and RBAC layers
- 🎯 **API Consistency**: All endpoints use standardized `folder_id` parameters with validation

## 🎉 **PHASE 2 COMPLETED** ✅

### **What Was Fixed in Phase 2:**
1. ✅ **Graph RBAC Logic**: Removed all `folder_name` fallbacks from graph RBAC methods:
   - `get_graph()` - Only uses `folder_id` for folder-based access
   - `list_graphs()` - Clean `folder_id`-only logic
   - `update_graph()` - No `folder_name` dependencies
2. ✅ **API Layer**: Fixed `update_graph` API endpoint to remove `folder_name` fallback
3. ✅ **Consistency**: Graph permissions now follow same pattern as documents (folder_id-only)
4. ✅ **No Data Migration Needed**: Graphs didn't have stale `folder_name` data

## 🎉 **PHASE 1 COMPLETED** ✅

### **What Was Fixed:**
1. ✅ **Document Storage**: `add_document_to_folder()` now only stores `folder_id` (no `folder_name`)
2. ✅ **Document Removal**: `remove_document_from_folder()` only clears `folder_id`
3. ✅ **Data Migration**: Removed all `folder_name` fields from 10 documents in database
4. ✅ **RBAC Logic**: Removed all `folder_name` fallbacks from document RBAC methods:
   - `get_document()` - Only uses `folder_id` for folder-based access
   - `get_documents()` - No more `folder_name` fallbacks
   - `get_documents_by_id()` - Clean `folder_id`-only logic
   - `get_document_by_filename()` - No `folder_name` dependencies
5. ✅ **Data Integrity**: **ELIMINATED** stale data risk when folder names change

### **Impact:**
- 🚨 **Critical Issue Resolved**: Folder renames no longer create stale data
- 🔒 **Data Integrity**: All document-folder associations use immutable UUIDs
- 🚀 **Performance**: Eliminated N+1 queries from folder name resolution
- 🧹 **Code Simplicity**: Removed complex fallback logic

## 🚨 CRITICAL ISSUE IDENTIFIED

**Data Integrity Problem**: We currently store BOTH `folder_id` AND `folder_name` in document `system_metadata`. When a folder name changes, all documents in that folder retain the OLD folder name, creating stale data and broken queries.

**Example of the problem:**
1. Folder "ProjectA" (ID: uuid-123) contains 100 documents
2. All documents have `system_metadata: {"folder_id": "uuid-123", "folder_name": "ProjectA"}`
3. User renames folder to "ProjectAlpha" 
4. ❌ Folder table updated, but 100 documents still have `"folder_name": "ProjectA"`
5. ❌ Queries filtering by folder_name="ProjectAlpha" return 0 documents

## Problem Statement

The current RBAC implementation has a critical architectural flaw where it uses both `folder_name` and `folder_id` for document-folder associations and permission checking. This creates:

1. **🚨 DATA INTEGRITY ISSUES**: Documents store stale folder_name when folders are renamed
2. **Performance Issues**: N+1 queries due to name-based folder lookups
3. **Complex RBAC Logic**: Fallback patterns make permission checking error-prone
4. **Inconsistent State**: Potential orphaned references when folders are renamed

## Current State Analysis

### Where `folder_name` is Used (Problematic)

#### **1. Document Storage (CRITICAL)**
```python
# ❌ BROKEN: Stores both folder_id AND folder_name
async def add_document_to_folder(self, folder_id: str, document_id: str, auth: AuthContext):
    folder_id_json = json.dumps(folder_id)
    folder_name_json = json.dumps(folder.name)  # ← STALE DATA RISK!
    stmt = text("""
        UPDATE documents
        SET system_metadata = jsonb_set(
            jsonb_set(system_metadata, '{folder_id}', :folder_id_json::jsonb),
            '{folder_name}', :folder_name_json::jsonb  -- ← CREATES STALE DATA
        )
        WHERE external_id = :document_id
    """)
```

#### **2. Document RBAC Checks**
- `get_document()`: Falls back to folder_name if folder_id missing
- `get_documents()`: Resolves folder_name to folder for RBAC
- `get_documents_by_id()`: Same fallback pattern

#### **3. Graph Storage (Same Issue)**
- Graphs also store both `folder_id` and `folder_name` in `system_metadata`
- Same stale data problem when folder names change

#### **4. API Layer**
- `/documents` endpoint accepts `folder_name` parameter
- Graph endpoints accept `folder_name` parameter

### Where `folder_id` is Used (Correct)

#### **1. RBAC Tables** ✅
- `UserFolderRoleModel.folder_id` (UUID)
- `TeamFolderRoleModel.folder_id` (UUID)
- All permission checks use folder UUIDs

#### **2. Folder Operations** ✅
- `get_folder(folder_id)` uses UUID
- `delete_folder(folder_id)` uses UUID

## Solution Strategy

### **Phase 1: Critical Data Integrity Fix (Week 1)**

#### **1.1 Remove folder_name from Document Storage**
```python
# ✅ FIXED: Only store folder_id
async def add_document_to_folder(self, folder_id: str, document_id: str, auth: AuthContext):
    stmt = text("""
        UPDATE documents
        SET system_metadata = jsonb_set(system_metadata, '{folder_id}', :folder_id_json::jsonb)
        WHERE external_id = :document_id
    """)
```

#### **1.2 Data Migration**
```sql
-- Ensure all documents have folder_id where folder_name exists
UPDATE documents d 
SET system_metadata = jsonb_set(d.system_metadata, '{folder_id}', to_jsonb(f.id::text))
FROM folders f 
WHERE d.system_metadata->>'folder_name' = f.name 
  AND d.system_metadata->>'folder_id' IS NULL;

-- Remove folder_name from all documents (after folder_id is populated)
UPDATE documents 
SET system_metadata = system_metadata - 'folder_name'
WHERE system_metadata ? 'folder_name';
```

#### **1.3 Update Document RBAC Logic**
```python
# ✅ FIXED: Only use folder_id for RBAC
async def get_document(self, document_id: str, auth: AuthContext) -> Optional[Document]:
    folder_id_str = pydantic_doc.system_metadata.get("folder_id")
    if folder_id_str:
        folder_uuid = uuid.UUID(folder_id_str)
        folder = await self.get_folder(str(folder_uuid), auth)
        # No fallback to folder_name - if folder_id is invalid, deny access
```

### **Phase 2: Graph Name vs ID Fix (Week 2)**

#### **2.1 Add get_graph_by_id Method**
```python
async def get_graph_by_id(self, graph_id: str, auth: AuthContext) -> Optional[Graph]:
    # Direct ID-based lookup, no name resolution needed
```

#### **2.2 Update API Endpoints**
```python
# ✅ Use graph IDs instead of names
@app.get("/graph/{graph_id}")
async def get_graph(graph_id: str, auth: AuthContext = Depends(verify_token)):
    return await document_service.db.get_graph_by_id(graph_id, auth)
```

#### **2.3 Remove folder_name from Graph Storage**
Same pattern as documents - only store `folder_id` in graph `system_metadata`

### **Phase 3: API Layer Cleanup (Week 3)**

#### **3.1 Update API Parameters**
```python
# ✅ Accept folder_id instead of folder_name
@app.post("/documents")
async def list_documents(
    folder_id: Optional[str] = None,  # ← Use folder_id
    # folder_name: Optional[str] = None,  # ← Remove this
):
```

#### **3.2 Frontend Updates**
- Update frontend to store and pass folder IDs
- Update graph operations to use graph IDs

### **Phase 4: Database Cleanup (Week 4)**

#### **4.1 Remove Indexes**
```sql
-- Remove folder_name indexes since we don't store folder_name anymore
DROP INDEX IF EXISTS idx_doc_system_metadata_folder_name;
DROP INDEX IF EXISTS idx_graph_system_metadata_folder_name;
```

#### **4.2 Add folder_id Indexes**
```sql
-- Ensure folder_id indexes exist and are optimized
CREATE INDEX IF NOT EXISTS idx_doc_system_metadata_folder_id 
ON documents ((system_metadata->>'folder_id'));

CREATE INDEX IF NOT EXISTS idx_graph_system_metadata_folder_id 
ON graphs ((system_metadata->>'folder_id'));
```

## Implementation Priority

### **🚨 IMMEDIATE (This Week)**
1. **Fix document storage** - Remove folder_name from `add_document_to_folder`
2. **Data migration** - Populate missing folder_ids and remove folder_names
3. **Update RBAC logic** - Remove folder_name fallbacks

### **📋 NEXT (Week 2)**
1. Fix graph name vs ID issue
2. Update API endpoints to use IDs

### **🧹 CLEANUP (Weeks 3-4)**
1. Remove folder_name parameters from APIs
2. Update frontend to use IDs
3. Remove unnecessary indexes

## Testing Strategy

### **Data Integrity Tests**
1. Create folder with documents
2. Rename folder
3. Verify all documents still accessible via folder_id
4. Verify no stale folder_name data exists

### **Performance Tests**
1. Measure query performance before/after
2. Verify no N+1 query patterns
3. Test with large numbers of documents/folders

## Risk Assessment

### **High Risk** 🚨
- **Data corruption** if migration fails
- **Broken queries** during transition period
- **Frontend breakage** when switching to IDs

### **Mitigation**
- **Backup database** before migration
- **Gradual rollout** with feature flags
- **Comprehensive testing** in staging environment

## Success Criteria

1. ✅ **No stale data**: folder_name never stored in document/graph metadata
2. ✅ **Consistent IDs**: All RBAC operations use UUIDs exclusively  
3. ✅ **Performance**: No N+1 queries, optimized indexes
4. ✅ **Maintainability**: Simple, predictable data model
5. ✅ **Data integrity**: Folder renames don't break document associations

## Implementation Checklist

### Phase 1: Data Migration
- [ ] Update `add_document_to_folder()` to set both `folder_id` and `folder_name`
- [ ] Update `remove_document_from_folder()` to clear both fields
- [ ] Create and run migration script for existing documents
- [ ] Update document creation logic in `ingest_text()` and `ingest_file()`
- [ ] Verify all documents have `folder_id` when in folders

### Phase 2: RBAC Simplification  
- [ ] Create `_get_document_folder_for_rbac()` helper method
- [ ] Update `get_document()` to use folder_id primarily
- [ ] Update `get_documents()` to use folder_id primarily
- [ ] Update `update_document()` and `delete_document()`
- [ ] Update graph RBAC methods
- [ ] Add logging for folder_name fallbacks

### Phase 3: API Modernization
- [ ] Add `folder_id` parameters to all relevant endpoints
- [ ] Update system filters logic to prefer `folder_id`
- [ ] Add validation to prevent both `folder_id` and `folder_name`
- [ ] Add deprecation warnings for `folder_name` usage
- [ ] Update API documentation

### Phase 4: SDK Updates
- [ ] Add `folder_id` properties to Folder classes
- [ ] Add `get_id()` methods for lazy loading
- [ ] Add new `*_by_folder_id()` methods
- [ ] Update existing methods to prefer `folder_id`
- [ ] Update SDK documentation and examples

### Phase 5: Monitoring & Cleanup
- [ ] Add telemetry for folder_name fallback usage
- [ ] Create data validation scripts
- [ ] Monitor performance improvements
- [ ] Create alerts for data inconsistencies

### Phase 6: Complete Migration
- [ ] Remove folder_name fallback logic
- [ ] Remove deprecated API parameters
- [ ] Update all documentation
- [ ] Verify no folder_name dependencies remain

## Testing Strategy

### Unit Tests
- Test RBAC methods with both `folder_id` and `folder_name`
- Test migration scenarios
- Test API parameter validation
- Test SDK folder ID resolution

### Integration Tests  
- Test end-to-end document operations with folder_id
- Test permission checking performance
- Test backward compatibility during transition
- Test error handling for invalid folder_ids

### Performance Tests
- Benchmark folder_id vs folder_name permission checks
- Measure query performance improvements
- Test with large numbers of documents and folders

## Rollback Plan

If issues arise during migration:

1. **Phase 1-2**: Revert database changes, restore folder_name-only logic
2. **Phase 3-4**: Disable folder_id parameters, fall back to folder_name
3. **Phase 5-6**: Re-enable fallback logic, postpone cleanup

## Success Metrics

- **Performance**: 50%+ reduction in folder permission check latency
- **Consistency**: 100% of documents in folders have valid `folder_id`
- **Simplicity**: 30%+ reduction in RBAC code complexity
- **Reliability**: Zero folder permission check failures due to name resolution

## Risk Assessment

**High Risk**:
- Data migration could fail for large datasets
- Breaking changes to API could affect existing clients

**Medium Risk**:
- Performance regression during transition period
- Complex rollback if issues discovered late

**Low Risk**:
- SDK compatibility issues (can be versioned)
- Documentation gaps

## Dependencies

- Database migration capabilities
- API versioning strategy  
- SDK release process
- Client notification process

## Timeline

**Total Duration**: 6 weeks

- **Week 1**: Data migration and consistency
- **Week 2**: RBAC simplification  
- **Week 3**: API modernization
- **Week 4**: SDK updates
- **Week 5**: Monitoring and validation
- **Week 6**: Final cleanup and documentation

This plan addresses the fundamental architectural flaw while maintaining backward compatibility and providing a clear migration path. 