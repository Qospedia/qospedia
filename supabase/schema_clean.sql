-- Qospedia Database Schema - Clean version for Supabase SQL Editor
-- Run this entire file at once

BEGIN;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create Enum Types
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('reader', 'editor', 'admin');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE article_status AS ENUM ('draft', 'published', 'archived');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create Tables
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  role user_role DEFAULT 'reader' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS articles (
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

CREATE TABLE IF NOT EXISTS article_revisions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  summary TEXT,
  content TEXT NOT NULL,
  editor_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  change_summary TEXT
);

CREATE TABLE IF NOT EXISTS article_categories (
  article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  PRIMARY KEY (article_id, category_id)
);

CREATE TABLE IF NOT EXISTS citations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  source_title TEXT NOT NULL,
  source_url TEXT,
  source_author TEXT,
  source_date TEXT,
  accessed_at TIMESTAMPTZ DEFAULT NOW(),
  order_index INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS moderation_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id UUID NOT NULL,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_articles_slug ON articles(slug);
CREATE INDEX IF NOT EXISTS idx_articles_status ON articles(status);
CREATE INDEX IF NOT EXISTS idx_articles_author ON articles(author_id);
CREATE INDEX IF NOT EXISTS idx_articles_published ON articles(published_at) WHERE status = 'published';
CREATE INDEX IF NOT EXISTS idx_articles_search ON articles USING gin(to_tsvector('english', coalesce(title, '') || ' ' || coalesce(content, '')));
CREATE INDEX IF NOT EXISTS idx_revisions_article ON article_revisions(article_id);
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);

-- RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE article_revisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE article_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE citations ENABLE ROW LEVEL SECURITY;
ALTER TABLE moderation_log ENABLE ROW LEVEL SECURITY;

-- Basic RLS Policies (simplified for service role access)
CREATE POLICY "public_profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "public_categories" ON categories FOR SELECT USING (true);
CREATE POLICY "public_articles" ON articles FOR SELECT USING (status = 'published');
CREATE POLICY "public_article_categories" ON article_categories FOR SELECT USING (true);
CREATE POLICY "public_citations" ON citations FOR SELECT USING (true);

-- Insert system profile and categories
INSERT INTO profiles (id, email, full_name, role) 
VALUES ('00000000-0000-0000-0000-000000000001', 'system@qospedia.local', 'Qospedia AI', 'editor') 
ON CONFLICT (id) DO NOTHING;

INSERT INTO categories (name, slug, description, icon) VALUES
  ('Technology', 'technology', 'Articles about technology and computing', 'laptop'),
  ('Science', 'science', 'Scientific topics and discoveries', 'flask'),
  ('History', 'history', 'Historical events and periods', 'book-open'),
  ('Arts', 'arts', 'Art, culture, and creative works', 'palette'),
  ('Philosophy', 'philosophy', 'Philosophical concepts and thinkers', 'brain'),
  ('Geography', 'geography', 'Places, regions, and geography', 'globe'),
  ('Mathematics', 'mathematics', 'Mathematical concepts and theories', 'calculator'),
  ('Medicine', 'medicine', 'Medical topics and healthcare', 'heart')
ON CONFLICT (slug) DO NOTHING;

COMMIT;