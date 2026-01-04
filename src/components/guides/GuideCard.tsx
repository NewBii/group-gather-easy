import { Link } from 'react-router-dom';
import { Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { GuideArticle } from '@/hooks/useGuides';
import { useLanguage } from '@/i18n/LanguageContext';

interface GuideCardProps {
  article: GuideArticle;
  categorySlug: string;
}

export function GuideCard({ article, categorySlug }: GuideCardProps) {
  const { t } = useLanguage();

  return (
    <Link to={`/guides/${categorySlug}/${article.slug}`}>
      <Card className="h-full transition-all hover:border-primary/50 hover:shadow-md">
        {article.cover_image_url && (
          <div className="aspect-video w-full overflow-hidden rounded-t-lg">
            <img
              src={article.cover_image_url}
              alt={article.title}
              className="h-full w-full object-cover"
            />
          </div>
        )}
        <CardHeader className={article.cover_image_url ? 'pt-4' : ''}>
          <CardTitle className="text-lg line-clamp-2">{article.title}</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {article.excerpt && (
            <p className="text-sm text-muted-foreground line-clamp-3 mb-3">
              {article.excerpt}
            </p>
          )}
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>
              {article.reading_time_minutes} min {t.guides.readTime || 'read'}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
