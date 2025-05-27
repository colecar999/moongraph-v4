/**
 * Shared formatting utilities for consistent data display across the application
 */

/**
 * Format a date string to a localized date format
 */
export function formatDate(dateString?: string | Date): string {
  if (!dateString) return "—"
  
  try {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString
    return date.toLocaleDateString()
  } catch {
    return "—"
  }
}

/**
 * Format a date string to a more detailed format with time
 */
export function formatDateTime(dateString?: string | Date): string {
  if (!dateString) return "—"
  
  try {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString
    return date.toLocaleString()
  } catch {
    return "—"
  }
}

/**
 * Format file size in bytes to human-readable format
 */
export function formatFileSize(bytes?: number): string {
  if (!bytes || bytes === 0) return "—"
  
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  
  if (i === 0) return `${bytes} B`
  
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`
}

/**
 * Format a number with commas for thousands separator
 */
export function formatNumber(num?: number): string {
  if (num === undefined || num === null) return "—"
  return num.toLocaleString()
}

/**
 * Truncate text to a specified length with ellipsis
 */
export function truncateText(text?: string, maxLength: number = 50): string {
  if (!text) return "—"
  if (text.length <= maxLength) return text
  return `${text.substring(0, maxLength)}...`
}

/**
 * Get file extension from filename
 */
export function getFileExtension(filename?: string): string {
  if (!filename) return ""
  const lastDot = filename.lastIndexOf('.')
  if (lastDot === -1) return ""
  return filename.substring(lastDot + 1).toLowerCase()
}

/**
 * Get file type display name from extension
 */
export function getFileTypeDisplay(filename?: string): string {
  if (!filename) return "—"
  const extension = getFileExtension(filename)
  if (!extension) return "File"
  return extension.toUpperCase()
}

/**
 * Format content type for display
 */
export function formatContentType(contentType?: string): string {
  if (!contentType) return "—"
  
  // Common content type mappings
  const typeMap: Record<string, string> = {
    'application/pdf': 'PDF',
    'text/plain': 'Text',
    'text/markdown': 'Markdown',
    'application/msword': 'Word',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'Word',
    'application/vnd.ms-excel': 'Excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'Excel',
    'image/jpeg': 'JPEG',
    'image/png': 'PNG',
    'image/gif': 'GIF',
    'image/svg+xml': 'SVG',
  }
  
  return typeMap[contentType] || contentType.split('/')[1]?.toUpperCase() || contentType
} 