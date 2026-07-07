/**
 * Utility functions for Career Guide AI frontend.
 */

/** Merge class names, filtering falsy values */
export const cn = (...classes) => classes.filter(Boolean).join(' ')

/** Format date to readable string */
export const formatDate = (dateString) =>
  new Date(dateString).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

/** Truncate text to a given length */
export const truncateText = (text, maxLength = 100) => {
  if (!text) return ''
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '…'
}

/** Capitalize first letter */
export const capitalize = (str) => {
  if (!str) return ''
  return str.charAt(0).toUpperCase() + str.slice(1)
}

/** Get a color for a numeric score (0-100) — matches Career Match Score zones */
export const getScoreColor = (score) => {
  if (score >= 86) return '#22c55e'   // Green
  if (score >= 71) return '#6366f1'   // Blue
  if (score >= 41) return '#f59e0b'   // Orange
  return '#ef4444'                     // Red
}

/** Get a label for a numeric score (0-100) */
export const getScoreLabel = (score) => {
  if (score >= 80) return 'Excellent'
  if (score >= 60) return 'Good'
  if (score >= 40) return 'Average'
  return 'Needs Work'
}

/** Delay utility (for animations) */
export const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

/** Generate stagger delay style for list items */
export const staggerDelay = (index, baseMs = 50) => ({
  animationDelay: `${index * baseMs}ms`,
})
