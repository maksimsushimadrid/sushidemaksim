-- Migration: Abandoned Carts & Unconfirmed Registrations Tracking

-- 1. Add abandoned_cart_reminder_sent_at to users
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS abandoned_cart_reminder_sent_at TIMESTAMP WITH TIME ZONE;

-- 2. Add unconfirmed_reminder_sent_at to users
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS unconfirmed_reminder_sent_at TIMESTAMP WITH TIME ZONE;
