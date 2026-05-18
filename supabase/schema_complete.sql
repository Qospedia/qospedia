-- Qospedia Database Schema - Full FK constraints
BEGIN;

DROP TABLE IF EXISTS article_categories CASCADE;
DROP TABLE IF EXISTS article_revisions CASCADE;
DROP TABLE IF EXISTS articles CASCADE;
DROP TABLE IF EXISTS citations CASCADE;
DROP TABLE IF EXISTS moderation_log CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS article_status CASCADE;

CREATE TYPE user_role AS ENUM ('reader', 'editor', 'admin');
CREATE TYPE article_status AS ENUM ('draft', 'published', 'archived');

CREATE TABLE profiles (
  id UUID PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  role user_role DEFAULT 'reader' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  summary TEXT,
  content TEXT NOT NULL DEFAULT '',
  featured_image TEXT,
  status article_status DEFAULT 'draft' NOT NULL,
  author_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  published_at TIMESTAMPTZ,
  view_count INTEGER DEFAULT 0
);

CREATE TABLE article_revisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  summary TEXT,
  content TEXT NOT NULL,
  editor_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  change_summary TEXT
);

CREATE TABLE article_categories (
  article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  PRIMARY KEY (article_id, category_id)
);

CREATE TABLE citations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  source_title TEXT NOT NULL,
  source_url TEXT,
  source_author TEXT,
  source_date TEXT,
  accessed_at TIMESTAMPTZ DEFAULT NOW(),
  order_index INTEGER NOT NULL
);

CREATE TABLE moderation_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id UUID NOT NULL,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_articles_slug ON articles(slug);
CREATE INDEX idx_articles_status ON articles(status);
CREATE INDEX idx_articles_author ON articles(author_id);
CREATE INDEX idx_articles_published ON articles(published_at) WHERE status = 'published';
CREATE INDEX idx_articles_search ON articles USING gin(to_tsvector('english', coalesce(title, '') || ' ' || coalesce(content, '')));

-- RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE article_revisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE article_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE citations ENABLE ROW LEVEL SECURITY;
ALTER TABLE moderation_log ENABLE ROW LEVEL SECURITY;

-- Permissive policies
DROP POLICY IF EXISTS "all_profiles" ON profiles;
DROP POLICY IF EXISTS "all_categories" ON categories;
DROP POLICY IF EXISTS "all_articles" ON articles;
DROP POLICY IF EXISTS "all_revisions" ON article_revisions;
DROP POLICY IF EXISTS "all_article_categories" ON article_categories;
DROP POLICY IF EXISTS "all_citations" ON citations;
DROP POLICY IF EXISTS "all_moderation" ON moderation_log;

CREATE POLICY "all_profiles" ON profiles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "all_categories" ON categories FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "all_articles" ON articles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "all_revisions" ON article_revisions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "all_article_categories" ON article_categories FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "all_citations" ON citations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "all_moderation" ON moderation_log FOR ALL USING (true) WITH CHECK (true);

-- Data
INSERT INTO profiles (id, email, full_name, role) VALUES 
  ('00000000-0000-0000-0000-000000000001', 'system@qospedia.local', 'Qospedia AI', 'editor');

INSERT INTO categories (name, slug, description, icon) VALUES
  ('Technology', 'technology', 'Articles about technology', 'laptop'),
  ('Science', 'science', 'Scientific topics', 'flask'),
  ('History', 'history', 'Historical events', 'book-open'),
  ('Arts', 'arts', 'Art and culture', 'palette'),
  ('Philosophy', 'philosophy', 'Philosophical concepts', 'brain'),
  ('Geography', 'geography', 'Places and regions', 'globe'),
  ('Mathematics', 'mathematics', 'Mathematical concepts', 'calculator'),
  ('Medicine', 'medicine', 'Medical topics', 'heart');

COMMIT;