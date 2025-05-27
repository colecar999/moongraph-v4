"use client"

import { useState, useMemo, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { 
  IconLayoutColumns, 
  IconChevronDown, 
  IconPlus,
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
  IconFiles,
  IconFolder,
  IconSearch,
  IconTrash,
  IconDots,
  IconLock,
  IconUsers,
  IconGlobe,
  IconX,
  IconUpload
} from "@tabler/icons-react"
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { useFolders } from "@/hooks/use-folders"
import { Folder } from "@/components/types"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { DeleteConfirmationDialog } from "@/components/ui/delete-confirmation-dialog"
import { cn } from "@/lib/utils"

// Import upload functionality
import UnifiedUploadDialog from "@/components/unified/UnifiedUploadDialog"
import { useUnifiedUpload } from "@/hooks/useUnifiedUpload"
import { useUnifiedDragAndDrop } from "@/hooks/useUnifiedDragAndDrop"

// Define the data structure for our table
interface UnifiedFolderRowData {
  id: string
  name: string
  type: "folder" | "all-content"
  documentCount: number
  graphCount: number
  totalCount: number
  lastModified: string
  owner: string
  visibility: string
  privacyLevel: string
}

// Create the "All Content" row
function createAllContentRow(totalDocuments: number, totalGraphs: number): UnifiedFolderRowData {
  return {
    id: "all-content",
    name: "All Content",
    type: "all-content",
    documentCount: totalDocuments,
    graphCount: totalGraphs,
    totalCount: totalDocuments + totalGraphs,
    lastModified: "—",
    owner: "—",
    visibility: "private",
    privacyLevel: "Private"
  }
}

// Convert folders to table data
function foldersToTableData(folders: Folder[], totalDocuments: number, totalGraphs: number = 0): UnifiedFolderRowData[] {
  const allContentRow = createAllContentRow(totalDocuments, totalGraphs)
  
  // Helper function to convert visibility to privacy level
  const getPrivacyLevel = (visibility: string, ownerType: string) => {
    switch (visibility) {
      case "private":
        return "Private"
      case "shared":
        return "Shared"  // Backend stores "shared", not "team_shared"
      case "public":
        return "Public"  // Backend stores "public", not "public_readable"
      default:
        return "Private"
    }
  }
  
  const folderRows: UnifiedFolderRowData[] = folders.map(folder => ({
    id: folder.id,
    name: folder.name,
    type: "folder" as const,
    documentCount: folder.document_count || 0,
    graphCount: folder.graph_count || 0, // TODO: Add graph count when available
    totalCount: (folder.document_count || 0) + (folder.graph_count || 0),
    lastModified: folder.updated_at ? new Date(folder.updated_at).toLocaleDateString() : "—",
    owner: "—", // TODO: Add owner info when available
    visibility: folder.visibility || "private",
    privacyLevel: getPrivacyLevel(folder.visibility || "private", folder.owner_type || "user")
  }))

  return [allContentRow, ...folderRows]
}

// MOVED OUTSIDE COMPONENT: Define table columns to prevent recreation on every render
const columns: ColumnDef<UnifiedFolderRowData>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
          disabled={row.original.type === "all-content"} // Disable for "All Content" row
        />
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => {
      const isAllContent = row.original.type === "all-content"
      const icon = isAllContent ? (
        <IconFiles className="h-4 w-4 text-muted-foreground" />
      ) : (
        <IconFolder className="h-4 w-4 text-muted-foreground" />
      )
      
      return (
        <div className="flex items-center gap-2">
          {icon}
          <span className="font-medium">{row.original.name}</span>
        </div>
      )
    },
    enableHiding: false,
  },
  {
    accessorKey: "documentCount",
    header: "Documents",
    cell: ({ row }) => (
      <div className="flex items-center gap-1">
        <IconFiles className="h-3 w-3 text-muted-foreground" />
        <span className="text-sm">{row.original.documentCount}</span>
      </div>
    ),
  },
  {
    accessorKey: "graphCount",
    header: "Graphs",
    cell: ({ row }) => (
      <div className="flex items-center gap-1">
        <div className="h-3 w-3 rounded-full bg-blue-500" />
        <span className="text-sm">{row.original.graphCount}</span>
      </div>
    ),
  },
  {
    accessorKey: "totalCount",
    header: "Total Items",
    cell: ({ row }) => (
      <div className="flex items-center gap-1">
        <Badge variant="secondary" className="text-xs">
          {row.original.totalCount}
        </Badge>
      </div>
    ),
  },
  {
    accessorKey: "lastModified",
    header: "Last Modified",
    cell: ({ row }) => (
      <div className="text-sm text-muted-foreground">
        {row.original.lastModified}
      </div>
    ),
  },
  {
    accessorKey: "owner",
    header: "Owner",
    cell: ({ row }) => (
      <div className="flex items-center gap-1">
        <span className="text-sm text-muted-foreground">{row.original.owner}</span>
      </div>
    ),
  },
  {
    accessorKey: "privacyLevel",
    header: "Privacy Level",
    cell: ({ row }) => {
      const level = row.original.privacyLevel
      const getPrivacyBadge = (level: string) => {
        switch (level) {
          case "Private":
            return <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200">🔒 Private</Badge>
          case "Shared":
            return <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-200">👥 Shared</Badge>
          case "Public":
            return <Badge variant="secondary" className="text-xs bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-200">🌍 Public</Badge>
          default:
            return <Badge variant="secondary" className="text-xs">—</Badge>
        }
      }
      
      return (
        <div className="flex items-center gap-1">
          {getPrivacyBadge(level)}
        </div>
      )
    },
  },
]

export default function UnifiedPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  
  // Table state
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = useState({})
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  })
  
  // Collection creation modal state
  const [createCollectionOpen, setCreateCollectionOpen] = useState(false)
  const [collectionForm, setCollectionForm] = useState({
    name: "",
    description: "",
    privacy: "private" as "private" | "shared" | "public"
  })
  const [isCreating, setIsCreating] = useState(false)

  // Delete confirmation dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Get API configuration
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000"
  const authToken = session?.accessToken as string | null

  // Don't fetch data if we don't have a proper token and we're not in dev mode
  const shouldSkipFetch = !authToken && process.env.NODE_ENV !== "development"

  // Fetch folders data
  const { folders, loading, error, totalDocuments, refetch } = useFolders({ 
    apiBaseUrl, 
    authToken,
    sessionStatus: status
  })

  // TODO: Fetch total graphs count when available
  const totalGraphs = 0

  // Upload functionality
  const {
    uploadDialogOpen,
    setUploadDialogOpen,
    uploadLoading,
    handleFileUpload,
    handleBatchFileUpload,
    handleTextUpload,
  } = useUnifiedUpload({
    onUploadComplete: () => {
      // Refresh folders data after upload
      refetch?.()
    }
  })

  // Drag and drop functionality
  const { isDragging, dragHandlers } = useUnifiedDragAndDrop({
    onDrop: (files: File[]) => {
      // Handle drag and drop upload - upload to unfiled by default
      handleBatchFileUpload(files, null)
    },
    disabled: uploadLoading
  })

  // MEMOIZED: Convert folders to table data to prevent recreation on every render
  const tableData = useMemo(() => {
    return foldersToTableData(folders, totalDocuments, totalGraphs)
  }, [folders, totalDocuments, totalGraphs])

  // Initialize table
  const table = useReactTable({
    data: tableData,
    columns,
    state: {
      sorting,
      columnVisibility,
      columnFilters,
      rowSelection,
      pagination,
    },
    getRowId: (row) => row.id,
    enableRowSelection: (row) => row.original.type !== "all-content", // Disable selection for "All Content"
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  })

  // MEMOIZED: Handle row clicks to prevent recreation on every render
  const handleRowClick = useMemo(() => (row: UnifiedFolderRowData, event: React.MouseEvent) => {
    // Don't navigate if clicking on checkbox
    if ((event.target as HTMLElement).closest('[role="checkbox"]')) {
      return
    }
    
    if (row.type === "all-content") {
      router.push("/unified/all")
    } else {
      router.push(`/unified/${row.id}`)
    }
  }, [router])

  // Handle bulk collection deletion
  const handleBulkDeleteCollections = async () => {
    const selectedCollectionIds = Object.keys(rowSelection).filter(id => id !== "all-content")
    
    if (selectedCollectionIds.length === 0) return
    
    // Open the styled confirmation dialog
    setDeleteDialogOpen(true)
  }

  // Handle the actual deletion after confirmation
  const handleConfirmDelete = async () => {
    const selectedCollectionIds = Object.keys(rowSelection).filter(id => id !== "all-content")
    
    if (selectedCollectionIds.length === 0) return
    
    // Use dev token in development if no real token is available
    const effectiveToken = authToken || (process.env.NODE_ENV === "development" ? "devtoken" : null)
    
    if (!effectiveToken) {
      alert("Authentication required")
      return
    }

    setIsDeleting(true)
    try {
      // Delete each collection (keeping files by default for bulk operations)
      const deletePromises = selectedCollectionIds.map(async (collectionId) => {
        const response = await fetch(`/api/folders/${collectionId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${effectiveToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            deleteFiles: false // Always keep files for bulk operations for safety
          }),
        })

        if (!response.ok) {
          const errorText = await response.text()
          throw new Error(`Failed to delete collection ${collectionId}: ${response.status} ${errorText}`)
        }
        
        return response.json()
      })

      await Promise.all(deletePromises)

      // Clear selection and refresh
      setRowSelection({})
      setDeleteDialogOpen(false)
      window.location.reload()
    } catch (error) {
      console.error('Error deleting collections:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      alert(`Failed to delete some collections: ${errorMessage}`)
    } finally {
      setIsDeleting(false)
    }
  }

  // Handle clear selection
  const handleClearSelection = () => {
    setRowSelection({})
  }

  // Handle collection creation
  const handleCreateCollection = async () => {
    if (!collectionForm.name.trim()) return

    // Use dev token in development if no real token is available
    const effectiveToken = authToken || (process.env.NODE_ENV === "development" ? "devtoken" : null)
    
    if (!effectiveToken) {
      alert("Authentication required")
      return
    }

    setIsCreating(true)
    try {
      const response = await fetch('/api/folders', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${effectiveToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: collectionForm.name.trim(),
          description: collectionForm.description.trim() || null,
          visibility: collectionForm.privacy,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create collection')
      }

      // Reset form and close modal
      setCollectionForm({ name: "", description: "", privacy: "private" })
      setCreateCollectionOpen(false)
      
      // Refresh the page to show new collection
      window.location.reload()
    } catch (error) {
      console.error('Error creating collection:', error)
      alert('Failed to create collection. Please try again.')
    } finally {
      setIsCreating(false)
    }
  }

  // Reset form when modal closes
  const handleModalClose = () => {
    setCreateCollectionOpen(false)
    setCollectionForm({ name: "", description: "", privacy: "private" })
  }

  // Show loading while session is loading
  if (status === "loading" && process.env.NODE_ENV !== "development") {
    return (
      <div className="flex flex-col gap-4 px-4 lg:px-6">
        <div className="text-center py-8">Loading...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col gap-4 px-4 lg:px-6">
        <div className="text-red-600">Error loading collections: {error}</div>
      </div>
    )
  }

  const hasSelection = Object.keys(rowSelection).length > 0

  return (
    <div 
      className={cn(
        "w-full flex-col justify-start gap-6 relative",
        isDragging && "drag-active"
      )}
      {...dragHandlers}
    >
      {/* Drag overlay - only visible when dragging files */}
      {isDragging && (
        <div className="absolute inset-0 z-50 flex items-center justify-center rounded-lg border-2 border-dashed border-primary bg-primary/10 backdrop-blur-sm">
          <div className="rounded-lg bg-background p-8 text-center shadow-lg">
            <IconUpload className="mx-auto mb-4 h-12 w-12 text-primary" />
            <h3 className="mb-2 text-xl font-medium">Drop to Upload</h3>
            <p className="text-muted-foreground">
              Files will be uploaded as unfiled content
            </p>
          </div>
        </div>
      )}

      {/* Header with controls - matches documents pattern exactly */}
      <div className="flex items-center justify-between px-4 lg:px-6 py-6">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <IconFolder className="h-5 w-5" />
            <h1 className="text-2xl font-bold tracking-tight">Research Collections</h1>
          </div>
          
          <div className="flex items-center gap-2 ml-4">
            <IconSearch className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search collections..."
              value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
              onChange={(event) =>
                table.getColumn("name")?.setFilterValue(event.target.value)
              }
              className="max-w-sm"
            />
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Bulk Action Buttons - always visible, disabled when no selection */}
          {/* Delete button - icon only */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleBulkDeleteCollections}
            disabled={loading || !hasSelection}
            className="flex items-center gap-2 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
          >
            <IconTrash className="h-4 w-4" />
          </Button>

          {/* Upload button */}
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setUploadDialogOpen(true)}
            disabled={uploadLoading}
            className="flex items-center gap-2"
          >
            <IconUpload className="h-4 w-4" />
            <span className="hidden lg:inline">Upload</span>
          </Button>
          
          {/* Collections dropdown - consolidated on far right */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <IconFolder className="h-4 w-4" />
                <span className="hidden lg:inline">Collections</span>
                <IconChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {/* New Collection */}
              <DropdownMenuItem onClick={() => setCreateCollectionOpen(true)}>
                <IconPlus className="h-4 w-4 mr-2" />
                New Collection
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              
              {/* Selection actions - only show when items are selected */}
              {hasSelection && (
                <>
                  <DropdownMenuItem 
                    onClick={handleClearSelection}
                    disabled={loading}
                  >
                    <IconX className="h-4 w-4 mr-2" />
                    Clear Selection
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              
              {/* Future actions */}
              <DropdownMenuItem disabled>
                Create Graph (Coming Soon)
              </DropdownMenuItem>
              <DropdownMenuItem disabled>
                Share (Coming Soon)
              </DropdownMenuItem>
              <DropdownMenuItem disabled>
                Export (Coming Soon)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Columns */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <IconLayoutColumns className="h-4 w-4" />
                <span className="hidden lg:inline">Columns</span>
                <IconChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {table
                .getAllColumns()
                .filter(
                  (column) =>
                    typeof column.accessorFn !== "undefined" &&
                    column.getCanHide()
                )
                .map((column) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                      }
                    >
                      {column.id}
                    </DropdownMenuCheckboxItem>
                  )
                })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Table content - matches documents pattern */}
      <div className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6">
        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader className="bg-muted sticky top-0 z-10">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead key={header.id} colSpan={header.colSpan}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </TableHead>
                    )
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center">
                    Loading collections...
                  </TableCell>
                </TableRow>
              ) : table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={(event) => handleRowClick(row.original, event)}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center">
                    <div className="flex flex-col items-center justify-center py-8">
                      <IconUpload className="mx-auto mb-2 h-12 w-12 text-muted-foreground" />
                      <p className="text-muted-foreground">No collections found.</p>
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
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination - matches documents pattern */}
        <div className="flex items-center justify-between px-4">
          <div className="text-muted-foreground hidden flex-1 text-sm lg:flex">
            {table.getFilteredSelectedRowModel().rows.length} of{" "}
            {table.getFilteredRowModel().rows.length} row(s) selected.
          </div>
          <div className="flex w-full items-center gap-8 lg:w-fit">
            <div className="hidden items-center gap-2 lg:flex">
              <Label htmlFor="rows-per-page" className="text-sm font-medium">
                Rows per page
              </Label>
              <Select
                value={`${table.getState().pagination.pageSize}`}
                onValueChange={(value) => {
                  table.setPageSize(Number(value))
                }}
              >
                <SelectTrigger size="sm" className="w-20" id="rows-per-page">
                  <SelectValue
                    placeholder={table.getState().pagination.pageSize}
                  />
                </SelectTrigger>
                <SelectContent side="top">
                  {[10, 20, 30, 40, 50].map((pageSize) => (
                    <SelectItem key={pageSize} value={`${pageSize}`}>
                      {pageSize}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex w-fit items-center justify-center text-sm font-medium">
              Page {table.getState().pagination.pageIndex + 1} of{" "}
              {table.getPageCount()}
            </div>
            <div className="ml-auto flex items-center gap-2 lg:ml-0">
              <Button
                variant="outline"
                className="hidden h-8 w-8 p-0 lg:flex"
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
              >
                <span className="sr-only">Go to first page</span>
                <IconChevronsLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                className="size-8"
                size="icon"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                <span className="sr-only">Go to previous page</span>
                <IconChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                className="size-8"
                size="icon"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                <span className="sr-only">Go to next page</span>
                <IconChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                className="hidden size-8 lg:flex"
                size="icon"
                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                disabled={!table.getCanNextPage()}
              >
                <span className="sr-only">Go to last page</span>
                <IconChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Upload Dialog */}
      <UnifiedUploadDialog
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
        currentFolderId={null}
        folders={folders}
        onUploadComplete={() => {
          // Additional completion handling if needed
        }}
        loading={uploadLoading}
        onFileUpload={handleFileUpload}
        onBatchFileUpload={handleBatchFileUpload}
        onTextUpload={handleTextUpload}
      />

      {/* Collection Creation Modal */}
      <Dialog open={createCollectionOpen} onOpenChange={handleModalClose}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create New Collection</DialogTitle>
            <DialogDescription>
              Organize your documents and graphs into a collection with privacy controls.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="collection-name">Collection Name *</Label>
              <Input
                id="collection-name"
                placeholder="Enter collection name..."
                value={collectionForm.name}
                onChange={(e) => setCollectionForm(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="collection-description">Description</Label>
              <Textarea
                id="collection-description"
                placeholder="Optional description..."
                value={collectionForm.description}
                onChange={(e) => setCollectionForm(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
              />
            </div>
            
            <div className="grid gap-3">
              <Label>Privacy Level</Label>
              <RadioGroup
                value={collectionForm.privacy}
                onValueChange={(value: string) => setCollectionForm(prev => ({ ...prev, privacy: value as "private" | "shared" | "public" }))}
              >
                <div className="flex items-start space-x-3 space-y-0">
                  <RadioGroupItem value="private" id="privacy-private" />
                  <div className="grid gap-1.5 leading-none">
                    <Label htmlFor="privacy-private" className="flex items-center gap-2 font-medium">
                      <IconLock className="h-4 w-4" />
                      Private
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Only you can access this collection
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3 space-y-0">
                  <RadioGroupItem value="shared" id="privacy-shared" />
                  <div className="grid gap-1.5 leading-none">
                    <Label htmlFor="privacy-shared" className="flex items-center gap-2 font-medium">
                      <IconUsers className="h-4 w-4" />
                      Shared
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Invite collaborators to access this collection
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3 space-y-0">
                  <RadioGroupItem value="public" id="privacy-public" />
                  <div className="grid gap-1.5 leading-none">
                    <Label htmlFor="privacy-public" className="flex items-center gap-2 font-medium">
                      <IconGlobe className="h-4 w-4" />
                      Public
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Discoverable by anyone, invite collaborators
                    </p>
                  </div>
                </div>
              </RadioGroup>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={handleModalClose} disabled={isCreating}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreateCollection} 
              disabled={!collectionForm.name.trim() || isCreating}
            >
              {isCreating ? "Creating..." : "Create Collection"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleConfirmDelete}
        itemCount={Object.keys(rowSelection).filter(id => id !== "all-content").length}
        itemType="collection"
        isLoading={isDeleting}
        title="Delete Collections?"
        description={`Are you sure you want to delete ${Object.keys(rowSelection).filter(id => id !== "all-content").length} collection${Object.keys(rowSelection).filter(id => id !== "all-content").length !== 1 ? 's' : ''}? This will remove the collections but keep all files (documents will become unfiled).`}
      />
    </div>
  )
} 