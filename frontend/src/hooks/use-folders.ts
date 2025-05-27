"use client"

import { useState, useEffect, useCallback } from "react"
import { Folder } from "@/components/types"

interface UseFoldersProps {
  apiBaseUrl: string
  authToken: string | null
  sessionStatus?: "loading" | "authenticated" | "unauthenticated"
}

interface UseFoldersReturn {
  folders: Folder[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
  totalDocuments: number
}

interface FoldersStatsResponse {
  folders: Folder[]
  total_documents: number
  unfiled_documents: number
  documents_in_folders: number
}

export function useFolders({ apiBaseUrl, authToken, sessionStatus }: UseFoldersProps): UseFoldersReturn {
  const [folders, setFolders] = useState<Folder[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [totalDocuments, setTotalDocuments] = useState<number>(0)

  // Fetch folders and document statistics in a single API call
  const fetchFoldersWithStats = useCallback(async () => {
    if (!apiBaseUrl) return

    // Use dev token in development if no real token is available
    const effectiveToken = authToken || (process.env.NODE_ENV === "development" ? "devtoken" : null)
    
    if (!effectiveToken) {
      console.log("useFolders: No auth token available and not in dev mode, skipping fetch")
      return
    }

    try {
      console.log("useFolders: Fetching folders with stats from", `/api/folders/stats`)
      console.log("useFolders: Using auth token:", effectiveToken ? `${effectiveToken.substring(0, 20)}...` : "null")
      
      const response = await fetch(`/api/folders/stats`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${effectiveToken}`,
        },
      })

      console.log("useFolders: Response status:", response.status)
      console.log("useFolders: Response headers:", Object.fromEntries(response.headers.entries()))

      if (!response.ok) {
        const errorText = await response.text()
        console.error("useFolders: Error response body:", errorText)
        throw new Error(`Failed to fetch folders with stats: ${response.status} ${response.statusText} - ${errorText}`)
      }

      const data: FoldersStatsResponse = await response.json()
      
      console.log(`useFolders: Fetched ${data.folders.length} folders, ${data.total_documents} total docs, ${data.unfiled_documents} unfiled docs`)
      
      setFolders(data.folders)
      setTotalDocuments(data.total_documents)
      
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to fetch folders with stats"
      console.error("useFolders: Error fetching folders with stats:", errorMsg)
      throw err // Re-throw to be handled by caller
    }
  }, [apiBaseUrl, authToken])

  // Fetch folders when authToken becomes available
  useEffect(() => {
    if (!apiBaseUrl) {
      setError("No API URL provided")
      return
    }

    // Wait for session to finish loading before making API calls
    if (sessionStatus === "loading") {
      console.log("useFolders: Session still loading, waiting...")
      return
    }

    // Use dev token in development if no real token is available
    const effectiveToken = authToken || (process.env.NODE_ENV === "development" ? "devtoken" : null)
    
    if (!effectiveToken) {
      console.log("useFolders: No auth token available and not in dev mode, skipping fetch")
      return
    }

    const fetchData = async () => {
      setLoading(true)
      setError(null)

      try {
        await fetchFoldersWithStats()
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "An unknown error occurred"
        console.error("useFolders: Error fetching data:", errorMsg)
        setError(errorMsg)
        setFolders([]) // Clear folders on error
        setTotalDocuments(0) // Clear total on error
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [authToken, apiBaseUrl, sessionStatus, fetchFoldersWithStats])

  // Refetch function for manual refresh
  const refetch = useCallback(async () => {
    if (!apiBaseUrl) return

    // Use dev token in development if no real token is available
    const effectiveToken = authToken || (process.env.NODE_ENV === "development" ? "devtoken" : null)
    
    if (!effectiveToken) return

    setLoading(true)
    setError(null)

    try {
      console.log("useFolders: Manual refetch")
      await fetchFoldersWithStats()
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "An unknown error occurred"
      console.error("useFolders: Error refetching data:", errorMsg)
      setError(errorMsg)
      setFolders([]) // Clear folders on error
      setTotalDocuments(0) // Clear total on error
    } finally {
      setLoading(false)
    }
  }, [apiBaseUrl, authToken, fetchFoldersWithStats])

  return {
    folders,
    loading,
    error,
    refetch,
    totalDocuments,
  }
} 