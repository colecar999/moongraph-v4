"use client"

import { IconX } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Document } from "@/components/types"

interface DocumentDetailPanelProps {
  document: Document | null
  onClose: () => void
  additionalInfo?: React.ReactNode
}

export function DocumentDetailPanel({ document, onClose, additionalInfo }: DocumentDetailPanelProps) {
  if (!document) return null

  return (
    <div className="fixed right-0 top-0 h-full w-1/3 border-l bg-background shadow-lg z-50 overflow-y-auto">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Document Details</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <IconX className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Basic document info */}
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground">Filename</label>
            <p className="text-sm">{document.filename || document.external_id}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">Content Type</label>
            <p className="text-sm">{document.content_type}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">Status</label>
            <p className="text-sm">
              {typeof document.system_metadata?.status === 'string' 
                ? document.system_metadata.status 
                : "Unknown"}
            </p>
          </div>
          {additionalInfo}
          <div>
            <label className="text-sm font-medium text-muted-foreground">Document ID</label>
            <p className="text-sm font-mono text-xs">{document.external_id}</p>
          </div>
        </div>
        
        <p className="text-xs text-muted-foreground mt-6">
          Full document detail panel will be integrated in the next phase
        </p>
      </div>
    </div>
  )
} 