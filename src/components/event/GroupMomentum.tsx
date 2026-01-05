import { useEffect, useState } from 'react';
import { Trophy, Users, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/i18n/LanguageContext';

interface GroupMomentumProps {
  eventId: string;
  scenarios: Array<{
    id: string;
    title: string;
    scenario_label: string;
  }>;
  totalParticipants: number;
}

interface ScenarioScore {
  scenarioId: string;
  title: string;
  label: string;
  score: number;
  votes: number;
  dealbreakers: number;
}

export const GroupMomentum = ({ eventId, scenarios, totalParticipants }: GroupMomentumProps) => {
  const { t } = useLanguage();
  const [scores, setScores] = useState<ScenarioScore[]>([]);
  const [votersCount, setVotersCount] = useState(0);

  const calculateScores = async () => {
    const { data: votes } = await supabase
      .from('scenario_votes')
      .select('*')
      .eq('event_id', eventId);

    if (!votes) return;

    // Count unique voters
    const uniqueVoters = new Set(votes.map(v => v.participant_id));
    setVotersCount(uniqueVoters.size);

    // Calculate scores for each scenario
    const scoreMap = new Map<string, { score: number; votes: number; dealbreakers: number }>();

    scenarios.forEach(s => {
      scoreMap.set(s.id, { score: 0, votes: 0, dealbreakers: 0 });
    });

    votes.forEach(vote => {
      const current = scoreMap.get(vote.scenario_id);
      if (!current) return;

      if (vote.is_dealbreaker) {
        current.dealbreakers += 1;
        current.score -= 5;
      } else if (vote.rank) {
        current.votes += 1;
        current.score += vote.rank === 1 ? 3 : vote.rank === 2 ? 2 : 1;
      }

      scoreMap.set(vote.scenario_id, current);
    });

    const calculatedScores: ScenarioScore[] = scenarios.map(s => ({
      scenarioId: s.id,
      title: s.title,
      label: s.scenario_label,
      ...scoreMap.get(s.id)!,
    }));

    // Sort by score descending
    calculatedScores.sort((a, b) => b.score - a.score);
    setScores(calculatedScores);
  };

  useEffect(() => {
    calculateScores();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('group-momentum')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'scenario_votes',
          filter: `event_id=eq.${eventId}`,
        },
        () => {
          calculateScores();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [eventId, scenarios]);

  const progressPercent = totalParticipants > 0 ? (votersCount / totalParticipants) * 100 : 0;
  const frontrunner = scores[0];

  return (
    <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <TrendingUp className="h-5 w-5 text-primary" />
          {t.aiConcierge?.pulse?.momentum?.title || 'Group Momentum'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Voting progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-1 text-muted-foreground">
              <Users className="h-4 w-4" />
              {t.aiConcierge?.pulse?.momentum?.progress?.replace('{count}', String(votersCount)).replace('{total}', String(totalParticipants)) || `${votersCount}/${totalParticipants} have voted`}
            </span>
            <span className="font-medium">{Math.round(progressPercent)}%</span>
          </div>
          <Progress value={progressPercent} className="h-2" />
        </div>

        {/* Frontrunner */}
        {frontrunner && frontrunner.score > 0 && (
          <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/10 animate-pulse">
            <Trophy className="h-6 w-6 text-primary" />
            <div>
              <p className="text-sm font-medium text-foreground">
                {t.aiConcierge?.pulse?.momentum?.frontrunner?.replace('{option}', frontrunner.title) || `${frontrunner.title} is the frontrunner!`}
              </p>
              <p className="text-xs text-muted-foreground">
                {frontrunner.label} • Score: {frontrunner.score}
              </p>
            </div>
          </div>
        )}

        {/* Score breakdown */}
        <div className="space-y-2">
          {scores.map((score, index) => (
            <div
              key={score.scenarioId}
              className="flex items-center justify-between text-sm"
            >
              <div className="flex items-center gap-2">
                {index === 0 && score.score > 0 && (
                  <span className="text-lg">🏆</span>
                )}
                <span className={index === 0 && score.score > 0 ? 'font-medium' : 'text-muted-foreground'}>
                  {score.label}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {score.dealbreakers > 0 && (
                  <Badge variant="destructive" className="text-xs">
                    ⛔ {score.dealbreakers}
                  </Badge>
                )}
                <Badge variant="secondary">
                  {score.score} pts
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
