-- ============================================================================
-- Tablón (Community Bulletin Board) — Database Migration
-- ============================================================================

-- 1. Categories table (admin-managed + user-suggested)
CREATE TABLE IF NOT EXISTS tablon_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  emoji TEXT DEFAULT '📌',
  is_approved BOOLEAN DEFAULT FALSE,    -- user-suggested categories need approval
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Seed default categories
INSERT INTO tablon_categories (name, emoji, is_approved) VALUES
  ('Espero mi pedido', '⏳', TRUE),
  ('Eventos', '🎉', TRUE),
  ('Negocios', '💼', TRUE),
  ('Ideas', '💡', TRUE),
  ('Sugerencias', '📝', TRUE),
  ('Trabajo', '👷', TRUE),
  ('Alquiler', '🏠', TRUE),
  ('Varios', '📦', TRUE)
ON CONFLICT (name) DO NOTHING;

-- 3. Posts table
CREATE TABLE IF NOT EXISTS tablon_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES tablon_categories(id) ON DELETE RESTRICT,
  tags TEXT[] DEFAULT '{}',
  message TEXT NOT NULL,
  whatsapp_phone TEXT NOT NULL,
  images TEXT[] DEFAULT '{}',
  is_approved BOOLEAN DEFAULT FALSE,    -- requires moderator approval
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Comments table (threaded)
CREATE TABLE IF NOT EXISTS tablon_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES tablon_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES tablon_comments(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_tablon_posts_category ON tablon_posts(category_id);
CREATE INDEX IF NOT EXISTS idx_tablon_posts_created ON tablon_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tablon_posts_user ON tablon_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_tablon_posts_approved ON tablon_posts(is_approved);
CREATE INDEX IF NOT EXISTS idx_tablon_comments_post ON tablon_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_tablon_comments_parent ON tablon_comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_tablon_categories_approved ON tablon_categories(is_approved);

-- 6. GIN index for tag filtering
CREATE INDEX IF NOT EXISTS idx_tablon_posts_tags ON tablon_posts USING GIN (tags);

-- 7. Setup Data API Grants (Supabase requirement)
GRANT SELECT ON public.tablon_categories TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tablon_categories TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tablon_categories TO service_role;

GRANT SELECT ON public.tablon_posts TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tablon_posts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tablon_posts TO service_role;

GRANT SELECT ON public.tablon_comments TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tablon_comments TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tablon_comments TO service_role;
