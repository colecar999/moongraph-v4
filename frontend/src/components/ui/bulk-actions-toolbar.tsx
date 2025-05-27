"use client"

import { useState } from "react"
import { 
  IconFolder, 
  IconTrash, 
  IconDots, 
  IconChevronDown,
  IconX,
  IconShare,
  IconFileText,
  IconGraph
} from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"

export interface BulkAction {
  id: string
  label: string
  icon?: React.ReactNode
  onClick: () => void | Promise<void>
  disabled?: boolean
  variant?: "default" | "destructive" | "warning"
  separator?: boolean
}

export interface BulkActionsToolbarProps {
  selectedCount: number
  itemType: "document" | "collection" | "item"
  onClearSelection: () => void
  onDelete?: () => void | Promise<void>
  folders?: Array<{ id: string; name: string; document_count?: number }>
  onMoveToFolder?: (folderId: string) => void | Promise<void>
  currentFolderId?: string | null
  moreActions?: BulkAction[]
  loading?: boolean
  className?: string
}

export function BulkActionsToolbar({
  selectedCount,
  itemType,
  onClearSelection,
  onDelete,
  folders = [],
  onMoveToFolder,
  currentFolderId,
  moreActions = [],
  loading = false,
  className = "",
}: BulkActionsToolbarProps) {
  const [isProcessing, setIsProcessing] = useState(false)

  if (selectedCount === 0) {
    return null
  }

  const itemLabel = itemType === "document" ? "document" : itemType === "collection" ? "collection" : "item"
  const pluralLabel = selectedCount === 1 ? itemLabel : `${itemLabel}s`
  const isInSpecificFolder = currentFolderId !== null && currentFolderId !== undefined

  const handleAction = async (action: () => void | Promise<void>) => {
    setIsProcessing(true)
    try {
      await action()
    } finally {
      setIsProcessing(false)
    }
  }

  const handleMoveToFolder = async (folderId: string) => {
    if (onMoveToFolder) {
      await handleAction(() => onMoveToFolder(folderId))
    }
  }

  const handleRemoveFromFolder = async () => {
    if (onMoveToFolder) {
      await handleAction(() => onMoveToFolder(""))
    }
  }

  const handleDelete = async () => {
    if (onDelete) {
      await handleAction(onDelete)
    }
  }

  const isActionDisabled = loading || isProcessing

  const defaultMoreActions: BulkAction[] = itemType === "document" ? [
    {
      id: "create-graph",
      label: "Create Graph",
      icon: <IconGraph className="h-4 w-4" />,
      onClick: () => console.log("Create graph"),
      disabled: true
    },
    {
      id: "create-report", 
      label: "Create Report",
      icon: <IconFileText className="h-4 w-4" />,
      onClick: () => console.log("Create report"),
      disabled: true
    },
    {
      id: "share",
      label: "Share",
      icon: <IconShare className="h-4 w-4" />,
      onClick: () => console.log("Share"),
      disabled: true,
      separator: true
    }
  ] : itemType === "collection" ? [
    {
      id: "share",
      label: "Share Collection",
      icon: <IconShare className="h-4 w-4" />,
      onClick: () => console.log("Share collection"),
      disabled: true
    },
    {
      id: "export",
      label: "Export Collection",
      icon: <IconFileText className="h-4 w-4" />,
      onClick: () => console.log("Export collection"),
      disabled: true
    }
  ] : []

  const allMoreActions = [...defaultMoreActions, ...moreActions]

  return (
    <div className={`flex items-center justify-between gap-4 p-4 bg-muted/50 rounded-lg border ${className}`}>
      <div className="flex items-center gap-4">
        <Badge variant="secondary" className="flex items-center gap-1">
          {selectedCount} {pluralLabel} selected
        </Badge>
      </div>
      
      <div className="flex items-center gap-2">
        {(itemType === "document" || onMoveToFolder) && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                disabled={isActionDisabled}
                className="flex items-center gap-2"
              >
                <IconFolder className="h-4 w-4" />
                {itemType === "collection" ? "Collections" : "Folders"}
                <IconChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {isInSpecificFolder && itemType === "document" && (
                <>
                  <DropdownMenuItem 
                    onClick={handleRemoveFromFolder}
                    disabled={isActionDisabled}
                    className="text-orange-600 dark:text-orange-400"
                  >
                    <IconX className="h-4 w-4 mr-2" />
                    Remove from Current Folder
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              
              <DropdownMenuItem 
                onClick={onClearSelection}
                disabled={isActionDisabled}
              >
                <IconX className="h-4 w-4 mr-2" />
                Clear Selection
              </DropdownMenuItem>
              
              {folders.length > 0 && (
                <>
                  <DropdownMenuSeparator />
                  {folders
                    .filter(folder => folder.id !== currentFolderId)
                    .map((folder) => (
                      <DropdownMenuItem
                        key={folder.id}
                        onClick={() => handleMoveToFolder(folder.id)}
                        disabled={isActionDisabled}
                      >
                        <IconFolder className="h-4 w-4 mr-2" />
                        {folder.name}
                        {folder.document_count !== undefined && (
                          <span className="ml-auto text-xs text-muted-foreground">
                            {folder.document_count}
                          </span>
                        )}
                      </DropdownMenuItem>
                    ))}
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        
        {onDelete && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleDelete}
            disabled={isActionDisabled}
            className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300"
          >
            <IconTrash className="h-4 w-4" />
            Delete
          </Button>
        )}
        
        {allMoreActions.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                disabled={isActionDisabled}
                className="flex items-center gap-2"
              >
                <IconDots className="h-4 w-4" />
                More
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {allMoreActions.map((action, index) => (
                <div key={action.id}>
                  {action.separator && index > 0 && <DropdownMenuSeparator />}
                  <DropdownMenuItem
                    onClick={() => handleAction(action.onClick)}
                    disabled={isActionDisabled || action.disabled}
                    className={action.variant === "destructive" ? "text-red-600 dark:text-red-400" : ""}
                  >
                    {action.icon && <span className="mr-2">{action.icon}</span>}
                    {action.label}
                    {action.disabled && (
                      <span className="ml-auto text-xs text-muted-foreground">(Coming Soon)</span>
                    )}
                  </DropdownMenuItem>
                </div>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  )
} 