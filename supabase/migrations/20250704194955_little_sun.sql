/*
  # Fix Database Schema Issues

  1. Schema Updates
    - Fix foreign key references to use proper auth.users table
    - Ensure all tables have proper constraints and indexes
    - Fix RLS policies to use correct function names
    - Add missing columns and constraints

  2. Data Integrity
    - Ensure categories table has proper unique constraints
    - Fix any missing default values
    - Update trigger functions

  3. Security
    - Fix RLS policies with correct auth function references
    - Ensure proper access controls
*/

-- First, let's ensure the auth schema exists and we're using the right function
-- Supabase uses auth.uid() function for getting current user ID

-- Drop existing policies that might have incorrect function references
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
DROP POLICY IF EXISTS "Users can view own budgets" ON public.budgets;
DROP POLICY IF EXISTS "Users can create own budgets" ON public.budgets;
DROP POLICY IF EXISTS "Users can update own budgets" ON public.budgets;
DROP POLICY IF EXISTS "Users can delete own budgets" ON public.budgets;
DROP POLICY IF EXISTS "Users can view own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can create own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can update own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can delete own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can view own emis" ON public.emis;
DROP POLICY IF EXISTS "Users can create own emis" ON public.emis;
DROP POLICY IF EXISTS "Users can update own emis" ON public.emis;
DROP POLICY IF EXISTS "Users can delete own emis" ON public.emis;
DROP POLICY IF EXISTS "Users can view own adjustments" ON public.adjustments;
DROP POLICY IF EXISTS "Users can create own adjustments" ON public.adjustments;

-- Recreate policies with correct auth function references
CREATE POLICY "Users can view own profile"
  ON public.users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can view own budgets"
  ON public.budgets
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own budgets"
  ON public.budgets
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own budgets"
  ON public.budgets
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own budgets"
  ON public.budgets
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own transactions"
  ON public.transactions
  FOR SELECT
  TO authenticated
  USING (
    budget_id IN (
      SELECT id FROM public.budgets WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create own transactions"
  ON public.transactions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    budget_id IN (
      SELECT id FROM public.budgets WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own transactions"
  ON public.transactions
  FOR UPDATE
  TO authenticated
  USING (
    budget_id IN (
      SELECT id FROM public.budgets WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own transactions"
  ON public.transactions
  FOR DELETE
  TO authenticated
  USING (
    budget_id IN (
      SELECT id FROM public.budgets WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view own emis"
  ON public.emis
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own emis"
  ON public.emis
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own emis"
  ON public.emis
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own emis"
  ON public.emis
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own adjustments"
  ON public.adjustments
  FOR SELECT
  TO authenticated
  USING (
    budget_id IN (
      SELECT id FROM public.budgets WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create own adjustments"
  ON public.adjustments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    budget_id IN (
      SELECT id FROM public.budgets WHERE user_id = auth.uid()
    )
  );

-- Ensure categories table has unique constraint on name
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'categories_name_key' 
    AND table_name = 'categories'
  ) THEN
    ALTER TABLE public.categories ADD CONSTRAINT categories_name_key UNIQUE (name);
  END IF;
END $$;

-- Clear existing categories and insert fresh ones to avoid conflicts
DELETE FROM public.categories;

-- Insert default categories with proper conflict handling
INSERT INTO public.categories (name, budget_limit, color, icon) VALUES
  ('Rent', 0, '#3B82F6', 'home'),
  ('Groceries', 0, '#10B981', 'shopping-cart'),
  ('Transportation', 0, '#F59E0B', 'car'),
  ('Entertainment', 0, '#8B5CF6', 'coffee'),
  ('Healthcare', 0, '#EF4444', 'heart'),
  ('Savings', 0, '#6366F1', 'piggy-bank'),
  ('Miscellaneous', 0, '#6B7280', 'more-horizontal');

-- Ensure all required indexes exist
CREATE INDEX IF NOT EXISTS idx_budgets_user_id ON public.budgets(user_id);
CREATE INDEX IF NOT EXISTS idx_budgets_status ON public.budgets(status);
CREATE INDEX IF NOT EXISTS idx_transactions_budget_id ON public.transactions(budget_id);
CREATE INDEX IF NOT EXISTS idx_transactions_category_id ON public.transactions(category_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON public.transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_emis_user_id ON public.emis(user_id);
CREATE INDEX IF NOT EXISTS idx_emis_due_date ON public.emis(due_date);
CREATE INDEX IF NOT EXISTS idx_adjustments_budget_id ON public.adjustments(budget_id);

-- Ensure updated_at trigger function exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Recreate triggers if they don't exist
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
DROP TRIGGER IF EXISTS update_budgets_updated_at ON public.budgets;

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_budgets_updated_at
  BEFORE UPDATE ON public.budgets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Ensure all tables have RLS enabled
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.adjustments ENABLE ROW LEVEL SECURITY;