# Fixing Folder Name → Folder ID Migration (V2)

**Status**: ✅ COMPLETED - Migration Successful  
**Priority**: P0 - Blocking Core Functionality  
**Created**: 2025-01-27  
**Completed**: 2025-01-27  

## Problem Statement

The migration from `folder_name` to `folder_id` schema was **partially completed** but left the system in a **broken hybrid state**. This is causing:

1. **"Remove from folder" functionality broken** - Documents can't be removed from folders ✅ **FIXED**
2. **Inconsistent folder detection** - Frontend can't reliably determine which folder a document is in ✅ **FIXED**
3. **Data integrity issues** - Documents have `folder_id` in DB but `folder_name` in `system_metadata` ✅ **FIXED**
4. **API inconsistency** - Some endpoints use `folder_id`, others use `folder_name` ✅ **FIXED**

## ✅ COMPLETED WORK

### Phase 1: Backend API Layer ✅ COMPLETED

#### ✅ 1.1 Updated File Upload Endpoints
**File**: `morphik-core/core/api.py`

- ✅ **Lines 290, 507**: Changed `folder_name: Optional[str] = Form(None)` to `folder_id: Optional[str] = Form(None)`
- ✅ **Lines 325-340, 546-558**: Updated RBAC checks to use `folder_id` and `get_folder(folder_id, auth)`
- ✅ **Lines 365-366, 618-619**: Removed `folder_name` storage in `system_metadata`
- ✅ **Lines 386-390, 639-643**: Replaced `_ensure_folder_exists(folder_name, ...)` with `add_document_to_folder(folder_id, ...)`

#### ✅ 1.2 Updated Document Service
**File**: `morphik-core/core/services/document_service.py`

- ✅ No longer using `_ensure_folder_exists()` method - using direct `folder_id` relationship

#### ✅ 1.3 Updated Search & Graph Endpoints
**File**: `morphik-core/core/api.py`

- ✅ **Lines 738, 775**: Updated search endpoints to use `folder_id`
- ✅ **Lines 1436-1446**: Updated graph creation to use `folder_id`
- ✅ **Lines 1477-1480**: Updated graph metadata to store only `folder_id` (removed `folder_name`)
- ✅ **Lines 1895-1937**: Updated graph update to use `folder_id`

#### ✅ 1.4 Updated Ingestion Worker
**File**: `morphik-core/core/workers/ingestion_worker.py`

- ✅ **Line 114**: Changed `folder_name: Optional[str] = None` to `folder_id: Optional[str] = None`
- ✅ **Line 282**: Removed `updates["system_metadata"]["folder_name"] = folder_name`

#### ✅ 1.5 Updated Request Models
**File**: `morphik-core/core/models/request.py`

- ✅ Updated `RetrieveRequest.folder_name` → `RetrieveRequest.folder_id`
- ✅ Updated `IngestTextRequest.folder_name` → `IngestTextRequest.folder_id`
- ✅ Updated `CreateGraphRequest.folder_name` → `CreateGraphRequest.folder_id`
- ✅ Updated `UpdateGraphRequest.folder_name` → `UpdateGraphRequest.folder_id`

### Phase 2: Frontend Layer ✅ COMPLETED

#### ✅ 2.1 Updated Upload Logic
**File**: `frontend/src/components/documents/DocumentsSection.tsx`

- ✅ **Lines 683, 690, 824**: Changed `formData.append("folder_name", selectedFolder)` to use `folder_id`
- ✅ Added logic to find folder by name and use its ID: `targetFolder.id`
- ✅ Updated all three upload methods: single file, batch file, and text upload

#### ✅ 2.2 Fixed Document Detail Detection
**File**: `frontend/src/components/documents/DocumentDetail.tsx`

- ✅ **Line 51**: Replaced `selectedDocument.system_metadata?.folder_name` with context-based folder detection
- ✅ **Line 68**: Updated to use folder context from parent component via `selectedFolder` prop
- ✅ **Lines 70-120**: Updated `handleMoveToFolder` to use new folder ID API endpoints

#### ✅ 2.3 Updated Document Fetching
**File**: `frontend/src/hooks/use-documents.ts`

- ✅ Updated to use `/folders/{folder_id}/documents` endpoint consistently
- ✅ Removed dependency on deprecated `document_ids` array approach

### Phase 3: Database Cleanup ✅ COMPLETED

#### ✅ 3.1 Removed Legacy Support
- ✅ All API endpoints now use `folder_id` exclusively
- ✅ No more `folder_name` stored in `system_metadata`
- ✅ Consistent use of `folder_id` relationship throughout

#### ✅ 3.2 Enhanced API Efficiency
**File**: `morphik-core/core/api.py`

- ✅ **New endpoint**: `/folders/stats` - Returns folders with document statistics in single API call
- ✅ **Updated frontend**: `frontend/src/hooks/use-folders.ts` - Uses efficient single API call

## ✅ VALIDATION RESULTS

### ✅ Test Cases Passed
1. ✅ **Upload to folder** - Document is assigned `folder_id`, not `folder_name`
2. ✅ **Move between folders** - Works via `folder_id` relationship using `/folders/{folder_id}/documents/{document_id}` endpoints
3. ✅ **Remove from folder** - Sets `folder_id = NULL` via DELETE endpoint
4. ✅ **Search in folder** - Uses `folder_id` for scoping
5. ✅ **Document detail view** - Correctly detects current folder from context

### ✅ Database Validation
```sql
-- ✅ VERIFIED: No documents have folder_name in system_metadata
SELECT COUNT(*) FROM documents WHERE system_metadata ? 'folder_name';
-- Result: 0

-- ✅ VERIFIED: All folder assignments use folder_id relationship
SELECT COUNT(*) FROM documents WHERE folder_id IS NOT NULL;
-- Result: 7 (documents properly assigned to folders)

-- ✅ VERIFIED: Folder document counts are accurate
SELECT f.name, COUNT(d.external_id) as actual_count
FROM folders f
LEFT JOIN documents d ON d.folder_id = f.id
GROUP BY f.id, f.name;
-- Result: Accurate counts matching UI display
```

## ✅ SUCCESS CRITERIA MET

- ✅ All API endpoints use `folder_id` instead of `folder_name`
- ✅ No `folder_name` stored in `system_metadata`
- ✅ "Remove from folder" functionality works
- ✅ Document upload assigns correct `folder_id`
- ✅ Document detail view correctly detects current folder
- ✅ Search and chat use `folder_id` for scoping
- ✅ All functionality tested and working

## Files Modified

### Backend ✅
- ✅ `morphik-core/core/api.py` (primary changes)
- ✅ `morphik-core/core/models/request.py`
- ✅ `morphik-core/core/workers/ingestion_worker.py`

### Frontend ✅
- ✅ `frontend/src/components/documents/DocumentsSection.tsx`
- ✅ `frontend/src/components/documents/DocumentDetail.tsx`
- ✅ `frontend/src/hooks/use-folders.ts`
- ✅ `frontend/src/hooks/use-documents.ts`

## Implementation Summary

**Total Effort**: ~6 hours  
**Backend changes**: ✅ 4 hours
**Frontend changes**: ✅ 2 hours  

## Key Improvements Delivered

1. **✅ Consistent API**: All endpoints now use `folder_id` exclusively
2. **✅ Efficient Data Fetching**: New `/folders/stats` endpoint reduces API calls
3. **✅ Reliable Folder Detection**: Context-based folder detection instead of deprecated metadata
4. **✅ Working Folder Operations**: Move, remove, and upload operations all functional
5. **✅ Clean Data Model**: No more hybrid state with both `folder_name` and `folder_id`

**Migration Status**: ✅ **COMPLETE AND SUCCESSFUL** 