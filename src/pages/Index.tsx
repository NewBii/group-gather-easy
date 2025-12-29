import { Link } from 'react-router-dom';
import { Users, Calendar, Sparkles } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';
import { Button } from '@/components/ui/button';

const Index = () => {
  const { t } = useLanguage();

  const features = [
    { icon: Users, label: t.home.features.noAccount },
    { icon: Calendar, label: t.home.features.collaborative },
    { icon: Sparkles, label: t.home.features.simple },
  ];

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="container py-20 md:py-32">
        <div className="max-w-3xl mx-auto text-center animate-fade-in">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground mb-6">
            {t.home.headline}
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
            {t.home.subheadline}
          </p>
          <Button asChild size="lg" className="text-base px-8 py-6 h-auto">
            <Link to="/create">{t.home.cta}</Link>
          </Button>
        </div>
      </section>

      {/* Features Section */}
      <section className="container pb-20">
        <div className="flex flex-wrap justify-center gap-8 md:gap-16">
          {features.map((feature, index) => (
            <div
              key={index}
              className="flex items-center gap-3 text-muted-foreground"
            >
              <feature.icon className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium">{feature.label}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Index;
