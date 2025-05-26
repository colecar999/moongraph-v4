"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { Document, Folder } from "@/components/types"

interface UseDocumentsProps {
  apiBaseUrl: string
  authToken: string | null
  folderId?: string | null // UUID for specific folder, null for all documents
  folders?: Folder[] // Not needed anymore with the new approach
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

  // Memoize folders to prevent unnecessary re-renders
  const stableFolders = useMemo(() => folders, [folders])

  const fetchDocuments = useCallback(async () => {
    if (!apiBaseUrl) {
      console.error("useDocuments: No API base URL provided")
      return
    }

    if (!authToken) {
      console.log("useDocuments: No auth token, skipping fetch")
      return
    }

    setLoading(true)
    setError(null)

    try {
      let documentsToFetch: Document[] = []

      if (!folderId) {
        // Fetch all documents using GET /documents
        console.log("useDocuments: Fetching all documents")
        const response = await fetch(`${apiBaseUrl}/documents`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
          },
        })

        if (!response.ok) {
          throw new Error(`Failed to fetch all documents: ${response.statusText}`)
        }

        documentsToFetch = await response.json()
        console.log(`useDocuments: Fetched ${documentsToFetch.length} total documents`)
        console.log("useDocuments: All documents IDs:", documentsToFetch.map(d => d.external_id))
      } else {
        // Fetch documents for a specific folder using GET /folders/{folder_id}/documents
        console.log(`useDocuments: Fetching documents for folder ID: ${folderId}`)
        
        const response = await fetch(`${apiBaseUrl}/folders/${folderId}/documents`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
          },
        })

        if (!response.ok) {
          throw new Error(`Failed to fetch documents for folder ${folderId}: ${response.statusText}`)
        }

        documentsToFetch = await response.json()
        console.log(
          `useDocuments: Fetched ${documentsToFetch.length} documents for folder ${folderId}`,
          documentsToFetch.map(d => d.external_id)
        )
      }

      // Process fetched documents (add status if needed)
      const processedData = documentsToFetch.map((doc: Document) => {
        if (!doc.system_metadata) {
          doc.system_metadata = {}
        }
        if (!doc.system_metadata.status && doc.system_metadata.folder_name) {
          doc.system_metadata.status = "processing"
        }
        return doc
      })

      setDocuments(processedData)
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "An unknown error occurred"
      console.error(`useDocuments: Error fetching documents: ${errorMsg}`)
      setError(errorMsg)
      setDocuments([])
    } finally {
      setLoading(false)
    }
  }, [apiBaseUrl, authToken, folderId])

  // Fetch documents when dependencies change
  useEffect(() => {
    fetchDocuments()
  }, [fetchDocuments])

  const refetch = useCallback(async () => {
    await fetchDocuments()
  }, [fetchDocuments])

  return {
    documents,
    loading,
    error,
    refetch,
  }
} 