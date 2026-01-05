import { useEffect, useState } from 'react';
import { Trophy, Users, TrendingUp, AlertTriangle, CheckCircle2, MessageCircle, Loader2, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/i18n/LanguageContext';
import { cn } from '@/lib/utils';

interface ConsensusScoreProps {
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
  consensusPercent: number;
}

interface AIRecommendation {
  canFinalize: boolean;
  message: string;
  actionSuggested: 'finalize' | 'wait_for_votes' | 'discuss_dealbreakers' | 'consider_alternative';
}

export const ConsensusScore = ({ eventId, scenarios, totalParticipants }: ConsensusScoreProps) => {
  const { t } = useLanguage();
  const [scores, setScores] = useState<ScenarioScore[]>([]);
  const [votersCount, setVotersCount] = useState(0);
  const [recommendation, setRecommendation] = useState<AIRecommendation | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const calculateScores = async () => {
    const { data: votes } = await supabase
      .from('scenario_votes')
      .select('*')
      .eq('event_id', eventId);

    if (!votes) return;

    const uniqueVoters = new Set(votes.map(v => v.participant_id));
    setVotersCount(uniqueVoters.size);

    const scoreMap = new Map<string, { score: number; votes: number; dealbreakers: number }>();
    scenarios.forEach(s => {
      scoreMap.set(s.id, { score: 0, votes: 0, dealbreakers: 0 });
    });

    votes.forEach(vote => {
      const current = scoreMap.get(vote.scenario_id);
      if (!current) return;

      if (vote.is_dealbreaker) {
        current.dealbreakers += 1;
        current.score -= 10; // Vetoes are powerful
      } else if (vote.rank) {
        current.votes += 1;
        current.score += vote.rank === 1 ? 3 : vote.rank === 2 ? 2 : 1;
      }

      scoreMap.set(vote.scenario_id, current);
    });

    // Calculate consensus percentage
    const maxPossibleScore = uniqueVoters.size * 3; // Everyone votes it as #1
    
    const calculatedScores: ScenarioScore[] = scenarios.map(s => {
      const data = scoreMap.get(s.id)!;
      // Consensus = (actual score / max possible) * 100, but penalize dealbreakers heavily
      let consensusPercent = maxPossibleScore > 0 
        ? Math.max(0, Math.min(100, ((data.score + (data.dealbreakers * 10)) / maxPossibleScore) * 100))
        : 0;
      
      // If there are dealbreakers, cap consensus at 50%
      if (data.dealbreakers > 0) {
        consensusPercent = Math.min(consensusPercent, 50);
      }
      
      return {
        scenarioId: s.id,
        title: s.title,
        label: s.scenario_label,
        consensusPercent: Math.round(consensusPercent),
        ...data,
      };
    });

    calculatedScores.sort((a, b) => b.score - a.score);
    setScores(calculatedScores);

    // Generate recommendation based on scores
    if (calculatedScores.length > 0 && uniqueVoters.size > 0) {
      const leader = calculatedScores[0];
      const votingProgress = uniqueVoters.size / totalParticipants;
      
      if (votingProgress < 0.5) {
        setRecommendation({
          canFinalize: false,
          message: 'Waiting for more participants to vote before making a recommendation.',
          actionSuggested: 'wait_for_votes'
        });
      } else if (leader.dealbreakers > 0) {
        setRecommendation({
          canFinalize: false,
          message: `${leader.label} is leading but has ${leader.dealbreakers} veto(s). Consider discussing with the group or looking at alternatives.`,
          actionSuggested: 'discuss_dealbreakers'
        });
      } else if (leader.consensusPercent >= 60) {
        setRecommendation({
          canFinalize: true,
          message: `${leader.label} has strong consensus (${leader.consensusPercent}%) with no vetoes. Ready to finalize!`,
          actionSuggested: 'finalize'
        });
      } else {
        const alternative = calculatedScores.find(s => s.dealbreakers === 0 && s.scenarioId !== leader.scenarioId);
        if (alternative) {
          setRecommendation({
            canFinalize: false,
            message: `Close race! ${alternative.label} has no vetoes and might be a safer choice.`,
            actionSuggested: 'consider_alternative'
          });
        } else {
          setRecommendation({
            canFinalize: false,
            message: 'No clear winner yet. The group may need more discussion.',
            actionSuggested: 'wait_for_votes'
          });
        }
      }
    }
  };

  useEffect(() => {
    calculateScores();

    const channel = supabase
      .channel('consensus-score')
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
  }, [eventId, scenarios, totalParticipants]);

  const progressPercent = totalParticipants > 0 ? (votersCount / totalParticipants) * 100 : 0;
  const frontrunner = scores[0];

  const getRecommendationStyle = (action: string) => {
    switch (action) {
      case 'finalize':
        return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200';
      case 'discuss_dealbreakers':
        return 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200';
      case 'consider_alternative':
        return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200';
      default:
        return 'bg-muted border-border';
    }
  };

  const getRecommendationIcon = (action: string) => {
    switch (action) {
      case 'finalize':
        return <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />;
      case 'discuss_dealbreakers':
        return <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />;
      case 'consider_alternative':
        return <MessageCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />;
      default:
        return <Loader2 className="h-4 w-4 animate-spin" />;
    }
  };

  return (
    <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <TrendingUp className="h-5 w-5 text-primary" />
          Decision Barometer
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Voting progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-1 text-muted-foreground">
              <Users className="h-4 w-4" />
              {votersCount}/{totalParticipants} have voted
            </span>
            <span className="font-medium">{Math.round(progressPercent)}%</span>
          </div>
          <Progress value={progressPercent} className="h-2" />
        </div>

        {/* AI Recommendation */}
        {recommendation && (
          <Alert className={cn('border', getRecommendationStyle(recommendation.actionSuggested))}>
            <div className="flex items-start gap-2">
              {getRecommendationIcon(recommendation.actionSuggested)}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles className="h-3 w-3" />
                  <span className="text-xs font-medium uppercase tracking-wide">AI Recommendation</span>
                </div>
                <AlertDescription className="text-sm">
                  {recommendation.message}
                </AlertDescription>
              </div>
            </div>
          </Alert>
        )}

        {/* Frontrunner with consensus score */}
        {frontrunner && frontrunner.score > 0 && (
          <div className={cn(
            'flex items-center gap-3 p-3 rounded-lg',
            frontrunner.dealbreakers === 0 ? 'bg-primary/10' : 'bg-amber-100 dark:bg-amber-900/20'
          )}>
            <Trophy className={cn(
              'h-6 w-6',
              frontrunner.dealbreakers === 0 ? 'text-primary' : 'text-amber-600'
            )} />
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-foreground">
                  {frontrunner.title}
                </p>
                <Badge 
                  variant={frontrunner.consensusPercent >= 60 ? 'default' : 'secondary'}
                  className="ml-2"
                >
                  {frontrunner.consensusPercent}% consensus
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                {frontrunner.label} • Score: {frontrunner.score}
                {frontrunner.dealbreakers > 0 && (
                  <span className="text-destructive ml-2">⛔ {frontrunner.dealbreakers} veto(s)</span>
                )}
              </p>
            </div>
          </div>
        )}

        {/* Score breakdown with consensus bars */}
        <div className="space-y-3">
          {scores.map((score, index) => (
            <div key={score.scenarioId} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  {index === 0 && score.score > 0 && score.dealbreakers === 0 && (
                    <span className="text-lg">🏆</span>
                  )}
                  {score.dealbreakers > 0 && (
                    <span className="text-lg">⚠️</span>
                  )}
                  <span className={cn(
                    index === 0 && score.score > 0 ? 'font-medium' : 'text-muted-foreground'
                  )}>
                    {score.label}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {score.dealbreakers > 0 && (
                    <Badge variant="destructive" className="text-xs">
                      ⛔ {score.dealbreakers}
                    </Badge>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {score.consensusPercent}%
                  </span>
                </div>
              </div>
              <Progress 
                value={score.consensusPercent} 
                className={cn(
                  'h-1.5',
                  score.dealbreakers > 0 && '[&>div]:bg-amber-500'
                )}
              />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};