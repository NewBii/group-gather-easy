import { Sun, Moon, Sunset, Coffee, Zap, Heart, Briefcase, Ban } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { useLanguage } from '@/i18n/LanguageContext';

interface ScenarioCardProps {
  scenario: {
    id: string;
    scenario_label: string;
    title: string;
    description?: string;
    suggested_date?: string;
    suggested_time_of_day?: string;
    suggested_vibe?: string;
  };
  rank?: number;
  isDealbreaker?: boolean;
  onRankChange?: (rank: number | null) => void;
  onDealbreakerToggle?: () => void;
  isVotingEnabled?: boolean;
  showRanking?: boolean;
}

const timeIcons = {
  morning: { icon: Sun, label: '🌅 Morning', color: 'text-amber-500' },
  afternoon: { icon: Sunset, label: '☀️ Afternoon', color: 'text-orange-500' },
  evening: { icon: Moon, label: '🌙 Evening', color: 'text-indigo-500' },
};

const vibeIcons = {
  casual: { icon: Coffee, label: 'Casual', color: 'bg-green-100 text-green-700' },
  active: { icon: Zap, label: 'Active', color: 'bg-blue-100 text-blue-700' },
  relaxed: { icon: Heart, label: 'Relaxed', color: 'bg-pink-100 text-pink-700' },
  formal: { icon: Briefcase, label: 'Formal', color: 'bg-purple-100 text-purple-700' },
};

export const ScenarioCard = ({
  scenario,
  rank,
  isDealbreaker,
  onRankChange,
  onDealbreakerToggle,
  isVotingEnabled = true,
  showRanking = true,
}: ScenarioCardProps) => {
  const { language } = useLanguage();
  const time = scenario.suggested_time_of_day as keyof typeof timeIcons;
  const vibe = scenario.suggested_vibe as keyof typeof vibeIcons;
  const TimeIcon = time ? timeIcons[time]?.icon : null;
  const VibeConfig = vibe ? vibeIcons[vibe] : null;

  const formattedDate = scenario.suggested_date
    ? format(parseISO(scenario.suggested_date), language === 'fr' ? 'EEEE d MMMM' : 'EEEE, MMMM d')
    : null;

  return (
    <Card
      className={cn(
        'relative transition-all duration-300',
        isDealbreaker && 'opacity-60 border-destructive bg-destructive/5',
        rank === 1 && !isDealbreaker && 'ring-2 ring-primary border-primary',
        rank === 2 && !isDealbreaker && 'ring-1 ring-primary/50',
      )}
    >
      {/* Rank badge */}
      {rank && !isDealbreaker && (
        <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm shadow-md">
          {rank}
        </div>
      )}

      {/* Dealbreaker overlay */}
      {isDealbreaker && (
        <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center shadow-md">
          <Ban className="w-4 h-4" />
        </div>
      )}

      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <Badge variant="outline" className="mb-2">
              {scenario.scenario_label}
            </Badge>
            <CardTitle className="text-lg">{scenario.title}</CardTitle>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {scenario.description && (
          <p className="text-sm text-muted-foreground">{scenario.description}</p>
        )}

        <div className="flex flex-wrap gap-2">
          {formattedDate && (
            <Badge variant="secondary" className="capitalize">
              📅 {formattedDate}
            </Badge>
          )}
          {TimeIcon && (
            <Badge variant="secondary" className={timeIcons[time].color}>
              {timeIcons[time].label}
            </Badge>
          )}
          {VibeConfig && (
            <Badge className={VibeConfig.color}>
              {VibeConfig.label}
            </Badge>
          )}
        </div>

        {/* Ranking buttons */}
        {showRanking && isVotingEnabled && (
          <div className="space-y-3 pt-2 border-t">
            <div className="flex gap-2">
              {[1, 2, 3].map((r) => (
                <Button
                  key={r}
                  variant={rank === r ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => onRankChange?.(rank === r ? null : r)}
                  className="flex-1"
                  disabled={isDealbreaker}
                >
                  {r === 1 ? '1st' : r === 2 ? '2nd' : '3rd'}
                </Button>
              ))}
            </div>

            <Button
              variant={isDealbreaker ? 'destructive' : 'ghost'}
              size="sm"
              onClick={onDealbreakerToggle}
              className="w-full text-sm"
            >
              <Ban className="mr-2 h-4 w-4" />
              {isDealbreaker ? 'Remove dealbreaker' : "This doesn't work for me"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
