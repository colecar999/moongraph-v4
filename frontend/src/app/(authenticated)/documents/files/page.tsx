"use client";

import DocumentsSection from "@/components/documents/DocumentsSection"
import { useConnection } from "@/context/ConnectionContext"

export default function FilesPage() {
  const { apiBaseUrl, authToken } = useConnection()

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
