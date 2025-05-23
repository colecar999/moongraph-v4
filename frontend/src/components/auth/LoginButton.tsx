'use client';
import { useSession, signIn, signOut } from 'next-auth/react';

export default function LoginButton() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <p>Loading...</p>;
  }

  if (session) {
    return (
      <>
        {session.user?.email && (
          <p>
            Signed in as {session.user.email} <br />
          </p>
        )}
        <button 
          onClick={() => signOut()} 
          style={{ padding: '10px', marginTop: '10px', cursor: 'pointer' }}
        >
          Sign out
        </button>
      </>
    );
  }
  return (
    <>
      Not signed in <br />
      <button 
        onClick={() => signIn('auth0')} 
        style={{ padding: '10px', marginTop: '10px', cursor: 'pointer' }}
      >
        Sign in with Auth0
      </button>
    </>
  );
} 