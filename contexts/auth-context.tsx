"use client"

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react"
import {
  auth,
  googleProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signInAnonymously,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User,
} from "@/lib/firebase"

interface AuthContextType {
  user: User | null
  loading: boolean
  token: string | null
  signInWithEmail: (email: string, password: string) => Promise<void>
  signUpWithEmail: (email: string, password: string) => Promise<void>
  signInWithGoogle: () => Promise<void>
  signInAsGuest: () => Promise<void>
  signOut: () => Promise<void>
  refreshToken: () => Promise<string | null>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [token, setToken] = useState<string | null>(null)

  const refreshToken = useCallback(async (): Promise<string | null> => {
    if (!auth.currentUser) return null
    try {
      const newToken = await auth.currentUser.getIdToken(true)
      setToken(newToken)
      return newToken
    } catch (error) {
      console.error("Error refreshing token:", error)
      return null
    }
  }, [])

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser)
      if (firebaseUser) {
        const idToken = await firebaseUser.getIdToken()
        setToken(idToken)
      } else {
        setToken(null)
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  // Auto-refresh token every 50 minutes (tokens expire in 1 hour)
  useEffect(() => {
    if (!user) return

    const interval = setInterval(
      () => {
        refreshToken()
      },
      50 * 60 * 1000
    )

    return () => clearInterval(interval)
  }, [user, refreshToken])

  const signInWithEmail = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password)
  }

  const signUpWithEmail = async (email: string, password: string) => {
    await createUserWithEmailAndPassword(auth, email, password)
  }

  const signInWithGoogle = async () => {
    await signInWithPopup(auth, googleProvider)
  }

  const signInAsGuest = async () => {
    await signInAnonymously(auth)
  }

  const signOut = async () => {
    await firebaseSignOut(auth)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        token,
        signInWithEmail,
        signUpWithEmail,
        signInWithGoogle,
        signInAsGuest,
        signOut,
        refreshToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
