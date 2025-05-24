import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route.js';

export async function GET(request) {
  try {
    // Get the session to access the access token
    const session = await getServerSession(authOptions);
    
    if (!session || !session.accessToken) {
      return new Response(
        JSON.stringify({ error: 'No valid session or access token found' }),
        { 
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Make request to backend with the access token
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    const response = await fetch(`${backendUrl}/test/auth-context`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${session.accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    // Return the response from the backend
    return new Response(
      JSON.stringify(data),
      { 
        status: response.status,
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in test-auth API route:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
} 