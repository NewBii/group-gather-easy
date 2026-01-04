import { Link } from 'react-router-dom';
import { BookOpen, Users, Heart, Gift, Lightbulb, type LucideIcon } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';
import { useCategories } from '@/hooks/useGuides';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

const iconMap: Record<string, LucideIcon> = {
  Users,
  Heart,
  Gift,
  Lightbulb,
  BookOpen,
};

const Guides = () => {
  const { t } = useLanguage();
  const { data: categories, isLoading, error } = useCategories();

  return (
    <div className="container py-16 md:py-24">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <div className="mb-6 flex justify-center">
            <div className="p-4 rounded-full bg-secondary">
              <BookOpen className="h-8 w-8 text-primary" />
            </div>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            {t.guides.title}
          </h1>
          <p className="text-lg text-muted-foreground">
            {t.guides.description}
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-24 rounded-lg" />
            ))}
          </div>
        ) : error ? (
          <div className="p-8 rounded-lg border border-border bg-card text-center">
            <p className="text-muted-foreground">{t.common.error}</p>
          </div>
        ) : categories && categories.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {categories.map((category) => {
              const IconComponent = iconMap[category.icon] || BookOpen;
              return (
                <Link key={category.id} to={`/guides/${category.slug}`}>
                  <Card className="h-full cursor-pointer transition-all hover:border-primary/50 hover:shadow-md">
                    <CardHeader className="flex flex-row items-center gap-4">
                      <div className="p-3 rounded-lg bg-secondary">
                        <IconComponent className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{category.name}</CardTitle>
                        {category.description && (
                          <CardDescription className="mt-1 line-clamp-2">
                            {category.description}
                          </CardDescription>
                        )}
                      </div>
                    </CardHeader>
                  </Card>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="p-8 rounded-lg border border-border bg-card text-center">
            <p className="text-muted-foreground">{t.guides.comingSoon}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Guides;
