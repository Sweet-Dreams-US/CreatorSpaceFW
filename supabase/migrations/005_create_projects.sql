-- CreatorSpaceFW — Projects / Portfolio system

CREATE TABLE IF NOT EXISTS projects (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id  UUID NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  description TEXT,
  youtube_url TEXT,
  link_url    TEXT,
  link_label  TEXT,
  sort_order  INT DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

-- Project images (multiple per project)
CREATE TABLE IF NOT EXISTS project_images (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  image_url  TEXT NOT NULL,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_images ENABLE ROW LEVEL SECURITY;

-- Public read
CREATE POLICY "Public read projects" ON projects
  FOR SELECT USING (true);

CREATE POLICY "Public read project_images" ON project_images
  FOR SELECT USING (true);

-- Creators can manage their own projects
CREATE POLICY "Creators manage own projects" ON projects
  FOR ALL USING (
    creator_id IN (SELECT id FROM creators WHERE auth_id = auth.uid())
  );

CREATE POLICY "Creators manage own project images" ON project_images
  FOR ALL USING (
    project_id IN (
      SELECT p.id FROM projects p
      JOIN creators c ON c.id = p.creator_id
      WHERE c.auth_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS projects_creator_id_idx ON projects(creator_id);
CREATE INDEX IF NOT EXISTS project_images_project_id_idx ON project_images(project_id);
