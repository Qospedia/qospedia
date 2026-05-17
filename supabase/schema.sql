-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create Enum Types
CREATE TYPE user_role AS ENUM ('reader', 'editor', 'admin');
CREATE TYPE article_status AS ENUM ('draft', 'published', 'archived');

-- Profiles Table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  role user_role DEFAULT 'reader' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Categories Table
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Articles Table
CREATE TABLE IF NOT EXISTS articles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  summary TEXT,
  content TEXT NOT NULL DEFAULT '',
  featured_image TEXT,
  status article_status DEFAULT 'draft' NOT NULL,
  author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  published_at TIMESTAMPTZ,
  view_count INTEGER DEFAULT 0
);

-- Article Revisions Table
CREATE TABLE IF NOT EXISTS article_revisions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  summary TEXT,
  content TEXT NOT NULL,
  editor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  change_summary TEXT
);

-- Article Categories Junction Table
CREATE TABLE IF NOT EXISTS article_categories (
  article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  PRIMARY KEY (article_id, category_id)
);

-- Citations Table
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

-- Moderation Log Table
CREATE TABLE IF NOT EXISTS moderation_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id UUID NOT NULL,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for Performance
CREATE INDEX idx_articles_slug ON articles(slug);
CREATE INDEX idx_articles_status ON articles(status);
CREATE INDEX idx_articles_author ON articles(author_id);
CREATE INDEX idx_articles_published ON articles(published_at) WHERE status = 'published';
CREATE INDEX idx_revisions_article ON article_revisions(article_id);
CREATE INDEX idx_categories_slug ON categories(slug);
CREATE INDEX idx_profiles_role ON profiles(role);

-- Full Text Search Index for Articles
CREATE INDEX idx_articles_search ON articles USING gin(
  to_tsvector('english', coalesce(title, '') || ' ' || coalesce(content, ''))
);

-- RLS Policies

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE article_revisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE article_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE citations ENABLE ROW LEVEL SECURITY;
ALTER TABLE moderation_log ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Public profiles are viewable by everyone" ON profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can manage all profiles" ON profiles
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Categories Policies
CREATE POLICY "Categories are public" ON categories
  FOR SELECT USING (true);

CREATE POLICY "Editors can manage categories" ON categories
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('editor', 'admin'))
  );

-- Articles Policies
CREATE POLICY "Published articles are viewable by everyone" ON articles
  FOR SELECT USING (status = 'published');

CREATE POLICY "Own drafts are viewable by author" ON articles
  FOR SELECT USING (
    status = 'draft' AND author_id = auth.uid()
  );

CREATE POLICY "Editors can view all articles" ON articles
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('editor', 'admin'))
  );

CREATE POLICY "Users can insert own articles" ON articles
  FOR INSERT WITH CHECK (author_id = auth.uid());

CREATE POLICY "Own articles can be updated by author" ON articles
  FOR UPDATE USING (author_id = auth.uid());

CREATE POLICY "Editors can update any article" ON articles
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('editor', 'admin'))
  );

CREATE POLICY "Admins can delete articles" ON articles
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Article Revisions Policies
CREATE POLICY "Revisions for published articles are public" ON article_revisions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM articles WHERE id = article_revisions.article_id AND status = 'published')
  );

CREATE POLICY "Authors can view own article revisions" ON article_revisions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM articles WHERE id = article_revisions.article_id AND author_id = auth.uid())
  );

CREATE POLICY "Editors can view all revisions" ON article_revisions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('editor', 'admin'))
  );

CREATE POLICY "Editors can create revisions" ON article_revisions
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('editor', 'admin'))
  );

-- Article Categories Policies
CREATE POLICY "Article categories are public" ON article_categories
  FOR SELECT USING (true);

CREATE POLICY "Editors can manage article categories" ON article_categories
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('editor', 'admin'))
  );

-- Citations Policies
CREATE POLICY "Citations for published articles are public" ON citations
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM articles WHERE id = citations.article_id AND status = 'published')
  );

CREATE POLICY "Editors can manage citations" ON citations
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('editor', 'admin'))
  );

-- Moderation Log Policies
CREATE POLICY "Admins can view moderation log" ON moderation_log
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can insert moderation logs" ON moderation_log
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    COALESCE(NEW.raw_user_meta_data->>'role', 'reader')::user_role
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Default Categories Data
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