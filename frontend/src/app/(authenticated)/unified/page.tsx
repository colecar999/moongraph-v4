'use client';

import React, { useState, useCallback } from 'react';
import { UnifiedContentView } from '@/components/unified/UnifiedContentView';
import { UnifiedContentItem } from '@/hooks/useUnifiedContent';
import { Button } from '@/components/ui/button';
import { ArrowLeft, BarChart3 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function UnifiedContentPage() {
  const router = useRouter();
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<UnifiedContentItem | null>(null);
  const [folders, setFolders] = useState<Array<{
    id: string;
    name: string;
    document_count: number;
    graph_count?: number;
  }>>([]);

  // Fetch folders for bulk actions
  React.useEffect(() => {
    const fetchFolders = async () => {
      try {
        const response = await fetch('/api/folders/stats', {
          headers: {
            'Authorization': `Bearer ${process.env.NODE_ENV === 'development' ? 'devtoken' : 'actual-token'}`,
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          setFolders(data.folders || []);
        }
      } catch (error) {
        console.error('Failed to fetch folders:', error);
      }
    };

    fetchFolders();
  }, []);

  const handleItemClick = useCallback((item: UnifiedContentItem) => {
    setSelectedItem(item);
    
    // Navigate to the appropriate detail page based on content type
    if (item.content_type === 'document') {
      // Navigate to document detail page
      router.push(`/documents/${item.id}`);
    } else if (item.content_type === 'graph') {
      // Navigate to graph detail page
      router.push(`/graphs/${item.name || item.id}`);
    }
  }, [router]);

  const handleFolderClick = useCallback((folderId: string) => {
    setSelectedFolderId(folderId);
  }, []);

  const handleBack = useCallback(() => {
    setSelectedFolderId(null);
  }, []);

  const handleBulkMoveToFolder = useCallback(async (itemIds: string[], targetFolderId: string) => {
    try {
      // Separate documents and graphs
      const documentIds: string[] = [];
      const graphIds: string[] = [];
      
      // We need to determine which items are documents vs graphs
      // For now, we'll assume all items are documents since graphs don't support folder operations yet
      documentIds.push(...itemIds);

      if (documentIds.length > 0) {
        // Handle document moves
        for (const documentId of documentIds) {
          const endpoint = targetFolderId 
            ? `/api/folders/${targetFolderId}/documents/${documentId}`
            : `/api/documents/${documentId}/remove-from-folder`;
          
          const method = targetFolderId ? 'POST' : 'DELETE';
          
          const response = await fetch(endpoint, {
            method,
            headers: {
              'Authorization': `Bearer ${process.env.NODE_ENV === 'development' ? 'devtoken' : 'actual-token'}`,
              'Content-Type': 'application/json',
            },
          });

          if (!response.ok) {
            throw new Error(`Failed to move document ${documentId}`);
          }
        }
      }

      // TODO: Handle graph moves when backend supports it
      if (graphIds.length > 0) {
        console.warn('Graph folder operations not yet implemented');
      }

      // Refresh the page to show updated content
      window.location.reload();
    } catch (error) {
      console.error('Error moving items:', error);
      throw error;
    }
  }, []);

  const handleBulkDeleteItems = useCallback(async (itemIds: string[]) => {
    try {
      // Delete each item individually
      for (const itemId of itemIds) {
        // For now, assume all items are documents
        // TODO: Implement proper type detection and graph deletion
        const response = await fetch(`/api/documents/${itemId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${process.env.NODE_ENV === 'development' ? 'devtoken' : 'actual-token'}`,
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to delete item ${itemId}`);
        }
      }

      // Refresh the page to show updated content
      window.location.reload();
    } catch (error) {
      console.error('Error deleting items:', error);
      throw error;
    }
  }, []);

  const currentFolder = selectedFolderId 
    ? folders.find(f => f.id === selectedFolderId)
    : null;

  const title = currentFolder ? currentFolder.name : 'Unified Content';

  return (
    <div className="container mx-auto p-6">
      <UnifiedContentView
        folderId={selectedFolderId}
        onItemClick={handleItemClick}
        onBack={selectedFolderId ? handleBack : undefined}
        title={title}
        folders={folders}
        onBulkMoveToFolder={handleBulkMoveToFolder}
        onBulkDeleteItems={handleBulkDeleteItems}
      />
    </div>
  );
} 