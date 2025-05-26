'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { useUnifiedContent, UnifiedContentItem } from '@/hooks/useUnifiedContent';
import { useUnifiedTableState } from '@/hooks/useUnifiedTableState';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  IconArrowLeft,
  IconLayoutColumns,
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
  IconSearch,
  IconFolder,
  IconTrash,
  IconDots,
  IconX,
  IconFilter
} from '@tabler/icons-react';
import { flexRender } from '@tanstack/react-table';
import { Folder } from '@/components/types';
import { DeleteConfirmationDialog } from '@/components/ui/delete-confirmation-dialog';

interface UnifiedContentViewProps {
  folderId?: string | null;
  onItemClick?: (item: UnifiedContentItem) => void;
  onBack?: () => void;
  title?: string;
  folders?: Folder[];
  onBulkMoveToFolder?: (itemIds: string[], folderId: string) => Promise<void>;
  onBulkDeleteItems?: (itemIds: string[]) => Promise<void>;
}

export function UnifiedContentView({
  folderId = null,
  onItemClick,
  onBack,
  title = "Unified Content",
  folders = [],
  onBulkMoveToFolder,
  onBulkDeleteItems,
}: UnifiedContentViewProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [contentTypeFilter, setContentTypeFilter] = useState<'all' | 'document' | 'graph'>('all');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const { content, loading, error, stats } = useUnifiedContent({ folderId });

  // Filter content by type
  const filteredContent = useMemo(() => {
    if (contentTypeFilter === 'all') return content;
    return content.filter(item => item.content_type === contentTypeFilter);
  }, [content, contentTypeFilter]);

  // Memoized callbacks to prevent infinite loops
  const handleSelectionChange = useCallback((selectedIds: string[]) => {
    setSelectedIds(selectedIds);
  }, []);

  const handleItemClick = useCallback((item: UnifiedContentItem, event: React.MouseEvent) => {
    // Don't trigger item click if clicking on checkbox
    if ((event.target as HTMLElement).closest('[role="checkbox"]')) {
      return;
    }
    onItemClick?.(item);
  }, [onItemClick]);

  const handleBulkMoveToFolder = useCallback(async (folderId: string) => {
    if (!onBulkMoveToFolder || selectedIds.length === 0) return;
    
    try {
      await onBulkMoveToFolder(selectedIds, folderId);
      setSelectedIds([]);
    } catch (error) {
      console.error("Error moving items:", error);
    }
  }, [onBulkMoveToFolder, selectedIds]);

  const handleBulkDeleteItems = useCallback(async () => {
    if (!onBulkDeleteItems || selectedIds.length === 0) return;
    
    setIsDeleting(true);
    try {
      await onBulkDeleteItems(selectedIds);
      setSelectedIds([]);
    } catch (error) {
      console.error("Error deleting items:", error);
    } finally {
      setIsDeleting(false);
    }
  }, [onBulkDeleteItems, selectedIds]);

  const handleDeleteClick = useCallback(() => {
    if (selectedIds.length === 0) return;
    setDeleteDialogOpen(true);
  }, [selectedIds]);

  const handleBack = useCallback(() => {
    onBack?.();
  }, [onBack]);

  const { table, handleItemClick: tableHandleItemClick } = useUnifiedTableState({
    content: filteredContent,
    onItemClick: handleItemClick,
    onSelectionChange: handleSelectionChange,
  });

  const hasSelection = selectedIds.length > 0;
  const isInSpecificFolder = folderId !== null && folderId !== undefined;

  const handleRemoveFromFolder = async () => {
    if (!onBulkMoveToFolder || selectedIds.length === 0) return;
    
    try {
      // Empty string means remove from folder (set folder_id to null)
      await onBulkMoveToFolder(selectedIds, "");
      setSelectedIds([]);
    } catch (error) {
      console.error("Error removing items from folder:", error);
    }
  };

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-red-600">Error loading content: {error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full flex-col justify-start gap-6">
      {/* Header with breadcrumb and controls */}
      <div className="flex items-center justify-between px-4 lg:px-6 py-6">
        <div className="flex items-center gap-4">
          {onBack && (
            <>
              <Button variant="ghost" size="sm" onClick={handleBack}>
                <IconArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <span className="text-muted-foreground">/</span>
            </>
          )}
          <span className="font-medium">{title}</span>
          
          <div className="flex items-center gap-2 ml-4">
            <IconSearch className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search content..."
              value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
              onChange={(event) =>
                table.getColumn("name")?.setFilterValue(event.target.value)
              }
              className="max-w-sm"
            />
          </div>

          {/* Content type filter */}
          <div className="flex items-center gap-2">
            <IconFilter className="h-4 w-4 text-muted-foreground" />
            <Select value={contentTypeFilter} onValueChange={(value: 'all' | 'document' | 'graph') => setContentTypeFilter(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="document">Documents</SelectItem>
                <SelectItem value="graph">Graphs</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Bulk Action Buttons - always visible, disabled when no selection */}
          {/* Folders dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                disabled={loading || !hasSelection}
                className="flex items-center gap-2"
              >
                <IconFolder className="h-4 w-4" />
                Folders
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              {/* Remove from current folder option (only show when in a specific folder) */}
              {isInSpecificFolder && (
                <>
                  <DropdownMenuItem 
                    onClick={handleRemoveFromFolder}
                    disabled={loading || !hasSelection}
                    className="text-orange-600 dark:text-orange-400"
                  >
                    <IconX className="h-4 w-4 mr-2" />
                    Remove from Current Folder
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              
              {/* Info about graph limitations */}
              {hasSelection && (
                <>
                  <div className="px-2 py-1.5 text-xs text-muted-foreground">
                    Note: Only documents can be moved to folders. Graphs will be skipped.
                  </div>
                  <DropdownMenuSeparator />
                </>
              )}
              
              {/* Move to folder options */}
              {folders && folders.length > 0 ? (
                folders
                  .filter(folder => folder.id !== folderId) // Don't show current folder
                  .map((folder) => (
                    <DropdownMenuItem
                      key={folder.id}
                      onClick={() => handleBulkMoveToFolder(folder.id)}
                      disabled={loading || !hasSelection}
                    >
                      <IconFolder className="h-4 w-4 mr-2" />
                      {folder.name}
                      {folder.document_count !== undefined && (
                        <span className="ml-auto text-xs text-muted-foreground">
                          {folder.document_count}
                        </span>
                      )}
                    </DropdownMenuItem>
                  ))
              ) : (
                <DropdownMenuItem disabled>
                  No folders available
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Delete button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleDeleteClick}
            disabled={loading || !hasSelection}
            className="flex items-center gap-2 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
          >
            <IconTrash className="h-4 w-4" />
            Delete
          </Button>

          {/* More actions dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                disabled={loading || !hasSelection}
                className="flex items-center gap-2"
              >
                <IconDots className="h-4 w-4" />
                More
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              <DropdownMenuItem disabled>
                Create Graph (Coming Soon)
              </DropdownMenuItem>
              <DropdownMenuItem disabled>
                Create Report (Coming Soon)
              </DropdownMenuItem>
              <DropdownMenuItem disabled>
                Share (Coming Soon)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Customize Columns */}
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
        </div>
      </div>

      {/* Table content */}
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
                  <TableCell colSpan={table.getAllColumns().length} className="h-24 text-center">
                    Loading content...
                  </TableCell>
                </TableRow>
              ) : table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={(event) => tableHandleItemClick(row.original, event)}
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
                  <TableCell colSpan={table.getAllColumns().length} className="h-24 text-center">
                    No content found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
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
                  <SelectValue placeholder="10" />
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

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleBulkDeleteItems}
        itemCount={selectedIds.length}
        itemType="item"
        isLoading={isDeleting}
      />
    </div>
  );
} 