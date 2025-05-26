"use client"

import { use } from "react"
import { DocumentsView } from "@/components/documents/DocumentsView"
import { DocumentPageButtons } from "@/components/documents/DocumentPageButtons"

interface FolderPageProps {
  params: Promise<{
    folder_id: string
  }>
}

export default function FolderPage({ params }: FolderPageProps) {
  // Unwrap params Promise using React.use()
  const { folder_id } = use(params)

  return (
    <DocumentsView
      folderId={folder_id} // specific folder ID
      title="Folder Documents" // Will be replaced with actual folder name
      showBackButton={true}
      additionalHeaderButtons={<DocumentPageButtons />}
    />
  )
} 