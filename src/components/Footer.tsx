import { Link } from 'react-router-dom';
import { useLanguage } from '@/i18n/LanguageContext';

export function Footer() {
  const { t } = useLanguage();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-muted/30">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <p>© {currentYear} Ensemble. {t.footer.allRightsReserved}</p>
            <span className="text-[10px] text-muted-foreground/50">
              Build: {new Date(__BUILD_TIMESTAMP__).toLocaleString('fr-FR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
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
