import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Eye } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useIsAdmin, useAdminCategories, useAdminArticles, useCreateArticle, useUpdateArticle } from '@/hooks/useAdmin';
import { useLanguage } from '@/i18n/LanguageContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import Markdown from 'react-markdown';

interface TranslationData {
  id?: string;
  language: string;
  title: string;
  excerpt: string;
  content: string;
  meta_title?: string;
  meta_description?: string;
}

const AdminArticleEditor = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isNew = id === 'new';
  const { t } = useLanguage();
  const { data: isAdmin, isLoading: isCheckingAdmin } = useIsAdmin();
  const { data: categories } = useAdminCategories();
  const { data: articles } = useAdminArticles();
  const createArticle = useCreateArticle();
  const updateArticle = useUpdateArticle();

  const [user, setUser] = useState<any>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [activeTab, setActiveTab] = useState('fr');
  
  // Article fields
  const [categoryId, setCategoryId] = useState('');
  const [slug, setSlug] = useState('');
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [readingTime, setReadingTime] = useState(5);
  const [sortOrder, setSortOrder] = useState(0);
  const [isPublished, setIsPublished] = useState(false);
  
  // Translations
  const [translations, setTranslations] = useState<TranslationData[]>([
    { language: 'fr', title: '', excerpt: '', content: '' },
    { language: 'en', title: '', excerpt: '', content: '' },
  ]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Load existing article data
  useEffect(() => {
    if (!isNew && articles && id) {
      const article = articles.find((a) => a.id === id);
      if (article) {
        setCategoryId(article.category_id);
        setSlug(article.slug);
        setCoverImageUrl(article.cover_image_url || '');
        setReadingTime(article.reading_time_minutes);
        setSortOrder(article.sort_order);
        setIsPublished(article.is_published);
        
        setTranslations([
          {
            id: article.translations?.find((t: any) => t.language === 'fr')?.id,
            language: 'fr',
            title: article.translations?.find((t: any) => t.language === 'fr')?.title || '',
            excerpt: article.translations?.find((t: any) => t.language === 'fr')?.excerpt || '',
            content: article.translations?.find((t: any) => t.language === 'fr')?.content || '',
            meta_title: article.translations?.find((t: any) => t.language === 'fr')?.meta_title || '',
            meta_description: article.translations?.find((t: any) => t.language === 'fr')?.meta_description || '',
          },
          {
            id: article.translations?.find((t: any) => t.language === 'en')?.id,
            language: 'en',
            title: article.translations?.find((t: any) => t.language === 'en')?.title || '',
            excerpt: article.translations?.find((t: any) => t.language === 'en')?.excerpt || '',
            content: article.translations?.find((t: any) => t.language === 'en')?.content || '',
            meta_title: article.translations?.find((t: any) => t.language === 'en')?.meta_title || '',
            meta_description: article.translations?.find((t: any) => t.language === 'en')?.meta_description || '',
          },
        ]);
      }
    }
  }, [isNew, articles, id]);

  const updateTranslation = (language: string, field: keyof TranslationData, value: string) => {
    setTranslations((prev) =>
      prev.map((t) => (t.language === language ? { ...t, [field]: value } : t))
    );
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  };

  const handleSave = async () => {
    if (!categoryId || !slug) {
      toast.error(t.admin?.fillRequired || 'Please fill in required fields');
      return;
    }

    const frTrans = translations.find((t) => t.language === 'fr');
    if (!frTrans?.title || !frTrans?.content) {
      toast.error(t.admin?.frenchRequired || 'French title and content are required');
      return;
    }

    try {
      if (isNew) {
        await createArticle.mutateAsync({
          category_id: categoryId,
          slug,
          cover_image_url: coverImageUrl || undefined,
          reading_time_minutes: readingTime,
          sort_order: sortOrder,
          is_published: isPublished,
          translations: translations.filter((t) => t.title && t.content),
        });
        toast.success(t.admin?.articleCreated || 'Article created');
      } else {
        await updateArticle.mutateAsync({
          id: id!,
          category_id: categoryId,
          slug,
          cover_image_url: coverImageUrl || undefined,
          reading_time_minutes: readingTime,
          sort_order: sortOrder,
          is_published: isPublished,
          translations,
        });
        toast.success(t.admin?.articleUpdated || 'Article updated');
      }
      navigate('/admin/guides');
    } catch (error) {
      toast.error(t.common?.error || 'Error saving article');
    }
  };

  if (isCheckingAdmin) {
    return (
      <div className="container py-16">
        <div className="max-w-4xl mx-auto space-y-4">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return (
      <div className="container py-16">
        <div className="max-w-md mx-auto text-center">
          <h1 className="text-2xl font-bold mb-4">{t.admin?.accessDenied || 'Access Denied'}</h1>
          <Button variant="outline" onClick={() => navigate('/')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t.common?.backHome || 'Back to Home'}
          </Button>
        </div>
      </div>
    );
  }

  const currentTranslation = translations.find((t) => t.language === activeTab);

  return (
    <div className="container py-8 md:py-16">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <Button variant="ghost" size="sm" onClick={() => navigate('/admin/guides')} className="mb-2">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t.admin?.backToList || 'Back to list'}
            </Button>
            <h1 className="text-2xl md:text-3xl font-bold">
              {isNew ? (t.admin?.newArticle || 'New Article') : (t.admin?.editArticle || 'Edit Article')}
            </h1>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowPreview(!showPreview)}>
              <Eye className="h-4 w-4 mr-2" />
              {showPreview ? (t.admin?.hidePreview || 'Hide Preview') : (t.admin?.showPreview || 'Preview')}
            </Button>
            <Button onClick={handleSave} disabled={createArticle.isPending || updateArticle.isPending}>
              <Save className="h-4 w-4 mr-2" />
              {t.common?.save || 'Save'}
            </Button>
          </div>
        </div>

        <div className="grid gap-6">
          {/* Article Settings */}
          <Card>
            <CardHeader>
              <CardTitle>{t.admin?.settings || 'Settings'}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t.admin?.category || 'Category'} *</Label>
                  <Select value={categoryId} onValueChange={setCategoryId}>
                    <SelectTrigger>
                      <SelectValue placeholder={t.admin?.selectCategory || 'Select category'} />
                    </SelectTrigger>
                    <SelectContent>
                      {categories?.map((cat) => {
                        const trans = cat.translations?.find((t: any) => t.language === 'fr');
                        return (
                          <SelectItem key={cat.id} value={cat.id}>
                            {trans?.name || cat.slug}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>{t.admin?.slug || 'Slug'} *</Label>
                  <Input
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="my-article-slug"
                  />
                </div>

                <div className="space-y-2">
                  <Label>{t.admin?.coverImage || 'Cover Image URL'}</Label>
                  <Input
                    value={coverImageUrl}
                    onChange={(e) => setCoverImageUrl(e.target.value)}
                    placeholder="https://..."
                  />
                </div>

                <div className="space-y-2">
                  <Label>{t.admin?.readingTime || 'Reading Time (min)'}</Label>
                  <Input
                    type="number"
                    min={1}
                    max={60}
                    value={readingTime}
                    onChange={(e) => setReadingTime(parseInt(e.target.value) || 5)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>{t.admin?.sortOrder || 'Sort Order'}</Label>
                  <Input
                    type="number"
                    value={sortOrder}
                    onChange={(e) => setSortOrder(parseInt(e.target.value) || 0)}
                  />
                </div>

                <div className="flex items-center gap-2 pt-6">
                  <Switch checked={isPublished} onCheckedChange={setIsPublished} />
                  <Label>{t.admin?.published || 'Published'}</Label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Content */}
          <Card>
            <CardHeader>
              <CardTitle>{t.admin?.content || 'Content'}</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="mb-4">
                  <TabsTrigger value="fr">Français</TabsTrigger>
                  <TabsTrigger value="en">English</TabsTrigger>
                </TabsList>

                {['fr', 'en'].map((lang) => (
                  <TabsContent key={lang} value={lang} className="space-y-4">
                    <div className="space-y-2">
                      <Label>{t.admin?.title || 'Title'} {lang === 'fr' && '*'}</Label>
                      <Input
                        value={translations.find((t) => t.language === lang)?.title || ''}
                        onChange={(e) => {
                          updateTranslation(lang, 'title', e.target.value);
                          if (lang === 'fr' && isNew && !slug) {
                            setSlug(generateSlug(e.target.value));
                          }
                        }}
                        placeholder={lang === 'fr' ? 'Titre de l\'article' : 'Article title'}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>{t.admin?.excerpt || 'Excerpt'}</Label>
                      <Textarea
                        value={translations.find((t) => t.language === lang)?.excerpt || ''}
                        onChange={(e) => updateTranslation(lang, 'excerpt', e.target.value)}
                        placeholder={lang === 'fr' ? 'Court résumé...' : 'Short summary...'}
                        rows={2}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>{t.admin?.contentMarkdown || 'Content (Markdown)'} {lang === 'fr' && '*'}</Label>
                      {showPreview ? (
                        <div className="border rounded-lg p-4 min-h-[300px] prose prose-sm max-w-none dark:prose-invert">
                          <Markdown>
                            {translations.find((t) => t.language === lang)?.content || ''}
                          </Markdown>
                        </div>
                      ) : (
                        <Textarea
                          value={translations.find((t) => t.language === lang)?.content || ''}
                          onChange={(e) => updateTranslation(lang, 'content', e.target.value)}
                          placeholder={lang === 'fr' ? '# Mon article\n\nContenu en Markdown...' : '# My article\n\nMarkdown content...'}
                          rows={15}
                          className="font-mono text-sm"
                        />
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                      <div className="space-y-2">
                        <Label>{t.admin?.metaTitle || 'Meta Title (SEO)'}</Label>
                        <Input
                          value={translations.find((t) => t.language === lang)?.meta_title || ''}
                          onChange={(e) => updateTranslation(lang, 'meta_title', e.target.value)}
                          placeholder={lang === 'fr' ? 'Titre SEO' : 'SEO Title'}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>{t.admin?.metaDescription || 'Meta Description (SEO)'}</Label>
                        <Input
                          value={translations.find((t) => t.language === lang)?.meta_description || ''}
                          onChange={(e) => updateTranslation(lang, 'meta_description', e.target.value)}
                          placeholder={lang === 'fr' ? 'Description SEO' : 'SEO Description'}
                        />
                      </div>
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminArticleEditor;
