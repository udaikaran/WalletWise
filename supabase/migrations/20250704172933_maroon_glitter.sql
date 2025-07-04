/*
  # Create BudgetBuddy Database Schema

  1. New Tables
    - `users` - User profiles and metadata
    - `budgets` - Budget plans with income and balance tracking
    - `categories` - Budget categories with spending limits and visual styling
    - `transactions` - Individual transactions linked to budgets and categories
    - `emis` - EMI/loan tracking with payment schedules
    - `adjustments` - AI-powered budget adjustments and recommendations

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to access only their own data
    - Implement proper foreign key constraints

  3. Indexes
    - Add indexes on frequently queried columns for performance
    - Add indexes on foreign keys for efficient joins
*/

-- Create users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  username text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create budgets table
CREATE TABLE IF NOT EXISTS public.budgets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  total_income numeric(10,2) NOT NULL DEFAULT 0,
  remaining_balance numeric(10,2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create categories table
CREATE TABLE IF NOT EXISTS public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  budget_limit numeric(10,2) NOT NULL DEFAULT 0,
  color text NOT NULL DEFAULT '#3B82F6',
  icon text NOT NULL DEFAULT 'circle',
  created_at timestamptz DEFAULT now()
);

-- Create transactions table
CREATE TABLE IF NOT EXISTS public.transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_id uuid REFERENCES public.budgets(id) ON DELETE CASCADE,
  category_id uuid REFERENCES public.categories(id) ON DELETE CASCADE,
  amount numeric(10,2) NOT NULL,
  description text NOT NULL,
  transaction_date date NOT NULL DEFAULT CURRENT_DATE,
  receipt_url text,
  is_recurring boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create emis table
CREATE TABLE IF NOT EXISTS public.emis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  amount numeric(10,2) NOT NULL,
  due_date date NOT NULL,
  remaining_months integer NOT NULL DEFAULT 1,
  created_at timestamptz DEFAULT now()
);

-- Create adjustments table for AI recommendations
CREATE TABLE IF NOT EXISTS public.adjustments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_id uuid REFERENCES public.budgets(id) ON DELETE CASCADE,
  adjustment_date timestamptz DEFAULT now(),
  details text NOT NULL,
  ai_response text,
  created_at timestamptz DEFAULT now()
);

-- Insert default categories
INSERT INTO public.categories (name, budget_limit, color, icon) VALUES
  ('Rent', 1200, '#3B82F6', 'home'),
  ('Groceries', 400, '#10B981', 'shopping-cart'),
  ('Transportation', 300, '#F59E0B', 'car'),
  ('Entertainment', 200, '#8B5CF6', 'coffee'),
  ('Healthcare', 150, '#EF4444', 'heart'),
  ('Savings', 500, '#6366F1', 'piggy-bank'),
  ('Miscellaneous', 150, '#6B7280', 'more-horizontal')
ON CONFLICT DO NOTHING;

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.adjustments ENABLE ROW LEVEL SECURITY;

-- Create policies for users table
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

-- Create policies for budgets table
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

-- Create policies for categories table (read-only for all authenticated users)
CREATE POLICY "All users can view categories"
  ON public.categories
  FOR SELECT
  TO authenticated
  USING (true);

-- Create policies for transactions table
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

-- Create policies for emis table
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

-- Create policies for adjustments table
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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_budgets_user_id ON public.budgets(user_id);
CREATE INDEX IF NOT EXISTS idx_budgets_status ON public.budgets(status);
CREATE INDEX IF NOT EXISTS idx_transactions_budget_id ON public.transactions(budget_id);
CREATE INDEX IF NOT EXISTS idx_transactions_category_id ON public.transactions(category_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON public.transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_emis_user_id ON public.emis(user_id);
CREATE INDEX IF NOT EXISTS idx_emis_due_date ON public.emis(due_date);
CREATE INDEX IF NOT EXISTS idx_adjustments_budget_id ON public.adjustments(budget_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_budgets_updated_at
  BEFORE UPDATE ON public.budgets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();