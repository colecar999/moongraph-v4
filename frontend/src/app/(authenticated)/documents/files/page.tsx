"use client";

import DocumentsSection from "@/components/documents/DocumentsSection"
import { useConnection } from "@/context/ConnectionContext"

export default function FilesPage() {
  const { apiBaseUrl, authToken, isAuthenticated, isLoading } = useConnection()

  const handleDocumentUpload = (fileName: string, fileSize: number) => {
    console.log("Document uploaded:", fileName, fileSize)
  }
  const handleDocumentDelete = (fileName: string) => {
    console.log("Document deleted:", fileName)
  }
  const handleDocumentClick = (fileName: string) => {
    console.log("Document clicked:", fileName)
  }
  const handleFolderCreate = (folderName: string) => {
    console.log("Folder created:", folderName)
  }
  const handleFolderClick = (folderName: string | null) => {
    console.log("Folder clicked:", folderName)
  }
  const handleRefresh = () => {
    console.log("Refresh triggered")
  }

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="text-sm text-gray-600">Loading...</p>
      </div>
    )
  }

  // Show message if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-4">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Authentication Required</h3>
          <p className="text-sm text-gray-600">Please sign in to access your documents.</p>
        </div>
      </div>
    )
  }

  return (
      <DocumentsSection
        apiBaseUrl={apiBaseUrl}
        authToken={authToken}
        initialFolder={null}
        setSidebarCollapsed={(collapsed) => console.log("Set sidebar collapsed:", collapsed)}
        onDocumentUpload={handleDocumentUpload}
        onDocumentDelete={handleDocumentDelete}
        onDocumentClick={handleDocumentClick}
        onFolderCreate={handleFolderCreate}
        onFolderClick={handleFolderClick}
        onRefresh={handleRefresh}
      />
  )
} 
