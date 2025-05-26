import { useState } from "react"

interface BulkMoveDocumentsParams {
  apiBaseUrl: string
  authToken: string | null
}

interface BulkMoveRequest {
  document_ids: string[]
  folder_id?: string | null
}

interface BulkMoveResponse {
  success: boolean
  processed: number
  results: Array<{
    document_id: string
    action: string
    folder_id?: string
  }>
  errors: Array<{
    document_id: string
    error: string
  }>
}

export function useBulkMoveDocuments({ apiBaseUrl, authToken }: BulkMoveDocumentsParams) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const bulkMoveDocuments = async (documentIds: string[], folderId: string): Promise<BulkMoveResponse> => {
    if (!authToken) {
      throw new Error("No authentication token available")
    }

    setLoading(true)
    setError(null)

    try {
      const requestBody: BulkMoveRequest = {
        document_ids: documentIds,
        folder_id: folderId || null, // Empty string becomes null for "remove from folder"
      }

      const response = await fetch(`${apiBaseUrl}/documents/bulk-move`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`)
      }

      const result: BulkMoveResponse = await response.json()
      
      if (!result.success && result.errors.length > 0) {
        // If there are errors but some succeeded, you might want to handle this differently
        const errorMessages = result.errors.map(e => `${e.document_id}: ${e.error}`).join(", ")
        setError(`Some operations failed: ${errorMessages}`)
      }

      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to move documents"
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }

  return {
    bulkMoveDocuments,
    loading,
    error,
  }
} 