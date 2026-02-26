import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/i18n/LanguageContext';
import { lovable } from '@/integrations/lovable/index';

interface ParticipantNudgeProps {
  eventId: string;
  eventSlug: string;
  isAuthenticated: boolean;
  hasInteracted: boolean;
}

export const ParticipantNudge = ({
  eventId,
  eventSlug,
  isAuthenticated,
  hasInteracted,
}: ParticipantNudgeProps) => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [dismissed, setDismissed] = useState(() => {
    return localStorage.getItem(`nudgeDismissed_${eventId}`) === 'true';
  });
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  if (!hasInteracted || isAuthenticated || dismissed) return null;

  const storePendingClaim = () => {
    localStorage.setItem(
      'pendingEventClaim',
      JSON.stringify({ eventId, slug: eventSlug })
    );
  };

  const handleDismiss = () => {
    localStorage.setItem(`nudgeDismissed_${eventId}`, 'true');
    setDismissed(true);
  };

  const handleGoogle = async () => {
    storePendingClaim();
    setIsGoogleLoading(true);
    try {
      const { error } = await lovable.auth.signInWithOAuth('google', {
        redirect_uri: window.location.origin,
      });
      if (error) console.error('Google OAuth error:', error);
    } catch (err) {
      console.error('Google sign-in failed:', err);
      setIsGoogleLoading(false);
    }
  };

  const handleEmailSignIn = () => {
    storePendingClaim();
    navigate(`/auth?returnTo=/event/${eventSlug}`);
  };

  const message =
    language === 'fr'
      ? 'Connectez-vous pour sauvegarder votre vote et être notifié quand le groupe décide.'
      : 'Sign in to save your vote and get notified when the group decides.';

  const maybeLater = language === 'fr' ? 'Plus tard' : 'Maybe later';

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-card shadow-[0_-4px_12px_rgba(0,0,0,0.08)]">
      <div className="container max-w-4xl py-3 px-4 flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <p className="text-sm text-foreground flex-1">{message}</p>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button
            size="sm"
            onClick={handleGoogle}
            disabled={isGoogleLoading}
            className="gap-1.5 text-xs h-8"
          >
            {isGoogleLoading ? '...' : language === 'fr' ? 'Continuer avec Google' : 'Continue with Google'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleEmailSignIn}
            className="text-xs h-8"
          >
            {language === 'fr' ? 'Se connecter / Créer un compte' : 'Sign in / Create account'}
          </Button>
          <button
            onClick={handleDismiss}
            className="text-xs text-muted-foreground hover:text-foreground ml-1 flex items-center gap-1"
          >
            <span className="hidden sm:inline">{maybeLater}</span>
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
