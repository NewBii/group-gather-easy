import { Link } from 'react-router-dom';
import { useLanguage } from '@/i18n/LanguageContext';

export function Footer() {
  const { t } = useLanguage();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-muted/30">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p>© {currentYear} Ensemble. {t.footer.allRightsReserved}</p>
          <Link 
            to="/privacy" 
            className="hover:text-foreground transition-colors"
          >
            {t.footer.privacyPolicy}
          </Link>
        </div>
      </div>
    </footer>
  );
}
