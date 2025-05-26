"use client"

import { useState, useMemo } from "react"
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
  IconDots
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
      case "team_shared":
        return "Shared"  // Simplified: invited collaborators
      case "public_readable":
        return "Public"  // Simplified: discoverable + collaborators
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
  
  // Get API configuration
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000"
  const authToken = session?.accessToken as string | null

  // Fetch folders data
  const { folders, loading, error, totalDocuments } = useFolders({ 
    apiBaseUrl, 
    authToken 
  })

  // TODO: Fetch total graphs count when available
  const totalGraphs = 0

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

  // Handle bulk folder deletion
  const handleBulkDeleteFolders = async () => {
    const selectedFolderIds = Object.keys(rowSelection).filter(id => id !== "all-content")
    
    if (selectedFolderIds.length === 0) return
    
    const confirmed = window.confirm(
      `Are you sure you want to delete ${selectedFolderIds.length} folder${selectedFolderIds.length !== 1 ? 's' : ''}? This will also remove all documents from these folders.`
    )
    if (!confirmed) return

    try {
      // Delete each folder
      for (const folderId of selectedFolderIds) {
        const response = await fetch(`/api/folders/${folderId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${authToken || 'devtoken'}`,
          },
        })

        if (!response.ok) {
          throw new Error(`Failed to delete folder ${folderId}`)
        }
      }

      // Refresh the page
      window.location.reload()
    } catch (error) {
      console.error('Error deleting folders:', error)
      alert('Failed to delete some folders. Please try again.')
    }
  }

  // Show loading while session is loading
  if (status === "loading") {
    return (
      <div className="flex flex-col gap-4 px-4 lg:px-6">
        <div className="text-center py-8">Loading...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col gap-4 px-4 lg:px-6">
        <div className="text-red-600">Error loading folders: {error}</div>
      </div>
    )
  }

  const hasSelection = Object.keys(rowSelection).length > 0

  return (
    <div className="w-full flex-col justify-start gap-6">
      {/* Header with controls - matches documents pattern */}
      <div className="flex items-center justify-between px-4 lg:px-6 py-6">
        <div className="flex flex-col gap-4 flex-1">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <IconFolder className="h-5 w-5" />
              <h1 className="text-2xl font-bold tracking-tight">Research Collections</h1>
            </div>
          </div>
          
          {/* Search toolbar - no bulk actions at folder level */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
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
        </div>
        
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <IconLayoutColumns className="h-4 w-4" />
                <span className="hidden lg:inline">Customize Columns</span>
                <span className="lg:hidden">Columns</span>
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
          <Button variant="outline" size="sm">
            <IconPlus className="h-4 w-4" />
            <span className="hidden lg:inline">New Collection</span>
          </Button>
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
                    Loading folders...
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
                    No folders found.
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
    </div>
  )
} 