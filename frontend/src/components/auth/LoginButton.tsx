'use client';
import { useSession, signIn, signOut } from 'next-auth/react';
import { useState } from 'react';

// Type definitions for our enhanced session
interface ExtendedSession {
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
    id?: string; // Auth0 user ID
  };
  accessToken?: string; // Auth0 access token
}

interface ApiTestResult {
  success?: boolean;
  data?: any;
  error?: string;
}

export default function LoginButton() {
  const { data: session, status } = useSession();
  const [apiTestResult, setApiTestResult] = useState<ApiTestResult | null>(null);
  const [loading, setLoading] = useState(false);

  const testApiCall = async () => {
    const extendedSession = session as ExtendedSession;
    
    if (!extendedSession?.accessToken) {
      setApiTestResult({ error: 'No access token available' });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('http://localhost:8000/test/auth-context', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${extendedSession.accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setApiTestResult({ success: true, data });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setApiTestResult({ error: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading") {
    return <p>Loading...</p>;
  }

  if (session) {
    const extendedSession = session as ExtendedSession;
    
    return (
      <div style={{ padding: '20px', maxWidth: '600px', border: '1px solid #ccc', borderRadius: '8px' }}>
        <div style={{ marginBottom: '20px' }}>
        {session.user?.email && (
          <p>
              Signed in as <strong>{session.user.email}</strong> <br />
              <small>Auth0 User ID: {extendedSession.user?.id}</small>
          </p>
        )}
        <button 
          onClick={() => signOut()} 
            style={{ padding: '10px', marginTop: '10px', cursor: 'pointer', marginRight: '10px' }}
        >
          Sign out
        </button>
          <button 
            onClick={testApiCall}
            disabled={loading}
            style={{ 
              padding: '10px', 
              marginTop: '10px', 
              cursor: loading ? 'not-allowed' : 'pointer',
              backgroundColor: loading ? '#ccc' : '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px'
            }}
          >
            {loading ? 'Testing...' : 'Test API Call'}
          </button>
        </div>

        {apiTestResult && (
          <div style={{ 
            marginTop: '20px', 
            padding: '15px', 
            border: '1px solid #ddd', 
            borderRadius: '4px',
            backgroundColor: '#f9f9f9'
          }}>
            <h4>API Test Result:</h4>
            {apiTestResult.error ? (
              <div style={{ color: 'red' }}>
                <strong>Error:</strong> {apiTestResult.error}
              </div>
            ) : (
              <div style={{ color: 'green' }}>
                <strong>Success!</strong>
                <pre style={{ marginTop: '10px', fontSize: '12px', overflow: 'auto' }}>
                  {JSON.stringify(apiTestResult.data, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }
  
  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <p>Not signed in</p>
      <button 
        onClick={() => signIn('auth0')} 
        style={{ 
          padding: '15px 30px', 
          fontSize: '16px',
          cursor: 'pointer',
          backgroundColor: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '8px'
        }}
      >
        Sign in with Auth0
      </button>
    </div>
  );
} 