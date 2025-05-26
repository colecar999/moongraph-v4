"use client"

import { useState } from "react"
import { IconFolder, IconX, IconChevronDown } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Folder } from "@/components/types"

interface BulkActionToolbarProps {
  selectedCount: number
  folders: Folder[]
  onMoveToFolder: (folderId: string) => Promise<void>
  onClearSelection: () => void
  loading?: boolean
}

export function BulkActionToolbar({
  selectedCount,
  folders,
  onMoveToFolder,
  onClearSelection,
  loading = false,
}: BulkActionToolbarProps) {
  const [isMoving, setIsMoving] = useState(false)

  const handleMoveToFolder = async (folderId: string) => {
    setIsMoving(true)
    try {
      await onMoveToFolder(folderId)
    } finally {
      setIsMoving(false)
    }
  }

  const handleRemoveFromFolder = async () => {
    setIsMoving(true)
    try {
      await onMoveToFolder("") // Empty string means remove from folder
    } finally {
      setIsMoving(false)
    }
  }

  if (selectedCount === 0) {
    return null
  }

  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50">
      <div className="bg-background border rounded-lg shadow-lg p-4 flex items-center gap-4 min-w-[400px]">
        <Badge variant="secondary" className="flex items-center gap-1">
          {selectedCount} document{selectedCount !== 1 ? 's' : ''} selected
        </Badge>

        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                disabled={isMoving || loading}
                className="flex items-center gap-2"
              >
                <IconFolder className="h-4 w-4" />
                Move to Folder
                <IconChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" className="w-56">
              <DropdownMenuItem 
                onClick={handleRemoveFromFolder}
                disabled={isMoving || loading}
              >
                <IconX className="h-4 w-4 mr-2" />
                Remove from Folder
              </DropdownMenuItem>
              {folders.length > 0 && (
                <>
                  <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground border-t">
                    Move to:
                  </div>
                  {folders.map((folder) => (
                    <DropdownMenuItem
                      key={folder.id}
                      onClick={() => handleMoveToFolder(folder.id)}
                      disabled={isMoving || loading}
                    >
                      <IconFolder className="h-4 w-4 mr-2" />
                      {folder.name}
                    </DropdownMenuItem>
                  ))}
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="ghost"
            size="sm"
            onClick={onClearSelection}
            disabled={isMoving || loading}
          >
            <IconX className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
} 