"use client"

import { useState } from "react"
import { IconFolder, IconTrash, IconDots, IconX, IconLayoutColumns } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Folder } from "@/components/types"

interface ContextualActionBarProps {
  folders: Folder[]
  currentFolderId?: string | null
  selectedDocumentIds?: string[]
  onMoveToFolder: (documentIds: string[], folderId: string) => Promise<void>
  onDeleteDocuments: (documentIds: string[]) => Promise<void>
  onClearSelection?: () => void
  loading?: boolean
}

export function ContextualActionBar({
  folders,
  currentFolderId,
  selectedDocumentIds = [],
  onMoveToFolder,
  onDeleteDocuments,
  onClearSelection,
  loading = false,
}: ContextualActionBarProps) {
  const [isMoving, setIsMoving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const selectedCount = selectedDocumentIds.length
  const hasSelection = selectedCount > 0
  const isInSpecificFolder = currentFolderId !== null && currentFolderId !== undefined

  const handleMoveToFolder = async (folderId: string) => {
    if (!hasSelection) return
    
    setIsMoving(true)
    try {
      await onMoveToFolder(selectedDocumentIds, folderId)
      onClearSelection?.()
    } finally {
      setIsMoving(false)
    }
  }

  const handleRemoveFromFolder = async () => {
    if (!hasSelection) return
    
    setIsMoving(true)
    try {
      // Empty string means remove from folder (set folder_id to null)
      await onMoveToFolder(selectedDocumentIds, "")
      onClearSelection?.()
    } finally {
      setIsMoving(false)
    }
  }

  const handleDeleteDocuments = async () => {
    if (!hasSelection) return
    
    // TODO: Add confirmation dialog
    const confirmed = window.confirm(`Are you sure you want to delete ${selectedCount} document${selectedCount !== 1 ? 's' : ''}?`)
    if (!confirmed) return

    setIsDeleting(true)
    try {
      await onDeleteDocuments(selectedDocumentIds)
      onClearSelection?.()
    } finally {
      setIsDeleting(false)
    }
  }

  const isActionDisabled = !hasSelection || loading || isMoving || isDeleting

  return (
    <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/30">
      <div className="flex items-center gap-2">
        {/* Selection indicator */}
        {hasSelection && (
          <Badge variant="secondary" className="flex items-center gap-1">
            {selectedCount} document{selectedCount !== 1 ? 's' : ''} selected
          </Badge>
        )}

        {/* Folders dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="outline" 
              size="sm" 
              disabled={isActionDisabled}
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
                  disabled={isActionDisabled}
                  className="text-orange-600 dark:text-orange-400"
                >
                  <IconX className="h-4 w-4 mr-2" />
                  Remove from Current Folder
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}
            
            {/* Move to folder options */}
            {folders.length > 0 ? (
              folders
                .filter(folder => folder.id !== currentFolderId) // Don't show current folder
                .map((folder) => (
                  <DropdownMenuItem
                    key={folder.id}
                    onClick={() => handleMoveToFolder(folder.id)}
                    disabled={isActionDisabled}
                  >
                    <IconFolder className="h-4 w-4 mr-2" />
                    {folder.name}
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
          onClick={handleDeleteDocuments}
          disabled={isActionDisabled}
          className="flex items-center gap-2 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
        >
          <IconTrash className="h-4 w-4" />
          Delete
        </Button>

        {/* More actions dropdown (placeholder for future features) */}
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
          <DropdownMenuContent align="start" className="w-48">
            <DropdownMenuItem disabled>
              <IconLayoutColumns className="h-4 w-4 mr-2" />
              Create Graph (Coming Soon)
            </DropdownMenuItem>
            <DropdownMenuItem disabled>
              <IconLayoutColumns className="h-4 w-4 mr-2" />
              Create Report (Coming Soon)
            </DropdownMenuItem>
            <DropdownMenuItem disabled>
              <IconLayoutColumns className="h-4 w-4 mr-2" />
              Share (Coming Soon)
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex items-center gap-2">
        {/* Clear selection */}
        {hasSelection && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearSelection}
            disabled={loading || isMoving || isDeleting}
            className="flex items-center gap-2"
          >
            <IconX className="h-4 w-4" />
            Clear
          </Button>
        )}

        {/* Customize columns (placeholder - this would be passed from parent) */}
        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
        >
          <IconLayoutColumns className="h-4 w-4" />
          <span className="hidden lg:inline">Customize Columns</span>
          <span className="lg:hidden">Columns</span>
        </Button>
      </div>
    </div>
  )
} 