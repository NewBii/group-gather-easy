import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffect, useState } from 'react';

export function useIsAdmin() {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUserId(session?.user?.id ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  return useQuery({
    queryKey: ['is-admin', userId],
    queryFn: async (): Promise<boolean> => {
      if (!userId) return false;

      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .eq('role', 'admin')
        .maybeSingle();

      if (error) return false;
      return !!data;
    },
    enabled: !!userId,
  });
}

export function useAdminCategories() {
  return useQuery({
    queryKey: ['admin-categories'],
    queryFn: async () => {
      const { data: categories, error: catError } = await supabase
        .from('guide_categories')
        .select('*')
        .order('sort_order');

      if (catError) throw catError;

      const { data: translations, error: transError } = await supabase
        .from('guide_category_translations')
        .select('*');

      if (transError) throw transError;

      return (categories || []).map((cat) => ({
        ...cat,
        translations: translations?.filter((t) => t.category_id === cat.id) || [],
      }));
    },
  });
}

export function useAdminArticles() {
  return useQuery({
    queryKey: ['admin-articles'],
    queryFn: async () => {
      const { data: articles, error: artError } = await supabase
        .from('guide_articles')
        .select('*')
        .order('created_at', { ascending: false });

      if (artError) throw artError;

      const articleIds = (articles || []).map((a) => a.id);
      
      const { data: translations, error: transError } = await supabase
        .from('guide_article_translations')
        .select('*')
        .in('article_id', articleIds.length > 0 ? articleIds : ['']);

      if (transError) throw transError;

      const { data: categories, error: catError } = await supabase
        .from('guide_categories')
        .select('id, slug');

      if (catError) throw catError;

      const categoryMap = new Map(categories?.map((c) => [c.id, c.slug]) || []);

      return (articles || []).map((art) => ({
        ...art,
        category_slug: categoryMap.get(art.category_id) || '',
        translations: translations?.filter((t) => t.article_id === art.id) || [],
      }));
    },
  });
}

export function useCreateArticle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      category_id: string;
      slug: string;
      cover_image_url?: string;
      reading_time_minutes: number;
      sort_order: number;
      is_published: boolean;
      translations: {
        language: string;
        title: string;
        excerpt: string;
        content: string;
        meta_title?: string;
        meta_description?: string;
      }[];
    }) => {
      const { translations, ...articleData } = data;

      const { data: article, error: artError } = await supabase
        .from('guide_articles')
        .insert({
          ...articleData,
          published_at: articleData.is_published ? new Date().toISOString() : null,
        })
        .select()
        .single();

      if (artError) throw artError;

      const translationsWithArticleId = translations.map((t) => ({
        ...t,
        article_id: article.id,
      }));

      const { error: transError } = await supabase
        .from('guide_article_translations')
        .insert(translationsWithArticleId);

      if (transError) throw transError;

      return article;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-articles'] });
      queryClient.invalidateQueries({ queryKey: ['guide-articles'] });
    },
  });
}

export function useUpdateArticle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      id: string;
      category_id: string;
      slug: string;
      cover_image_url?: string;
      reading_time_minutes: number;
      sort_order: number;
      is_published: boolean;
      translations: {
        id?: string;
        language: string;
        title: string;
        excerpt: string;
        content: string;
        meta_title?: string;
        meta_description?: string;
      }[];
    }) => {
      const { id, translations, ...articleData } = data;

      const { error: artError } = await supabase
        .from('guide_articles')
        .update({
          ...articleData,
          published_at: articleData.is_published ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (artError) throw artError;

      // Upsert translations
      for (const trans of translations) {
        if (trans.id) {
          const { error } = await supabase
            .from('guide_article_translations')
            .update({
              title: trans.title,
              excerpt: trans.excerpt,
              content: trans.content,
              meta_title: trans.meta_title,
              meta_description: trans.meta_description,
            })
            .eq('id', trans.id);
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from('guide_article_translations')
            .insert({
              article_id: id,
              language: trans.language,
              title: trans.title,
              excerpt: trans.excerpt,
              content: trans.content,
              meta_title: trans.meta_title,
              meta_description: trans.meta_description,
            });
          if (error) throw error;
        }
      }

      return { id };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-articles'] });
      queryClient.invalidateQueries({ queryKey: ['guide-articles'] });
      queryClient.invalidateQueries({ queryKey: ['guide-article'] });
    },
  });
}

export function useDeleteArticle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('guide_articles')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-articles'] });
      queryClient.invalidateQueries({ queryKey: ['guide-articles'] });
    },
  });
}

export function useTogglePublish() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, is_published }: { id: string; is_published: boolean }) => {
      const { error } = await supabase
        .from('guide_articles')
        .update({
          is_published,
          published_at: is_published ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-articles'] });
      queryClient.invalidateQueries({ queryKey: ['guide-articles'] });
    },
  });
}
