# Frontend API Authentication Pattern with NextAuth.js and Auth0

This document outlines the standard pattern for making authenticated API calls from the Moongraph Next.js frontend to the Morphik Core backend. Authentication is handled by Auth0, and client-side session management is managed by NextAuth.js.

## Overview

When the user logs in via Auth0, NextAuth.js establishes a session and makes an `accessToken` (JWT) available to the client. This JWT must be included in the `Authorization` header for all requests to protected Morphik Core API endpoints.

The backend will then verify this JWT to authenticate the user and authorize the request.

## Retrieving the Access Token

NextAuth.js provides hooks and functions to access session data, including the `accessToken`.

### 1. Using the `useSession` Hook (Client Components)

For React client components, the `useSession` hook is the preferred way to access session data.

```typescript jsx
// Example: A component that fetches data
'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';

interface MyData {
  // Define the expected shape of your data
  id: string;
  content: string;
}

export default function SecureDataComponent() {
  const { data: session, status } = useSession();
  const [data, setData] = useState<MyData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'authenticated' && session?.accessToken) {
      const fetchData = async () => {
        try {
          const response = await fetch('/api/morphik/some-secure-resource', { // Your Morphik API endpoint
            headers: {
              'Authorization': `Bearer ${session.accessToken}`,
              'Content-Type': 'application/json',
            },
          });

          if (!response.ok) {
            throw new Error(`API request failed with status ${response.status}`);
          }

          const result: MyData = await response.json();
          setData(result);
        } catch (e: any) {
          setError(e.message);
        }
      };

      fetchData();
    }
  }, [session, status]);

  if (status === 'loading') {
    return <p>Loading session...</p>;
  }

  if (status === 'unauthenticated') {
    return <p>Please log in to see this content.</p>; // Or trigger signIn()
  }

  if (error) {
    return <p>Error fetching data: {error}</p>;
  }

  return (
    <div>
      <h2>Secure Data:</h2>
      {data ? <pre>{JSON.stringify(data, null, 2)}</pre> : <p>Fetching data...</p>}
    </div>
  );
}
```

### 2. Using `getSession` (Server Components, API Routes, or outside React lifecycle)

In contexts where hooks cannot be used (e.g., older Next.js Pages API routes, or utility functions outside of React components, or sometimes for initial data fetching in Server Components if appropriate), `getSession` can be used.

```typescript
// Example: An API handler or a utility function
import { getSession } from 'next-auth/react'; // Can be used server-side or client-side if not in a hook context

// This example is conceptual. In Next.js App Router, you'd typically handle this in Route Handlers or Server Actions.
// For client-side fetching outside components, ensure it's called appropriately.

async function callMorphikApi(endpoint: string, options: RequestInit = {}) {
  const session = await getSession(); // Works on server and client

  if (!session || !session.accessToken) {
    throw new Error('User not authenticated or access token unavailable.');
  }

  const defaultHeaders = {
    'Authorization': `Bearer ${session.accessToken}`,
    'Content-Type': 'application/json',
  };

  const response = await fetch(`/api/morphik/${endpoint}`, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  });

  if (!response.ok) {
    // You might want to handle different error statuses specifically
    const errorData = await response.text(); // or response.json() if the error is structured
    throw new Error(`API request to ${endpoint} failed with status ${response.status}: ${errorData}`);
  }

  return response.json();
}

// Example usage:
// async function getSomeData() {
//   try {
//     const data = await callMorphikApi('some-secure-resource');
//     console.log(data);
//   } catch (error) {
//     console.error('Failed to fetch data:', error);
//   }
// }
```

## Key Considerations

*   **Token Expiration & Refresh:** NextAuth.js, when configured correctly with Auth0, typically handles token refresh behind the scenes. The `accessToken` you get from the session should be valid. If you encounter issues with expired tokens, review your NextAuth.js and Auth0 configuration, particularly regarding refresh token handling if applicable to your Auth0 grant type (usually handled by Auth0 provider in NextAuth).
*   **Error Handling:** Always include robust error handling in your API calls. Check for unauthenticated states, network errors, and non-successful HTTP responses from the API.
*   **Backend Verification:** Remember that the Morphik Core backend is responsible for verifying the signature and claims (like `iss`, `aud`, `exp`) of the incoming JWT. This document only covers the frontend's responsibility of sending the token.
*   **`NEXT_PUBLIC_API_BASE_URL`**: Your frontend should use an environment variable (e.g., `process.env.NEXT_PUBLIC_API_BASE_URL`) to construct the full API endpoint URLs rather than hardcoding them. The example above uses relative paths like `/api/morphik/...` which implies either a Next.js API route acting as a proxy or that the Morphik API is served under the same domain. Adjust as per your architecture.

By following this pattern, you ensure that your frontend correctly authenticates with the Morphik Core API, leveraging the security provided by Auth0 and NextAuth.js. 