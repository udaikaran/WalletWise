import { createClient } from '@supabase/supabase-js'

// Check if environment variables are properly configured
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Validate that we have proper Supabase configuration
const isSupabaseConfigured = supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl !== 'https://placeholder.supabase.co' &&
  supabaseAnonKey !== 'placeholder-key' &&
  supabaseUrl.startsWith('https://') &&
  supabaseUrl.includes('.supabase.co')

// Use a valid dummy URL if Supabase is not configured to prevent initialization errors
const validUrl = isSupabaseConfigured ? supabaseUrl : 'https://dummy.supabase.co'
const validKey = isSupabaseConfigured ? supabaseAnonKey : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR1bW15Iiwicm9sZSI6ImFub24iLCJpYXQiOjE2NDUxOTI4MDAsImV4cCI6MTk2MDc2ODgwMH0.dummy'

if (!isSupabaseConfigured) {
  console.warn('Supabase is not properly configured. Please set up your environment variables.')
}

export const supabase = createClient(validUrl, validKey)

// Export a flag to check if Supabase is properly configured
export const isSupabaseReady = isSupabaseConfigured

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          username: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          username: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          username?: string
          created_at?: string
          updated_at?: string
        }
      }
      budgets: {
        Row: {
          id: string
          user_id: string
          name: string
          total_income: number
          remaining_balance: number
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          total_income: number
          remaining_balance: number
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          total_income?: number
          remaining_balance?: number
          status?: string
          created_at?: string
          updated_at?: string
        }
      }
      categories: {
        Row: {
          id: string
          name: string
          budget_limit: number
          color: string
          icon: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          budget_limit: number
          color: string
          icon: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          budget_limit?: number
          color?: string
          icon?: string
          created_at?: string
        }
      }
      transactions: {
        Row: {
          id: string
          budget_id: string
          category_id: string
          amount: number
          description: string
          transaction_date: string
          receipt_url: string | null
          is_recurring: boolean
          created_at: string
        }
        Insert: {
          id?: string
          budget_id: string
          category_id: string
          amount: number
          description: string
          transaction_date: string
          receipt_url?: string | null
          is_recurring?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          budget_id?: string
          category_id?: string
          amount?: number
          description?: string
          transaction_date?: string
          receipt_url?: string | null
          is_recurring?: boolean
          created_at?: string
        }
      }
      emis: {
        Row: {
          id: string
          user_id: string
          name: string
          amount: number
          due_date: string
          remaining_months: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          amount: number
          due_date: string
          remaining_months: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          amount?: number
          due_date?: string
          remaining_months?: number
          created_at?: string
        }
      }
    }
  }
}