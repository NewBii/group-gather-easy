import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/i18n/LanguageContext';

export interface GuideCategory {
  id: string;
  slug: string;
  icon: string;
  sort_order: number;
  name: string;
  description: string | null;
}

export interface GuideArticle {
  id: string;
  slug: string;
  category_id: string;
  cover_image_url: string | null;
  reading_time_minutes: number;
  sort_order: number;
  is_published: boolean;
  published_at: string | null;
  title: string;
  excerpt: string | null;
  content: string;
  meta_title: string | null;
  meta_description: string | null;
}

export function useCategories() {
  const { language } = useLanguage();

  return useQuery({
    queryKey: ['guide-categories', language],
    queryFn: async (): Promise<GuideCategory[]> => {
      const { data: categories, error: catError } = await supabase
        .from('guide_categories')
        .select('*')
        .order('sort_order');

      if (catError) throw catError;

      const { data: translations, error: transError } = await supabase
        .from('guide_category_translations')
        .select('*')
        .eq('language', language);

      if (transError) throw transError;

      const translationMap = new Map(
        translations?.map((t: any) => [t.category_id, t]) || []
      );

      return (categories || []).map((cat: any) => {
        const trans = translationMap.get(cat.id);
        return {
          id: cat.id,
          slug: cat.slug,
          icon: cat.icon,
          sort_order: cat.sort_order,
          name: trans?.name || cat.slug,
          description: trans?.description || null,
        };
      });
    },
  });
}

export function useCategoryBySlug(slug: string | undefined) {
  const { language } = useLanguage();

  return useQuery({
    queryKey: ['guide-category', slug, language],
    queryFn: async (): Promise<GuideCategory | null> => {
      if (!slug) return null;

      const { data: category, error: catError } = await supabase
        .from('guide_categories')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();

      if (catError) throw catError;
      if (!category) return null;

      const { data: translation, error: transError } = await supabase
        .from('guide_category_translations')
        .select('*')
        .eq('category_id', category.id)
        .eq('language', language)
        .maybeSingle();

      if (transError) throw transError;

      return {
        id: category.id,
        slug: category.slug,
        icon: category.icon,
        sort_order: category.sort_order,
        name: translation?.name || category.slug,
        description: translation?.description || null,
      };
    },
    enabled: !!slug,
  });
}

export function useCategoryArticles(categorySlug: string | undefined) {
  const { language } = useLanguage();

  return useQuery({
    queryKey: ['guide-articles', categorySlug, language],
    queryFn: async (): Promise<GuideArticle[]> => {
      if (!categorySlug) return [];

      // Get category ID
      const { data: category, error: catError } = await supabase
        .from('guide_categories')
        .select('id')
        .eq('slug', categorySlug)
        .maybeSingle();

      if (catError) throw catError;
      if (!category) return [];

      // Get published articles
      const { data: articles, error: artError } = await supabase
        .from('guide_articles')
        .select('*')
        .eq('category_id', category.id)
        .eq('is_published', true)
        .order('sort_order');

      if (artError) throw artError;

      // Get translations
      const articleIds = (articles || []).map((a: any) => a.id);
      const { data: translations, error: transError } = await supabase
        .from('guide_article_translations')
        .select('*')
        .in('article_id', articleIds)
        .eq('language', language);

      if (transError) throw transError;

      const translationMap = new Map(
        translations?.map((t: any) => [t.article_id, t]) || []
      );

      return (articles || []).map((art: any) => {
        const trans = translationMap.get(art.id);
        return {
          id: art.id,
          slug: art.slug,
          category_id: art.category_id,
          cover_image_url: art.cover_image_url,
          reading_time_minutes: art.reading_time_minutes,
          sort_order: art.sort_order,
          is_published: art.is_published,
          published_at: art.published_at,
          title: trans?.title || art.slug,
          excerpt: trans?.excerpt || null,
          content: trans?.content || '',
          meta_title: trans?.meta_title || null,
          meta_description: trans?.meta_description || null,
        };
      });
    },
    enabled: !!categorySlug,
  });
}

export function useArticle(categorySlug: string | undefined, articleSlug: string | undefined) {
  const { language } = useLanguage();

  return useQuery({
    queryKey: ['guide-article', categorySlug, articleSlug, language],
    queryFn: async (): Promise<GuideArticle | null> => {
      if (!categorySlug || !articleSlug) return null;

      // Get category ID
      const { data: category, error: catError } = await supabase
        .from('guide_categories')
        .select('id')
        .eq('slug', categorySlug)
        .maybeSingle();

      if (catError) throw catError;
      if (!category) return null;

      // Get article
      const { data: article, error: artError } = await supabase
        .from('guide_articles')
        .select('*')
        .eq('category_id', category.id)
        .eq('slug', articleSlug)
        .eq('is_published', true)
        .maybeSingle();

      if (artError) throw artError;
      if (!article) return null;

      // Get translation
      const { data: translation, error: transError } = await supabase
        .from('guide_article_translations')
        .select('*')
        .eq('article_id', article.id)
        .eq('language', language)
        .maybeSingle();

      if (transError) throw transError;

      return {
        id: article.id,
        slug: article.slug,
        category_id: article.category_id,
        cover_image_url: article.cover_image_url,
        reading_time_minutes: article.reading_time_minutes,
        sort_order: article.sort_order,
        is_published: article.is_published,
        published_at: article.published_at,
        title: translation?.title || article.slug,
        excerpt: translation?.excerpt || null,
        content: translation?.content || '',
        meta_title: translation?.meta_title || null,
        meta_description: translation?.meta_description || null,
      };
    },
    enabled: !!categorySlug && !!articleSlug,
  });
}
