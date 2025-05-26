"use client";

import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Info } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Image from "next/image";
import DeleteConfirmationModal from "./DeleteConfirmationModal";

import { Document, Folder } from "@/components/types";

interface DocumentDetailProps {
  selectedDocument: Document | null;
  handleDeleteDocument: (documentId: string) => Promise<void>;
  folders: Folder[];
  apiBaseUrl: string;
  authToken: string | null;
  refreshDocuments: () => void;
  refreshFolders: () => void;
  loading: boolean;
  onClose: () => void;
  selectedFolder: string | null;
}

const DocumentDetail: React.FC<DocumentDetailProps> = ({
  selectedDocument,
  handleDeleteDocument,
  folders,
  apiBaseUrl,
  authToken,
  refreshDocuments,
  refreshFolders,
  loading,
  onClose,
  selectedFolder,
}) => {
  const [isMovingToFolder, setIsMovingToFolder] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  if (!selectedDocument) {
    return (
      <div className="flex h-[calc(100vh-200px)] items-center justify-center rounded-lg border border-dashed p-8">
        <div className="text-center text-muted-foreground">
          <Info className="mx-auto mb-2 h-12 w-12" />
          <p>Select a document to view details</p>
        </div>
      </div>
    );
  }

  // Helper function to determine current folder from context
  const getCurrentFolder = () => {
    // Since we're viewing documents in a specific folder context, 
    // we can determine the current folder from the selectedFolder prop
    // passed down from the parent component
    if (selectedFolder && selectedFolder !== "all") {
      return folders.find(folder => folder.name === selectedFolder);
    }
    return null;
  };

  const currentFolder = getCurrentFolder();

  const handleDeleteConfirm = async () => {
    if (selectedDocument) {
      await handleDeleteDocument(selectedDocument.external_id);
      setShowDeleteModal(false);
    }
  };

  const handleMoveToFolder = async (folderName: string | null) => {
    if (isMovingToFolder || !selectedDocument) return;

    const documentId = selectedDocument.external_id;
    setIsMovingToFolder(true);

    try {
      if (folderName === null) {
        // Remove from any folder (set folder_id to NULL) using bulk-move endpoint
        console.log(`Removing document ${documentId} from any folder (setting to unfiled)`);
        
        const response = await fetch(`${apiBaseUrl}/documents/bulk-move`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
          },
          body: JSON.stringify({
            document_ids: [documentId],
            folder_id: null // This will set folder_id to NULL
          }),
        });

        if (!response.ok) {
          throw new Error(`Failed to remove document from folder: ${response.statusText}`);
        }

        const result = await response.json();
        if (!result.success) {
          throw new Error(`Failed to remove document from folder: ${result.errors?.[0]?.error || 'Unknown error'}`);
        }
      } else {
        // Move to a specific folder using bulk-move endpoint
        const targetFolder = folders.find(folder => folder.name === folderName);
        if (targetFolder && targetFolder.id) {
          console.log(`Moving document ${documentId} to folder ${folderName} (ID: ${targetFolder.id})`);

          const response = await fetch(`${apiBaseUrl}/documents/bulk-move`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
            },
            body: JSON.stringify({
              document_ids: [documentId],
              folder_id: targetFolder.id
            }),
          });

          if (!response.ok) {
            throw new Error(`Failed to move document to folder: ${response.statusText}`);
          }

          const result = await response.json();
          if (!result.success) {
            throw new Error(`Failed to move document to folder: ${result.errors?.[0]?.error || 'Unknown error'}`);
          }
        } else {
          console.error(`Could not find folder with name: ${folderName}`);
          throw new Error(`Folder "${folderName}" not found`);
        }
      }

      // Refresh folders first to get updated document counts
      await refreshFolders();
      // Then refresh documents with the updated folder information
      await refreshDocuments();
      
      console.log(`Successfully ${folderName ? `moved document to folder "${folderName}"` : 'removed document from folder'}`);
    } catch (error) {
      console.error("Error updating folder:", error);
      // You might want to show an error message to the user here
    } finally {
      setIsMovingToFolder(false);
    }
  };

  return (
    <div className="rounded-lg border">
      <div className="sticky top-0 flex items-center justify-between border-b bg-muted px-4 py-3">
        <h3 className="text-lg font-semibold">Document Details</h3>
        <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-background/80">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
          <span className="sr-only">Close panel</span>
        </Button>
      </div>

      <ScrollArea className="h-[calc(100vh-200px)]">
        <div className="space-y-4 p-4">
          <div>
            <h3 className="mb-1 font-medium">Filename</h3>
            <p>{selectedDocument.filename || "N/A"}</p>
          </div>

          <div>
            <h3 className="mb-1 font-medium">Content Type</h3>
            <Badge variant="secondary">{selectedDocument.content_type}</Badge>
          </div>

          <div>
            <h3 className="mb-1 font-medium">Folder</h3>
            <div className="flex items-center gap-2">
              <Image src="/icons/folder-icon.png" alt="Folder" width={16} height={16} />
              <Select
                value={currentFolder ? currentFolder.name : "_none"}
                onValueChange={value => handleMoveToFolder(value === "_none" ? null : value)}
                disabled={isMovingToFolder}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Not in a folder" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">Not in a folder</SelectItem>
                  {folders.map(folder => (
                    <SelectItem key={folder.name} value={folder.name}>
                      {folder.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <h3 className="mb-1 font-medium">Document ID</h3>
            <p className="font-mono text-xs">{selectedDocument.external_id}</p>
          </div>

          <Accordion type="single" collapsible>
            <AccordionItem value="metadata">
              <AccordionTrigger>Metadata</AccordionTrigger>
              <AccordionContent>
                <pre className="overflow-x-auto whitespace-pre-wrap rounded bg-muted p-2 text-xs">
                  {JSON.stringify(selectedDocument.metadata, null, 2)}
                </pre>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="system-metadata">
              <AccordionTrigger>System Metadata</AccordionTrigger>
              <AccordionContent>
                <pre className="overflow-x-auto whitespace-pre-wrap rounded bg-muted p-2 text-xs">
                  {JSON.stringify(selectedDocument.system_metadata, null, 2)}
                </pre>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="additional-metadata">
              <AccordionTrigger>Additional Metadata</AccordionTrigger>
              <AccordionContent>
                <pre className="overflow-x-auto whitespace-pre-wrap rounded bg-muted p-2 text-xs">
                  {JSON.stringify(selectedDocument.additional_metadata, null, 2)}
                </pre>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <div className="mt-4 border-t pt-4">
            <Button
              variant="outline"
              size="sm"
              className="w-full border-red-500 text-red-500 hover:bg-red-100 dark:hover:bg-red-950"
              onClick={() => setShowDeleteModal(true)}
              disabled={loading}
            >
              Delete Document
            </Button>
          </div>
        </div>
      </ScrollArea>
      {selectedDocument && (
        <DeleteConfirmationModal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={handleDeleteConfirm}
          itemName={selectedDocument.filename || selectedDocument.external_id}
          loading={loading}
        />
      )}
    </div>
  );
};

export default DocumentDetail;