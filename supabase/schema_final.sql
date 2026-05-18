-- Qospedia Database Schema - Safe for re-running
-- Uses DROP IF EXISTS + CREATE for idempotent execution

-- Drop existing policies first
DROP POLICY IF EXISTS "public_profiles" ON profiles CASCADE;
DROP POLICY IF EXISTS "public_categories" ON categories CASCADE;
DROP POLICY IF EXISTS "public_articles" ON articles CASCADE;
DROP POLICY IF EXISTS "public_article_categories" ON article_categories CASCADE;
DROP POLICY IF EXISTS "public_citations" ON citations CASCADE;

-- Drop existing RLS
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE articles DISABLE ROW LEVEL SECURITY;
ALTER TABLE article_revisions DISABLE ROW LEVEL SECURITY;
ALTER TABLE article_categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE citations DISABLE ROW LEVEL SECURITY;
ALTER TABLE moderation_log DISABLE ROW LEVEL SECURITY;

-- Drop existing indexes
DROP INDEX IF EXISTS idx_articles_slug;
DROP INDEX IF EXISTS idx_articles_status;
DROP INDEX IF EXISTS idx_articles_author;
DROP INDEX IF EXISTS idx_articles_published;
DROP INDEX IF EXISTS idx_articles_search;
DROP INDEX IF EXISTS idx_revisions_article;
DROP INDEX IF EXISTS idx_categories_slug;

-- Drop existing tables (in reverse order due to FK constraints)
DROP TABLE IF EXISTS moderation_log CASCADE;
DROP TABLE IF EXISTS citations CASCADE;
DROP TABLE IF EXISTS article_categories CASCADE;
DROP TABLE IF EXISTS article_revisions CASCADE;
DROP TABLE IF EXISTS articles CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Drop existing types
DROP TYPE IF EXISTS moderation_log_target_type CASCADE;
DROP TYPE IF EXISTS article_status CASCADE;
DROP TYPE IF EXISTS user_role CASCADE;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create Enum Types
CREATE TYPE user_role AS ENUM ('reader', 'editor', 'admin');
CREATE TYPE article_status AS ENUM ('draft', 'published', 'archived');

-- Create Tables
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
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE articles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  source_title TEXT NOT NULL,
  source_url TEXT,
  source_author TEXT,
  source_date TEXT,
  accessed_at TIMESTAMPTZ DEFAULT NOW(),
  order_index INTEGER NOT NULL
);

CREATE TABLE moderation_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id UUID NOT NULL,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create Indexes
CREATE INDEX idx_articles_slug ON articles(slug);
CREATE INDEX idx_articles_status ON articles(status);
CREATE INDEX idx_articles_author ON articles(author_id);
CREATE INDEX idx_articles_published ON articles(published_at) WHERE status = 'published';
CREATE INDEX idx_articles_search ON articles USING gin(to_tsvector('english', coalesce(title, '') || ' ' || coalesce(content, '')));
CREATE INDEX idx_revisions_article ON article_revisions(article_id);
CREATE INDEX idx_categories_slug ON categories(slug);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE article_revisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE article_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE citations ENABLE ROW LEVEL SECURITY;
ALTER TABLE moderation_log ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies
CREATE POLICY "public_profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "public_categories" ON categories FOR SELECT USING (true);
CREATE POLICY "public_articles" ON articles FOR SELECT USING (status = 'published');
CREATE POLICY "public_article_categories" ON article_categories FOR SELECT USING (true);
CREATE POLICY "public_citations" ON citations FOR SELECT USING (true);

-- Insert system profile and categories
INSERT INTO profiles (id, email, full_name, role) 
VALUES ('00000000-0000-0000-0000-000000000001', 'system@qospedia.local', 'Qospedia AI', 'editor');

INSERT INTO categories (name, slug, description, icon) VALUES
  ('Technology', 'technology', 'Articles about technology and computing', 'laptop'),
  ('Science', 'science', 'Scientific topics and discoveries', 'flask'),
  ('History', 'history', 'Historical events and periods', 'book-open'),
  ('Arts', 'arts', 'Art, culture, and creative works', 'palette'),
  ('Philosophy', 'philosophy', 'Philosophical concepts and thinkers', 'brain'),
  ('Geography', 'geography', 'Places, regions, and geography', 'globe'),
  ('Mathematics', 'mathematics', 'Mathematical concepts and theories', 'calculator'),
  ('Medicine', 'medicine', 'Medical topics and healthcare', 'heart');