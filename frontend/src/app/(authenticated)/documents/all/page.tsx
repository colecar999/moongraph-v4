"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { DocumentTable } from "@/components/documents/DocumentTable"
import { DocumentDetailPanel } from "@/components/documents/DocumentDetailPanel"
import { useDocuments } from "@/hooks/use-documents"
import { Document } from "@/components/types"

export default function AllDocumentsPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null)
  
  // Get API configuration
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000"
  const authToken = session?.accessToken as string | null

  // Fetch all documents (no folder filter)
  const { documents, loading, error } = useDocuments({
    apiBaseUrl,
    authToken,
    folderId: null, // null means fetch all documents
  })

  // Handle document row clicks
  const handleDocumentClick = useMemo(() => (document: Document, event: React.MouseEvent) => {
    // Don't open detail panel if clicking on checkbox
    if ((event.target as HTMLElement).closest('[role="checkbox"]')) {
      return
    }
    
    console.log("AllDocumentsPage: Document clicked:", document.filename || document.external_id)
    setSelectedDocument(document)
  }, [])

  // Handle back navigation
  const handleBack = () => {
    router.push("/documents")
  }

  // Show loading while session is loading
  if (status === "loading") {
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

  return (
    <div className="flex h-full">
      {/* Main content */}
      <div className={`flex-1 transition-all duration-300 ${selectedDocument ? "mr-1/3" : ""}`}>
        <DocumentTable
          documents={documents}
          loading={loading}
          title="All Documents"
          onBack={handleBack}
          onDocumentClick={handleDocumentClick}
        />
      </div>

      {/* Document Detail Panel */}
      <DocumentDetailPanel
        document={selectedDocument}
        onClose={() => setSelectedDocument(null)}
      />
    </div>
  )
} 