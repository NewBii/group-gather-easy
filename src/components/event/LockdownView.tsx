import { useState, useEffect } from 'react';
import { Calendar, Clock, Check, ExternalLink, Home, Pencil, Link as LinkIcon, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { TaskSplitter } from './TaskSplitter';
import { AIProgressStepper } from '../create-event/AIProgressStepper';
import { AccommodationCard, AccommodationInfo, BudgetInfo } from './AccommodationCard';
import { useLanguage } from '@/i18n/LanguageContext';
import { Step3HelpersWanted } from '../create-event/Step3HelpersWanted';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { generateBookingUrl, generateAirbnbUrl, deriveWeekendDates } from '@/lib/bookingLinks';
import { format, parseISO } from 'date-fns';
import { fr, enUS } from 'date-fns/locale';

interface WinningScenario {
  id: string;
  title: string;
  description?: string;
  suggested_date?: string;
  suggested_time_of_day?: string;
  suggested_vibe?: string;
  metadata?: {
    location?: {
      townName?: string;
      justification?: string;
    };
    accommodation?: {
      name?: string;
      style?: string;
    };
    budget?: {
      per_person?: number;
      total_weekend?: number;
      budget_tier?: 'budget' | 'moderate' | 'premium';
      accommodation_per_night?: number;
    };
    special_traits?: Array<{ type: string; label: string; description?: string }>;
    midpoint_info?: {
      suggested_location?: string;
      travel_logic?: string;
    };
  } | null;
}

interface FinalLocationData {
  accommodation?: {
    name: string;
    description?: string;
    url?: string;
  };
}

interface LockdownViewProps {
  eventId: string;
  eventTitle: string;
  winningScenario?: WinningScenario;
  participantId?: string;
  participantName?: string;
  isOrganizer?: boolean;
  finalLocation?: FinalLocationData | null;
  onRefetch?: () => void;
  participantsCount?: number;
}

const HelpersWantedSection = () => {
  const { language } = useLanguage();
  const [tasks, setTasks] = useState<string[]>([]);
  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold">🙌 {language === 'fr' ? 'Répartir les tâches' : 'Split the tasks'}</h3>
      <Step3HelpersWanted tasks={tasks} setTasks={setTasks} />
    </div>
  );
};

const AccommodationLockdownSection = ({
  eventId,
  winningScenario,
  isOrganizer,
  finalLocation,
  onRefetch,
  participantsCount,
}: {
  eventId: string;
  winningScenario?: WinningScenario;
  isOrganizer?: boolean;
  finalLocation?: FinalLocationData | null;
  onRefetch?: () => void;
  participantsCount?: number;
}) => {
  const { language } = useLanguage();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formUrl, setFormUrl] = useState('');

  const locked = finalLocation?.accommodation;
  const meta = winningScenario?.metadata;
  const locationName = meta?.location?.townName || meta?.midpoint_info?.suggested_location;
  const suggestedDate = winningScenario?.suggested_date;

  // Derive weekend dates for booking links
  const weekendDates = suggestedDate ? deriveWeekendDates(suggestedDate) : null;

  const handleSave = async () => {
    if (!formName.trim()) return;
    setIsSaving(true);
    try {
      const currentFinalLocation = finalLocation || {};
      const updated = {
        ...currentFinalLocation,
        accommodation: {
          name: formName.trim(),
          description: formDescription.trim() || undefined,
          url: formUrl.trim() || undefined,
        },
      };
      const { error } = await supabase
        .from('events')
        .update({ final_location: updated })
        .eq('id', eventId);

      if (error) throw error;
      toast({ title: language === 'fr' ? 'Hébergement confirmé !' : 'Accommodation confirmed!' });
      setIsEditing(false);
      onRefetch?.();
    } catch {
      toast({ title: language === 'fr' ? 'Erreur lors de la sauvegarde' : 'Error saving', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  // Locked state — show confirmed accommodation
  if (locked) {
    return (
      <Card className="border-2 border-primary/30 bg-primary/5">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <Home className="h-4 w-4 text-primary" />
            <span>{language === 'fr' ? 'Hébergement' : 'Accommodation'}</span>
            <Badge variant="default" className="ml-auto bg-emerald-500 hover:bg-emerald-600 text-white gap-1">
              <Check className="h-3 w-3" />
              {language === 'fr' ? 'Confirmé par l\'orga' : "Organizer's Choice"}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="font-semibold text-foreground">{locked.name}</p>
          {locked.description && (
            <p className="text-sm text-muted-foreground">{locked.description}</p>
          )}
          {locked.url && (
            <Button variant="outline" size="sm" className="gap-1.5 text-xs" asChild>
              <a href={locked.url} target="_blank" rel="noopener noreferrer">
                <LinkIcon className="h-3 w-3" />
                {language === 'fr' ? 'Voir le lien' : 'View link'}
              </a>
            </Button>
          )}
          {isOrganizer && (
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-xs text-muted-foreground"
              onClick={() => {
                setFormName(locked.name);
                setFormDescription(locked.description || '');
                setFormUrl(locked.url || '');
                setIsEditing(true);
              }}
            >
              <Pencil className="h-3 w-3" />
              {language === 'fr' ? 'Modifier' : 'Edit'}
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  // Unlocked state
  return (
    <Card className="border border-border">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <Home className="h-4 w-4 text-muted-foreground" />
          <span>{language === 'fr' ? 'Hébergement' : 'Accommodation'}</span>
          {meta?.budget?.budget_tier && (
            <Badge variant="secondary" className="ml-auto text-xs">
              {meta.budget.budget_tier === 'budget' ? '€' : meta.budget.budget_tier === 'moderate' ? '€€' : '€€€'}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {meta?.accommodation?.name && (
          <p className="text-sm text-muted-foreground">
            {language === 'fr' ? 'Suggestion IA : ' : 'AI suggestion: '}
            <span className="font-medium text-foreground">{meta.accommodation.name}</span>
            {meta.accommodation.style && ` (${meta.accommodation.style})`}
          </p>
        )}

        {/* Booking search links */}
        {locationName && weekendDates && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">
              {language === 'fr' ? 'Chercher un hébergement :' : 'Search accommodation:'}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs h-8"
                onClick={() => {
                  const url = generateBookingUrl(locationName, weekendDates.checkIn, weekendDates.checkOut, participantsCount || 10);
                  window.open(url, '_blank', 'noopener,noreferrer');
                }}
              >
                <ExternalLink className="h-3 w-3" />
                Booking.com
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs h-8"
                onClick={() => {
                  const url = generateAirbnbUrl(locationName, weekendDates.checkIn, weekendDates.checkOut, participantsCount || 10);
                  window.open(url, '_blank', 'noopener,noreferrer');
                }}
              >
                <ExternalLink className="h-3 w-3" />
                Airbnb
              </Button>
            </div>
          </div>
        )}

        {/* Organizer lock form */}
        {isOrganizer && !isEditing && (
          <Button
            variant="default"
            size="sm"
            className="gap-1.5"
            onClick={() => setIsEditing(true)}
          >
            <Check className="h-3.5 w-3.5" />
            {language === 'fr' ? 'Confirmer un hébergement' : 'Confirm accommodation'}
          </Button>
        )}

        {isEditing && (
          <div className="space-y-3 p-3 rounded-md border border-border bg-muted/30">
            <div className="space-y-1.5">
              <Label htmlFor="acc-name" className="text-xs">{language === 'fr' ? 'Nom *' : 'Name *'}</Label>
              <Input
                id="acc-name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder={language === 'fr' ? 'ex: Gîte des Collines' : 'e.g. Mountain Lodge'}
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="acc-desc" className="text-xs">{language === 'fr' ? 'Description' : 'Description'}</Label>
              <Textarea
                id="acc-desc"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder={language === 'fr' ? 'Infos pratiques, nb de chambres...' : 'Practical info, rooms...'}
                className="text-sm min-h-[60px]"
                rows={2}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="acc-url" className="text-xs">{language === 'fr' ? 'Lien (optionnel)' : 'Link (optional)'}</Label>
              <Input
                id="acc-url"
                type="url"
                value={formUrl}
                onChange={(e) => setFormUrl(e.target.value)}
                placeholder="https://..."
                className="h-8 text-sm"
              />
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSave} disabled={!formName.trim() || isSaving} className="gap-1.5">
                {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                {language === 'fr' ? 'Confirmer' : 'Confirm'}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)} disabled={isSaving}>
                {language === 'fr' ? 'Annuler' : 'Cancel'}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export const LockdownView = ({
  eventId,
  eventTitle,
  winningScenario,
  participantId,
  participantName,
  isOrganizer,
  finalLocation,
  onRefetch,
  participantsCount,
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

  const meta = winningScenario?.metadata;

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
              {meta?.location?.townName && (
                <div className="flex items-center gap-2 text-foreground">
                  <Home className="h-5 w-5 text-green-500" />
                  <span className="font-medium">{meta.location.townName}</span>
                </div>
              )}
            </div>

            {/* Location justification */}
            {meta?.location?.justification && (
              <p className="text-sm text-muted-foreground italic border-l-2 border-green-500/30 pl-3">
                {meta.location.justification}
              </p>
            )}

            {/* Special traits */}
            {meta?.special_traits && meta.special_traits.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {meta.special_traits.map((trait, i) => (
                  <Badge key={i} variant="secondary" className="text-xs">
                    {trait.label}
                  </Badge>
                ))}
              </div>
            )}

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

      {/* Accommodation Section */}
      <AccommodationLockdownSection
        eventId={eventId}
        winningScenario={winningScenario}
        isOrganizer={isOrganizer}
        finalLocation={finalLocation}
        onRefetch={onRefetch}
        participantsCount={participantsCount}
      />

      {/* Task Splitter */}
      <TaskSplitter
        eventId={eventId}
        participantId={participantId}
        participantName={participantName}
      />

      {/* Helpers Wanted - Organizer only */}
      {isOrganizer && (
        <HelpersWantedSection />
      )}
    </div>
  );
};
