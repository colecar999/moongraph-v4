'use client';
import GraphSection from "@/components/graphs/GraphSection";
import { useConnection } from "@/context/ConnectionContext";

export default function GraphsPage() {
  const { apiBaseUrl, authToken } = useConnection();

  return (
      <GraphSection apiBaseUrl={apiBaseUrl} authToken={authToken} />
  );
} 
