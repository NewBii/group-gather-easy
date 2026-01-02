import { Trophy, Calendar, Sparkles, MapPin } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLanguage } from '@/i18n/LanguageContext';
import { format } from 'date-fns';
import { fr, enUS } from 'date-fns/locale';
import type { DateOption, DateVote, Activity, ActivityVote, LocationSuggestion, LocationVote } from '@/hooks/useEventData';

interface VoteResultsProps {
  dateOptions: DateOption[];
  dateVotes: DateVote[];
  activities: Activity[];
  activityVotes: ActivityVote[];
  locationSuggestions: LocationSuggestion[];
  locationVotes: LocationVote[];
}

export const VoteResults = ({ 
  dateOptions, 
  dateVotes, 
  activities, 
  activityVotes,
  locationSuggestions,
  locationVotes,
}: VoteResultsProps) => {
  const { t, language } = useLanguage();
  const dateLocale = language === 'fr' ? fr : enUS;

  const getYesVotes = (votes: { vote: string }[]) => 
    votes.filter(v => v.vote === 'yes').length;

  // Find top date
  const dateResults = dateOptions.map(option => ({
    option,
    yesVotes: getYesVotes(dateVotes.filter(v => v.date_option_id === option.id)),
  })).sort((a, b) => b.yesVotes - a.yesVotes);

  const topDate = dateResults[0];

  // Find top activity
  const activityResults = activities.map(activity => ({
    activity,
    yesVotes: getYesVotes(activityVotes.filter(v => v.activity_id === activity.id)),
  })).sort((a, b) => b.yesVotes - a.yesVotes);

  const topActivity = activityResults[0];

  // Find top location
  const locationResults = locationSuggestions.map(location => ({
    location,
    yesVotes: getYesVotes(locationVotes.filter(v => v.location_suggestion_id === location.id)),
  })).sort((a, b) => b.yesVotes - a.yesVotes);

  const topLocation = locationResults[0];

  const formatDateOption = (option: DateOption) => {
    const start = format(new Date(option.start_date), 'EEE d MMM', { locale: dateLocale });
    if (option.end_date && option.end_date !== option.start_date) {
      const end = format(new Date(option.end_date), 'EEE d MMM', { locale: dateLocale });
      return `${start} - ${end}`;
    }
    return start;
  };

  const hasResults = (topDate?.yesVotes || 0) > 0 || 
                     (topActivity?.yesVotes || 0) > 0 || 
                     (topLocation?.yesVotes || 0) > 0;

  if (!hasResults) {
    return null;
  }

  return (
    <Card className="bg-primary/5 border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-primary">
          <Trophy className="h-5 w-5" />
          <span>{t.eventPage.results.title}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {topDate && topDate.yesVotes > 0 && (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Calendar className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t.eventPage.results.topDate}</p>
              <p className="font-medium">{formatDateOption(topDate.option)}</p>
              <p className="text-xs text-muted-foreground">
                {topDate.yesVotes} {t.eventPage.dateVoting.votes}
              </p>
            </div>
          </div>
        )}

        {topActivity && topActivity.yesVotes > 0 && (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t.eventPage.results.topActivity}</p>
              <p className="font-medium">{topActivity.activity.name}</p>
              <p className="text-xs text-muted-foreground">
                {topActivity.yesVotes} {t.eventPage.dateVoting.votes}
              </p>
            </div>
          </div>
        )}

        {topLocation && topLocation.yesVotes > 0 && (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <MapPin className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t.eventPage.results.topLocation}</p>
              <p className="font-medium">{topLocation.location.name}</p>
              <p className="text-xs text-muted-foreground">
                {topLocation.yesVotes} {t.eventPage.dateVoting.votes}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
