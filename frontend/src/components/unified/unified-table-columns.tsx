"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { 
  MoreHorizontal, 
  FileText, 
  Download, 
  Trash2,
  Share,
  Network,
  Clock
} from "lucide-react"
import { IconFiles, IconGraph } from "@tabler/icons-react"
import { Checkbox } from "@/components/ui/checkbox"
import { UnifiedContentItem } from "@/hooks/useUnifiedContent"
import { StatusBadge, getDocumentStatus } from "@/components/ui/status-badge"
import { formatDate, formatFileSize, getFileTypeDisplay } from "@/lib/utils/format-helpers"

// Helper function to get content type badge
function getContentTypeBadge(contentType: 'document' | 'graph') {
  switch (contentType) {
    case "document":
      return <Badge variant="secondary" className="text-blue-600">Document</Badge>
    case "graph":
      return <Badge variant="outline" className="text-purple-600">Graph</Badge>
    default:
      return <Badge variant="outline">Unknown</Badge>
  }
}

// Unified columns for documents and graphs
export const unifiedContentColumns: ColumnDef<UnifiedContentItem>[] = [
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
      const item = row.original
      const icon = item.content_type === 'document' ? 
        <IconFiles className="h-4 w-4 text-blue-500" /> : 
        <IconGraph className="h-4 w-4 text-purple-500" />
      
      return (
        <div className="flex items-center gap-2">
          {icon}
          <span className="font-medium">{item.name}</span>
        </div>
      )
    },
    enableHiding: false,
  },
  {
    accessorKey: "content_type",
    header: "Type",
    cell: ({ row }) => getContentTypeBadge(row.original.content_type),
  },
  {
    accessorKey: "file_type",
    header: "Format",
    cell: ({ row }) => {
      const item = row.original
      if (item.content_type === 'document') {
        // Use filename or file_name to determine file type
        const filename = item.filename || item.file_name || item.name
        return (
          <div className="text-sm text-muted-foreground">
            {getFileTypeDisplay(filename)}
          </div>
        )
      }
      if (item.content_type === 'graph') {
        const entityCount = item.entities?.length || 0
        const relationshipCount = item.relationships?.length || 0
        return (
          <div className="text-sm text-muted-foreground">
            {entityCount}E, {relationshipCount}R
          </div>
        )
      }
      return <div className="text-sm text-muted-foreground">—</div>
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const item = row.original
      // Only show status for documents
      if (item.content_type === 'document') {
        const status = getDocumentStatus(item.system_metadata)
        return <StatusBadge status={status} />
      }
      // For graphs, show a simple "Active" status or similar
      return (
        <Badge variant="outline" className="text-xs">
          Active
        </Badge>
      )
    },
  },
  {
    accessorKey: "file_size",
    header: "Size",
    cell: ({ row }) => {
      const item = row.original
      if (item.content_type === 'document' && item.file_size) {
        return (
          <div className="text-sm text-muted-foreground">
            {formatFileSize(item.file_size)}
          </div>
        )
      }
      if (item.content_type === 'graph') {
        const docCount = item.document_ids?.length || 0
        return (
          <div className="text-sm text-muted-foreground">
            {docCount} docs
          </div>
        )
      }
      return <div className="text-sm text-muted-foreground">—</div>
    },
  },
  {
    accessorKey: "updated_at",
    header: "Last Modified",
    cell: ({ row }) => (
      <div className="text-sm text-muted-foreground">
        {formatDate(row.original.updated_at)}
      </div>
    ),
  },
  {
    accessorKey: "created_at",
    header: "Created",
    cell: ({ row }) => (
      <div className="text-sm text-muted-foreground">
        {formatDate(row.original.created_at)}
      </div>
    ),
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const item = row.original
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {item.content_type === 'document' && (
              <>
                <DropdownMenuItem>
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Share className="mr-2 h-4 w-4" />
                  Share
                </DropdownMenuItem>
              </>
            )}
            {item.content_type === 'graph' && (
              <>
                <DropdownMenuItem>
                  <Network className="mr-2 h-4 w-4" />
                  View Graph
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Share className="mr-2 h-4 w-4" />
                  Share
                </DropdownMenuItem>
              </>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-red-600">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
] 