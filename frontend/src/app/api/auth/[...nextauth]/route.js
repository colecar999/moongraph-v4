import NextAuth from 'next-auth';
import Auth0Provider from 'next-auth/providers/auth0';

export const authOptions = {
  providers: [
    Auth0Provider({
      clientId: process.env.AUTH0_CLIENT_ID,
      clientSecret: process.env.AUTH0_CLIENT_SECRET,
      issuer: process.env.AUTH0_ISSUER_BASE_URL, // e.g., https://your-tenant.auth0.com
      authorization: {
        params: {
          audience: process.env.AUTH0_API_IDENTIFIER, // The API Identifier for Morphik Core
          scope: 'openid email profile',
          prompt: 'login', // Force login screen to show user selection
        },
      },
    }),
    // Add other providers as needed (e.g., GitHub, Google through NextAuth directly if preferred over Auth0 handling)
  ],
  session: {
    strategy: 'jwt', // Use JWT for session strategy
  },
  pages: {
    signIn: '/auth/signin', // Custom sign-in page
    error: '/auth/error', // Error page
  },
  callbacks: {
    async jwt({ token, user, account }) {
      // Persist the OAuth access_token and user id to the token right after signin
      if (account && user) {
        token.accessToken = account.access_token;
        token.id = user.id; // This is the Auth0 user ID (sub)
        token.user = user; // Contains profile info from Auth0
      }
      return token;
    },
    async session({ session, token }) {
      // Send properties to the client, like an access_token and user id from the token
      session.accessToken = token.accessToken;
      session.user.id = token.id; // Auth0 user ID
      // Add other user properties from token.user if needed
      session.user.name = token.user?.name;
      session.user.email = token.user?.email;
      session.user.image = token.user?.picture;
      return session;
    },
  },
  // Ensure your Auth0 application is configured for PKCE if not using client secret in a public client
  // Add other NextAuth.js configurations as needed (e.g., database adapter if syncing users, pages for custom login)
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST }; 