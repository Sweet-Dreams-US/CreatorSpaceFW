-- CreatorSpaceFW — Add missing columns, invite system, and proper constraints
-- This migration adds columns that exist in the live DB but were missing from 001

-- ── Add missing columns ────────────────────────────────────────────────────

ALTER TABLE creators ADD COLUMN IF NOT EXISTS auth_id UUID REFERENCES auth.users(id);
ALTER TABLE creators ADD COLUMN IF NOT EXISTS claimed BOOLEAN DEFAULT false;
ALTER TABLE creators ADD COLUMN IF NOT EXISTS slug TEXT;
ALTER TABLE creators ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE creators ADD COLUMN IF NOT EXISTS website TEXT;
ALTER TABLE creators ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE creators ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- ── Invite system columns ──────────────────────────────────────────────────

ALTER TABLE creators ADD COLUMN IF NOT EXISTS invite_token UUID DEFAULT gen_random_uuid();
ALTER TABLE creators ADD COLUMN IF NOT EXISTS invite_sent_at TIMESTAMPTZ;

-- ── Indexes & constraints ──────────────────────────────────────────────────

CREATE UNIQUE INDEX IF NOT EXISTS creators_slug_unique ON creators(slug) WHERE slug IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS creators_auth_id_unique ON creators(auth_id) WHERE auth_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS creators_claimed_idx ON creators(claimed);
CREATE INDEX IF NOT EXISTS creators_email_idx ON creators(email);

-- ── RLS policy for UPDATE ──────────────────────────────────────────────────

CREATE POLICY "Users can update own profile" ON creators
  FOR UPDATE USING (auth.uid() = auth_id)
  WITH CHECK (auth.uid() = auth_id);
