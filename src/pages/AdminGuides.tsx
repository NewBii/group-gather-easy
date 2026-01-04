import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useIsAdmin, useAdminArticles, useAdminCategories, useDeleteArticle, useTogglePublish } from '@/hooks/useAdmin';
import { useLanguage } from '@/i18n/LanguageContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

const AdminGuides = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { data: isAdmin, isLoading: isCheckingAdmin } = useIsAdmin();
  const { data: articles, isLoading: isLoadingArticles } = useAdminArticles();
  const { data: categories } = useAdminCategories();
  const deleteArticle = useDeleteArticle();
  const togglePublish = useTogglePublish();
  
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (isCheckingAdmin) {
    return (
      <div className="container py-16">
        <div className="max-w-4xl mx-auto space-y-4">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container py-16">
        <div className="max-w-md mx-auto text-center">
          <h1 className="text-2xl font-bold mb-4">{t.admin?.loginRequired || 'Login Required'}</h1>
          <p className="text-muted-foreground mb-6">
            {t.admin?.loginToAccess || 'Please login to access the admin area.'}
          </p>
          <Button onClick={() => navigate('/auth')}>
            {t.auth?.login || 'Login'}
          </Button>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="container py-16">
        <div className="max-w-md mx-auto text-center">
          <h1 className="text-2xl font-bold mb-4">{t.admin?.accessDenied || 'Access Denied'}</h1>
          <p className="text-muted-foreground mb-6">
            {t.admin?.noPermission || 'You do not have permission to access this page.'}
          </p>
          <Button variant="outline" onClick={() => navigate('/')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t.common?.backHome || 'Back to Home'}
          </Button>
        </div>
      </div>
    );
  }

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteArticle.mutateAsync(deleteId);
      toast.success(t.admin?.articleDeleted || 'Article deleted');
      setDeleteId(null);
    } catch (error) {
      toast.error(t.common?.error || 'Error deleting article');
    }
  };

  const handleTogglePublish = async (id: string, currentStatus: boolean) => {
    try {
      await togglePublish.mutateAsync({ id, is_published: !currentStatus });
      toast.success(currentStatus 
        ? (t.admin?.articleUnpublished || 'Article unpublished')
        : (t.admin?.articlePublished || 'Article published')
      );
    } catch (error) {
      toast.error(t.common?.error || 'Error updating article');
    }
  };

  const getCategoryName = (categoryId: string) => {
    const cat = categories?.find((c) => c.id === categoryId);
    const trans = cat?.translations?.find((t: any) => t.language === 'fr');
    return trans?.name || cat?.slug || '';
  };

  const getArticleTitle = (article: any) => {
    const trans = article.translations?.find((t: any) => t.language === 'fr');
    return trans?.title || article.slug;
  };

  return (
    <div className="container py-8 md:py-16">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <Button variant="ghost" size="sm" onClick={() => navigate('/guides')} className="mb-2">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t.guides?.backToGuides || 'Back to Guides'}
            </Button>
            <h1 className="text-2xl md:text-3xl font-bold">
              {t.admin?.manageArticles || 'Manage Articles'}
            </h1>
          </div>
          <Button onClick={() => navigate('/admin/guides/new')}>
            <Plus className="h-4 w-4 mr-2" />
            {t.admin?.newArticle || 'New Article'}
          </Button>
        </div>

        {isLoadingArticles ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        ) : articles && articles.length > 0 ? (
          <div className="space-y-4">
            {articles.map((article) => (
              <Card key={article.id}>
                <CardHeader className="py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <CardTitle className="text-lg">{getArticleTitle(article)}</CardTitle>
                        <Badge variant={article.is_published ? 'default' : 'secondary'}>
                          {article.is_published 
                            ? (t.admin?.published || 'Published')
                            : (t.admin?.draft || 'Draft')
                          }
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {getCategoryName(article.category_id)} · {article.reading_time_minutes} min
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleTogglePublish(article.id, article.is_published)}
                      >
                        {article.is_published ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate(`/admin/guides/${article.id}`)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteId(article.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground mb-4">
                {t.admin?.noArticles || 'No articles yet'}
              </p>
              <Button onClick={() => navigate('/admin/guides/new')}>
                <Plus className="h-4 w-4 mr-2" />
                {t.admin?.createFirst || 'Create your first article'}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.admin?.confirmDelete || 'Delete Article?'}</AlertDialogTitle>
            <AlertDialogDescription>
              {t.admin?.deleteWarning || 'This action cannot be undone.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.common?.cancel || 'Cancel'}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              {t.common?.delete || 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminGuides;
