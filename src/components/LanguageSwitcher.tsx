import { useLanguage } from '@/i18n/LanguageContext';
import { cn } from '@/lib/utils';

export function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="flex items-center gap-1 text-sm font-medium">
      <button
        onClick={() => setLanguage('fr')}
        className={cn(
          'px-2 py-1 rounded-md transition-colors',
          language === 'fr'
            ? 'text-primary font-semibold'
            : 'text-muted-foreground hover:text-foreground'
        )}
        aria-label="Français"
      >
        FR
      </button>
      <span className="text-muted-foreground">|</span>
      <button
        onClick={() => setLanguage('en')}
        className={cn(
          'px-2 py-1 rounded-md transition-colors',
          language === 'en'
            ? 'text-primary font-semibold'
            : 'text-muted-foreground hover:text-foreground'
        )}
        aria-label="English"
      >
        EN
      </button>
    </div>
  );
}
