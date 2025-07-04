import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables. Please check your .env file.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

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