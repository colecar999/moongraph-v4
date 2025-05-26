import { useState, useMemo, useEffect } from "react"
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
import { unifiedContentColumns } from "@/components/unified/unified-table-columns"
import { UnifiedContentItem } from "@/hooks/useUnifiedContent"

interface UseUnifiedTableStateProps {
  content: UnifiedContentItem[]
  onItemClick: (item: UnifiedContentItem, event: React.MouseEvent) => void
  onSelectionChange?: (selectedIds: string[]) => void
}

export function useUnifiedTableState({ 
  content, 
  onItemClick, 
  onSelectionChange 
}: UseUnifiedTableStateProps) {
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
    data: content,
    columns: unifiedContentColumns,
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

  // Notify parent of selection changes
  useEffect(() => {
    if (onSelectionChange) {
      const selectedIds = Object.keys(rowSelection).filter(id => (rowSelection as Record<string, boolean>)[id])
      onSelectionChange(selectedIds)
    }
  }, [rowSelection, onSelectionChange])

  return {
    table,
    handleItemClick: onItemClick,
  }
} 