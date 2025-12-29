import { useNavigate } from 'react-router-dom';
import { Check, Copy, User, ArrowRight, Mail, Calendar } from 'lucide-react';
import { useState } from 'react';
import { useLanguage } from '@/i18n/LanguageContext';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface EventCreatedPromptProps {
  eventSlug: string;
  eventId: string;
  eventTitle?: string;
}

export const EventCreatedPrompt = ({ eventSlug, eventId, eventTitle = 'Event' }: EventCreatedPromptProps) => {
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

  const handleShareEmail = () => {
    const subject = encodeURIComponent(eventTitle);
    const body = encodeURIComponent(`${eventUrl}`);
    window.open(`mailto:?subject=${subject}&body=${body}`);
  };

  const handleAddToCalendar = () => {
    const calendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(eventTitle)}&details=${encodeURIComponent(eventUrl)}`;
    window.open(calendarUrl, '_blank');
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

      {/* Share Section */}
      <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-6 text-left space-y-4">
        <h2 className="font-semibold text-foreground">{t.eventCreated.shareTitle}</h2>
        <p className="text-sm text-muted-foreground">
          {t.eventCreated.shareDescription}
        </p>
        
        <div className="bg-background border border-border rounded-md p-3 flex items-center gap-2">
          <input
            type="text"
            value={eventUrl}
            readOnly
            className="flex-1 bg-transparent text-sm text-foreground truncate outline-none"
          />
          <Button variant="ghost" size="icon" onClick={handleCopyLink} className="shrink-0">
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </Button>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleCopyLink} className="flex-1">
            <Copy className="h-4 w-4 mr-2" />
            {t.eventCreated.copyLink}
          </Button>
          <Button variant="outline" size="sm" onClick={handleShareEmail} className="flex-1">
            <Mail className="h-4 w-4 mr-2" />
            {t.eventCreated.shareByEmail}
          </Button>
          <Button variant="outline" size="sm" onClick={handleAddToCalendar} className="flex-1">
            <Calendar className="h-4 w-4 mr-2" />
            {t.eventCreated.addToCalendar}
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
