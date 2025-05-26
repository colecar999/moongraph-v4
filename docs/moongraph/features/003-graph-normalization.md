# Graph Normalization and Unified Folder View

**Status**: Planning  
**Created**: 2025-01-27  
**Last Updated**: 2025-01-27  

## Overview

This document outlines the plan to normalize graph-folder relationships and create a new unified view that displays both documents and graphs within folders. The existing `/documents` route pages will remain unchanged, and a new `/unified` route will be created to provide the combined view using the same shadcn UI table components.

## Current State Analysis

### Documents ↔ Folders Relationship
- **Database Schema**: Documents have a direct `folder_id` foreign key column pointing to `folders.id`
- **Relationship**: Strong relational database constraint with CASCADE behavior
- **Access Control**: RBAC-based through folder permissions (folder:read, folder:write, etc.)
- **API Endpoints**: Folder-scoped endpoints like `POST /folders/{folder_id}/documents`
- **Migration Status**: Recently migrated from `folder_name` to `folder_id` system

### Graphs ↔ Folders Relationship
- **Database Schema**: Graphs store `folder_id` in `system_metadata` JSONB field (no foreign key constraint)
- **Relationship**: Loose association through metadata, not enforced at DB level
- **Access Control**: RBAC-based through folder permissions (same as documents)
- **API Endpoints**: System filter-based like `GET /graphs?folder_id={id}`
- **Migration Status**: Uses both `folder_id` and legacy `folder_name` in system_metadata

### Key Structural Differences

| Aspect | Documents | Graphs |
|--------|-----------|---------|
| **Folder Association** | `folder_id` FK column | `system_metadata.folder_id` JSONB |
| **Database Constraint** | Foreign key with CASCADE | No constraint |
| **Unfiled Items** | `folder_id = NULL` | `system_metadata.folder_id` missing/null |
| **Bulk Operations** | Move between folders | Update `system_metadata` |
| **API Pattern** | `/folders/{id}/documents` | `/graphs?folder_id={id}` |

## Goals

1. **Normalize graph-folder relationships** to match document patterns
2. **Create new unified view** at `/unified` route showing both documents and graphs
3. **Preserve existing `/documents` pages** exactly as they are
4. **Maintain separate shadcn UI tables** for documents-only and unified views
5. **Enable graph creation workflows** from folder documents
6. **Enable mixed-type bulk operations** in the unified view

## Implementation Plan

### Phase 1: Backend Graph Normalization

#### 1.1 Database Schema Changes

**Add Foreign Key Column to Graphs Table:**
```sql
-- Add folder_id FK column to graphs table
ALTER TABLE graphs ADD COLUMN folder_id UUID REFERENCES folders(id) ON DELETE SET NULL;

-- Create index for performance
CREATE INDEX idx_graphs_folder_id ON graphs(folder_id);
```

**Data Migration Script:**
```sql
-- Migrate existing folder associations from system_metadata to FK column
UPDATE graphs 
SET folder_id = (system_metadata->>'folder_id')::UUID 
WHERE system_metadata->>'folder_id' IS NOT NULL 
  AND system_metadata->>'folder_id' != '';

-- Clean up legacy folder_name references
UPDATE graphs 
SET system_metadata = system_metadata - 'folder_name'
WHERE system_metadata ? 'folder_name';
```

#### 1.2 Database Layer Updates

**Update GraphModel in `postgres_database.py`:**
```python
class GraphModel(Base):
    # ... existing fields ...
    folder_id = Column(UUID(as_uuid=True), ForeignKey("folders.id", ondelete="SET NULL"), nullable=True, index=True)
    
    # Add relationship
    folder = relationship("FolderModel", back_populates="graphs", foreign_keys=[folder_id])
```

**Update FolderModel:**
```python
class FolderModel(Base):
    # ... existing fields ...
    graphs = relationship("GraphModel", back_populates="folder", foreign_keys="GraphModel.folder_id")
```

#### 1.3 API Endpoint Enhancements

**New Unified Folder Content Endpoints:**
```python
@app.get("/folders/{folder_id}/contents")
async def get_folder_contents(
    folder_id: str,
    content_types: List[str] = Query(default=["documents", "graphs"]),
    auth: AuthContext = Depends(verify_token)
) -> FolderContentsResponse:
    """Get all contents (documents and/or graphs) in a folder"""

@app.post("/folders/{folder_id}/graphs")
async def create_graph_in_folder(
    folder_id: str,
    request: CreateGraphRequest,
    auth: AuthContext = Depends(verify_token)
) -> Graph:
    """Create a graph directly in a specific folder"""

@app.put("/folders/{folder_id}/graphs/{graph_id}")
async def move_graph_to_folder(
    folder_id: str,
    graph_id: str,
    auth: AuthContext = Depends(verify_token)
) -> Graph:
    """Move a graph to a specific folder"""
```

**Unified Bulk Operations:**
```python
@app.post("/folders/bulk-move")
async def bulk_move_items(
    request: BulkMoveItemsRequest,
    auth: AuthContext = Depends(verify_token)
) -> BulkOperationResponse:
    """Move multiple documents and/or graphs between folders"""
```

#### 1.4 Service Layer Updates

**Create Unified Folder Service:**
```python
class FolderContentService:
    async def get_folder_contents(
        self, 
        folder_id: str, 
        content_types: List[str],
        auth: AuthContext
    ) -> FolderContents:
        """Fetch documents and graphs for a folder"""
    
    async def bulk_move_items(
        self,
        item_ids: List[str],
        item_types: List[str],
        target_folder_id: Optional[str],
        auth: AuthContext
    ) -> BulkOperationResult:
        """Move mixed content types between folders"""
```

### Phase 2: Frontend Unified View Implementation

#### 2.1 New Route Structure

**Add Unified Menu Item:**
```typescript
// Update sidebar navigation
const navigationItems = [
  { name: "Home", href: "/home" },
  { name: "Documents", href: "/documents" }, // Existing - unchanged
  { name: "Unified", href: "/unified" }, // NEW
  { name: "Graphs", href: "/graphs" },
  // ... other items
]
```

**New Route Pages:**
```
/app/(authenticated)/unified/
├── page.tsx                    // All unified content
├── all/
│   └── page.tsx               // All unified content (unfiled)
└── [folder_id]/
    └── page.tsx               // Folder-specific unified content
```

#### 2.2 Data Models and Types

**Unified Item Interface:**
```typescript
interface FolderItem {
  id: string
  name: string
  type: 'document' | 'graph'
  created_at: string
  updated_at: string
  folder_id: string | null
  
  // Document-specific fields
  filename?: string
  content_type?: string
  external_id?: string
  
  // Graph-specific fields
  entity_count?: number
  relationship_count?: number
  document_count?: number
  status?: 'processing' | 'completed' | 'failed'
}

interface FolderContents {
  documents: Document[]
  graphs: Graph[]
  total_documents: number
  total_graphs: number
}
```

#### 2.3 New Unified Components

**Create `UnifiedView` Component:**
```typescript
interface UnifiedViewProps {
  folderId: string | null
  title?: string
  showBackButton?: boolean
  additionalHeaderButtons?: React.ReactNode
}

// This component will use the same shadcn table components as DocumentsView
// but display both documents and graphs
```

**Create `UnifiedTable` Component:**
```typescript
interface UnifiedTableProps {
  items: FolderItem[] // Mixed documents and graphs
  loading: boolean
  title: string
  onBack: () => void
  onItemClick: (item: FolderItem, event: React.MouseEvent) => void
  folders?: Folder[]
  currentFolderId?: string | null
  onBulkMoveToFolder?: (itemIds: string[], folderId: string) => Promise<void>
  onBulkDeleteItems?: (itemIds: string[]) => Promise<void>
  onCreateGraphFromDocuments?: (documentIds: string[]) => Promise<void>
  onSelectionChange?: (selectedIds: string[]) => void
}

// Reuses existing table structure but with mixed content types
```

#### 2.4 Data Fetching for Unified View

**Create `useFolderContents` Hook:**
```typescript
export function useFolderContents(
  folderId: string | null,
  contentTypes: ('documents' | 'graphs')[] = ['documents', 'graphs']
) {
  // Fetch both documents and graphs for a folder
  // Return unified loading states and error handling
  // Transform data into FolderItem[] format
}
```

**Create `useBulkMoveItems` Hook:**
```typescript
export function useBulkMoveItems() {
  // Handle moving both documents and graphs
  // Support mixed selections
}
```

#### 2.5 Enhanced Bulk Actions for Unified View

**Unified Bulk Actions:**
```typescript
// In UnifiedTable component, add these actions:
- "Create Graph from Selected Documents" (when only documents selected)
- "Move to Folder" (for any selection)
- "Delete" (for any selection)
- Standard folder operations for mixed selections
```

### Phase 3: Graph Creation Workflows

#### 3.1 Graph Creation from Documents

**"Create Graph" Button:**
- Add to unified view header
- Creates graph from all documents in current folder

**"Create Graph from Selected" Bulk Action:**
- Available when documents are selected in unified view
- Creates graph from selected documents only
- Automatically associates graph with current folder

**Implementation:**
```typescript
const handleCreateGraphFromDocuments = async (documentIds: string[]) => {
  // Call API to create graph from specific documents
  // Automatically set folder_id to current folder
  // Refresh unified view to show new graph
}
```

## Data Migration Strategy

### Migration Script

```python
async def migrate_graph_folder_relationships():
    """
    Migrate existing graph folder associations from system_metadata to FK column
    """
    # 1. Add folder_id column to graphs table
    # 2. Migrate data from system_metadata.folder_id
    # 3. Verify data integrity
    # 4. Update indexes
    # 5. Clean up legacy references
```

**Note**: No backward compatibility required since we're in dev mode.

## Implementation Scope

### In Scope
- ✅ Database schema normalization for graphs
- ✅ New `/unified` route with separate UI
- ✅ Unified table showing documents + graphs
- ✅ Mixed-type bulk operations (move, delete)
- ✅ Graph creation workflows from documents
- ✅ Preserve existing `/documents` pages unchanged

### Out of Scope
- ❌ Visualization integration
- ❌ Advanced search and filtering
- ❌ Backward compatibility
- ❌ Modifying existing `/documents` route components
- ❌ Graph analytics or advanced features

## Testing Strategy

### Database Migration Testing
- Test migration script on development data
- Verify FK constraints work correctly
- Test CASCADE behavior on folder deletion

### API Testing
- Unit tests for new unified endpoints
- Integration tests for bulk operations
- RBAC permission testing

### Frontend Testing
- Component tests for new UnifiedView
- E2E tests for bulk operations
- Graph creation workflow testing

## Performance Considerations

### Database Performance
- Index on `graphs.folder_id` for efficient queries
- Optimize unified folder content queries
- Consider pagination for large folders

### Frontend Performance
- Efficient re-rendering for mixed content updates
- Optimistic updates for bulk operations

## Security Considerations

### RBAC Consistency
- Ensure graph permissions align with document permissions
- Validate folder access for all operations
- Audit trail for bulk operations

### Data Integrity
- FK constraints prevent orphaned graphs
- Transaction safety for bulk operations
- Validation of folder ownership

## Success Metrics

### Technical Metrics
- Migration completion rate: 100%
- API response time: <200ms for folder contents
- Zero data loss during migration

### User Experience Metrics
- Functional unified view showing both content types
- Working graph creation from documents
- Efficient bulk operations for mixed content

## Timeline

### Phase 1: Backend Normalization (1 week)
- Database schema changes and migration
- API endpoints and service layer updates

### Phase 2: Frontend Unified View (1.5 weeks)
- New route structure and components
- Data fetching and state management
- Bulk operations implementation

### Phase 3: Graph Creation Workflows (0.5 weeks)
- Graph creation from documents
- Integration with unified view

### Testing and Deployment (0.5 weeks)
- Testing and bug fixes
- Deployment to development environment

**Total Timeline: 3.5 weeks**

## File Structure Changes

### New Frontend Files
```
frontend/src/
├── app/(authenticated)/unified/
│   ├── page.tsx
│   ├── all/page.tsx
│   └── [folder_id]/page.tsx
├── components/unified/
│   ├── UnifiedView.tsx
│   ├── UnifiedTable.tsx
│   └── UnifiedPageButtons.tsx
├── hooks/
│   ├── use-folder-contents.ts
│   └── use-bulk-move-items.ts
└── types/
    └── unified.ts
```

### Backend Changes
```
morphik-core/
├── core/database/postgres_database.py  # Updated models
├── core/api.py                         # New endpoints
└── core/services/folder_content_service.py  # New service
```

---

## Appendix

### Related Documents
- `002-fixing-folder-name-id-v2.md` - Previous folder schema migration
- Database schema documentation
- RBAC implementation guide

### Code References
- `morphik-core/core/database/postgres_database.py` - Database layer
- `frontend/src/components/documents/DocumentsView.tsx` - Reference for UI patterns
- `morphik-core/core/api.py` - API endpoints