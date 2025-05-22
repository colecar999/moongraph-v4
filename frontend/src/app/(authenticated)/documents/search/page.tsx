"use client";
import SearchSection from "@/components/documents/search/SearchSection";
import { useConnection } from "@/context/ConnectionContext";

export default function SearchPage() {
  const { apiBaseUrl, authToken } = useConnection();

  return (
      <SearchSection apiBaseUrl={apiBaseUrl} authToken={authToken} />
  );
} 
