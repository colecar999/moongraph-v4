# Unified Route File Upload Implementation Plan

**Date:** 2025-01-27  
**Author:** AI Assistant  
**Status:** Planning  
**Priority:** High (Restore Missing Functionality)

## 1. Executive Summary

This document outlines the implementation plan for adding file upload functionality to the unified route (`/unified`) in Moongraph. The analysis reveals that while comprehensive upload functionality exists in the documents route components, it is not currently integrated into the unified interface. The unified route currently only supports viewing, organizing, and deleting content but lacks upload capabilities.

## 2. Current State Analysis

### 2.1 Documents Route Upload Functionality ✅ **EXISTS BUT BROKEN**

**Location:** `frontend/src/components/documents/DocumentsSection.tsx`

**Status:** The upload functionality exists but appears to be broken:
- Upload button doesn't respond
- Drag and drop functionality missing
- Upload dialog may not be properly connected

**Existing Features:**
- **Single File Upload**: Via file picker with metadata and rules
- **Batch File Upload**: Multiple files with drag and drop support
- **Text Upload**: Direct text content with metadata
- **Drag and Drop**: Full drag and drop interface with visual feedback
- **Collection Assignment**: Automatic assignment to selected folder
- **Progress Tracking**: Real-time upload progress with alerts
- **Error Handling**: Comprehensive error handling and user feedback

**Key Components:**
- `DocumentsSection.tsx` - Main upload logic and drag/drop
- `UploadDialog.tsx` - Upload modal with file/text/batch options
- `useUploadDialog` hook - State management for upload process

### 2.2 Morphik-Core UI Component ✅ **FULLY FUNCTIONAL**

**Location:** `morphik-core/ee/ui-component/components/documents/`

**Status:** Complete and functional upload system that serves as reference implementation.

**Features:**
- Identical upload functionality to frontend documents route
- Uses `folder_name` instead of `folder_id` for API calls
- Proven working implementation with all upload types
- Complete drag and drop with visual feedback
- Alert system integration for progress tracking

### 2.3 Unified Route ❌ **NO UPLOAD FUNCTIONALITY**

**Current Capabilities:**
- ✅ View all content (documents and graphs)
- ✅ Filter by content type
- ✅ Search and sort content
- ✅ Bulk operations (move to folder, delete)
- ✅ Collection management
- ❌ **No file upload functionality**
- ❌ **No drag and drop support**
- ❌ **No upload button or interface**

**Key Components:**
- `UnifiedContentView.tsx` - Main content display (no upload features)
- `useUnifiedContent.ts` - Data fetching (no upload methods)
- Collection creation modal exists but no file upload

## 3. Technical Architecture Analysis

### 3.1 Upload API Endpoints ✅ **AVAILABLE**

The backend provides comprehensive upload endpoints:

```typescript
// Single file upload
POST /ingest/file
- FormData with file, metadata, rules, use_colpali
- folder_id parameter for collection assignment

// Batch file upload  
POST /ingest/files
- FormData with multiple files
- folder_id parameter for collection assignment

// Text upload
POST /ingest/text
- JSON body with content, metadata, rules, folder_id
```

### 3.2 Frontend Proxy Routes ✅ **AVAILABLE**

Frontend API proxy routes handle authentication and forwarding:
- `/api/ingest/*` routes proxy to backend
- Authentication token handling
- Error response formatting

### 3.3 Collection Integration ✅ **READY**

The unified route has full collection context:
- Current folder ID available
- Collection selection interface
- RBAC permission validation
- Folder creation capabilities

## 4. Implementation Plan

### 4.1 Phase 1: Core Upload Infrastructure (Week 1)

#### 4.1.1 Upload Dialog Component
**File:** `frontend/src/components/unified/UnifiedUploadDialog.tsx`

```typescript
interface UnifiedUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentFolderId?: string | null;
  folders: Folder[];
  onUploadComplete: () => void;
}

// Features to implement:
// - File upload (single)
// - Batch file upload (multiple)
// - Text content upload
// - Collection selection dropdown
// - Metadata and rules configuration
// - Progress tracking with alerts
```

**Key Differences from Documents Route:**
- Collection selection dropdown (since unified can upload to any collection)
- Simplified metadata interface (focus on common use cases)
- Integration with unified content refresh patterns

#### 4.1.2 Upload Hook
**File:** `frontend/src/hooks/useUnifiedUpload.ts`

```typescript
interface UseUnifiedUploadProps {
  onUploadComplete?: () => void;
  defaultFolderId?: string | null;
}

// State management for:
// - Upload dialog visibility
// - File selection (single/batch)
// - Text content
// - Target collection selection
// - Upload progress tracking
// - Error handling
```

#### 4.1.3 Drag and Drop Integration
**Location:** `UnifiedContentView.tsx` enhancements

```typescript
// Add drag and drop functionality:
// - useDragAndDrop hook (adapted from DocumentsSection)
// - Drag overlay with collection context
// - File validation and processing
// - Integration with upload handlers
```

### 4.2 Phase 2: UI Integration (Week 1)

#### 4.2.1 Upload Button Integration
**Location:** `UnifiedContentView.tsx` header section

```typescript
// Add upload button to header controls:
<div className="flex items-center gap-2">
  {/* Existing buttons */}
  
  {/* New Upload Button */}
  <Button 
    variant="outline" 
    size="sm"
    onClick={() => setUploadDialogOpen(true)}
    className="flex items-center gap-2"
  >
    <IconUpload className="h-4 w-4" />
    Upload
  </Button>
</div>
```

#### 4.2.2 Drag and Drop Overlay
**Location:** `UnifiedContentView.tsx` main content area

```typescript
// Add drag and drop overlay:
{isDragging && (
  <div className="absolute inset-0 z-50 flex items-center justify-center rounded-lg border-2 border-dashed border-primary bg-primary/10 backdrop-blur-sm">
    <div className="rounded-lg bg-background p-8 text-center shadow-lg">
      <IconUpload className="mx-auto mb-4 h-12 w-12 text-primary" />
      <h3 className="mb-2 text-xl font-medium">Drop to Upload</h3>
      <p className="text-muted-foreground">
        Files will be added to {selectedCollection || "your documents"}
      </p>
    </div>
  </div>
)}
```

#### 4.2.3 Empty State Enhancement
**Location:** `UnifiedContentView.tsx` empty state

```typescript
// Enhance empty state with upload prompt:
<div className="flex flex-1 items-center justify-center rounded-lg border border-dashed py-8 text-center">
  <div>
    <IconUpload className="mx-auto mb-2 h-12 w-12 text-muted-foreground" />
    <p className="text-muted-foreground">No content found.</p>
    <p className="mt-2 text-xs text-muted-foreground">
      Drag and drop files here or use the upload button to get started.
    </p>
    <Button 
      variant="outline" 
      className="mt-4"
      onClick={() => setUploadDialogOpen(true)}
    >
      Upload Files
    </Button>
  </div>
</div>
```

### 4.3 Phase 3: Advanced Features (Week 2)

#### 4.3.1 Collection-Specific Upload
**Feature:** Smart collection detection and assignment

```typescript
// Auto-detect target collection based on context:
// - If viewing specific collection: default to that collection
// - If viewing "All Content": show collection selector
// - Remember last selected collection for user convenience
```

#### 4.3.2 Upload Progress Integration
**Feature:** Unified progress tracking

```typescript
// Integration with existing alert system:
// - Upload progress alerts
// - Success/error notifications
// - Batch upload status tracking
// - Real-time content refresh after upload
```

#### 4.3.3 Bulk Upload Operations
**Feature:** Enhanced batch upload capabilities

```typescript
// Advanced batch features:
// - Folder structure preservation (if dragging folders)
// - File type validation and filtering
// - Duplicate detection and handling
// - Metadata inheritance from collection
```

## 5. Code Adaptation Strategy

### 5.1 Reuse Existing Components ✅ **HIGH PRIORITY**

**From Documents Route:**
- `UploadDialog.tsx` - Adapt for unified interface
- `useUploadDialog` hook - Extend for collection selection
- Drag and drop logic from `DocumentsSection.tsx`
- Upload handlers and API integration patterns

**From Morphik-Core UI:**
- Reference implementation for API calls
- Alert system integration patterns
- Error handling approaches
- Progress tracking mechanisms

### 5.2 API Integration Patterns ✅ **PROVEN**

**Existing Patterns to Follow:**
```typescript
// Single file upload (from DocumentsSection.tsx)
const formData = new FormData();
formData.append("file", file);
formData.append("metadata", metadata);
formData.append("rules", rules);
formData.append("use_colpali", String(useColpali));
if (folderId) {
  formData.append("folder_id", folderId);
}

fetch(`${apiBaseUrl}/ingest/file`, {
  method: "POST",
  headers: { Authorization: `Bearer ${authToken}` },
  body: formData,
});
```

**Batch upload pattern:**
```typescript
// Batch file upload (from DocumentsSection.tsx)
const formData = new FormData();
files.forEach(file => formData.append("files", file));
formData.append("metadata", metadata);
if (folderId) {
  formData.append("folder_id", folderId);
}

fetch(`${apiBaseUrl}/ingest/files`, {
  method: "POST",
  headers: { Authorization: `Bearer ${authToken}` },
  body: formData,
});
```

### 5.3 State Management Integration ✅ **STRAIGHTFORWARD**

**Unified Content Refresh:**
```typescript
// After successful upload, refresh content:
const { refreshContent } = useUnifiedContent({ folderId });

const handleUploadComplete = useCallback(() => {
  refreshContent(); // Refresh current view
  setUploadDialogOpen(false);
  // Show success notification
}, [refreshContent]);
```

## 6. User Experience Design

### 6.1 Upload Flow Design

**Primary Upload Flow:**
1. User clicks "Upload" button in unified interface
2. Upload dialog opens with collection selector
3. User selects files (single/batch) or enters text
4. User configures metadata and target collection
5. Upload progress shown with real-time feedback
6. Content automatically refreshes on completion

**Drag and Drop Flow:**
1. User drags files over unified content area
2. Drag overlay appears with collection context
3. User drops files to initiate upload
4. Collection assignment based on current context
5. Progress tracking and automatic refresh

### 6.2 Collection Context Handling

**Smart Collection Assignment:**
- **Viewing specific collection**: Default to current collection
- **Viewing "All Content"**: Show collection selector with recent collections
- **No collections**: Prompt to create collection or upload to "unfiled"
- **Remember preferences**: Save last selected collection per user

### 6.3 Progress and Feedback

**Upload Progress:**
- Real-time progress bars for individual files
- Batch upload progress with file count
- Success/error notifications with clear actions
- Automatic content refresh on completion

**Error Handling:**
- Clear error messages with suggested actions
- Partial success handling for batch uploads
- Retry mechanisms for failed uploads
- Validation feedback for file types and sizes

## 7. Implementation Timeline

### Week 1: Core Implementation
- **Days 1-2**: Create UnifiedUploadDialog component
- **Days 3-4**: Implement upload hooks and state management
- **Days 5-7**: Integrate drag and drop functionality

### Week 2: UI Integration and Polish
- **Days 1-2**: Add upload button and UI integration
- **Days 3-4**: Implement collection selection and context handling
- **Days 5-7**: Progress tracking, error handling, and testing

### Week 3: Advanced Features and Testing
- **Days 1-2**: Bulk upload enhancements
- **Days 3-4**: User experience polish and edge cases
- **Days 5-7**: Comprehensive testing and bug fixes

## 8. Technical Considerations

### 8.1 Performance Optimization

**File Upload Performance:**
- Chunked upload for large files (future enhancement)
- Parallel processing for batch uploads
- Progress streaming for real-time feedback
- Memory management for large file sets

**UI Performance:**
- Lazy loading of upload dialog
- Efficient drag and drop event handling
- Optimized content refresh after uploads
- Minimal re-renders during upload process

### 8.2 Security Considerations

**File Validation:**
- File type validation on frontend and backend
- File size limits and validation
- Malware scanning integration points
- User permission validation for target collections

**Data Protection:**
- Secure file transmission (HTTPS)
- Authentication token validation
- Collection access control enforcement
- Audit logging for upload activities

### 8.3 Accessibility

**Upload Interface:**
- Keyboard navigation for upload dialog
- Screen reader support for drag and drop
- Clear focus indicators and labels
- Alternative upload methods for accessibility

## 9. Testing Strategy

### 9.1 Unit Testing
- Upload dialog component testing
- Upload hook state management testing
- File validation and processing testing
- Error handling and edge case testing

### 9.2 Integration Testing
- End-to-end upload flow testing
- Collection assignment and permission testing
- API integration and error handling testing
- Cross-browser compatibility testing

### 9.3 User Acceptance Testing
- Upload workflow usability testing
- Drag and drop functionality testing
- Progress feedback and error handling testing
- Performance testing with various file sizes

## 10. Success Metrics

### 10.1 Functional Metrics
- ✅ Upload button responds and opens dialog
- ✅ Drag and drop functionality works across browsers
- ✅ Single file upload completes successfully
- ✅ Batch file upload handles multiple files
- ✅ Text upload functionality works
- ✅ Collection assignment works correctly
- ✅ Progress tracking provides real-time feedback
- ✅ Error handling provides clear user guidance

### 10.2 Performance Metrics
- Upload dialog opens within 200ms
- File processing starts within 500ms of selection
- Progress updates every 100ms during upload
- Content refresh completes within 2 seconds
- Drag and drop response time under 100ms

### 10.3 User Experience Metrics
- Upload success rate > 95%
- User task completion rate > 90%
- Error recovery rate > 80%
- User satisfaction with upload experience

## 11. Risk Mitigation

### 11.1 Technical Risks
- **File size limitations**: Implement chunked upload for large files
- **Browser compatibility**: Test across all supported browsers
- **Network interruptions**: Implement retry mechanisms
- **Memory usage**: Optimize file handling for large batches

### 11.2 User Experience Risks
- **Complex interface**: Keep upload dialog simple and intuitive
- **Unclear progress**: Provide clear, real-time feedback
- **Error confusion**: Design clear error messages with actions
- **Performance issues**: Optimize for responsive user experience

### 11.3 Integration Risks
- **API compatibility**: Use proven patterns from existing code
- **State management**: Follow established patterns in unified components
- **Collection permissions**: Leverage existing RBAC validation
- **Content refresh**: Use existing refresh mechanisms

## 12. Future Enhancements

### 12.1 Advanced Upload Features
- **Chunked uploads**: For large files and improved reliability
- **Resume capability**: Resume interrupted uploads
- **Folder upload**: Preserve folder structure when uploading
- **Cloud integration**: Direct upload from cloud storage services

### 12.2 Collaboration Features
- **Shared uploads**: Upload directly to shared collections
- **Upload notifications**: Notify collaborators of new uploads
- **Version control**: Handle file versioning and updates
- **Approval workflows**: Upload approval for shared collections

### 12.3 AI and Automation
- **Smart categorization**: Auto-assign collections based on content
- **Metadata extraction**: Automatic metadata generation
- **Content analysis**: AI-powered content insights
- **Duplicate detection**: Intelligent duplicate file handling

## 13. Conclusion

The implementation of file upload functionality in the unified route is a high-priority enhancement that will restore missing functionality and provide a more complete user experience. The existing codebase provides excellent reference implementations that can be adapted for the unified interface.

### Key Success Factors:
1. **Reuse proven patterns** from existing upload implementations
2. **Maintain consistency** with established UI/UX patterns
3. **Provide clear feedback** throughout the upload process
4. **Handle errors gracefully** with actionable user guidance
5. **Optimize performance** for responsive user experience

### Implementation Approach:
- **Phase 1**: Core upload infrastructure and dialog
- **Phase 2**: UI integration and drag/drop functionality  
- **Phase 3**: Advanced features and polish

The unified route upload functionality will provide users with a seamless, efficient way to add content to their collections while maintaining the security, performance, and user experience standards established in the existing codebase.

### Next Steps:
1. Begin Phase 1 implementation with UnifiedUploadDialog component
2. Adapt existing upload patterns for unified interface
3. Implement comprehensive testing strategy
4. Plan for future enhancements and advanced features

This implementation will significantly improve the unified route's functionality and provide users with the complete content management experience they expect from the Moongraph platform. 