import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Clock, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { fr, enUS } from 'date-fns/locale';
import { useCategoryBySlug, useArticle } from '@/hooks/useGuides';
import { useLanguage } from '@/i18n/LanguageContext';
import { GuideBreadcrumb } from '@/components/guides/GuideBreadcrumb';
import { GuideContent } from '@/components/guides/GuideContent';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';

const GuideArticle = () => {
  const { category: categorySlug, slug: articleSlug } = useParams<{
    category: string;
    slug: string;
  }>();
  const { language, t } = useLanguage();
  const { data: category, isLoading: categoryLoading } = useCategoryBySlug(categorySlug);
  const { data: article, isLoading: articleLoading } = useArticle(categorySlug, articleSlug);

  const isLoading = categoryLoading || articleLoading;
  const dateLocale = language === 'fr' ? fr : enUS;

  // Set document title and meta description for SEO
  if (article) {
    document.title = article.meta_title || `${article.title} | Ensemble`;
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute(
        'content',
        article.meta_description || article.excerpt || ''
      );
    }
  }

  if (isLoading) {
    return (
      <div className="container py-16 md:py-24">
        <div className="max-w-3xl mx-auto">
          <Skeleton className="h-4 w-64 mb-6" />
          <Skeleton className="h-12 w-full mb-4" />
          <Skeleton className="h-6 w-48 mb-8" />
          <Skeleton className="h-64 w-full rounded-lg mb-8" />
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-4 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!article || !category) {
    return (
      <div className="container py-16 md:py-24">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-2xl font-bold mb-4">{t.notFound.title}</h1>
          <p className="text-muted-foreground mb-6">{t.notFound.description}</p>
          <Button asChild>
            <Link to="/guides">{t.common.back}</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-16 md:py-24">
      <article className="max-w-3xl mx-auto">
        <GuideBreadcrumb
          items={[
            { label: category.name, href: `/guides/${categorySlug}` },
            { label: article.title },
          ]}
        />

        <header className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            {article.title}
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>
                {article.reading_time_minutes} min {t.guides.readTime || 'read'}
              </span>
            </div>
            {article.published_at && (
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>
                  {format(new Date(article.published_at), 'PPP', {
                    locale: dateLocale,
                  })}
                </span>
              </div>
            )}
          </div>
        </header>

        {article.cover_image_url && (
          <div className="aspect-video w-full overflow-hidden rounded-lg mb-8">
            <img
              src={article.cover_image_url}
              alt={article.title}
              className="h-full w-full object-cover"
            />
          </div>
        )}

        <GuideContent content={article.content} />

        <footer className="mt-12 pt-8 border-t border-border">
          <Button variant="ghost" asChild>
            <Link to={`/guides/${categorySlug}`}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t.guides.backToCategory?.replace('{category}', category.name) ||
                `Back to ${category.name}`}
            </Link>
          </Button>
        </footer>
      </article>
    </div>
  );
};

export default GuideArticle;
