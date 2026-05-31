-- Migration: Maksim Coins (Loyalty System)

-- 1. Add coins_balance to users
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS coins_balance DECIMAL(10, 2) DEFAULT 0.00;

-- 2. Add coins tracking to orders
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS coins_earned DECIMAL(10, 2) DEFAULT 0.00;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS coins_spent DECIMAL(10, 2) DEFAULT 0.00;

-- Note: Because these are just new columns on existing tables, we don't need to update RLS or Grants.
