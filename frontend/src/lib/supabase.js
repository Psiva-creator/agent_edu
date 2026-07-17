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
      await mockDelay(500)
      const stored = localStorage.getItem('mock_supabase_session')
      return { data: { session: stored ? JSON.parse(stored) : null }, error: null }
    },
    onAuthStateChange: (callback) => {
      authListeners.push(callback)
      return { data: { subscription: { unsubscribe: () => { authListeners = authListeners.filter(cb => cb !== callback) } } } }
    },
    signUp: async ({ email, password, options }) => {
      await mockDelay(1000)
      if (password.length < 8) return { error: { message: 'Password too short' } }
      const session = { user: { email, id: 'mock-user-123' }, access_token: 'mock-token' }
      localStorage.setItem('mock_supabase_session', JSON.stringify(session))
      notifyListeners(session)
      return { data: { user: session.user, session }, error: null }
    },
    signInWithPassword: async ({ email, password }) => {
      await mockDelay(1000)
      // Accept any password for testing
      const session = { user: { email, id: 'mock-user-123' }, access_token: 'mock-token' }
      localStorage.setItem('mock_supabase_session', JSON.stringify(session))
      notifyListeners(session)
      return { data: { session, user: session.user }, error: null }
    },
    signOut: async () => {
      await mockDelay(500)
      localStorage.removeItem('mock_supabase_session')
      authListeners.forEach(cb => cb('SIGNED_OUT', null))
      window.location.reload() 
      return { error: null }
    },
    signInWithOAuth: async () => {
      await mockDelay(1000)
      const session = { user: { email: 'google.user@example.com', id: 'mock-user-123' }, access_token: 'mock-token' }
      localStorage.setItem('mock_supabase_session', JSON.stringify(session))
      notifyListeners(session)
      window.location.href = '/dashboard' // Force navigation for OAuth mock
      return { data: { session }, error: null }
    },
    resetPasswordForEmail: async () => {
      await mockDelay(1000)
      return { error: null }
    }
  }
} : realClient

