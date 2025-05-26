import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Document } from '@/components/types';

export interface UnifiedContentItem {
  id: string;
  name: string;
  content_type: 'document' | 'graph';
  created_at: string;
  updated_at: string;
  folder_id?: string;
  // Document-specific fields
  file_name?: string;
  file_type?: string;
  file_size?: number;
  // Graph-specific fields
  entities?: any[];
  relationships?: any[];
  document_ids?: string[];
}

export interface UnifiedStats {
  folders: Array<{
    id: string;
    name: string;
    document_count: number;
    graph_count: number;
  }>;
  total_documents: number;
  total_graphs: number;
  unfiled_documents: number;
  unfiled_graphs: number;
}

interface UseUnifiedContentOptions {
  folderId?: string | null;
  limit?: number;
  skip?: number;
}

export function useUnifiedContent(options: UseUnifiedContentOptions = {}) {
  const { folderId = null, limit = 50, skip = 0 } = options;
  const { data: session } = useSession();
  
  const [content, setContent] = useState<UnifiedContentItem[]>([]);
  const [stats, setStats] = useState<UnifiedStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchContent = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Get auth token from session
      const authToken = session?.accessToken as string | null;
      if (!authToken) {
        throw new Error('No authentication token available');
      }

      const params = new URLSearchParams({
        limit: limit.toString(),
        skip: skip.toString(),
      });
      
      if (folderId) {
        params.append('folder_id', folderId);
      }

      const response = await fetch(`/api/unified/content?${params}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch unified content: ${response.statusText}`);
      }

      const data = await response.json();
      setContent(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch content');
    } finally {
      setLoading(false);
    }
  }, [folderId, limit, skip, session?.accessToken]);

  const fetchStats = useCallback(async () => {
    try {
      // Get auth token from session
      const authToken = session?.accessToken as string | null;
      if (!authToken) {
        return; // Skip stats if no token
      }

      const response = await fetch('/api/unified/stats', {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch unified stats: ${response.statusText}`);
      }

      const data = await response.json();
      setStats(data);
    } catch (err) {
      console.error('Failed to fetch unified stats:', err);
    }
  }, [session?.accessToken]);

  useEffect(() => {
    if (session?.accessToken) {
      fetchContent();
    }
  }, [fetchContent, session?.accessToken]);

  useEffect(() => {
    if (session?.accessToken) {
      fetchStats();
    }
  }, [fetchStats, session?.accessToken]);

  const refresh = useCallback(() => {
    if (session?.accessToken) {
      fetchContent();
      fetchStats();
    }
  }, [fetchContent, fetchStats, session?.accessToken]);

  return {
    content,
    stats,
    loading,
    error,
    refresh,
  };
} 