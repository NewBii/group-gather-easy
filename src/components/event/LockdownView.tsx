import { useEffect, useState } from 'react';
import { Calendar, MapPin, Clock, Check, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TaskSplitter } from './TaskSplitter';
import { AIProgressStepper } from '../create-event/AIProgressStepper';
import { useLanguage } from '@/i18n/LanguageContext';
import { format, parseISO } from 'date-fns';
import { fr, enUS } from 'date-fns/locale';

interface WinningScenario {
  id: string;
  title: string;
  description?: string;
  suggested_date?: string;
  suggested_time_of_day?: string;
  suggested_vibe?: string;
}

interface LockdownViewProps {
  eventId: string;
  eventTitle: string;
  winningScenario?: WinningScenario;
  participantId?: string;
  participantName?: string;
}

export const LockdownView = ({
  eventId,
  eventTitle,
  winningScenario,
  participantId,
  participantName,
}: LockdownViewProps) => {
  const { t, language } = useLanguage();
  const locale = language === 'fr' ? fr : enUS;

  const formattedDate = winningScenario?.suggested_date
    ? format(parseISO(winningScenario.suggested_date), 'EEEE, d MMMM yyyy', { locale })
    : null;

  const timeLabels = {
    morning: language === 'fr' ? 'Matin' : 'Morning',
    afternoon: language === 'fr' ? 'Après-midi' : 'Afternoon',
    evening: language === 'fr' ? 'Soirée' : 'Evening',
  };

  const handleAddToCalendar = () => {
    if (!winningScenario?.suggested_date) return;

    const date = parseISO(winningScenario.suggested_date);
    const timeOffset = winningScenario.suggested_time_of_day === 'morning' ? 10 :
                       winningScenario.suggested_time_of_day === 'afternoon' ? 14 : 19;
    
    date.setHours(timeOffset, 0, 0);
    const endDate = new Date(date);
    endDate.setHours(timeOffset + 3);

    const formatForGoogle = (d: Date) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    
    const googleUrl = new URL('https://calendar.google.com/calendar/render');
    googleUrl.searchParams.set('action', 'TEMPLATE');
    googleUrl.searchParams.set('text', eventTitle);
    googleUrl.searchParams.set('dates', `${formatForGoogle(date)}/${formatForGoogle(endDate)}`);
    googleUrl.searchParams.set('details', winningScenario.description || '');

    window.open(googleUrl.toString(), '_blank');
  };

  return (
    <div className="space-y-8">
      <AIProgressStepper currentPhase="lockdown" />

      {/* Header */}
      <div className="text-center space-y-4">
        <Badge className="bg-green-500 text-white px-4 py-1 text-sm">
          <Check className="mr-1 h-4 w-4" />
          {t.aiConcierge?.lockdown?.badge || 'Confirmed'}
        </Badge>
        <h1 className="text-4xl font-bold text-foreground">
          {t.aiConcierge?.lockdown?.title || "It's Official!"}
        </h1>
        <p className="text-xl text-muted-foreground">{eventTitle}</p>
      </div>

      {/* The Winning Verdict */}
      {winningScenario && (
        <Card className="border-2 border-green-500/50 bg-gradient-to-br from-green-500/10 to-transparent shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <span className="text-2xl">🏆</span>
              {t.aiConcierge?.lockdown?.theVerdict || 'The Verdict'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <h2 className="text-2xl font-bold text-foreground">{winningScenario.title}</h2>
            
            {winningScenario.description && (
              <p className="text-muted-foreground">{winningScenario.description}</p>
            )}

            <div className="flex flex-wrap gap-4">
              {formattedDate && (
                <div className="flex items-center gap-2 text-foreground">
                  <Calendar className="h-5 w-5 text-green-500" />
                  <span className="font-medium capitalize">{formattedDate}</span>
                </div>
              )}
              {winningScenario.suggested_time_of_day && (
                <div className="flex items-center gap-2 text-foreground">
                  <Clock className="h-5 w-5 text-green-500" />
                  <span className="font-medium">
                    {timeLabels[winningScenario.suggested_time_of_day as keyof typeof timeLabels]}
                  </span>
                </div>
              )}
            </div>

            {/* Frictionless Actions */}
            <div className="flex flex-wrap gap-3 pt-4 border-t">
              <Button onClick={handleAddToCalendar} className="flex-1 sm:flex-none">
                <Calendar className="mr-2 h-4 w-4" />
                {t.aiConcierge?.lockdown?.addToCalendar || 'Add to Calendar'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Task Splitter */}
      <TaskSplitter
        eventId={eventId}
        participantId={participantId}
        participantName={participantName}
      />
    </div>
  );
};
