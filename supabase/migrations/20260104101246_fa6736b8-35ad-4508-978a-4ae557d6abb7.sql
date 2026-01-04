-- Create guide_categories table
CREATE TABLE public.guide_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  icon text NOT NULL DEFAULT 'book-open',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create guide_category_translations table
CREATE TABLE public.guide_category_translations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES public.guide_categories(id) ON DELETE CASCADE,
  language text NOT NULL CHECK (language IN ('fr', 'en')),
  name text NOT NULL,
  description text,
  UNIQUE (category_id, language)
);

-- Create guide_articles table
CREATE TABLE public.guide_articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES public.guide_categories(id) ON DELETE CASCADE,
  slug text NOT NULL,
  cover_image_url text,
  reading_time_minutes integer NOT NULL DEFAULT 5,
  sort_order integer NOT NULL DEFAULT 0,
  is_published boolean NOT NULL DEFAULT false,
  published_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (category_id, slug)
);

-- Create guide_article_translations table
CREATE TABLE public.guide_article_translations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id uuid NOT NULL REFERENCES public.guide_articles(id) ON DELETE CASCADE,
  language text NOT NULL CHECK (language IN ('fr', 'en')),
  title text NOT NULL,
  excerpt text,
  content text NOT NULL,
  meta_title text,
  meta_description text,
  UNIQUE (article_id, language)
);

-- Enable RLS on all tables
ALTER TABLE public.guide_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guide_category_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guide_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guide_article_translations ENABLE ROW LEVEL SECURITY;

-- Public read policies for categories
CREATE POLICY "Anyone can view guide categories"
  ON public.guide_categories FOR SELECT
  USING (true);

CREATE POLICY "Anyone can view guide category translations"
  ON public.guide_category_translations FOR SELECT
  USING (true);

-- Public read policies for published articles only
CREATE POLICY "Anyone can view published guide articles"
  ON public.guide_articles FOR SELECT
  USING (is_published = true);

CREATE POLICY "Anyone can view translations of published articles"
  ON public.guide_article_translations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.guide_articles
      WHERE id = article_id AND is_published = true
    )
  );

-- Create updated_at trigger for articles
CREATE TRIGGER update_guide_articles_updated_at
  BEFORE UPDATE ON public.guide_articles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Seed categories
INSERT INTO public.guide_categories (slug, icon, sort_order) VALUES
  ('friends', 'Users', 1),
  ('family', 'Heart', 2),
  ('birthdays', 'Gift', 3),
  ('tips', 'Lightbulb', 4);

-- Seed category translations (French)
INSERT INTO public.guide_category_translations (category_id, language, name, description)
SELECT id, 'fr', 
  CASE slug 
    WHEN 'friends' THEN 'Entre amis'
    WHEN 'family' THEN 'En famille'
    WHEN 'birthdays' THEN 'Anniversaires'
    WHEN 'tips' THEN 'Astuces'
  END,
  CASE slug 
    WHEN 'friends' THEN 'Conseils pour organiser des sorties mémorables entre amis'
    WHEN 'family' THEN 'Idées et astuces pour des moments en famille réussis'
    WHEN 'birthdays' THEN 'Guides pour des fêtes d''anniversaire inoubliables'
    WHEN 'tips' THEN 'Trucs et astuces pour une organisation parfaite'
  END
FROM public.guide_categories;

-- Seed category translations (English)
INSERT INTO public.guide_category_translations (category_id, language, name, description)
SELECT id, 'en',
  CASE slug 
    WHEN 'friends' THEN 'With Friends'
    WHEN 'family' THEN 'With Family'
    WHEN 'birthdays' THEN 'Birthdays'
    WHEN 'tips' THEN 'Tips & Tricks'
  END,
  CASE slug 
    WHEN 'friends' THEN 'Tips for organizing memorable outings with friends'
    WHEN 'family' THEN 'Ideas and tips for successful family moments'
    WHEN 'birthdays' THEN 'Guides for unforgettable birthday parties'
    WHEN 'tips' THEN 'Tips and tricks for perfect event planning'
  END
FROM public.guide_categories;