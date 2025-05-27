"use client"

import React, { useState } from "react"
import { useSession } from "next-auth/react"
import { UnifiedContentView } from "@/components/unified/UnifiedContentView"
import { useFolders } from "@/hooks/use-folders"
import { ErrorDialog } from "@/components/ui/error-dialog"

interface UnifiedFolderPageProps {
  params: Promise<{ folder_id: string }>
}

export default function UnifiedFolderPage({ params }: UnifiedFolderPageProps) {
  // Unwrap params Promise using React.use()
  const { folder_id } = React.use(params)
  const { data: session, status } = useSession()
  const [errorDialog, setErrorDialog] = useState<{
    open: boolean
    title: string
    description?: string
    errors: string[]
  }>({
    open: false,
    title: "",
    errors: []
  })
  
  // Get API configuration
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000"
  const authToken = session?.accessToken as string | null

  // Fetch folders data
  const { folders } = useFolders({ 
    apiBaseUrl, 
    authToken,
    sessionStatus: status
  })

  // Find the current folder to get its name
  const currentFolder = folders?.find(folder => folder.id === folder_id)
  const folderTitle = currentFolder?.name || "Collection"

  return (
    <>
      <UnifiedContentView
        folderId={folder_id}
        title={folderTitle}
        onBack={() => window.history.back()}
        folders={folders}
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
              setErrorDialog({
                open: true,
                title: "Move Operation Completed with Errors",
                description: `${successes.length} items moved successfully, ${errors.length} failed.`,
                errors
              });
            }

            // Refresh the page to show updated content if any items were moved successfully
            if (successes.length > 0) {
              window.location.reload();
            }
          } catch (error) {
            console.error('Error moving items:', error);
            setErrorDialog({
              open: true,
              title: "Move Operation Failed",
              description: "An unexpected error occurred while moving items.",
              errors: [error instanceof Error ? error.message : 'Unknown error']
            });
          }
        }}
        onBulkDeleteItems={async (itemIds: string[], contentItems?: any[], refreshContent?: () => void) => {
          // Handle bulk delete operations for both documents and graphs
          try {
            const errors: string[] = [];
            const successes: string[] = [];
            
            for (const itemId of itemIds) {
              try {
                // Find the content item to determine its type
                const contentItem = contentItems?.find(item => item.id === itemId || item.external_id === itemId);
                const contentType = contentItem?.content_type;
                
                let response: Response;
                
                if (contentType === 'graph') {
                  // Delete as graph
                  response = await fetch(`/api/graphs/${itemId}`, {
                    method: 'DELETE',
                    headers: {
                      'Authorization': `Bearer ${authToken || 'devtoken'}`,
                    },
                  });
                } else {
                  // Delete as document (default for unknown types)
                  response = await fetch(`/api/documents/${itemId}`, {
                    method: 'DELETE',
                    headers: {
                      'Authorization': `Bearer ${authToken || 'devtoken'}`,
                    },
                  });
                }

                if (response.ok) {
                  successes.push(itemId);
                } else {
                  const errorText = await response.text();
                  const itemType = contentType || 'item';
                  errors.push(`Failed to delete ${itemType} ${itemId}: ${errorText}`);
                }
              } catch (error) {
                errors.push(`Failed to delete item ${itemId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
              }
            }

            // Refresh content if any items were successfully deleted
            if (successes.length > 0 && refreshContent) {
              refreshContent();
              console.log(`Successfully deleted ${successes.length} items - content refreshed`);
            }
            
            if (errors.length > 0) {
              setErrorDialog({
                open: true,
                title: "Delete Operation Completed with Errors",
                description: `${successes.length} items deleted successfully, ${errors.length} failed.`,
                errors
              });
            }
            
          } catch (error) {
            console.error('Bulk delete failed:', error);
            setErrorDialog({
              open: true,
              title: "Delete Operation Failed",
              description: "An unexpected error occurred while deleting items.",
              errors: [error instanceof Error ? error.message : 'Unknown error']
            });
          }
        }}
      />

      <ErrorDialog
        open={errorDialog.open}
        onOpenChange={(open) => setErrorDialog(prev => ({ ...prev, open }))}
        title={errorDialog.title}
        description={errorDialog.description}
        errors={errorDialog.errors}
        onClose={() => setErrorDialog({ open: false, title: "", errors: [] })}
      />
    </>
  )
} 