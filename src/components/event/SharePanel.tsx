import { useState, useEffect } from 'react';
import { Copy, Check, Mail, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLanguage } from '@/i18n/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface SharePanelProps {
  eventId: string;
  eventSlug: string;
  eventTitle?: string;
  compact?: boolean;
}

export const SharePanel = ({ eventId, eventSlug, eventTitle, compact = false }: SharePanelProps) => {
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
      .channel(`share-panel-participants-${eventId}`)
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

  if (compact) {
    return (
      <Card className="border-primary/30 bg-primary/5">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Users className="h-4 w-4" />
            {participantCount} {t.aiConcierge?.spark?.waitingRoom?.peopleJoined?.replace('{count}', '').trim() || 'joined'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2 p-2 bg-background rounded-md border text-xs">
            <code className="flex-1 truncate font-mono">
              {shareUrl}
            </code>
            <Button
              variant={copied ? 'default' : 'ghost'}
              size="icon"
              className="h-6 w-6 shrink-0"
              onClick={handleCopy}
            >
              {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
            </Button>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={handleCopy}>
              <Copy className="mr-1 h-3 w-3" />
              {t.eventCreated?.copyLink || 'Copy'}
            </Button>
            <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={handleEmailShare}>
              <Mail className="mr-1 h-3 w-3" />
              {t.eventCreated?.shareByEmail || 'Email'}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
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
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </Button>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={handleCopy}>
            <Copy className="mr-2 h-4 w-4" />
            {t.eventCreated?.copyLink || 'Copy'}
          </Button>
          <Button variant="outline" className="flex-1" onClick={handleEmailShare}>
            <Mail className="mr-2 h-4 w-4" />
            {t.eventCreated?.shareByEmail || 'Email'}
          </Button>
        </div>

        {/* Participant Counter */}
        <div className="flex items-center justify-center gap-3 pt-2">
          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
            <Users className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <p className="text-xl font-bold text-foreground">{participantCount}</p>
            <p className="text-xs text-muted-foreground">
              {t.aiConcierge?.spark?.waitingRoom?.peopleJoined?.replace('{count}', String(participantCount)) || `${participantCount} people have joined`}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
