import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { profileApi } from '../data/profile'
import type { Profile } from '../types/database'

interface AuthContextType {
  user: User | null
  session: Session | null
  profile: Profile | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, fullName: string) => Promise<{ needEmailConfirm: boolean }>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  profile: null,
  loading: true,
  signIn: async () => {},
  signUp: async () => ({ needEmailConfirm: false }),
  signOut: async () => {},
  refreshProfile: async () => {},
})

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState<boolean>(true)

  const fetchProfile = useCallback(async (currentUser: User | null) => {
    if (!currentUser) {
      setProfile(null)
      return
    }
    try {
      const prof = await profileApi.getProfile()
      if (prof) {
        setProfile(prof)
      } else {
        // Profil par défaut si création en cours
        setProfile({
          id: currentUser.id,
          full_name: currentUser.user_metadata?.full_name || currentUser.email?.split('@')[0] || 'Utilisateur',
          currency: 'XOF',
          pay_day: 1,
          plan: 'free',
          role: 'user',
          status: 'active',
          created_at: currentUser.created_at,
          updated_at: currentUser.created_at,
        })
      }
    } catch (err) {
      console.error('[AuthContext] Erreur chargement profil:', err)
      // Profil de secours local
      setProfile({
        id: currentUser.id,
        full_name: currentUser.user_metadata?.full_name || currentUser.email?.split('@')[0] || 'Utilisateur',
        currency: 'XOF',
        pay_day: 1,
        plan: 'free',
        role: 'user',
        status: 'active',
        created_at: currentUser.created_at,
        updated_at: currentUser.created_at,
      })
    }
  }, [])

  const refreshProfile = useCallback(async () => {
    const { data } = await supabase.auth.getUser()
    await fetchProfile(data.user || null)
  }, [fetchProfile])

  useEffect(() => {
    let isMounted = true

    // 1. Récupération de la session initiale active
    const initAuth = async () => {
      try {
        const { data: { session: initialSession }, error } = await supabase.auth.getSession()
        if (error) {
          console.warn('[AuthContext] Session init error:', error)
        }
        if (isMounted) {
          setSession(initialSession)
          setUser(initialSession?.user || null)
          if (initialSession?.user) {
            await fetchProfile(initialSession.user)
          }
        }
      } catch (e) {
        console.error('[AuthContext] Init error:', e)
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    initAuth()

    // 2. Écoute réactive de tout événement Auth Supabase
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      console.log(`[AuthContext] Événement Auth: ${event}`)
      if (!isMounted) return

      setSession(newSession)
      setUser(newSession?.user || null)

      if (newSession?.user) {
        await fetchProfile(newSession.user)
      } else {
        setProfile(null)
      }
      setLoading(false)
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [fetchProfile])

  const signIn = async (email: string, password: string) => {
    setLoading(true)
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error
      setSession(data.session)
      setUser(data.user)
      if (data.user) {
        await fetchProfile(data.user)
      }
    } finally {
      setLoading(false)
    }
  }

  const signUp = async (email: string, password: string, fullName: string) => {
    setLoading(true)
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
        },
      })
      if (error) throw error

      if (data.session) {
        setSession(data.session)
        setUser(data.user)
        if (data.user) {
          await fetchProfile(data.user)
        }
        return { needEmailConfirm: false }
      }
      return { needEmailConfirm: true }
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    setLoading(true)
    try {
      await supabase.auth.signOut()
      setUser(null)
      setSession(null)
      setProfile(null)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        loading,
        signIn,
        signUp,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
