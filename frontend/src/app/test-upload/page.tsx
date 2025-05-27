"use client"

import { useState } from "react"
import UnifiedUploadDialog from "@/components/unified/UnifiedUploadDialog"
import { Button } from "@/components/ui/button"
import { useUnifiedUpload } from "@/hooks/useUnifiedUpload"
import { useUnifiedDragAndDrop } from "@/hooks/useUnifiedDragAndDrop"
import { cn } from "@/lib/utils"
import { IconUpload } from "@tabler/icons-react"

// Mock folders for testing
const mockFolders = [
  { id: "1", name: "Research Papers", document_count: 5, graph_count: 2 },
  { id: "2", name: "Meeting Notes", document_count: 3, graph_count: 1 },
  { id: "3", name: "Project Files", document_count: 8, graph_count: 4 },
]

export default function TestUploadPage() {
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)

  const {
    uploadLoading,
    handleFileUpload,
    handleBatchFileUpload,
    handleTextUpload,
  } = useUnifiedUpload({
    onUploadComplete: () => {
      console.log("Upload completed!")
    }
  })

  const { isDragging, dragHandlers } = useUnifiedDragAndDrop({
    onDrop: (files: File[]) => {
      console.log("Files dropped:", files)
      handleBatchFileUpload(files, null)
    },
    disabled: uploadLoading
  })

  return (
    <div 
      className={cn(
        "min-h-screen p-8 relative",
        isDragging && "drag-active"
      )}
      {...dragHandlers}
    >
      {/* Drag overlay */}
      {isDragging && (
        <div className="absolute inset-0 z-50 flex items-center justify-center rounded-lg border-2 border-dashed border-primary bg-primary/10 backdrop-blur-sm">
          <div className="rounded-lg bg-background p-8 text-center shadow-lg">
            <IconUpload className="mx-auto mb-4 h-12 w-12 text-primary" />
            <h3 className="mb-2 text-xl font-medium">Drop to Upload</h3>
            <p className="text-muted-foreground">
              Files will be uploaded as unfiled content
            </p>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Upload Test Page</h1>
        
        <div className="space-y-6">
          <div className="border rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Upload Controls</h2>
            <div className="flex gap-4">
              <Button 
                onClick={() => setUploadDialogOpen(true)}
                disabled={uploadLoading}
              >
                <IconUpload className="h-4 w-4 mr-2" />
                Open Upload Dialog
              </Button>
              
              <Button 
                variant="outline"
                disabled={uploadLoading}
              >
                Upload Status: {uploadLoading ? "Loading..." : "Ready"}
              </Button>
            </div>
          </div>

          <div className="border rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Drag and Drop Area</h2>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <IconUpload className="mx-auto mb-4 h-12 w-12 text-gray-400" />
              <p className="text-gray-600">
                Drag and drop files here to test the upload functionality
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Or use the upload button above
              </p>
            </div>
          </div>

          <div className="border rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Mock Collections</h2>
            <div className="grid gap-2">
              {mockFolders.map((folder) => (
                <div key={folder.id} className="flex items-center justify-between p-3 border rounded">
                  <span className="font-medium">{folder.name}</span>
                  <span className="text-sm text-gray-500">
                    {folder.document_count} docs, {folder.graph_count} graphs
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Upload Dialog */}
      <UnifiedUploadDialog
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
        currentFolderId={null}
        folders={mockFolders as any}
        onUploadComplete={() => {
          console.log("Dialog upload completed!")
        }}
        loading={uploadLoading}
        onFileUpload={handleFileUpload}
        onBatchFileUpload={handleBatchFileUpload}
        onTextUpload={handleTextUpload}
      />
    </div>
  )
} 