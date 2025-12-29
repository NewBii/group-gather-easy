import { useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';
import { Button } from '@/components/ui/button';

const Event = () => {
  const { id } = useParams<{ id: string }>();
  const { t } = useLanguage();

  // Placeholder - will be replaced with actual event loading
  return (
    <div className="container py-16 md:py-24">
      <div className="max-w-2xl mx-auto text-center">
        <h1 className="text-2xl font-bold text-foreground mb-4">
          {t.event.notFound}
        </h1>
        <p className="text-muted-foreground mb-8">
          Event ID: {id}
        </p>
        <Button asChild variant="outline">
          <Link to="/">
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t.event.backHome}
          </Link>
        </Button>
      </div>
    </div>
  );
};

export default Event;
