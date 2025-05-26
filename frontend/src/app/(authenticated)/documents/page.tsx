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
  IconSearch
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
interface FolderRowData {
  id: string
  name: string
  type: "folder" | "all-documents"
  documentCount: number
  lastModified: string
  owner: string
}

// Create the "All Documents" row
function createAllDocumentsRow(totalDocuments: number): FolderRowData {
  return {
    id: "all-documents",
    name: "All Documents",
    type: "all-documents",
    documentCount: totalDocuments,
    lastModified: "—",
    owner: "—"
  }
}

// Convert folders to table data
function foldersToTableData(folders: Folder[], totalDocuments: number): FolderRowData[] {
  const allDocumentsRow = createAllDocumentsRow(totalDocuments)
  
  const folderRows: FolderRowData[] = folders.map(folder => ({
    id: folder.id,
    name: folder.name,
    type: "folder" as const,
    documentCount: folder.document_count || 0,
    lastModified: folder.updated_at ? new Date(folder.updated_at).toLocaleDateString() : "—",
    owner: "—" // TODO: Add owner info when available
  }))

  return [allDocumentsRow, ...folderRows]
}

// MOVED OUTSIDE COMPONENT: Define table columns to prevent recreation on every render
const columns: ColumnDef<FolderRowData>[] = [
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
      const isAllDocuments = row.original.type === "all-documents"
      const icon = isAllDocuments ? (
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
]

export default function DocumentsPage() {
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

  // MEMOIZED: Convert folders to table data to prevent recreation on every render
  const tableData = useMemo(() => {
    return foldersToTableData(folders, totalDocuments)
  }, [folders, totalDocuments])

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
    enableRowSelection: true,
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
  const handleRowClick = useMemo(() => (row: FolderRowData, event: React.MouseEvent) => {
    // Don't navigate if clicking on checkbox
    if ((event.target as HTMLElement).closest('[role="checkbox"]')) {
      return
    }
    
    if (row.type === "all-documents") {
      router.push("/documents/all")
    } else {
      router.push(`/documents/${row.id}`)
    }
  }, [router])

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

  return (
    <div className="w-full flex-col justify-start gap-6">
      {/* Header with controls - matches dashboard pattern */}
      <div className="flex items-center justify-between px-4 lg:px-6 py-6">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <IconSearch className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search folders..."
              value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
              onChange={(event) =>
                table.getColumn("name")?.setFilterValue(event.target.value)
              }
              className="max-w-sm"
            />
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
            <span className="hidden lg:inline">New Folder</span>
          </Button>
        </div>
      </div>

      {/* Table content - matches dashboard pattern */}
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

        {/* Pagination - matches dashboard pattern */}
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