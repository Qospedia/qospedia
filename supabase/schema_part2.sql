-- STEP 2: Indexes
CREATE INDEX IF NOT EXISTS idx_articles_slug ON articles(slug);
CREATE INDEX IF NOT EXISTS idx_articles_status ON articles(status);
CREATE INDEX IF NOT EXISTS idx_articles_author ON articles(author_id);
CREATE INDEX IF NOT EXISTS idx_articles_published ON articles(published_at) WHERE status = 'published';
CREATE INDEX IF NOT EXISTS idx_revisions_article ON article_revisions(article_id);
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_articles_search ON articles USING gin(to_tsvector('english', coalesce(title, '') || ' ' || coalesce(content, '')));

-- STEP 3: RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE article_revisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE article_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE citations ENABLE ROW LEVEL SECURITY;
ALTER TABLE moderation_log ENABLE ROW LEVEL SECURITY;

-- STEP 4: Policies
CREATE POLICY "profiles_select" ON profiles FOR SELECT USING (true);
CREATE POLICY "profiles_update" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_admin_all" ON profiles FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "categories_select" ON categories FOR SELECT USING (true);
CREATE POLICY "categories_manage" ON categories FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('editor', 'admin')));

CREATE POLICY "articles_published_select" ON articles FOR SELECT USING (status = 'published');
CREATE POLICY "articles_draft_select" ON articles FOR SELECT USING (status = 'draft' AND author_id = auth.uid());
CREATE POLICY "articles_editor_select" ON articles FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('editor', 'admin')));
CREATE POLICY "articles_insert" ON articles FOR INSERT WITH CHECK (author_id = auth.uid());
CREATE POLICY "articles_author_update" ON articles FOR UPDATE USING (author_id = auth.uid());
CREATE POLICY "articles_editor_update" ON articles FOR UPDATE USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('editor', 'admin')));
CREATE POLICY "articles_admin_delete" ON articles FOR DELETE USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "article_categories_select" ON article_categories FOR SELECT USING (true);
CREATE POLICY "article_categories_manage" ON article_categories FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('editor', 'admin')));

CREATE POLICY "citations_select" ON citations FOR SELECT USING (EXISTS (SELECT 1 FROM articles WHERE id = citations.article_id AND status = 'published'));
CREATE POLICY "citations_manage" ON citations FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('editor', 'admin')));

-- STEP 5: Function & Trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email), COALESCE(NEW.raw_user_meta_data->>'role', 'reader')::user_role);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- STEP 6: System Profile & Categories
INSERT INTO profiles (id, email, full_name, role) VALUES ('00000000-0000-0000-0000-000000000001', 'system@qospedia.local', 'Qospedia AI', 'editor') ON CONFLICT (id) DO NOTHING;

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