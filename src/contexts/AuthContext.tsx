'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
      setError(null); // Clear any previous errors
    });

    return unsubscribe;
  }, []);

  const signInWithGoogle = async () => {
    try {
      setError(null);
      // Set device language for better UX
      auth.useDeviceLanguage();
      await signInWithPopup(auth, googleProvider);
    } catch (error: unknown) {
      console.error('Error signing in with Google:', error);
      
      // Handle specific Firebase auth errors
      if (error && typeof error === 'object' && 'code' in error) {
        const authError = error as { code: string };
        if (authError.code === 'auth/unauthorized-domain') {
          setError('This domain is not authorized for OAuth. Please contact support.');
        } else if (authError.code === 'auth/invalid-api-key') {
          setError('Authentication configuration error. Please contact support.');
        } else if (authError.code === 'auth/operation-not-allowed') {
          setError('Google sign-in is not enabled. Please contact support.');
        } else if (authError.code === 'auth/popup-closed-by-user') {
          setError('Sign-in was cancelled.');
        } else {
          setError('Failed to sign in with Google. Please try again.');
        }
      } else {
        setError('Failed to sign in with Google. Please try again.');
      }
    }
  };

  const handleSignOut = async () => {
    try {
      setError(null);
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
      setError('Failed to sign out. Please try again.');
    }
  };

  const value = {
    user,
    loading,
    signInWithGoogle,
    signOut: handleSignOut,
    error,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
