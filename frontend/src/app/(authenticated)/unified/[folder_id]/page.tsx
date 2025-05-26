"use client"

import { use } from "react"
import { useSession } from "next-auth/react"
import { UnifiedContentView } from "@/components/unified/UnifiedContentView"
import { useFolders } from "@/hooks/use-folders"

interface UnifiedFolderPageProps {
  params: Promise<{
    folder_id: string
  }>
}

export default function UnifiedFolderPage({ params }: UnifiedFolderPageProps) {
  // Unwrap params Promise using React.use()
  const { folder_id } = use(params)
  const { data: session } = useSession()
  
  // Get API configuration
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000"
  const authToken = session?.accessToken as string | null

  // Fetch folders data
  const { folders } = useFolders({ 
    apiBaseUrl, 
    authToken 
  })

  return (
    <div className="container mx-auto p-6">
      <UnifiedContentView
        folderId={folder_id} // specific folder ID
        title="Folder Content" // Will be replaced with actual folder name
        onBack={() => window.history.back()}
        folders={folders} // Pass the actual folders
        onBulkMoveToFolder={async (itemIds: string[], targetFolderId: string) => {
          // Handle bulk move operations for documents only (graphs don't support folders)
          try {
            const errors: string[] = [];
            const successes: string[] = [];
            
            for (const itemId of itemIds) {
              try {
                // Try to move as document
                const response = await fetch('/api/documents/bulk-move', {
                  method: 'POST',
                  headers: {
                    'Authorization': `Bearer ${authToken || 'devtoken'}`,
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    document_ids: [itemId],
                    folder_id: targetFolderId || null
                  }),
                });

                if (response.ok) {
                  successes.push(itemId);
                } else if (response.status === 404) {
                  // Item not found as document, might be a graph
                  errors.push(`Item ${itemId} appears to be a graph. Graphs cannot be organized into folders.`);
                } else {
                  const errorData = await response.json().catch(() => ({}));
                  errors.push(`Failed to move item ${itemId}: ${errorData.detail || `HTTP error! status: ${response.status}`}`);
                }
              } catch (error) {
                errors.push(`Failed to move item ${itemId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
              }
            }

            // Show results
            if (successes.length > 0) {
              console.log(`Successfully moved ${successes.length} items`);
            }
            
            if (errors.length > 0) {
              // Show the first few errors as an alert
              alert(`Move operation completed with errors:\n${errors.slice(0, 3).join('\n')}${errors.length > 3 ? `\n... and ${errors.length - 3} more errors` : ''}`);
            }

            // Refresh the page to show updated content if any items were moved successfully
            if (successes.length > 0) {
              window.location.reload();
            }
          } catch (error) {
            console.error('Error moving items:', error);
            alert(`Move operation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        }}
        onBulkDeleteItems={async (itemIds: string[]) => {
          // Handle bulk delete operations for both documents and graphs
          try {
            const errors: string[] = [];
            const successes: string[] = [];
            
            for (const itemId of itemIds) {
              try {
                // First, try to determine if this is a document or graph
                // We'll try deleting as document first, then handle the error
                const response = await fetch(`/api/documents/${itemId}`, {
                  method: 'DELETE',
                  headers: {
                    'Authorization': `Bearer ${authToken || 'devtoken'}`,
                  },
                });

                if (response.ok) {
                  successes.push(itemId);
                } else if (response.status === 404) {
                  // Item not found as document, might be a graph
                  // Since graphs don't support deletion, we'll show an error
                  errors.push(`Item ${itemId} appears to be a graph. Graph deletion is not currently supported.`);
                } else {
                  const errorText = await response.text();
                  errors.push(`Failed to delete item ${itemId}: ${errorText}`);
                }
              } catch (error) {
                errors.push(`Failed to delete item ${itemId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
              }
            }

            // Show results
            if (successes.length > 0) {
              console.log(`Successfully deleted ${successes.length} items`);
            }
            
            if (errors.length > 0) {
              // Show the first error as an alert for now
              alert(`Delete operation completed with errors:\n${errors.slice(0, 3).join('\n')}${errors.length > 3 ? `\n... and ${errors.length - 3} more errors` : ''}`);
            }
            
          } catch (error) {
            console.error('Bulk delete failed:', error);
            alert(`Delete operation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        }}
      />
    </div>
  )
} 