export type UserRole = 'reader' | 'editor' | 'admin';

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  created_at: string;
}

export interface Article {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  content: string;
  featured_image: string | null;
  status: 'draft' | 'published' | 'archived';
  author_id: string;
  author?: Profile;
  created_at: string;
  updated_at: string;
  published_at: string | null;
  view_count: number;
  categories?: Category[];
}

export interface ArticleRevision {
  id: string;
  article_id: string;
  title: string;
  summary: string | null;
  content: string;
  editor_id: string;
  editor?: Profile;
  created_at: string;
  change_summary: string | null;
}

export interface Citation {
  id: string;
  article_id: string;
  source_title: string;
  source_url: string | null;
  source_author: string | null;
  source_date: string | null;
  accessed_at: string;
  order_index: number;
}

export interface ArticleCategory {
  article_id: string;
  category_id: string;
}

export interface SearchResult {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  status: string;
  match_type: 'title' | 'content' | 'category';
  highlight?: string;
}

export interface AIGenerationRequest {
  topic: string;
  type: 'draft' | 'summary' | 'improve' | 'related';
  context?: string;
}

export interface AIGenerationResponse {
  content: string;
  suggestions?: string[];
}