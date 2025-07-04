import React, { createContext, useContext, useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

interface UserProfile {
  id: string
  email: string
  username: string
  created_at: string
  updated_at: string
}

interface AuthContextType {
  user: User | null
  userProfile: UserProfile | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, username: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle() // Use maybeSingle instead of single to handle no results gracefully

      if (error) {
        console.error('Error fetching user profile:', error)
        setUserProfile(null)
        return
      }

      if (data) {
        setUserProfile(data)
      } else {
        // Profile doesn't exist, this is normal for new users
        console.log('User profile not found, user may need to complete profile setup')
        setUserProfile(null)
      }
    } catch (error) {
      console.error('Error fetching user profile:', error)
      setUserProfile(null)
    }
  }

  const createUserProfile = async (userId: string, email: string, username: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .insert([
          {
            id: userId,
            email,
            username
          }
        ])
        .select()
        .single()

      if (error) {
        // Check if it's a duplicate key error (user already exists)
        if (error.code === '23505') {
          console.log('User profile already exists, fetching existing profile')
          await fetchUserProfile(userId)
          return
        }
        throw error
      }

      if (data) {
        setUserProfile(data)
      }
    } catch (error) {
      console.error('Error creating user profile:', error)
      // Don't throw here - we'll handle this gracefully
      setUserProfile(null)
    }
  }

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchUserProfile(session.user.id)
      }
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null)
      
      if (session?.user) {
        if (event === 'SIGNED_UP') {
          // For new sign-ups, we'll create the profile in the signUp function
          // Just fetch here in case it was already created
          await fetchUserProfile(session.user.id)
        } else {
          await fetchUserProfile(session.user.id)
        }
      } else {
        setUserProfile(null)
      }
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }

  const signUp = async (email: string, password: string, username: string) => {
    // Check if Supabase is properly configured
    if (!import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === 'https://placeholder.supabase.co') {
      throw new Error('Please configure your Supabase connection first. Click the "Connect to Supabase" button in the top right.')
    }

    const { data, error } = await supabase.auth.signUp({ 
      email,
      password,
      options: {
        emailRedirectTo: undefined // Disable email confirmation
      }
    })
    
    if (error) throw error

    // Create user profile immediately after successful auth signup
    if (data.user && !data.user.email_confirmed_at) {
      // For new users (not email confirmed), create profile
      await createUserProfile(data.user.id, email, username)
    } else if (data.user) {
      // For existing users or confirmed users, just fetch profile
      await fetchUserProfile(data.user.id)
    }
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    setUserProfile(null)
  }

  return (
    <AuthContext.Provider value={{ user, userProfile, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}