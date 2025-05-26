# Folder-Document Relationship Migration Plan

**Document ID**: 004-folder-document-relationship-migration  
**Status**: Planning  
**Priority**: High  
**Estimated Effort**: 2-3 weeks  
**Created**: 2025-01-25  

## Executive Summary

Migrate from the current problematic folder → document IDs array relationship to a proper relational document → folder ID design. This will fix data integrity issues, improve performance, and align with database best practices.

## Current Problems

### Data Integrity Issues
- **Orphaned References**: Deleted documents leave stale IDs in `folder.document_ids` arrays
- **No Referential Integrity**: JSONB arrays can't have foreign key constraints
- **Inconsistent Counts**: Folder document counts don't match actual accessible documents
- **Race Conditions**: Concurrent folder updates can corrupt document lists

### Performance Problems
- **Array Operations**: Adding/removing documents requires expensive array manipulation
- **No Indexes**: Can't efficiently query "which folder contains document X"
- **Memory Usage**: Large folders load entire document ID arrays
- **Complex Queries**: Joining folders with documents requires array operations

### Scalability Limitations
- **Array Size Limits**: PostgreSQL JSONB arrays have practical size constraints
- **Concurrent Access**: Multiple users modifying folders causes conflicts
- **Query Complexity**: Filtering and searching across folder contents is inefficient

## Target Architecture

### New Relationship Model
```
Folders (1) ←→ (N) Documents
- Documents reference their parent folder via folder_id
- Folders calculate document counts dynamically
- Proper foreign key constraints ensure data integrity
```

### Database Schema Changes
```sql
-- Add folder_id column to documents table
ALTER TABLE documents 
ADD COLUMN folder_id UUID REFERENCES folders(id) ON DELETE SET NULL;

-- Create index for performance
CREATE INDEX idx_documents_folder_id ON documents(folder_id);

-- Remove document_ids from folders (after migration)
ALTER TABLE folders DROP COLUMN document_ids;
```

### API Changes
```typescript
// Before: Folder contains document IDs
interface Folder {
  id: string
  name: string
  document_ids: string[]  // ❌ Remove this
}

// After: Document references folder
interface Document {
  external_id: string
  folder_id: string | null  // ✅ Add this
}

interface Folder {
  id: string
  name: string
  document_count?: number  // ✅ Calculated dynamically
}
```

## Migration Strategy

### Phase 1: Preparation (Week 1)
1. **Audit Current Data**
   - Identify orphaned document references in folders
   - Count documents with existing `system_metadata.folder_id`
   - Document data inconsistencies

2. **Add New Schema**
   - Add `folder_id` column to documents table
   - Create necessary indexes
   - Keep existing `document_ids` for rollback safety

3. **Create Migration Scripts**
   - Data migration script
   - Validation script
   - Rollback script

### Phase 2: Data Migration (Week 2)
1. **Migrate Existing Data**
   ```sql
   -- Migrate from folder.document_ids to document.folder_id
   UPDATE documents 
   SET folder_id = folders.id
   FROM folders
   WHERE documents.external_id = ANY(folders.document_ids);
   ```

2. **Handle Edge Cases**
   - Documents in multiple folders (choose primary)
   - Documents with `system_metadata.folder_id` conflicts
   - Orphaned document references

3. **Validate Migration**
   - Verify all documents have correct folder_id
   - Ensure document counts match
   - Test data consistency

### Phase 3: API Migration (Week 2-3)
1. **Update Backend APIs**
   - Modify folder endpoints to calculate document counts
   - Update document endpoints to use folder_id
   - Maintain backward compatibility during transition

2. **Update Frontend**
   - Modify folder listing to use new counts
   - Update document filtering by folder
   - Handle migration period gracefully

3. **Update Database Layer**
   - Modify queries to use new relationship
   - Remove array-based operations
   - Add proper foreign key constraints

### Phase 4: Cleanup (Week 3)
1. **Remove Legacy Code**
   - Remove `document_ids` from folder schema
   - Clean up array-based operations
   - Remove backward compatibility code

2. **Performance Optimization**
   - Optimize queries for new schema
   - Add additional indexes if needed
   - Monitor performance improvements

## Implementation Details

### Database Migration Script
```sql
-- migration_001_folder_document_relationship.sql

BEGIN;

-- Step 1: Add new column
ALTER TABLE documents 
ADD COLUMN folder_id UUID;

-- Step 2: Create index
CREATE INDEX idx_documents_folder_id ON documents(folder_id);

-- Step 3: Migrate data from folder.document_ids to document.folder_id
WITH folder_docs AS (
  SELECT 
    f.id as folder_id,
    jsonb_array_elements_text(f.document_ids) as document_id
  FROM folders f
  WHERE f.document_ids IS NOT NULL
)
UPDATE documents d
SET folder_id = fd.folder_id
FROM folder_docs fd
WHERE d.external_id = fd.document_id;

-- Step 4: Handle documents with system_metadata.folder_id
UPDATE documents 
SET folder_id = (system_metadata->>'folder_id')::UUID
WHERE folder_id IS NULL 
  AND system_metadata->>'folder_id' IS NOT NULL
  AND (system_metadata->>'folder_id')::UUID IN (SELECT id FROM folders);

-- Step 5: Add foreign key constraint
ALTER TABLE documents 
ADD CONSTRAINT fk_documents_folder_id 
FOREIGN KEY (folder_id) REFERENCES folders(id) ON DELETE SET NULL;

COMMIT;
```

### API Endpoint Changes

#### Folders API
```python
# Before
@app.get("/folders/{folder_id}")
async def get_folder(folder_id: str):
    folder = await db.get_folder(folder_id)
    return {
        "id": folder.id,
        "name": folder.name,
        "document_ids": folder.document_ids,  # ❌ Remove
        "document_count": len(folder.document_ids)  # ❌ Inaccurate
    }

# After
@app.get("/folders/{folder_id}")
async def get_folder(folder_id: str):
    folder = await db.get_folder(folder_id)
    document_count = await db.count_documents_in_folder(folder_id)
    return {
        "id": folder.id,
        "name": folder.name,
        "document_count": document_count  # ✅ Accurate
    }
```

#### Documents API
```python
# New endpoint for folder contents
@app.get("/folders/{folder_id}/documents")
async def get_folder_documents(folder_id: str, skip: int = 0, limit: int = 100):
    documents = await db.get_documents_by_folder(folder_id, skip, limit)
    return documents

# Updated document creation
@app.post("/documents")
async def create_document(document_data: dict, folder_id: str = None):
    document = await document_service.create_document(
        content=document_data["content"],
        folder_id=folder_id  # ✅ Direct assignment
    )
    return document
```

### Frontend Changes

#### Hooks Update
```typescript
// Before: useDocuments with folder document_ids
const { documents } = useDocuments({
  folderId: folder_id,
  folders: folders  // ❌ Needed for document_ids lookup
})

// After: Direct folder query
const { documents } = useDocuments({
  folderId: folder_id  // ✅ Direct database query
})
```

#### Folder Count Display
```typescript
// Before: Unreliable count from document_ids
const documentCount = folder.document_ids?.length || 0

// After: Reliable count from database
const documentCount = folder.document_count || 0
```

## Risk Assessment

### High Risk
- **Data Loss**: Incorrect migration could lose document-folder relationships
- **Downtime**: Schema changes require careful coordination
- **API Breaking Changes**: Frontend/backend synchronization required

### Medium Risk
- **Performance Impact**: New queries might be slower initially
- **Complex Rollback**: Reverting changes requires careful planning

### Low Risk
- **User Experience**: Minimal impact if migration is done correctly

## Mitigation Strategies

### Data Safety
- **Full Database Backup** before migration
- **Staged Migration** with validation at each step
- **Rollback Scripts** tested in staging environment

### Zero-Downtime Deployment
- **Dual-Write Period**: Write to both old and new schema temporarily
- **Feature Flags**: Enable new behavior gradually
- **Monitoring**: Track migration progress and data consistency

### Testing Strategy
- **Unit Tests**: Test new database operations
- **Integration Tests**: Test API endpoints with new schema
- **Load Tests**: Verify performance improvements
- **User Acceptance Tests**: Ensure UI works correctly

## Success Metrics

### Data Integrity
- ✅ Zero orphaned document references
- ✅ 100% accurate folder document counts
- ✅ All documents have valid folder_id or NULL

### Performance
- ✅ Folder listing queries < 100ms
- ✅ Document filtering by folder < 50ms
- ✅ Reduced memory usage for large folders

### User Experience
- ✅ Consistent document counts across UI
- ✅ No loading errors or empty folders
- ✅ Fast folder navigation

## Timeline

| Week | Phase | Tasks | Deliverables |
|------|-------|-------|--------------|
| 1 | Preparation | Schema design, migration scripts, testing | Migration scripts, test plan |
| 2 | Migration | Data migration, API updates, frontend changes | Working system with new schema |
| 3 | Cleanup | Remove legacy code, optimization, monitoring | Production-ready system |

## Rollback Plan

### If Migration Fails
1. **Stop Migration**: Halt process immediately
2. **Restore Backup**: Restore database from pre-migration backup
3. **Revert Code**: Roll back API and frontend changes
4. **Investigate**: Analyze failure and update migration plan

### If Issues Found Post-Migration
1. **Feature Flag**: Disable new behavior
2. **Dual Schema**: Temporarily support both approaches
3. **Fix Forward**: Correct issues while maintaining new schema
4. **Monitor**: Ensure system stability

## Dependencies

### Technical
- Database migration tools
- Feature flag system
- Monitoring and alerting
- Backup and restore procedures

### Team
- Backend developer for API changes
- Frontend developer for UI updates
- DevOps for deployment coordination
- QA for testing validation

## Conclusion

This migration will solve fundamental data integrity issues and improve system performance. The phased approach minimizes risk while ensuring a smooth transition to a proper relational design.

The investment in this migration will pay dividends in:
- **Reliability**: No more data inconsistencies
- **Performance**: Faster queries and better scalability
- **Maintainability**: Simpler code and standard database patterns
- **User Experience**: Consistent and accurate folder/document relationships

**Next Steps:**
1. Review and approve this migration plan
2. Set up staging environment for testing
3. Begin Phase 1 preparation work
4. Schedule migration window for production deployment 