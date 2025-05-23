'use client';
import CosmographSection from "@/components/graphs/CosmographSection";
import { useConnection } from "@/context/ConnectionContext";

export default function CosmographPage() {
  const { apiBaseUrl, authToken } = useConnection();

  return (
    <CosmographSection 
      apiBaseUrl={apiBaseUrl}
      authToken={authToken}
    />
  );
} 
