'use client';

import { SessionProvider } from 'next-auth/react';
import { ConnectionProvider } from "@/context/ConnectionContext"; // Path from original layout.tsx
import React from 'react';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ConnectionProvider>
        {children}
      </ConnectionProvider>
    </SessionProvider>
  );
} 