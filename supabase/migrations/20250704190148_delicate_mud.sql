/*
  # Seed default categories

  1. New Data
    - Insert default spending categories that users can assign to transactions
    - Categories include common expense types like rent, groceries, etc.
  
  2. Security
    - Categories are readable by all authenticated users
    - No user-specific restrictions since these are shared categories
*/

-- Insert default categories
INSERT INTO categories (name, budget_limit, color, icon) VALUES
  ('Rent', 0, '#3B82F6', 'home'),
  ('Groceries', 0, '#10B981', 'shopping-cart'),
  ('Transportation', 0, '#F59E0B', 'car'),
  ('Entertainment', 0, '#8B5CF6', 'coffee'),
  ('Healthcare', 0, '#EF4444', 'heart'),
  ('Savings', 0, '#6366F1', 'piggy-bank'),
  ('Miscellaneous', 0, '#6B7280', 'more-horizontal')
ON CONFLICT (name) DO NOTHING;