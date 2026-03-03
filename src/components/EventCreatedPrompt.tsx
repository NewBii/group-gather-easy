import { useNavigate } from 'react-router-dom';
import { Check, Copy, Mail, Calendar, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { z } from 'zod';
import { useLanguage } from '@/i18n/LanguageContext';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface EventCreatedPromptProps {
  eventSlug: string;
  eventId: string;
  eventTitle?: string;
}

const pendingClaimSchema = z.object({
  eventId: z.string().uuid(),
  slug: z.string().min(1).max(100),
});

export const EventCreatedPrompt = ({ eventSlug, eventId, eventTitle = 'Event' }: EventCreatedPromptProps) => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [justLinked, setJustLinked] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      const authed = !!session?.user;
      setIsAuthenticated(authed);

      // Claim event on sign-in
      if (authed && session && (event === 'SIGNED_IN' || event === 'USER_UPDATED')) {
        await claimPendingEvent(session.user.id);
      }
    });

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      const authed = !!session?.user;
      setIsAuthenticated(authed);
      if (authed && session) {
        await claimPendingEvent(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const claimPendingEvent = async (userId: string) => {
    const pendingClaim = localStorage.getItem('pendingEventClaim');
    if (!pendingClaim) return;

    try {
      const parsed = JSON.parse(pendingClaim);
      const validated = pendingClaimSchema.parse(parsed);

      const { error } = await supabase
        .from('events')
        .update({ created_by: userId })
        .eq('id', validated.eventId)
        .is('created_by', null);

      if (!error) {
        setJustLinked(true);
        toast.success(t.eventCreated.accountLinked);
      }

      localStorage.removeItem('pendingEventClaim');
    } catch {
      localStorage.removeItem('pendingEventClaim');
    }
  };

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

  const handleGoogleSignIn = async () => {
    // Ensure pendingEventClaim is set before redirecting
    localStorage.setItem('pendingEventClaim', JSON.stringify({ eventId, slug: eventSlug }));
    setIsGoogleLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth?returnTo=/event/${eventSlug}`,
        },
      });

      if (error) {
        toast.error(error.message);
      }
    } catch {
      toast.error(t.common.error);
    } finally {
      setIsGoogleLoading(false);
    }
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

      {/* Auth Warning / Success Banner */}
      {!isAuthenticated && !justLinked && (
        <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-6 space-y-4">
          <div className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            <p className="text-sm font-medium text-left">
              ⚠️ Without an account, you may lose access to this event if you close this page.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            className="w-full flex items-center justify-center gap-3"
            onClick={handleGoogleSignIn}
            disabled={isGoogleLoading}
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            {isGoogleLoading ? t.common.loading : t.auth.continueWithGoogle}
          </Button>
        </div>
      )}

      {(isAuthenticated || justLinked) && (
        <div className="bg-success/10 border border-success/30 rounded-lg p-4 flex items-center justify-center gap-2 text-success">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          <p className="text-sm font-medium">✓ Your event is saved to your account.</p>
        </div>
      )}

      <div className="space-y-2">
        <Button variant="default" onClick={handleContinueAsGuest}>
          {isAuthenticated ? t.eventCreated.viewEvent : t.eventCreated.continueAsGuest}
        </Button>
        <p className="text-xs text-muted-foreground text-center">
          {language === 'fr'
            ? 'Vous pourrez suivre les votes depuis la page de l\'événement.'
            : 'You can track votes from the event page.'}
        </p>
      </div>
    </div>
  );
};
