import { useState, useCallback } from 'react'

/**
 * Custom hook for API calls with loading/error/data state management.
 * 
 * Usage:
 *   const { data, loading, error, execute, reset } = useApi(apiFunction)
 *   const result = await execute(arg1, arg2)
 */
export function useApi(apiFn) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const execute = useCallback(async (...args) => {
    try {
      setLoading(true)
      setError(null)
      const result = await apiFn(...args)
      setData(result)
      return result
    } catch (err) {
      const message =
        err.response?.data?.detail ||
        err.response?.data?.error ||
        err.message ||
        'An unexpected error occurred'
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [apiFn])

  const reset = useCallback(() => {
    setData(null)
    setLoading(false)
    setError(null)
  }, [])

  return { data, loading, error, execute, reset }
}
