# Unified Route File Upload Implementation Plan

## Overview

This document outlines the comprehensive implementation plan for adding file upload functionality to the unified route (`/unified`) in Moongraph v4, along with enhancements to the file-level tables and status display.

## Current Status ✅

### Phase 1: Core Upload Infrastructure (COMPLETED)
- ✅ **UnifiedUploadDialog Component** - Fully functional upload dialog with collection selection
- ✅ **Upload Hooks** - `useUnifiedUpload` and `useUnifiedDragAndDrop` hooks implemented
- ✅ **Unified Page Integration** - Upload button, drag/drop, and dialog integration complete
- ✅ **API Integration** - Direct calls to backend ingest endpoints with proper authentication
- ✅ **Collection Support** - folder_id parameter for assigning uploads to specific collections
- ✅ **Progress Tracking** - Alert system integration for upload progress and completion
- ✅ **Error Handling** - Comprehensive error handling with user-friendly messages
- ✅ **Test Page** - Created for verification without authentication requirements

## Phase 2: Enhanced File-Level Tables and Status Display

### 2.1 Status Column Implementation (NEW FEATURE)

**Objective**: Add document status display to unified file-level tables, adapting existing status implementation from `/documents` route.

**Implementation Strategy (DRY Principle)**:
1. **Extract Reusable Status Components**:
   - Create `@/components/ui/status-badge.tsx` - Reusable status badge component
   - Create `@/lib/utils/status-helpers.ts` - Status formatting utilities
   - Extract from existing `DocumentList.tsx` implementation

2. **Update Unified Table Columns**:
   - Modify `@/components/unified/unified-table-columns.tsx`
   - Add status column for document-type items
   - Reuse status badge component and helpers

**Files to Create/Modify**:
```
frontend/src/components/ui/status-badge.tsx (NEW)
frontend/src/lib/utils/status-helpers.ts (NEW)
frontend/src/components/unified/unified-table-columns.tsx (MODIFY)
frontend/src/components/documents/DocumentList.tsx (REFACTOR - extract reusable parts)
```

**Status Badge Component Structure**:
```typescript
interface StatusBadgeProps {
  status: string;
  showTooltip?: boolean;
  className?: string;
}

// Supports: "processing", "completed", "failed", "unknown"
// Includes animated processing indicator
// Tooltip with processing explanation
```

### 2.2 Missing Data Columns Fix (NEW FEATURE)

**Objective**: Fix missing Size, Last Modified, and Created columns data for Document-type files in unified tables.

**Root Cause Analysis**:
- Current `UnifiedContentItem` interface lacks proper document metadata mapping
- Backend `/unified/content` endpoint needs to include file size and proper date fields
- Frontend column definitions need to access correct data paths

**Implementation Strategy**:
1. **Backend Data Enhancement**:
   - Modify `morphik-core/core/api.py` `/unified/content` endpoint
   - Ensure document file_size, created_at, updated_at are properly mapped
   - Add system_metadata fields to response

2. **Frontend Type Updates**:
   - Update `UnifiedContentItem` interface in `useUnifiedContent.ts`
   - Add missing fields: `file_size`, proper date handling, `system_metadata`

3. **Column Definition Updates**:
   - Update `unified-table-columns.tsx` to access correct data paths
   - Ensure proper fallbacks for missing data
   - Use shared date/size formatting utilities

**Files to Modify**:
```
morphik-core/core/api.py (MODIFY - /unified/content endpoint)
frontend/src/hooks/useUnifiedContent.ts (MODIFY - interface)
frontend/src/components/unified/unified-table-columns.tsx (MODIFY - column definitions)
frontend/src/lib/utils/format-helpers.ts (NEW - shared formatting utilities)
```

### 2.3 File-Level Upload Integration (NEW FEATURE)

**Objective**: Add upload functionality to file-level tables (inside folders and "All Content" views).

**Implementation Strategy (DRY Principle)**:
1. **Reuse Existing Upload Infrastructure**:
   - Leverage existing `UnifiedUploadDialog`, `useUnifiedUpload`, `useUnifiedDragAndDrop`
   - No duplication of upload logic

2. **Context-Aware Upload Behavior**:
   - When in specific folder: Upload to that folder by default
   - When in "All Content": Upload as unfiled content
   - Upload button and drag/drop should respect current context

3. **Component Integration**:
   - Modify `UnifiedContentView.tsx` to include upload functionality
   - Add upload button to header controls
   - Integrate drag/drop overlay
   - Pass current folder context to upload hooks

**Files to Modify**:
```
frontend/src/components/unified/UnifiedContentView.tsx (MODIFY)
frontend/src/app/(authenticated)/unified/all/page.tsx (MODIFY)
frontend/src/app/(authenticated)/unified/[folder_id]/page.tsx (MODIFY)
```

**Upload Context Logic**:
```typescript
// In UnifiedContentView
const currentFolderId = folderId; // null for "All Content", folder ID for specific folder

// Upload functions automatically use currentFolderId
const { uploadDialogOpen, setUploadDialogOpen, ... } = useUnifiedUpload({
  onUploadComplete: () => refresh(), // Refresh current view
  defaultFolderId: currentFolderId
});

// Drag and drop respects context
const { isDragging, dragHandlers } = useUnifiedDragAndDrop({
  onDrop: (files) => handleBatchFileUpload(files, currentFolderId),
  disabled: uploadLoading
});
```

## Phase 3: Code Quality and DRY Improvements

### 3.1 Shared Component Library

**Create Reusable Components**:
1. **StatusBadge** - Used across documents and unified routes
2. **UploadButton** - Standardized upload button component
3. **DragDropOverlay** - Reusable drag/drop visual feedback
4. **TablePagination** - Shared pagination component
5. **ColumnCustomizer** - Shared column visibility controls

### 3.2 Shared Utilities

**Create Utility Libraries**:
1. **format-helpers.ts** - Date, size, status formatting
2. **upload-helpers.ts** - Upload validation, progress tracking
3. **table-helpers.ts** - Common table operations
4. **auth-helpers.ts** - Authentication utilities

### 3.3 Hook Consolidation

**Standardize Table Hooks**:
1. **useTableState** - Generic table state management
2. **useUploadIntegration** - Standardized upload integration
3. **useBulkActions** - Shared bulk operation logic

## Implementation Timeline

### Week 1: Status Column Implementation
- [ ] Extract status components from DocumentList
- [ ] Create reusable StatusBadge component
- [ ] Update unified table columns with status
- [ ] Test status display across routes

### Week 2: Data Column Fixes
- [ ] Update backend unified content endpoint
- [ ] Fix frontend data mapping
- [ ] Update column definitions
- [ ] Test data display accuracy

### Week 3: File-Level Upload Integration
- [ ] Modify UnifiedContentView for upload support
- [ ] Update all/folder pages with upload context
- [ ] Test upload functionality in different contexts
- [ ] Verify drag/drop behavior

### Week 4: Code Quality and Testing
- [ ] Extract shared components and utilities
- [ ] Refactor existing code to use shared components
- [ ] Comprehensive testing across all routes
- [ ] Documentation updates

## Technical Architecture

### Component Hierarchy
```
UnifiedContentView
├── Upload Integration (reused from folder-level)
│   ├── UnifiedUploadDialog (existing)
│   ├── useUnifiedUpload (existing)
│   └── useUnifiedDragAndDrop (existing)
├── Enhanced Table
│   ├── StatusBadge (new, reusable)
│   ├── Enhanced Columns (updated)
│   └── Proper Data Mapping (fixed)
└── Shared UI Components
    ├── TablePagination (extracted)
    ├── ColumnCustomizer (extracted)
    └── BulkActions (extracted)
```

### Data Flow
```
Backend /unified/content
├── Enhanced Document Data
│   ├── file_size (added)
│   ├── system_metadata.status (ensured)
│   └── proper date fields (verified)
├── Unified Response Format
└── Frontend Processing
    ├── UnifiedContentItem (updated interface)
    ├── Status Badge Rendering
    └── Context-Aware Upload
```

### Shared Code Strategy
```
Reusable Components:
├── @/components/ui/status-badge.tsx
├── @/components/ui/upload-button.tsx
├── @/components/ui/drag-drop-overlay.tsx
└── @/components/ui/table-pagination.tsx

Utility Libraries:
├── @/lib/utils/format-helpers.ts
├── @/lib/utils/upload-helpers.ts
├── @/lib/utils/table-helpers.ts
└── @/lib/utils/auth-helpers.ts

Shared Hooks:
├── @/hooks/useTableState.ts
├── @/hooks/useUploadIntegration.ts
└── @/hooks/useBulkActions.ts
```

## Testing Strategy

### Unit Tests
- [ ] StatusBadge component variants
- [ ] Upload hook functionality
- [ ] Data formatting utilities
- [ ] Table state management

### Integration Tests
- [ ] Upload flow in different contexts
- [ ] Status display accuracy
- [ ] Drag/drop behavior
- [ ] Column data mapping

### E2E Tests
- [ ] Complete upload workflow
- [ ] Cross-route consistency
- [ ] Error handling scenarios
- [ ] Performance under load

## Success Criteria

### Functional Requirements
- ✅ Upload functionality available at folder level
- [ ] Status column displays correctly for documents
- [ ] Size, Last Modified, Created columns show proper data
- [ ] Upload works in file-level views (folders and "All Content")
- [ ] Context-aware upload behavior (respects current folder)
- [ ] Drag and drop works consistently across views

### Technical Requirements
- [ ] No code duplication between routes
- [ ] Reusable components across documents and unified routes
- [ ] Consistent UI/UX patterns
- [ ] Proper error handling and loading states
- [ ] Performance optimization (memoization, efficient re-renders)

### User Experience Requirements
- [ ] Intuitive upload process
- [ ] Clear visual feedback for all operations
- [ ] Consistent behavior across different views
- [ ] Proper progress indication
- [ ] Helpful error messages

## Risk Mitigation

### Technical Risks
1. **Data Mapping Issues**: Thorough testing of backend data structure
2. **Performance Impact**: Implement proper memoization and lazy loading
3. **State Management**: Use React best practices for state updates
4. **Authentication Edge Cases**: Robust token handling and fallbacks

### User Experience Risks
1. **Confusing Upload Context**: Clear visual indicators of target location
2. **Inconsistent Behavior**: Standardized components and patterns
3. **Poor Error Handling**: Comprehensive error states and recovery options

## Future Enhancements

### Phase 4: Advanced Features
- [ ] Bulk upload with progress tracking
- [ ] Upload queue management
- [ ] File type validation and restrictions
- [ ] Upload resume functionality
- [ ] Advanced metadata extraction during upload

### Phase 5: Performance Optimization
- [ ] Virtual scrolling for large tables
- [ ] Optimistic updates for better UX
- [ ] Background upload processing
- [ ] Caching strategies for frequently accessed data

This plan ensures a robust, maintainable, and user-friendly implementation that follows DRY principles and provides a consistent experience across the Moongraph application. 