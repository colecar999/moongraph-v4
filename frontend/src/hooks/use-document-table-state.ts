import { useState, useMemo } from "react"
import {
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { documentColumns } from "@/components/documents/table-columns"
import { Document } from "@/components/types"

interface UseDocumentTableStateProps {
  documents: Document[]
  onDocumentClick: (document: Document, event: React.MouseEvent) => void
}

export function useDocumentTableState({ documents, onDocumentClick }: UseDocumentTableStateProps) {
  // Table state
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = useState({})
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  })

  // Initialize table
  const table = useReactTable({
    data: documents,
    columns: documentColumns,
    state: {
      sorting,
      columnVisibility,
      columnFilters,
      rowSelection,
      pagination,
    },
    getRowId: (row) => row.external_id,
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

  // Memoized click handler
  const handleDocumentClick = useMemo(() => onDocumentClick, [onDocumentClick])

  return {
    table,
    handleDocumentClick,
  }
} 