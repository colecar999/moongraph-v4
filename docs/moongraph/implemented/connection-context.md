# ConnectionContext in Frontend

## Overview

The `ConnectionContext` is a React context/provider that centralizes all backend connection logic for the frontend. It ensures that all pages and components use the same, robust, and modular approach to connect to the backend, mirroring the structure and best practices of the `ui-component` frontend.

## Features
- **Centralized connection logic:** All backend connection details (URI, API base URL, auth token) are managed in one place.
- **DRY and modular:** No more duplicated connection code in each page/component.
- **Dynamic updates:** The connection URI can be updated at runtime, and all consumers will reactively receive the new values.
- **Best practices:** Uses React context, hooks, and utility functions for maintainability and extensibility.

## How It Works
- The context provides:
  - `connectionUri`: The Morphik connection URI (e.g., `morphik://appname:token@host`).
  - `setConnectionUri`: Function to update the URI at runtime.
  - `apiBaseUrl`: The derived API base URL for backend requests.
  - `authToken`: The derived authentication token for backend requests.
- The context is initialized from the environment variable `NEXT_PUBLIC_MORPHIK_CONNECTION_URI` (with fallback to `NEXT_PUBLIC_API_BASE_URL` or localhost).
- Utility functions `extractTokenFromUri` and `getApiBaseUrlFromUri` are used to parse the URI and derive the connection details.

## Usage

### 1. Wrap your app in the provider (already done in `layout.tsx`):
```tsx
import { ConnectionProvider } from "@/context/ConnectionContext";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <ConnectionProvider>
          {children}
        </ConnectionProvider>
      </body>
    </html>
  );
}
```

### 2. Use the connection in any page or component:
```tsx
import { useConnection } from "@/context/ConnectionContext";

export default function SomePage() {
  const { apiBaseUrl, authToken } = useConnection();
  // Use apiBaseUrl and authToken for backend requests
}
```

### 3. (Optional) Allow users to change the connection URI at runtime:
```tsx
const { connectionUri, setConnectionUri } = useConnection();
// setConnectionUri(newUri) to update
```

## Example: Search Page
```tsx
import SearchSection from "@/components/documents/search/SearchSection";
import { useConnection } from "@/context/ConnectionContext";

export default function SearchPage() {
  const { apiBaseUrl, authToken } = useConnection();
  return <SearchSection apiBaseUrl={apiBaseUrl} authToken={authToken} />;
}
```

## Best Practices
- Always use the `useConnection` hook for backend connection info.
- Do not hardcode API URLs or tokens in pages/components.
- Use the context to keep your code DRY and maintainable.

## Extensibility
- You can add a UI for users to change the connection URI at runtime (e.g., a settings modal or sidebar input).
- The context can be extended to include more backend-related state as needed.

---

**Implemented: Centralized, robust, and modular backend connection logic for the frontend using ConnectionContext.** 