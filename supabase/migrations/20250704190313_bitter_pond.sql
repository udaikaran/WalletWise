/*
  # Seed default categories

  1. New Data
    - Insert default categories for budget management
    - Categories include: Rent, Groceries, Transportation, Entertainment, Healthcare, Savings, Miscellaneous
    - Each category has appropriate color and icon defaults

  2. Safety
    - Uses conditional INSERT to avoid duplicates
    - Only inserts if category doesn't already exist
*/

-- Insert default categories only if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Rent') THEN
    INSERT INTO categories (name, budget_limit, color, icon) VALUES ('Rent', 0, '#3B82F6', 'home');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Groceries') THEN
    INSERT INTO categories (name, budget_limit, color, icon) VALUES ('Groceries', 0, '#10B981', 'shopping-cart');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Transportation') THEN
    INSERT INTO categories (name, budget_limit, color, icon) VALUES ('Transportation', 0, '#F59E0B', 'car');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Entertainment') THEN
    INSERT INTO categories (name, budget_limit, color, icon) VALUES ('Entertainment', 0, '#8B5CF6', 'coffee');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Healthcare') THEN
    INSERT INTO categories (name, budget_limit, color, icon) VALUES ('Healthcare', 0, '#EF4444', 'heart');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Savings') THEN
    INSERT INTO categories (name, budget_limit, color, icon) VALUES ('Savings', 0, '#6366F1', 'piggy-bank');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Miscellaneous') THEN
    INSERT INTO categories (name, budget_limit, color, icon) VALUES ('Miscellaneous', 0, '#6B7280', 'more-horizontal');
  END IF;
END $$;