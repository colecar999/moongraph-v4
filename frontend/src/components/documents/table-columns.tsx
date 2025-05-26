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
  Folder, 
  FileText, 
  Download, 
  Trash2,
  Share,
  Edit,
  Clock,
  User,
  Files
} from "lucide-react"
import { Document, Folder as FolderType } from "@/components/types"
import { IconFiles, IconFolder } from "@tabler/icons-react"
import { Checkbox } from "@/components/ui/checkbox"

// Helper function to format dates
function formatDate(dateString?: string): string {
  if (!dateString) return "—"
  try {
    return new Date(dateString).toLocaleDateString()
  } catch {
    return "—"
  }
}

// Helper function to format file sizes
function formatFileSize(bytes?: number): string {
  if (!bytes) return "—"
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`
}

// Helper function to get status badge
function getStatusBadge(status?: string) {
  switch (status) {
    case "processing":
      return <Badge variant="secondary" className="text-yellow-600">Processing</Badge>
    case "completed":
      return <Badge variant="default" className="text-green-600">Completed</Badge>
    case "failed":
      return <Badge variant="destructive">Failed</Badge>
    default:
      return <Badge variant="outline">Unknown</Badge>
  }
}

// Folder columns for the main documents page
export const folderColumns: ColumnDef<any>[] = [
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
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <IconFolder className="h-4 w-4 text-muted-foreground" />
        <span className="font-medium">{row.original.name}</span>
      </div>
    ),
    enableHiding: false,
  },
  {
    accessorKey: "document_count",
    header: "Documents",
    cell: ({ row }) => (
      <div className="text-sm text-muted-foreground">
        {row.original.document_count || 0}
      </div>
    ),
  },
  {
    accessorKey: "created_at",
    header: "Created",
    cell: ({ row }) => (
      <div className="text-sm text-muted-foreground">
        {row.original.created_at ? new Date(row.original.created_at).toLocaleDateString() : "—"}
      </div>
    ),
  },
]

// Document columns for folder contents and all documents view
export const documentColumns: ColumnDef<Document>[] = [
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
    accessorKey: "filename",
    header: "Name",
    cell: ({ row }) => {
      const filename = row.original.filename || row.original.external_id
      return (
        <div className="flex items-center gap-2">
          <IconFiles className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{filename}</span>
        </div>
      )
    },
    enableHiding: false,
  },
  {
    accessorKey: "content_type",
    header: "Type",
    cell: ({ row }) => (
      <div className="text-sm text-muted-foreground">
        {row.original.content_type || "—"}
      </div>
    ),
  },
  {
    accessorKey: "system_metadata.status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.original.system_metadata?.status
      return (
        <div className="text-sm text-muted-foreground">
          {typeof status === 'string' ? status : "—"}
        </div>
      )
    },
  },
  {
    accessorKey: "system_metadata.updated_at",
    header: "Last Modified",
    cell: ({ row }) => {
      const updatedAt = row.original.system_metadata?.updated_at
      return (
        <div className="text-sm text-muted-foreground">
          {updatedAt && typeof updatedAt === 'string' ? new Date(updatedAt).toLocaleDateString() : "—"}
        </div>
      )
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const document = row.original
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>
              <Download className="mr-2 h-4 w-4" />
              Download
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Share className="mr-2 h-4 w-4" />
              Share
            </DropdownMenuItem>
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

// Special row type for "All Documents" entry
export interface AllDocumentsRow {
  id: "all-documents"
  name: "All Documents"
  type: "special"
  document_count: number
}

// Mixed columns for when we show both folders and special rows
export const mixedFolderColumns: ColumnDef<FolderType | AllDocumentsRow>[] = [
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => {
      const item = row.original
      
      if ("type" in item && item.type === "special") {
        return (
          <div className="flex items-center space-x-2">
            <FileText className="h-4 w-4 text-green-500" />
            <span className="font-medium text-green-600">{item.name}</span>
          </div>
        )
      }
      
      const folder = item as FolderType
      return (
        <div className="flex items-center space-x-2">
          <Folder className="h-4 w-4 text-blue-500" />
          <span className="font-medium">{folder.name}</span>
        </div>
      )
    },
  },
  {
    accessorKey: "document_count",
    header: "Documents",
    cell: ({ row }) => {
      const item = row.original
      
      if ("type" in item && item.type === "special") {
        return (
          <div className="flex items-center space-x-1">
            <Files className="h-3 w-3 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">{item.document_count}</span>
          </div>
        )
      }
      
      const folder = item as FolderType
      const count = folder.document_count || 0
      return (
        <div className="flex items-center space-x-1">
          <Files className="h-3 w-3 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">{count}</span>
        </div>
      )
    },
  },
  {
    accessorKey: "updated_at",
    header: "Last Modified",
    cell: ({ row }) => {
      const item = row.original
      
      if ("type" in item && item.type === "special") {
        return (
          <span className="text-sm text-muted-foreground">—</span>
        )
      }
      
      const folder = item as FolderType
      return (
        <div className="flex items-center space-x-1">
          <Clock className="h-3 w-3 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {formatDate(folder.updated_at)}
          </span>
        </div>
      )
    },
  },
  {
    accessorKey: "owner",
    header: "Owner",
    cell: ({ row }) => {
      const item = row.original
      
      if ("type" in item && item.type === "special") {
        return (
          <span className="text-sm text-muted-foreground">—</span>
        )
      }
      
      const folder = item as FolderType
      return (
        <div className="flex items-center space-x-1">
          <User className="h-3 w-3 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {folder.owner || "—"}
          </span>
        </div>
      )
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const item = row.original
      
      // No actions for special rows
      if ("type" in item && item.type === "special") {
        return null
      }
      
      const folder = item as FolderType
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>
              <Edit className="mr-2 h-4 w-4" />
              Rename
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Share className="mr-2 h-4 w-4" />
              Share
            </DropdownMenuItem>
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