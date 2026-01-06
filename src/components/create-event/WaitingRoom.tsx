import { useState, useEffect } from 'react';
import { Copy, Check, Mail, Users, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLanguage } from '@/i18n/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { AIProgressStepper } from './AIProgressStepper';

interface WaitingRoomProps {
  eventId: string;
  eventSlug: string;
  eventTitle?: string;
}

export const WaitingRoom = ({ eventId, eventSlug, eventTitle }: WaitingRoomProps) => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [participantCount, setParticipantCount] = useState(0);

  const shareUrl = `${window.location.origin}/event/${eventSlug}`;

  useEffect(() => {
    // Fetch initial participant count
    const fetchParticipants = async () => {
      const { count } = await supabase
        .from('participants_public')
        .select('*', { count: 'exact', head: true })
        .eq('event_id', eventId);
      setParticipantCount(count || 0);
    };

    fetchParticipants();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('waiting-room-participants')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'participants',
          filter: `event_id=eq.${eventId}`,
        },
        () => {
          setParticipantCount((prev) => prev + 1);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [eventId]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast({
      title: t.eventCreated?.linkCopied || 'Link copied!',
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleEmailShare = () => {
    const subject = encodeURIComponent(eventTitle || 'Join our event!');
    const body = encodeURIComponent(`Hey! I'm organizing an event and would love for you to join.\n\nClick here to participate: ${shareUrl}`);
    window.open(`mailto:?subject=${subject}&body=${body}`);
  };

  return (
    <div className="space-y-8">
      <AIProgressStepper currentPhase="spark" />

      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-4 animate-pulse">
          <span className="text-4xl">✨</span>
        </div>
        <h2 className="text-3xl font-bold text-foreground">
          {t.aiConcierge?.spark?.waitingRoom?.title || 'Idea Sparked!'}
        </h2>
        <p className="text-lg text-muted-foreground max-w-md mx-auto">
          {t.aiConcierge?.spark?.waitingRoom?.subtitle || "Send this link to your group. I'll help everyone decide the rest."}
        </p>
      </div>

      {/* Share Link - PROMINENT */}
      <Card className="border-2 border-primary bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader className="pb-2">
          <CardTitle className="text-center text-lg">
            {t.aiConcierge?.spark?.waitingRoom?.shareLink || 'Share this link'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2 p-4 bg-background rounded-lg border">
            <code className="flex-1 text-sm truncate font-mono">
              {shareUrl}
            </code>
            <Button
              variant={copied ? 'default' : 'outline'}
              size="sm"
              onClick={handleCopy}
              className="shrink-0"
            >
              {copied ? (
                <Check className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleCopy}
            >
              <Copy className="mr-2 h-4 w-4" />
              {t.eventCreated?.copyLink || 'Copy'}
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleEmailShare}
            >
              <Mail className="mr-2 h-4 w-4" />
              {t.eventCreated?.shareByEmail || 'Email'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Participant Counter */}
      <Card className="border-dashed">
        <CardContent className="py-6">
          <div className="flex items-center justify-center gap-3">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
              <Users className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{participantCount}</p>
              <p className="text-sm text-muted-foreground">
                {t.aiConcierge?.spark?.waitingRoom?.peopleJoined?.replace('{count}', String(participantCount)) || `${participantCount} people have joined`}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* View Event Button */}
      <Button
        variant="outline"
        className="w-full"
        onClick={() => window.location.href = `/event/${eventSlug}`}
      >
        <ExternalLink className="mr-2 h-4 w-4" />
        {t.eventCreated?.viewEvent || 'View Event'}
      </Button>
    </div>
  );
};
