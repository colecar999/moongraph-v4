"use client"

import { useState, useMemo, use } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { IconUpload, IconSettings } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { DocumentTable } from "@/components/documents/DocumentTable"
import { DocumentDetailPanel } from "@/components/documents/DocumentDetailPanel"
import { useDocuments } from "@/hooks/use-documents"
import { useFolders } from "@/hooks/use-folders"
import { Document } from "@/components/types"

interface FolderPageProps {
  params: Promise<{
    folder_id: string
  }>
}

export default function FolderPage({ params }: FolderPageProps) {
  // Unwrap params Promise using React.use()
  const { folder_id } = use(params)
  
  const router = useRouter()
  const { data: session, status } = useSession()
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null)
  
  // Get API configuration
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000"
  const authToken = session?.accessToken as string | null

  // Fetch folders to get folder info and for document fetching
  const { folders, loading: foldersLoading } = useFolders({
    apiBaseUrl,
    authToken,
  })

  // Find the current folder
  const currentFolder = folders.find(folder => folder.id === folder_id)

  // Fetch documents for this specific folder
  const { documents, loading: documentsLoading, error } = useDocuments({
    apiBaseUrl,
    authToken,
    folderId: folder_id,
    folders, // Pass folders for document fetching
  })

  const loading = foldersLoading || documentsLoading

  // Handle document row clicks
  const handleDocumentClick = useMemo(() => (document: Document, event: React.MouseEvent) => {
    // Don't open detail panel if clicking on checkbox
    if ((event.target as HTMLElement).closest('[role="checkbox"]')) {
      return
    }
    
    console.log("FolderPage: Document clicked:", document.filename || document.external_id)
    setSelectedDocument(document)
  }, [])

  // Handle back navigation
  const handleBack = () => {
    router.push("/documents")
  }

  // Validate folder ID format (should be UUID)
  const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(folder_id)

  // Show loading while session is loading
  if (status === "loading") {
    return (
      <div className="flex flex-col gap-4 px-4 lg:px-6">
        <div className="text-center py-8">Loading...</div>
      </div>
    )
  }

  if (!isValidUUID) {
    return (
      <div className="flex flex-col gap-4 px-4 lg:px-6">
        <div className="text-red-600">Invalid folder ID format.</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col gap-4 px-4 lg:px-6">
        <div className="text-red-600">Error loading folder: {error}</div>
      </div>
    )
  }

  // Show loading state while folders are being fetched
  if (foldersLoading) {
    return (
      <div className="flex flex-col gap-4 px-4 lg:px-6">
        <div className="text-center py-8">Loading folder...</div>
      </div>
    )
  }

  // Show error if folder not found
  if (!currentFolder) {
    return (
      <div className="flex flex-col gap-4 px-4 lg:px-6">
        <div className="text-red-600">Folder not found.</div>
      </div>
    )
  }

  // Additional header buttons for folder-specific actions
  const additionalHeaderButtons = (
    <>
      <Button variant="outline" size="sm">
        <IconSettings className="h-4 w-4" />
        <span className="hidden lg:inline">Folder Settings</span>
      </Button>
      <Button size="sm">
        <IconUpload className="h-4 w-4" />
        <span className="hidden lg:inline">Upload Files</span>
      </Button>
    </>
  )

  // Additional info for document detail panel
  const additionalDocumentInfo = currentFolder && (
    <div>
      <label className="text-sm font-medium text-muted-foreground">Folder</label>
      <p className="text-sm">{currentFolder.name}</p>
    </div>
  )

  return (
    <div className="flex h-full">
      {/* Main content */}
      <div className={`flex-1 transition-all duration-300 ${selectedDocument ? "mr-1/3" : ""}`}>
        <DocumentTable
          documents={documents}
          loading={loading}
          title={currentFolder.name}
          onBack={handleBack}
          onDocumentClick={handleDocumentClick}
          additionalHeaderButtons={additionalHeaderButtons}
        />
      </div>

      {/* Document Detail Panel */}
      <DocumentDetailPanel
        document={selectedDocument}
        onClose={() => setSelectedDocument(null)}
        additionalInfo={additionalDocumentInfo}
      />
    </div>
  )
} 