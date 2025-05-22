"use client";
import AppLayout from "../../AppLayout"; // Adjusted import path
import SearchSection from "@/components/documents/search/SearchSection";
import { useConnection } from "@/context/ConnectionContext";

export default function SearchPage() {
  const { apiBaseUrl, authToken } = useConnection();

  return (
    <AppLayout>
      <SearchSection apiBaseUrl={apiBaseUrl} authToken={authToken} />
    </AppLayout>
  );
} 