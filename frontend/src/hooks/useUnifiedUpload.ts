import { useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { showAlert, removeAlert } from '@/components/ui/alert-system';

interface UseUnifiedUploadProps {
  onUploadComplete?: () => void;
  defaultFolderId?: string | null;
}

export function useUnifiedUpload({ onUploadComplete, defaultFolderId }: UseUnifiedUploadProps = {}) {
  const { data: session } = useSession();
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);

  // Get API configuration
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
  const authToken = (session as any)?.accessToken as string | null;

  // Handle single file upload
  const handleFileUpload = useCallback(async (file: File | null, targetFolderId?: string | null) => {
    if (!file) {
      showAlert("Please select a file to upload", {
        type: "error",
        duration: 3000,
      });
      return;
    }

    // Use dev token in development if no real token is available
    const effectiveToken = authToken || (process.env.NODE_ENV === "development" ? "devtoken" : null);
    
    if (!effectiveToken) {
      showAlert("Authentication required", {
        type: "error",
        duration: 3000,
      });
      return;
    }

    setUploadLoading(true);
    const uploadId = "unified-upload-progress";
    showAlert(`Uploading 1 file...`, {
      type: "upload",
      dismissible: false,
      id: uploadId,
    });

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("metadata", "{}");
      formData.append("rules", "[]");
      formData.append("use_colpali", "true");

      // Add folder_id if specified
      if (targetFolderId) {
        formData.append("folder_id", targetFolderId);
      }

      const response = await fetch(`${apiBaseUrl}/ingest/file`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${effectiveToken}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Upload failed: ${response.status} ${errorText}`);
      }

      const result = await response.json();
      console.log("File upload successful:", result);

      // Show success message
      showAlert(`File "${file.name}" uploaded successfully!`, {
        type: "success",
        duration: 3000,
      });

      // Remove upload progress alert
      removeAlert(uploadId);

      // Call completion callback
      onUploadComplete?.();
    } catch (error) {
      console.error("Error uploading file:", error);
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
      
      showAlert(`Error uploading ${file.name}: ${errorMessage}`, {
        type: "error",
        title: "Upload Failed",
        duration: 5000,
      });

      // Remove upload progress alert
      removeAlert(uploadId);
    } finally {
      setUploadLoading(false);
    }
  }, [authToken, apiBaseUrl, onUploadComplete]);

  // Handle batch file upload
  const handleBatchFileUpload = useCallback(async (files: File[], targetFolderId?: string | null) => {
    if (files.length === 0) {
      showAlert("Please select files to upload", {
        type: "error",
        duration: 3000,
      });
      return;
    }

    // Use dev token in development if no real token is available
    const effectiveToken = authToken || (process.env.NODE_ENV === "development" ? "devtoken" : null);
    
    if (!effectiveToken) {
      showAlert("Authentication required", {
        type: "error",
        duration: 3000,
      });
      return;
    }

    setUploadLoading(true);
    const fileCount = files.length;
    const uploadId = "unified-batch-upload-progress";
    showAlert(`Uploading ${fileCount} files...`, {
      type: "upload",
      dismissible: false,
      id: uploadId,
    });

    try {
      const formData = new FormData();
      
      // Add all files
      files.forEach(file => {
        formData.append("files", file);
      });
      
      formData.append("metadata", "{}");
      formData.append("rules", "[]");
      formData.append("use_colpali", "true");
      formData.append("parallel", "true");

      // Add folder_id if specified
      if (targetFolderId) {
        formData.append("folder_id", targetFolderId);
      }

      const response = await fetch(`${apiBaseUrl}/ingest/files`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${effectiveToken}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Batch upload failed: ${response.status} ${errorText}`);
      }

      const result = await response.json();
      console.log("Batch upload successful:", result);

      // Check for errors in the response
      if (result.errors && result.errors.length > 0) {
        const errorMsg = `${result.errors.length} of ${fileCount} files failed to upload`;
        showAlert(errorMsg, {
          type: "error",
          title: "Upload Partially Failed",
          duration: 5000,
        });
      } else {
        // Show success message
        showAlert(`${fileCount} files uploaded successfully!`, {
          type: "success",
          duration: 3000,
        });
      }

      // Remove upload progress alert
      removeAlert(uploadId);

      // Call completion callback
      onUploadComplete?.();
    } catch (error) {
      console.error("Error uploading files:", error);
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
      
      showAlert(`Error uploading files: ${errorMessage}`, {
        type: "error",
        title: "Upload Failed",
        duration: 5000,
      });

      // Remove upload progress alert
      removeAlert(uploadId);
    } finally {
      setUploadLoading(false);
    }
  }, [authToken, apiBaseUrl, onUploadComplete]);

  // Handle text upload
  const handleTextUpload = useCallback(async (
    text: string, 
    metadata: string, 
    rules: string, 
    useColpali: boolean, 
    targetFolderId?: string | null
  ) => {
    if (!text.trim()) {
      showAlert("Please enter text content", {
        type: "error",
        duration: 3000,
      });
      return;
    }

    // Use dev token in development if no real token is available
    const effectiveToken = authToken || (process.env.NODE_ENV === "development" ? "devtoken" : null);
    
    if (!effectiveToken) {
      showAlert("Authentication required", {
        type: "error",
        duration: 3000,
      });
      return;
    }

    setUploadLoading(true);
    const uploadId = "unified-text-upload-progress";
    showAlert("Uploading text content...", {
      type: "upload",
      dismissible: false,
      id: uploadId,
    });

    try {
      const requestBody: any = {
        content: text,
        metadata: JSON.parse(metadata || "{}"),
        rules: JSON.parse(rules || "[]"),
        use_colpali: useColpali,
      };

      // Add folder_id if specified
      if (targetFolderId) {
        requestBody.folder_id = targetFolderId;
      }

      const response = await fetch(`${apiBaseUrl}/ingest/text`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${effectiveToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Text upload failed: ${response.status} ${errorText}`);
      }

      const result = await response.json();
      console.log("Text upload successful:", result);

      // Show success message
      showAlert("Text content uploaded successfully!", {
        type: "success",
        duration: 3000,
      });

      // Remove upload progress alert
      removeAlert(uploadId);

      // Call completion callback
      onUploadComplete?.();
    } catch (error) {
      console.error("Error uploading text:", error);
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
      
      showAlert(`Error uploading text: ${errorMessage}`, {
        type: "error",
        title: "Upload Failed",
        duration: 5000,
      });

      // Remove upload progress alert
      removeAlert(uploadId);
    } finally {
      setUploadLoading(false);
    }
  }, [authToken, apiBaseUrl, onUploadComplete]);

  return {
    uploadDialogOpen,
    setUploadDialogOpen,
    uploadLoading,
    handleFileUpload,
    handleBatchFileUpload,
    handleTextUpload,
  };
} 