// Admin utility functions

/**
 * Check if a user is an admin based on their email
 * In production, this should be replaced with a proper role-based system
 * that checks against your backend API
 */
export const isAdminUser = (email: string | null | undefined): boolean => {
  if (!email) return false
  
  const adminEmails = [
    'cole@moongraph.io',
    'admin@moongraph.io'
  ]
  
  return adminEmails.includes(email.toLowerCase())
}

/**
 * Admin email list - can be moved to environment variables in production
 */
export const ADMIN_EMAILS = [
  'cole@moongraph.io',
  'admin@moongraph.io'
] 