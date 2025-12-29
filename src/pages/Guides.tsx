import { BookOpen, Users, Heart, Gift, Lightbulb } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';

const Guides = () => {
  const { t } = useLanguage();

  const categories = [
    { key: 'friends', icon: Users, label: t.guides.categories.friends },
    { key: 'family', icon: Heart, label: t.guides.categories.family },
    { key: 'birthdays', icon: Gift, label: t.guides.categories.birthdays },
    { key: 'tips', icon: Lightbulb, label: t.guides.categories.tips },
  ];

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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {categories.map((category) => (
            <Card
              key={category.key}
              className="cursor-pointer transition-colors hover:border-primary/50"
            >
              <CardHeader className="flex flex-row items-center gap-4">
                <div className="p-3 rounded-lg bg-secondary">
                  <category.icon className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-lg">{category.label}</CardTitle>
              </CardHeader>
            </Card>
          ))}
        </div>

        <div className="mt-12 p-8 rounded-lg border border-border bg-card text-center">
          <p className="text-muted-foreground">{t.guides.comingSoon}</p>
        </div>
      </div>
    </div>
  );
};

export default Guides;
