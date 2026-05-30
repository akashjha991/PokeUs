-- ============================================================
-- SUPABASE SETUP SQL
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- Step 1: Create the profiles table in the public schema
-- This mirrors key user data and is linked to auth.users via UUID
CREATE TABLE IF NOT EXISTS public.profiles (
  id           UUID         PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name    TEXT,
  email        TEXT,
  avatar_url   TEXT,
  role         TEXT         NOT NULL DEFAULT 'USER',   -- 'USER' | 'ADMIN'
  prisma_user_id TEXT,                                 -- Links to Neon Prisma User.id (cuid)
  created_at   TIMESTAMPTZ  DEFAULT NOW(),
  updated_at   TIMESTAMPTZ  DEFAULT NOW()
);

-- Step 2: Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Step 3: RLS Policies (safe to re-run)
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Service role can insert profiles" ON public.profiles;

-- Allow users to read ONLY their own profile
CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Allow users to update ONLY their own profile
CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- Allow service role (server-side) to insert profiles (for signup trigger)
CREATE POLICY "Service role can insert profiles"
  ON public.profiles
  FOR INSERT
  WITH CHECK (true);

-- Step 4: Auto-update updated_at on every update
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Step 5: Trigger — auto-create profile when a new Supabase user is created
-- This runs automatically when a user verifies their email and signs in
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.email,
    'USER'
  )
  ON CONFLICT (id) DO NOTHING;  -- Safe for re-runs
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if it already exists (safe re-run)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- VERIFICATION QUERIES (run after setup to confirm everything works)
-- ============================================================

-- Confirm profiles table exists
-- SELECT * FROM public.profiles LIMIT 5;

-- Confirm RLS is enabled
-- SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'profiles';

-- Confirm trigger exists
-- SELECT trigger_name FROM information_schema.triggers WHERE trigger_name = 'on_auth_user_created';
