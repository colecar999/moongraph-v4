"use client";

import React, { createContext, useContext, useState, useMemo } from "react";
import { extractTokenFromUri, getApiBaseUrlFromUri } from "@/lib/utils";

interface ConnectionContextProps {
  connectionUri: string;
  setConnectionUri: (uri: string) => void;
  apiBaseUrl: string;
  authToken: string | null;
}

const defaultUri = process.env.NEXT_PUBLIC_MORPHIK_CONNECTION_URI || "";
const defaultApiBaseUrl = getApiBaseUrlFromUri(defaultUri, process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000");
const defaultAuthToken = extractTokenFromUri(defaultUri);

const ConnectionContext = createContext<ConnectionContextProps>({
  connectionUri: defaultUri,
  setConnectionUri: () => {},
  apiBaseUrl: defaultApiBaseUrl,
  authToken: defaultAuthToken,
});

export const ConnectionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [connectionUri, setConnectionUri] = useState(defaultUri);

  const apiBaseUrl = useMemo(
    () => getApiBaseUrlFromUri(connectionUri, process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000"),
    [connectionUri]
  );
  const authToken = useMemo(() => extractTokenFromUri(connectionUri), [connectionUri]);

  return (
    <ConnectionContext.Provider value={{ connectionUri, setConnectionUri, apiBaseUrl, authToken }}>
      {children}
    </ConnectionContext.Provider>
  );
};

export const useConnection = () => useContext(ConnectionContext); 