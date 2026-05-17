# Supabase Migrations & Permissions Guide

Due to a security update by Supabase (May/October 2026), the `public` schema no longer provides implicit access to newly created tables via the Data API (PostgREST).

## What This Means

When you create a **new table** in Supabase, whether through the Dashboard UI or via raw SQL, it will be invisible to your React frontend (`supabase-js`), even if you configure Row Level Security (RLS).

You will receive an **`HTTP 42501 (Unauthorized)`** error when trying to fetch or insert data.

## The Solution

Whenever you create a new table, you **MUST** explicitly grant permissions to the standard Supabase roles (`anon`, `authenticated`, and `service_role`).

### Example SQL Snippet

If you create a table named `my_new_table`, you must run the following commands immediately after:

```sql
-- 1. Create the table
CREATE TABLE public.my_new_table (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL
);

-- 2. Explicitly Grant Permissions (REQUIRED)
GRANT SELECT ON public.my_new_table TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.my_new_table TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.my_new_table TO service_role;

-- 3. Enable RLS (As usual)
ALTER TABLE public.my_new_table ENABLE ROW LEVEL SECURITY;

-- 4. Create your RLS Policies...
```

## How to check existing tables

You can go to your Supabase Dashboard -> **Security Advisor**. It will flag any tables that are missing required grants.

_Note: Existing tables created before the cutoff date will retain their implicit grants, so your current application will continue to work without modifications._
