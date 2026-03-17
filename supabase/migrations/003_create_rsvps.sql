-- CreatorSpaceFW — RSVP table

CREATE TABLE IF NOT EXISTS rsvps (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id   TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, event_id)
);

ALTER TABLE rsvps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own RSVPs" ON rsvps
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own RSVPs" ON rsvps
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Public read RSVP counts" ON rsvps
  FOR SELECT USING (true);
