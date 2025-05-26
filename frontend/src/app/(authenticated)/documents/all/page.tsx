"use client"

import { DocumentsView } from "@/components/documents/DocumentsView"
import { DocumentPageButtons } from "@/components/documents/DocumentPageButtons"

export default function AllDocumentsPage() {
  return (
    <DocumentsView
      folderId={null} // null means fetch all documents
      title="All Documents"
      showBackButton={true}
      additionalHeaderButtons={<DocumentPageButtons />}
    />
  )
} 