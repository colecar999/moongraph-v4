"use client"

import { useState, useEffect, useCallback } from "react"
import { Folder } from "@/components/types"

interface UseFoldersProps {
  apiBaseUrl: string
  authToken: string | null
}

interface UseFoldersReturn {
  folders: Folder[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
  totalDocuments: number
  getAccurateDocumentCount: (folderId: string) => Promise<number>
}

export function useFolders({ apiBaseUrl, authToken }: UseFoldersProps): UseFoldersReturn {
  const [folders, setFolders] = useState<Folder[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Calculate total documents across all folders
  const totalDocuments = folders.reduce((total, folder) => {
    return total + (folder.document_ids?.length || 0)
  }, 0)

  // Fetch folders when authToken becomes available
  useEffect(() => {
    if (!apiBaseUrl) {
      setError("No API URL provided")
      return
    }

    // Don't fetch if we don't have an auth token yet
    if (!authToken) {
      console.log("useFolders: No auth token available, skipping fetch")
      return
    }

    const fetchFolders = async () => {
      setLoading(true)
      setError(null)

      try {
        console.log("useFolders: Fetching folders from", `${apiBaseUrl}/folders`)
        
        const response = await fetch(`${apiBaseUrl}/folders`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        })

        if (!response.ok) {
          throw new Error(`Failed to fetch folders: ${response.statusText}`)
        }

        const data = await response.json()
        console.log(`useFolders: Fetched ${data.length} folders`)
        
        setFolders(data)
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "An unknown error occurred"
        console.error("useFolders: Error fetching folders:", errorMsg)
        setError(errorMsg)
        setFolders([]) // Clear folders on error
      } finally {
        setLoading(false)
      }
    }

    fetchFolders()
  }, [authToken, apiBaseUrl]) // Only depend on the actual values

  // Refetch function for manual refresh
  const refetch = useCallback(async () => {
    if (!apiBaseUrl || !authToken) return

    setLoading(true)
    setError(null)

    try {
      console.log("useFolders: Manual refetch from", `${apiBaseUrl}/folders`)
      
      const response = await fetch(`${apiBaseUrl}/folders`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch folders: ${response.statusText}`)
      }

      const data = await response.json()
      console.log(`useFolders: Refetched ${data.length} folders`)
      
      setFolders(data)
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "An unknown error occurred"
      console.error("useFolders: Error refetching folders:", errorMsg)
      setError(errorMsg)
      setFolders([]) // Clear folders on error
    } finally {
      setLoading(false)
    }
  }, [apiBaseUrl, authToken])

  return {
    folders,
    loading,
    error,
    refetch,
    totalDocuments,
  }
} 