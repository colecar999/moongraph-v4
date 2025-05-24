'use client';
import CosmographSection from "@/components/graphs/CosmographSection";
import { useConnection } from "@/context/ConnectionContext";

export default function CosmographPage() {
  const { apiBaseUrl, authToken, isAuthenticated, isLoading } = useConnection();

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="text-sm text-gray-600">Loading...</p>
      </div>
    )
  }

  // Show message if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-4">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Authentication Required</h3>
          <p className="text-sm text-gray-600">Please sign in to access cosmograph visualization.</p>
        </div>
      </div>
    )
  }

  return (
    <CosmographSection 
      apiBaseUrl={apiBaseUrl}
      authToken={authToken}
    />
  );
} 
