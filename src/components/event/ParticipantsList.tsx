import { Users, Crown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/i18n/LanguageContext';
import type { Participant } from '@/hooks/useEventData';

interface ParticipantsListProps {
  participants: Participant[];
  currentParticipantId: string | undefined;
}

export const ParticipantsList = ({ participants, currentParticipantId }: ParticipantsListProps) => {
  const { t } = useLanguage();

  // Sort: organizers first, then by name
  const sortedParticipants = [...participants].sort((a, b) => {
    if (a.is_organizer && !b.is_organizer) return -1;
    if (!a.is_organizer && b.is_organizer) return 1;
    return a.name.localeCompare(b.name);
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          <span>{t.eventPage.participants.title}</span>
          <Badge variant="secondary" className="ml-2">
            {participants.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {participants.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">
            {t.eventPage.participants.noParticipants}
          </p>
        ) : (
          <div className="space-y-2">
            {sortedParticipants.map(participant => (
              <div 
                key={participant.id} 
                className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50"
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">
                    {participant.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="font-medium">
                    {participant.name}
                    {participant.id === currentParticipantId && (
                      <span className="text-muted-foreground ml-1">({t.eventPage.participants.you})</span>
                    )}
                  </span>
                </div>
                {participant.is_organizer && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Crown className="h-3 w-3" />
                    {t.eventPage.participants.organizer}
                  </Badge>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
