'use client';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface ApiTestResult {
  success: boolean;
  data?: any;
  error?: string;
}

export default function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [apiTestResult, setApiTestResult] = useState<ApiTestResult | null>(null);
  const [isTestingApi, setIsTestingApi] = useState(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === 'loading') return; // Still loading
    if (!session) {
      router.push('/');
    }
  }, [session, status, router]);

  const testApiCall = async () => {
    setIsTestingApi(true);
    setApiTestResult(null);
    
    try {
      const response = await fetch('/api/test-auth', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setApiTestResult({
          success: true,
          data: data,
        });
      } else {
        setApiTestResult({
          success: false,
          error: data.detail || data.error || 'Unknown error',
        });
      }
    } catch (error) {
      setApiTestResult({
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      });
    } finally {
      setIsTestingApi(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-8 p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="text-sm text-gray-600">Loading...</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-8 p-8">
        <p className="text-sm text-gray-600">Redirecting to login...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Welcome to Moongraph</CardTitle>
          <CardDescription>
            Your knowledge graph platform is ready to use.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-green-600 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <div className="text-sm">
                  <p className="text-green-800 font-medium">Authentication Successful!</p>
                  <p className="text-green-700 mt-1">
                    You are now securely authenticated with Auth0. Your session is active and protected.
                  </p>
                </div>
              </div>
            </div>

            {/* User Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-sm font-medium text-blue-800 mb-2">Your Account</h3>
              <div className="space-y-1 text-sm text-blue-700">
                {session.user?.email && (
                  <p><span className="font-medium">Email:</span> {session.user.email}</p>
                )}
                {session.user?.name && (
                  <p><span className="font-medium">Name:</span> {session.user.name}</p>
                )}
                <p><span className="font-medium">Auth Provider:</span> Auth0</p>
              </div>
            </div>

            {/* API Test Section */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-900 mb-3">Test Backend Connection</h3>
              <div className="space-y-3">
                <Button 
                  onClick={testApiCall} 
                  disabled={isTestingApi}
                  variant="default"
                  className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {isTestingApi ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Testing API...
                    </>
                  ) : (
                    'Test API Call'
                  )}
                </Button>
                
                {apiTestResult && (
                  <div className={`rounded-lg p-3 text-sm ${
                    apiTestResult.success 
                      ? 'bg-green-50 border border-green-200 text-green-800' 
                      : 'bg-red-50 border border-red-200 text-red-800'
                  }`}>
                    {apiTestResult.success ? (
                      <div>
                        <p className="font-medium mb-2">✅ Backend Connection Successful!</p>
                        <pre className="text-xs overflow-x-auto whitespace-pre-wrap bg-green-100 p-2 rounded">
                          {JSON.stringify(apiTestResult.data, null, 2)}
                        </pre>
                      </div>
                    ) : (
                      <div>
                        <p className="font-medium mb-1">❌ Backend Connection Failed</p>
                        <p className="text-xs">{apiTestResult.error}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Next Steps */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-gray-900">Next Steps</h3>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <Button variant="outline" className="justify-start h-auto p-4">
                  <div className="text-left">
                    <div className="font-medium">Create Graph</div>
                    <div className="text-xs text-gray-500 mt-1">Start building your knowledge graph</div>
                  </div>
                </Button>
                <Button variant="outline" className="justify-start h-auto p-4">
                  <div className="text-left">
                    <div className="font-medium">Upload Documents</div>
                    <div className="text-xs text-gray-500 mt-1">Add your documents to analyze</div>
                  </div>
                </Button>
                <Button variant="outline" className="justify-start h-auto p-4">
                  <div className="text-left">
                    <div className="font-medium">Explore Features</div>
                    <div className="text-xs text-gray-500 mt-1">Learn about platform capabilities</div>
                  </div>
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 
