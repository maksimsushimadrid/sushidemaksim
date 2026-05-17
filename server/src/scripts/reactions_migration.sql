-- ============================================================================
-- Tablón (Community Bulletin Board) — Reactions Migration
-- ============================================================================

CREATE TABLE IF NOT EXISTS tablon_post_reactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id INTEGER NOT NULL REFERENCES tablon_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reaction_type TEXT NOT NULL, -- e.g. '❤️', '👍', '😮'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, user_id, reaction_type)
);

CREATE INDEX IF NOT EXISTS idx_tablon_reactions_post ON tablon_post_reactions(post_id);
CREATE INDEX IF NOT EXISTS idx_tablon_reactions_user ON tablon_post_reactions(user_id);

-- Setup Data API Grants (Supabase requirement)
GRANT SELECT ON public.tablon_post_reactions TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tablon_post_reactions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tablon_post_reactions TO service_role;
