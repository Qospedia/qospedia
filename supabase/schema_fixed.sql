-- Qospedia Database Schema - Fixed RLS
BEGIN;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create Enum Types
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('reader', 'editor', 'admin');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE article_status AS ENUM ('draft', 'published', 'archived');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Create Tables (without FK constraints initially)
DROP TABLE IF EXISTS article_categories CASCADE;
DROP TABLE IF EXISTS article_revisions CASCADE;
DROP TABLE IF EXISTS articles CASCADE;
DROP TABLE IF EXISTS citations CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS moderation_log CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

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
  article_id UUID NOT NULL,
  title TEXT NOT NULL,
  summary TEXT,
  content TEXT NOT NULL,
  editor_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  change_summary TEXT
);

CREATE TABLE article_categories (
  article_id UUID NOT NULL,
  category_id UUID NOT NULL,
  PRIMARY KEY (article_id, category_id)
);

CREATE TABLE citations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  article_id UUID NOT NULL,
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

-- Indexes
CREATE INDEX idx_articles_slug ON articles(slug);
CREATE INDEX idx_articles_status ON articles(status);
CREATE INDEX idx_articles_author ON articles(author_id);
CREATE INDEX idx_articles_published ON articles(published_at) WHERE status = 'published';
CREATE INDEX idx_articles_search ON articles USING gin(to_tsvector('english', coalesce(title, '') || ' ' || coalesce(content, '')));
CREATE INDEX idx_revisions_article ON article_revisions(article_id);
CREATE INDEX idx_categories_slug ON categories(slug);

-- RLS (enabled but simple policies for service role)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE article_revisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE article_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE citations ENABLE ROW LEVEL SECURITY;
ALTER TABLE moderation_log ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "public_profiles" ON profiles;
DROP POLICY IF EXISTS "Profiles are public" ON profiles;
DROP POLICY IF EXISTS "Categories are public" ON categories;
DROP POLICY IF EXISTS "public_categories" ON categories;
DROP POLICY IF EXISTS "Published articles are viewable by everyone" ON articles;
DROP POLICY IF EXISTS "public_articles" ON articles;
DROP POLICY IF EXISTS "public_article_categories" ON article_categories;
DROP POLICY IF EXISTS "public_citations" ON citations;

-- Simple permissive policies (service role bypasses RLS anyway)
CREATE POLICY "profiles_read" ON profiles FOR SELECT USING (true);
CREATE POLICY "profiles_all" ON profiles FOR ALL USING (true);
CREATE POLICY "categories_read" ON categories FOR SELECT USING (true);
CREATE POLICY "categories_all" ON categories FOR ALL USING (true);
CREATE POLICY "articles_read" ON articles FOR SELECT USING (true);
CREATE POLICY "articles_all" ON articles FOR ALL USING (true);
CREATE POLICY "revisions_read" ON article_revisions FOR SELECT USING (true);
CREATE POLICY "revisions_all" ON article_revisions FOR ALL USING (true);
CREATE POLICY "article_categories_read" ON article_categories FOR SELECT USING (true);
CREATE POLICY "article_categories_all" ON article_categories FOR ALL USING (true);
CREATE POLICY "citations_read" ON citations FOR SELECT USING (true);
CREATE POLICY "citations_all" ON citations FOR ALL USING (true);
CREATE POLICY "moderation_read" ON moderation_log FOR SELECT USING (true);
CREATE POLICY "moderation_all" ON moderation_log FOR ALL USING (true);

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

COMMIT;