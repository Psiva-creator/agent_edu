import { useState } from 'react'

/**
 * Custom hook for making API calls with loading/error state management.
 * Usage: const { data, loading, error, execute } = useApi(apiFn)
 */
export function useApi(apiFn) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const execute = async (...args) => {
    try {
      setLoading(true)
      setError(null)
      const result = await apiFn(...args)
      setData(result)
      return result
    } catch (err) {
      setError(err.response?.data?.detail || err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  return { data, loading, error, execute }
}
