import { Calendar } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';

const CreateEvent = () => {
  const { t } = useLanguage();

  return (
    <div className="container py-16 md:py-24">
      <div className="max-w-2xl mx-auto text-center">
        <div className="mb-8 flex justify-center">
          <div className="p-4 rounded-full bg-secondary">
            <Calendar className="h-8 w-8 text-primary" />
          </div>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
          {t.createEvent.title}
        </h1>
        <p className="text-lg text-muted-foreground mb-8">
          {t.createEvent.description}
        </p>
        <div className="p-8 rounded-lg border border-border bg-card">
          <p className="text-muted-foreground">{t.createEvent.comingSoon}</p>
        </div>
      </div>
    </div>
  );
};

export default CreateEvent;
