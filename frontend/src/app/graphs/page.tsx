'use client';
import AppLayout from "../AppLayout"; // Adjusted import path
import GraphSection from "@/components/graphs/GraphSection";
import { useConnection } from "@/context/ConnectionContext";

export default function GraphsPage() {
  const { apiBaseUrl, authToken } = useConnection();

  return (
    <AppLayout>
      <GraphSection apiBaseUrl={apiBaseUrl} authToken={authToken} />
    </AppLayout>
  );
} 