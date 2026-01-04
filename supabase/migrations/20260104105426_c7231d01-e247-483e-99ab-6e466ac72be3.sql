-- Create app_role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles (avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS policies for user_roles table
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Only admins can manage roles"
ON public.user_roles
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Update guide_categories RLS for admin write access
CREATE POLICY "Admins can insert categories"
ON public.guide_categories
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update categories"
ON public.guide_categories
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete categories"
ON public.guide_categories
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- Update guide_category_translations RLS for admin write access
CREATE POLICY "Admins can insert category translations"
ON public.guide_category_translations
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update category translations"
ON public.guide_category_translations
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete category translations"
ON public.guide_category_translations
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- Update guide_articles RLS for admin write access (including viewing unpublished)
DROP POLICY IF EXISTS "Anyone can view published guide articles" ON public.guide_articles;

CREATE POLICY "Anyone can view published articles"
ON public.guide_articles
FOR SELECT
USING (is_published = true OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert articles"
ON public.guide_articles
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update articles"
ON public.guide_articles
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete articles"
ON public.guide_articles
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- Update guide_article_translations RLS for admin write access
DROP POLICY IF EXISTS "Anyone can view translations of published articles" ON public.guide_article_translations;

CREATE POLICY "Anyone can view published article translations"
ON public.guide_article_translations
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM guide_articles
    WHERE guide_articles.id = guide_article_translations.article_id
    AND (guide_articles.is_published = true OR public.has_role(auth.uid(), 'admin'))
  )
);

CREATE POLICY "Admins can insert article translations"
ON public.guide_article_translations
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update article translations"
ON public.guide_article_translations
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete article translations"
ON public.guide_article_translations
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));