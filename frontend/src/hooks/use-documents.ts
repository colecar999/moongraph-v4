"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { Document, Folder } from "@/components/types"

interface UseDocumentsProps {
  apiBaseUrl: string
  authToken: string | null
  folderId?: string | null // UUID for specific folder, null for all documents
  folders?: Folder[] // Needed for folder-based document fetching
}

interface UseDocumentsReturn {
  documents: Document[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useDocuments({ 
  apiBaseUrl, 
  authToken, 
  folderId, 
  folders = [] 
}: UseDocumentsProps): UseDocumentsReturn {
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Memoize folders to prevent infinite re-renders
  const stableFolders = useMemo(() => folders, [folders.length, folders.map(f => f.id).join(',')])

  const fetchDocuments = useCallback(async () => {
    if (!apiBaseUrl) {
      setError("No API URL provided")
      return
    }

    // Don't fetch if we don't have an auth token yet
    if (!authToken) {
      console.log("useDocuments: No auth token available, skipping fetch")
      return
    }

    setLoading(true)
    setError(null)

    try {
      let documentsToFetch: Document[] = []

      if (!folderId) {
        // Fetch all documents
        console.log("useDocuments: Fetching all documents")
        const response = await fetch(`${apiBaseUrl}/documents`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
          },
          body: JSON.stringify({}), // Empty body for all documents
        })

        if (!response.ok) {
          throw new Error(`Failed to fetch all documents: ${response.statusText}`)
        }

        documentsToFetch = await response.json()
        console.log(`useDocuments: Fetched ${documentsToFetch.length} total documents`)
        console.log("useDocuments: All documents IDs:", documentsToFetch.map(d => d.external_id))
      } else {
        // Fetch documents for a specific folder by ID
        console.log(`useDocuments: Fetching documents for folder ID: ${folderId}`)
        
        // Find the folder by ID
        const targetFolder = stableFolders.find(folder => folder.id === folderId)

        if (targetFolder && Array.isArray(targetFolder.document_ids) && targetFolder.document_ids.length > 0) {
          // Folder found and has documents, fetch them by ID
          console.log(
            `useDocuments: Folder found with ${targetFolder.document_ids.length} IDs:`,
            targetFolder.document_ids
          )
          
          const response = await fetch(`${apiBaseUrl}/batch/documents`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
            },
            body: JSON.stringify({ document_ids: targetFolder.document_ids }),
          })

          if (!response.ok) {
            throw new Error(`Failed to fetch batch documents: ${response.statusText}`)
          }

          documentsToFetch = await response.json()
          console.log(
            `useDocuments: Fetched details for ${documentsToFetch.length} documents.`,
            `Expected ${targetFolder.document_ids.length}, got ${documentsToFetch.length}.`,
            documentsToFetch.map(d => d.external_id)
          )
        } else {
          // Folder not found or folder is empty
          if (targetFolder) {
            console.log(`useDocuments: Folder ${folderId} found but is empty.`)
          } else {
            console.log(`useDocuments: Folder ${folderId} not found.`)
          }
          documentsToFetch = []
        }
      }

      // Process fetched documents (add status if needed)
      const processedData = documentsToFetch.map((doc: Document) => {
        if (!doc.system_metadata) {
          doc.system_metadata = {}
        }
        if (!doc.system_metadata.status && doc.system_metadata.folder_id) {
          doc.system_metadata.status = "processing"
        }
        return doc
      })

      setDocuments(processedData)
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "An unknown error occurred"
      console.error("useDocuments: Error fetching documents:", errorMsg)
      setError(errorMsg)
      setDocuments([]) // Clear documents on error
    } finally {
      setLoading(false)
    }
  }, [apiBaseUrl, authToken, folderId, stableFolders])

  // Fetch documents when dependencies change
  useEffect(() => {
    fetchDocuments()
  }, [fetchDocuments])

  return {
    documents,
    loading,
    error,
    refetch: fetchDocuments,
  }
} 