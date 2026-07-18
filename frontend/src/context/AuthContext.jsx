import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        setUser(session?.user ?? null);
      } catch (err) {
        console.error("Failed to retrieve initial session from Supabase:", err);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    let subscription;
    try {
      const { data } = supabase.auth.onAuthStateChange((_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      });
      subscription = data?.subscription;
    } catch (err) {
      console.error("Failed to subscribe to Supabase auth state changes:", err);
    }

    return () => {
      if (subscription) subscription.unsubscribe();
    };
  }, []);

  // Enforce global user data extraction
  useEffect(() => {
    if (user) {
      const provider = user.app_metadata?.provider || user.app_metadata?.providers?.[0] || 'email';
      const loginMethod = user.app_metadata?.providers?.join(', ') || provider;
      const metadata = user.user_metadata || {};
      
      setUserData({
        id: user.id,
        email: user.email,
        emailVerified: !!user.email_confirmed_at || metadata.email_verified || provider === 'google' || provider === 'github',
        phone: user.phone || metadata.phone || null,
        fullName: metadata.full_name || metadata.name || '',
        profilePicture: metadata.avatar_url || metadata.picture || null,
        username: metadata.user_name || metadata.preferred_username || null,
        provider: provider,
        loginMethod: loginMethod,
        createdAt: user.created_at,
        lastLogin: user.last_sign_in_at,
      });
    } else {
      setUserData(null);
    }
  }, [user]);

  const signUp = async (email, password, fullName) => {
    return supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        }
      }
    });
  };

  const signIn = async (email, password) => {
    return supabase.auth.signInWithPassword({
      email,
      password,
    });
  };

  const signOut = async () => {
    return supabase.auth.signOut();
  };

  const signInWithGoogle = async () => {
    return supabase.auth.signInWithOAuth({
      provider: 'google',
    });
  };

  const resetPassword = async (email) => {
    return supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login?type=reset`,
    });
  };

  const updatePassword = async (newPassword) => {
    return supabase.auth.updateUser({
      password: newPassword,
    });
  };

  const value = {
    signUp,
    signIn,
    signOut,
    signInWithGoogle,
    resetPassword,
    updatePassword,
    user,
    session,
    loading,
    userData
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
