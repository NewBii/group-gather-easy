import { useNavigate } from 'react-router-dom';
import { Check, Copy, User, ArrowRight } from 'lucide-react';
import { useState } from 'react';
import { useLanguage } from '@/i18n/LanguageContext';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface EventCreatedPromptProps {
  eventSlug: string;
  eventId: string;
}

export const EventCreatedPrompt = ({ eventSlug, eventId }: EventCreatedPromptProps) => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  const eventUrl = `${window.location.origin}/event/${eventSlug}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(eventUrl);
      setCopied(true);
      toast.success(t.eventCreated.linkCopied);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(t.common.error);
    }
  };

  const handleCreateAccount = () => {
    localStorage.setItem('pendingEventClaim', JSON.stringify({ eventId, slug: eventSlug }));
    navigate(`/auth?returnTo=/event/${eventSlug}`);
  };

  const handleContinueAsGuest = () => {
    navigate(`/event/${eventSlug}`);
  };

  return (
    <div className="max-w-lg mx-auto text-center space-y-8">
      <div className="space-y-2">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-success/10 text-success mb-4">
          <Check className="h-8 w-8" />
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-foreground">
          {t.eventCreated.title}
        </h1>
        <p className="text-lg text-muted-foreground">
          {t.eventCreated.subtitle}
        </p>
      </div>

      <div className="bg-card border border-border rounded-lg p-4">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={eventUrl}
            readOnly
            className="flex-1 bg-transparent text-sm text-foreground truncate outline-none"
          />
          <Button variant="outline" size="sm" onClick={handleCopyLink}>
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      <div className="bg-secondary/50 border border-border rounded-lg p-6 space-y-4">
        <div className="flex items-center justify-center gap-2 text-foreground">
          <User className="h-5 w-5" />
          <h2 className="font-semibold">{t.eventCreated.createAccountTitle}</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          {t.eventCreated.createAccountDescription}
        </p>
        <Button onClick={handleCreateAccount} className="w-full">
          {t.eventCreated.createAccountButton}
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>

      <Button variant="ghost" onClick={handleContinueAsGuest} className="text-muted-foreground">
        {t.eventCreated.continueAsGuest}
      </Button>
    </div>
  );
};
