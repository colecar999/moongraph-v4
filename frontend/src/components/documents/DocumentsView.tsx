"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { IconArrowLeft } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { DocumentTable } from "@/components/documents/DocumentTable"
import { DocumentDetailPanel } from "@/components/documents/DocumentDetailPanel"
import { useDocuments } from "@/hooks/use-documents"
import { useFolders } from "@/hooks/use-folders"
import { useBulkMoveDocuments } from "@/hooks/use-bulk-move-documents"
import { Document } from "@/components/types"

interface DocumentsViewProps {
  folderId?: string | null // null = all documents, string = specific folder
  title: string
  showBackButton?: boolean
  onBack?: () => void
  additionalHeaderButtons?: React.ReactNode
}

export function DocumentsView({
  folderId,
  title,
  showBackButton = false,
  onBack,
  additionalHeaderButtons,
}: DocumentsViewProps) {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null)
  const [selectedDocumentIds, setSelectedDocumentIds] = useState<string[]>([])
  
  // Get API configuration
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000"
  // Use dev token if no session in development
  const authToken = session?.accessToken as string || 
    (process.env.NODE_ENV === "development" ? "devtoken" : null)

  // Fetch documents (all or folder-specific based on folderId)
  const { documents, loading: documentsLoading, error, refetch: refetchDocuments } = useDocuments({
    apiBaseUrl,
    authToken,
    folderId, // null for all documents, folder ID for specific folder
  })

  // Fetch folders for bulk move functionality and folder info
  const { folders, loading: foldersLoading } = useFolders({
    apiBaseUrl,
    authToken,
    sessionStatus: status,
  })

  // Find current folder info if viewing a specific folder
  const currentFolder = folderId ? folders.find(folder => folder.id === folderId) : null

  // Bulk move functionality
  const { bulkMoveDocuments, loading: bulkMoveLoading } = useBulkMoveDocuments({
    apiBaseUrl,
    authToken,
  })

  const loading = documentsLoading || foldersLoading

  // Handle document row clicks
  const handleDocumentClick = useMemo(() => (document: Document, event: React.MouseEvent) => {
    // Don't open detail panel if clicking on checkbox
    if ((event.target as HTMLElement).closest('[role="checkbox"]')) {
      return
    }
    
    console.log("DocumentsView: Document clicked:", document.filename || document.external_id)
    setSelectedDocument(document)
  }, [])

  // Handle bulk move to folder
  const handleBulkMoveToFolder = useMemo(() => async (documentIds: string[], targetFolderId: string) => {
    try {
      await bulkMoveDocuments(documentIds, targetFolderId)
      // Refetch documents to update the UI
      await refetchDocuments()
    } catch (error) {
      console.error("Failed to move documents:", error)
      // You might want to show a toast notification here
    }
  }, [bulkMoveDocuments, refetchDocuments])

  // Handle bulk delete documents
  const handleBulkDeleteDocuments = useMemo(() => async (documentIds: string[]) => {
    try {
      // TODO: Implement bulk delete API call
      console.log("Bulk delete documents:", documentIds)
      // For now, just refetch to update UI
      await refetchDocuments()
    } catch (error) {
      console.error("Failed to delete documents:", error)
    }
  }, [refetchDocuments])

  // Handle selection changes from DocumentTable
  const handleSelectionChange = useMemo(() => (selectedIds: string[]) => {
    setSelectedDocumentIds(selectedIds)
  }, [])

  // Handle clear selection
  const handleClearSelection = useMemo(() => () => {
    setSelectedDocumentIds([])
  }, [])

  // Handle back navigation
  const handleBack = useMemo(() => () => {
    if (onBack) {
      onBack()
    } else {
      router.push("/documents")
    }
  }, [onBack, router])

  // Show loading while session is loading (but not in development with dev token)
  if (status === "loading" && process.env.NODE_ENV !== "development") {
    return (
      <div className="flex flex-col gap-4 px-4 lg:px-6">
        <div className="text-center py-8">Loading...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col gap-4 px-4 lg:px-6">
        <div className="text-red-600">Error loading documents: {error}</div>
      </div>
    )
  }

  // Determine the effective title (use folder name if available and viewing specific folder)
  const effectiveTitle = currentFolder?.name || title

  return (
    <div className="flex h-full">
      {/* Main content */}
      <div className={`flex-1 transition-all duration-300 ${selectedDocument ? "mr-1/3" : ""}`}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-4">
              {showBackButton && (
                <Button variant="ghost" size="sm" onClick={handleBack}>
                  <IconArrowLeft className="h-4 w-4" />
                  Back
                </Button>
              )}
              <h1 className="text-2xl font-semibold">{effectiveTitle}</h1>
            </div>
            <div className="flex items-center gap-2">
              {additionalHeaderButtons}
            </div>
          </div>

          {/* Document Table */}
          <div className="flex-1">
            <DocumentTable
              documents={documents}
              loading={loading || bulkMoveLoading}
              title={effectiveTitle}
              onBack={handleBack}
              onDocumentClick={handleDocumentClick}
              folders={folders}
              currentFolderId={folderId}
              onBulkMoveToFolder={handleBulkMoveToFolder}
              onBulkDeleteDocuments={handleBulkDeleteDocuments}
              onSelectionChange={handleSelectionChange}
            />
          </div>
        </div>
      </div>

      {/* Document Detail Panel */}
      <DocumentDetailPanel
        document={selectedDocument}
        onClose={() => setSelectedDocument(null)}
      />
    </div>
  )
} 