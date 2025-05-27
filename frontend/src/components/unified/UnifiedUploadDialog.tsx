"use client";

import React, { useState, ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { IconUpload, IconFolder } from "@tabler/icons-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Folder } from "@/components/types";

interface UnifiedUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentFolderId?: string | null;
  folders: Folder[];
  onUploadComplete: () => void;
  loading: boolean;
  onFileUpload: (file: File | null, targetFolderId?: string | null) => Promise<void>;
  onBatchFileUpload: (files: File[], targetFolderId?: string | null) => Promise<void>;
  onTextUpload: (text: string, metadata: string, rules: string, useColpali: boolean, targetFolderId?: string | null) => Promise<void>;
}

const UnifiedUploadDialog: React.FC<UnifiedUploadDialogProps> = ({
  open,
  onOpenChange,
  currentFolderId,
  folders,
  onUploadComplete,
  loading,
  onFileUpload,
  onBatchFileUpload,
  onTextUpload,
}) => {
  // Component state for managing the upload form
  const [uploadType, setUploadType] = useState<"file" | "text" | "batch">("file");
  const [textContent, setTextContent] = useState("");
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);
  const [batchFilesToUpload, setBatchFilesToUpload] = useState<File[]>([]);
  const [metadata, setMetadata] = useState("{}");
  const [rules, setRules] = useState("[]");
  const [useColpali, setUseColpali] = useState(true);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(currentFolderId || null);

  // Reset upload dialog state
  const resetUploadDialog = () => {
    setUploadType("file");
    setFileToUpload(null);
    setBatchFilesToUpload([]);
    setTextContent("");
    setMetadata("{}");
    setRules("[]");
    setUseColpali(true);
    setSelectedFolderId(currentFolderId || null);
  };

  // Handle file selection
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setFileToUpload(files[0]);
    }
  };

  // Handle batch file selection
  const handleBatchFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setBatchFilesToUpload(Array.from(files));
    }
  };

  // Handle upload action
  const handleUpload = async () => {
    try {
      if (uploadType === "file") {
        await onFileUpload(fileToUpload, selectedFolderId);
      } else if (uploadType === "batch") {
        await onBatchFileUpload(batchFilesToUpload, selectedFolderId);
      } else {
        await onTextUpload(textContent, metadata, rules, useColpali, selectedFolderId);
      }
      
      // Reset form and close dialog on success
      resetUploadDialog();
      onOpenChange(false);
      onUploadComplete();
    } catch (error) {
      // Error handling is done in the parent component
      console.error("Upload failed:", error);
    }
  };

  // Handle dialog close
  const handleClose = () => {
    resetUploadDialog();
    onOpenChange(false);
  };

  // Get collection options for dropdown
  const collectionOptions = [
    { id: null, name: "Unfiled (No Collection)" },
    ...folders.map(folder => ({ id: folder.id, name: folder.name }))
  ];

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload to Collection</DialogTitle>
          <DialogDescription>
            Upload files or text content to your research collections.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Upload Type Selection */}
          <div className="flex gap-2">
            <Button 
              variant={uploadType === "file" ? "default" : "outline"} 
              onClick={() => setUploadType("file")}
              size="sm"
            >
              File
            </Button>
            <Button 
              variant={uploadType === "batch" ? "default" : "outline"} 
              onClick={() => setUploadType("batch")}
              size="sm"
            >
              Batch Files
            </Button>
            <Button 
              variant={uploadType === "text" ? "default" : "outline"} 
              onClick={() => setUploadType("text")}
              size="sm"
            >
              Text
            </Button>
          </div>

          {/* Collection Selection */}
          <div>
            <Label htmlFor="collection-select" className="mb-2 block">
              Target Collection
            </Label>
            <Select
              value={selectedFolderId || "unfiled"}
              onValueChange={(value) => setSelectedFolderId(value === "unfiled" ? null : value)}
            >
              <SelectTrigger id="collection-select">
                <SelectValue placeholder="Select a collection..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unfiled">
                  <div className="flex items-center gap-2">
                    <IconFolder className="h-4 w-4 text-muted-foreground" />
                    Unfiled (No Collection)
                  </div>
                </SelectItem>
                {folders.map((folder) => (
                  <SelectItem key={folder.id} value={folder.id}>
                    <div className="flex items-center gap-2">
                      <IconFolder className="h-4 w-4 text-muted-foreground" />
                      {folder.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* File Upload Section */}
          {uploadType === "file" && (
            <div>
              <Label htmlFor="file" className="mb-2 block">
                File
              </Label>
              <Input id="file" type="file" onChange={handleFileChange} />
            </div>
          )}

          {/* Batch Upload Section */}
          {uploadType === "batch" && (
            <div>
              <Label htmlFor="batchFiles" className="mb-2 block">
                Select Multiple Files
              </Label>
              <Input id="batchFiles" type="file" multiple onChange={handleBatchFileChange} />
              {batchFilesToUpload.length > 0 && (
                <div className="mt-2">
                  <p className="mb-1 text-sm font-medium">{batchFilesToUpload.length} files selected:</p>
                  <ScrollArea className="h-24 w-full rounded-md border p-2">
                    <ul className="text-xs">
                      {Array.from(batchFilesToUpload).map((file, index) => (
                        <li key={index} className="border-b border-gray-100 py-1 last:border-0">
                          {file.name} ({(file.size / 1024).toFixed(1)} KB)
                        </li>
                      ))}
                    </ul>
                  </ScrollArea>
                </div>
              )}
            </div>
          )}

          {/* Text Upload Section */}
          {uploadType === "text" && (
            <div>
              <Label htmlFor="text" className="mb-2 block">
                Text Content
              </Label>
              <Textarea
                id="text"
                value={textContent}
                onChange={e => setTextContent(e.target.value)}
                placeholder="Enter text content"
                rows={6}
              />
            </div>
          )}

          {/* Metadata Section */}
          <div>
            <Label htmlFor="metadata" className="mb-2 block">
              Metadata (JSON)
            </Label>
            <Textarea
              id="metadata"
              value={metadata}
              onChange={e => setMetadata(e.target.value)}
              placeholder='{"key": "value"}'
              rows={3}
            />
          </div>

          {/* Rules Section */}
          <div>
            <Label htmlFor="rules" className="mb-2 block">
              Rules (JSON)
            </Label>
            <Textarea
              id="rules"
              value={rules}
              onChange={e => setRules(e.target.value)}
              placeholder='[{"type": "metadata_extraction", "schema": {...}}]'
              rows={3}
            />
          </div>

          {/* ColPali Option */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="useColpali"
              checked={useColpali}
              onCheckedChange={checked => setUseColpali(checked === true)}
            />
            <Label
              htmlFor="useColpali"
              className="cursor-pointer text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              onClick={() => setUseColpali(!useColpali)}
            >
              Use ColPali
            </Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleUpload}
            disabled={loading || (
              uploadType === "file" && !fileToUpload ||
              uploadType === "batch" && batchFilesToUpload.length === 0 ||
              uploadType === "text" && !textContent.trim()
            )}
          >
            {loading ? "Uploading..." : "Upload"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default UnifiedUploadDialog; 