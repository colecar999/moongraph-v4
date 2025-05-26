"use client";

import React, { createContext, useContext, useState, useMemo } from "react";
import { useSession } from "next-auth/react";
import { extractTokenFromUri, getApiBaseUrlFromUri } from "@/lib/utils";

interface ConnectionContextProps {
  connectionUri: string;
  setConnectionUri: (uri: string) => void;
  apiBaseUrl: string;
  authToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// Extend the Session type to include our custom accessToken
interface ExtendedSession {
  accessToken?: string;
  user?: {
    id?: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

const defaultUri = process.env.NEXT_PUBLIC_MORPHIK_CONNECTION_URI || "";
const defaultApiBaseUrl = getApiBaseUrlFromUri(defaultUri, process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000");

const ConnectionContext = createContext<ConnectionContextProps>({
  connectionUri: defaultUri,
  setConnectionUri: () => {},
  apiBaseUrl: defaultApiBaseUrl,
  authToken: null,
  isAuthenticated: false,
  isLoading: true,
});

export const ConnectionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [connectionUri, setConnectionUri] = useState(defaultUri);
  const { data: session, status } = useSession();

  const apiBaseUrl = useMemo(
    () => getApiBaseUrlFromUri(connectionUri, process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000"),
    [connectionUri]
  );

  // Get auth token from NextAuth session only (no fallback to URI)
  const authToken = useMemo(() => {
    // Only use NextAuth session access token
    if (session && (session as ExtendedSession).accessToken) {
      return (session as ExtendedSession).accessToken as string;
    }
    
    // No fallback - if there's no Auth0 token, return null
    return null;
  }, [session]);

  const isAuthenticated = status === 'authenticated' && !!authToken;
  const isLoading = status === 'loading';

  return (
    <ConnectionContext.Provider value={{ 
      connectionUri, 
      setConnectionUri, 
      apiBaseUrl, 
      authToken, 
      isAuthenticated, 
      isLoading 
    }}>
      {children}
    </ConnectionContext.Provider>
  );
};

export const useConnection = () => useContext(ConnectionContext); 