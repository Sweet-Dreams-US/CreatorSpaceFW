-- CreatorSpaceFW — Events table

CREATE TABLE IF NOT EXISTS events (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title        TEXT NOT NULL,
  description  TEXT,
  date         TIMESTAMPTZ NOT NULL,
  location     TEXT,
  image_url    TEXT,
  max_capacity INT,
  created_by   UUID REFERENCES auth.users(id),
  created_at   TIMESTAMPTZ DEFAULT now(),
  updated_at   TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Anyone can read events
CREATE POLICY "Public read events" ON events
  FOR SELECT USING (true);

-- Only authenticated users can create (admin check happens in server action)
CREATE POLICY "Authenticated insert events" ON events
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated update events" ON events
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated delete events" ON events
  FOR DELETE USING (auth.role() = 'authenticated');

-- Index for fetching upcoming events
CREATE INDEX IF NOT EXISTS events_date_idx ON events(date);

-- ── Announcements log table ────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS announcements (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  subject    TEXT NOT NULL,
  body       TEXT NOT NULL,
  sent_by    UUID REFERENCES auth.users(id),
  sent_to    INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read announcements" ON announcements
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated insert announcements" ON announcements
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
