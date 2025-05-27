"use client"

import React from "react"
import { Badge } from "@/components/ui/badge"

export interface StatusBadgeProps {
  status?: string
  showTooltip?: boolean
  className?: string
}

export function StatusBadge({ status, showTooltip = true, className }: StatusBadgeProps) {
  if (!status) {
    return (
      <Badge variant="outline" className={className}>
        Unknown
      </Badge>
    )
  }

  switch (status.toLowerCase()) {
    case "completed":
      return (
        <Badge
          variant="outline"
          className={`flex items-center gap-1 border-green-200 bg-green-50 text-xs font-normal text-green-700 dark:border-green-800 dark:bg-green-900/20 dark:text-green-400 ${className || ""}`}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-green-500"></span>
          Completed
        </Badge>
      )
    
    case "failed":
      return (
        <Badge
          variant="outline"
          className={`flex items-center gap-1 border-red-200 bg-red-50 text-xs font-normal text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400 ${className || ""}`}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-red-500"></span>
          Failed
        </Badge>
      )
    
    case "processing":
      return (
        <div className="group relative flex items-center">
          <Badge
            variant="outline"
            className={`flex items-center gap-1 border-amber-200 bg-amber-50 text-xs font-normal text-amber-700 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-400 ${className || ""}`}
          >
            <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-500"></div>
            Processing
          </Badge>
          {showTooltip && (
            <div className="absolute -bottom-14 left-0 z-10 hidden whitespace-nowrap rounded-md border bg-popover p-2 text-xs text-foreground shadow-md group-hover:block">
              Document is being processed. Partial search available.
            </div>
          )}
        </div>
      )
    
    default:
      return (
        <Badge variant="outline" className={className}>
          {status}
        </Badge>
      )
  }
}

// Helper function for getting status from system_metadata
export function getDocumentStatus(systemMetadata?: Record<string, unknown>): string {
  if (!systemMetadata) return "unknown"
  
  const status = systemMetadata.status
  if (typeof status === 'string') {
    return status
  }
  
  return "unknown"
} 