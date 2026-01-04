import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface GuideBreadcrumbProps {
  items: BreadcrumbItem[];
}

export function GuideBreadcrumb({ items }: GuideBreadcrumbProps) {
  const { t } = useLanguage();

  return (
    <nav aria-label="Breadcrumb" className="mb-6">
      <ol className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
        <li>
          <Link
            to="/"
            className="flex items-center gap-1 hover:text-foreground transition-colors"
          >
            <Home className="h-4 w-4" />
            <span className="sr-only">{t.nav.home}</span>
          </Link>
        </li>
        <ChevronRight className="h-4 w-4" />
        <li>
          <Link
            to="/guides"
            className="hover:text-foreground transition-colors"
          >
            {t.nav.guides}
          </Link>
        </li>
        {items.map((item, index) => (
          <li key={index} className="flex items-center gap-1">
            <ChevronRight className="h-4 w-4" />
            {item.href ? (
              <Link
                to={item.href}
                className="hover:text-foreground transition-colors"
              >
                {item.label}
              </Link>
            ) : (
              <span className="text-foreground font-medium">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
