import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder-project.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-anon-key'

// If the user hasn't provided real keys, use a mock client to avoid "Failed to fetch" errors.
const isMock = supabaseUrl === 'https://placeholder-project.supabase.co'

const realClient = isMock ? null : createClient(supabaseUrl, supabaseAnonKey)

const mockDelay = (ms) => new Promise(resolve => setTimeout(resolve, ms))

let authListeners = []
const notifyListeners = (session) => {
  authListeners.forEach(cb => cb('SIGNED_IN', session))
}

export const supabase = isMock ? {
  auth: {
    getSession: async () => {
      await mockDelay(300)
      const stored = localStorage.getItem('mock_supabase_session')
      return { data: { session: stored ? JSON.parse(stored) : null }, error: null }
    },
    onAuthStateChange: (callback) => {
      authListeners.push(callback)
      return { data: { subscription: { unsubscribe: () => { authListeners = authListeners.filter(cb => cb !== callback) } } } }
    },
    signUp: async ({ email, password, options }) => {
      await mockDelay(600)
      if (password.length < 8) return { error: { message: 'Password too short' } }
      const session = { user: { email, id: 'mock-user-123' }, access_token: 'mock-token' }
      localStorage.setItem('mock_supabase_session', JSON.stringify(session))
      notifyListeners(session)
      return { data: { user: session.user, session }, error: null }
    },
    signInWithPassword: async ({ email, password }) => {
      await mockDelay(600)
      const session = { user: { email, id: 'mock-user-123' }, access_token: 'mock-token' }
      localStorage.setItem('mock_supabase_session', JSON.stringify(session))
      notifyListeners(session)
      return { data: { session, user: session.user }, error: null }
    },
    signOut: async () => {
      await mockDelay(300)
      localStorage.removeItem('mock_supabase_session')
      authListeners.forEach(cb => cb('SIGNED_OUT', null))
      window.location.reload() 
      return { error: null }
    },
    signInWithOAuth: async () => {
      await mockDelay(600)
      const session = { user: { email: 'google.user@example.com', id: 'mock-user-123' }, access_token: 'mock-token' }
      localStorage.setItem('mock_supabase_session', JSON.stringify(session))
      notifyListeners(session)
      window.location.href = '/dashboard'
      return { data: { session }, error: null }
    },
    resetPasswordForEmail: async () => {
      await mockDelay(500)
      return { error: null }
    }
  },
  from: (table) => {
    const getStorageData = () => {
      const data = localStorage.getItem(`mock_supabase_table_${table}`)
      return data ? JSON.parse(data) : []
    }
    const setStorageData = (data) => {
      localStorage.setItem(`mock_supabase_table_${table}`, JSON.stringify(data))
    }
    
    let queryResult = getStorageData()
    let filteredResult = [...queryResult]
    let isSingle = false

    const builder = {
      select: (columns = '*') => {
        return builder
      },
      eq: (column, value) => {
        filteredResult = filteredResult.filter(row => row[column] === value)
        return builder
      },
      order: (column, { ascending = true } = {}) => {
        filteredResult.sort((a, b) => {
          if (a[column] < b[column]) return ascending ? -1 : 1
          if (a[column] > b[column]) return ascending ? 1 : -1
          return 0
        })
        return builder
      },
      limit: (n) => {
        filteredResult = filteredResult.slice(0, n)
        return builder
      },
      single: () => {
        isSingle = true
        return builder
      },
      insert: async (rows) => {
        await mockDelay(150)
        const currentData = getStorageData()
        const newRows = Array.isArray(rows) ? rows : [rows]
        
        const newRowsProcessed = newRows.map(row => ({
          id: row.id || Math.random().toString(36).substring(2, 9),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          ...row
        }))
        
        const updatedData = [...currentData, ...newRowsProcessed]
        setStorageData(updatedData)
        filteredResult = newRowsProcessed
        return { data: isSingle ? newRowsProcessed[0] : newRowsProcessed, error: null }
      },
      update: async (changes) => {
        await mockDelay(150)
        const currentData = getStorageData()
        let updatedRows = []
        
        const updatedData = currentData.map(row => {
          const match = filteredResult.some(fr => fr.id === row.id)
          if (match) {
            const updated = { ...row, ...changes, updated_at: new Date().toISOString() }
            if (changes.status === 'completed') {
              updated.completed_at = new Date().toISOString()
            }
            updatedRows.push(updated)
            return updated
          }
          return row
        })
        
        setStorageData(updatedData)
        filteredResult = updatedRows
        return { data: isSingle ? updatedRows[0] : updatedRows, error: null }
      },
      upsert: async (rows) => {
        await mockDelay(150)
        const currentData = getStorageData()
        const newRows = Array.isArray(rows) ? rows : [rows]
        
        const newRowsProcessed = newRows.map(row => ({
          id: row.id || Math.random().toString(36).substring(2, 9),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          ...row
        }))

        let updatedData = [...currentData]
        newRowsProcessed.forEach(nr => {
          const index = updatedData.findIndex(d => d.id === nr.id || (nr.user_id && d.user_id === nr.user_id && d.status !== 'completed' && d.status !== 'failed'))
          if (index !== -1) {
            updatedData[index] = { ...updatedData[index], ...nr }
          } else {
            updatedData.push(nr)
          }
        })
        
        setStorageData(updatedData)
        filteredResult = newRowsProcessed
        return { data: isSingle ? newRowsProcessed[0] : newRowsProcessed, error: null }
      },
      then: (onfulfilled) => {
        const response = {
          data: isSingle ? (filteredResult[0] || null) : filteredResult,
          error: null
        }
        return Promise.resolve(response).then(onfulfilled)
      }
    }
    return builder
  }
} : realClient
