import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, BookOpen, Users, Heart, Gift, Lightbulb, type LucideIcon } from 'lucide-react';
import { useCategoryBySlug, useCategoryArticles } from '@/hooks/useGuides';
import { useLanguage } from '@/i18n/LanguageContext';
import { GuideBreadcrumb } from '@/components/guides/GuideBreadcrumb';
import { GuideCard } from '@/components/guides/GuideCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';

const iconMap: Record<string, LucideIcon> = {
  Users,
  Heart,
  Gift,
  Lightbulb,
  BookOpen,
};

const GuideCategory = () => {
  const { category: categorySlug } = useParams<{ category: string }>();
  const { t } = useLanguage();
  const { data: category, isLoading: categoryLoading } = useCategoryBySlug(categorySlug);
  const { data: articles, isLoading: articlesLoading } = useCategoryArticles(categorySlug);

  const isLoading = categoryLoading || articlesLoading;

  // Get icon component from map
  const IconComponent = category?.icon ? iconMap[category.icon] || BookOpen : BookOpen;

  if (isLoading) {
    return (
      <div className="container py-16 md:py-24">
        <div className="max-w-4xl mx-auto">
          <Skeleton className="h-4 w-48 mb-6" />
          <Skeleton className="h-10 w-64 mb-4" />
          <Skeleton className="h-6 w-96 mb-8" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-48 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="container py-16 md:py-24">
        <div className="max-w-4xl mx-auto text-center">
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
      <div className="max-w-4xl mx-auto">
        <GuideBreadcrumb items={[{ label: category.name }]} />

        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 rounded-lg bg-secondary">
              <IconComponent className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">
              {category.name}
            </h1>
          </div>
          {category.description && (
            <p className="text-lg text-muted-foreground">{category.description}</p>
          )}
        </div>

        {articles && articles.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {articles.map((article) => (
              <GuideCard
                key={article.id}
                article={article}
                categorySlug={categorySlug!}
              />
            ))}
          </div>
        ) : (
          <div className="p-8 rounded-lg border border-border bg-card text-center">
            <p className="text-muted-foreground">{t.guides.comingSoon}</p>
          </div>
        )}

        <div className="mt-8">
          <Button variant="ghost" asChild>
            <Link to="/guides">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t.guides.backToGuides}
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default GuideCategory;
