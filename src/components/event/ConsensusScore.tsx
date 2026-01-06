import { useEffect, useState } from 'react';
import { Trophy, Users, TrendingUp, AlertTriangle, CheckCircle2, MessageCircle, Loader2, Sparkles, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/i18n/LanguageContext';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { fr, enUS } from 'date-fns/locale';

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

interface TopDateInfo {
  date: string;
  availableCount: number;
  totalVoters: number;
  availabilityPercent: number;
  isLongWeekend: boolean;
  holidayName: string | null;
}

export const ConsensusScore = ({ eventId, scenarios, totalParticipants }: ConsensusScoreProps) => {
  const { t, language } = useLanguage();
  const [scores, setScores] = useState<ScenarioScore[]>([]);
  const [votersCount, setVotersCount] = useState(0);
  const [recommendation, setRecommendation] = useState<AIRecommendation | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [topDate, setTopDate] = useState<TopDateInfo | null>(null);

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

  // Calculate top date from date votes
  const calculateTopDate = async () => {
    const scenarioIds = scenarios.map(s => s.id);
    if (scenarioIds.length === 0) return;

    // Fetch all date options
    const { data: dateOptions } = await supabase
      .from('scenario_date_options')
      .select('*')
      .in('scenario_id', scenarioIds);

    if (!dateOptions || dateOptions.length === 0) return;

    // Fetch all date votes
    const { data: dateVotes } = await supabase
      .from('scenario_date_votes')
      .select('*')
      .in('scenario_id', scenarioIds);

    if (!dateVotes || dateVotes.length === 0) return;

    // Aggregate by date (group same dates across scenarios)
    const dateMap = new Map<string, { 
      available: number; 
      maybe: number; 
      unavailable: number;
      voters: Set<string>;
      isLongWeekend: boolean;
      holidayName: string | null;
    }>();

    // Initialize date map from options
    dateOptions.forEach(opt => {
      if (!dateMap.has(opt.suggested_date)) {
        dateMap.set(opt.suggested_date, {
          available: 0,
          maybe: 0,
          unavailable: 0,
          voters: new Set(),
          isLongWeekend: opt.is_long_weekend || false,
          holidayName: opt.holiday_name,
        });
      }
    });

    // Count votes per date
    dateVotes.forEach(vote => {
      const opt = dateOptions.find(o => o.id === vote.date_option_id);
      if (!opt) return;
      
      const dateData = dateMap.get(opt.suggested_date);
      if (!dateData) return;

      dateData.voters.add(vote.participant_id);
      if (vote.availability === 'available') {
        dateData.available += 1;
      } else if (vote.availability === 'maybe') {
        dateData.maybe += 1;
      } else if (vote.availability === 'unavailable') {
        dateData.unavailable += 1;
      }
    });

    // Find date with highest availability
    let bestDate: string | null = null;
    let bestScore = -1;
    let bestData: typeof dateMap extends Map<string, infer V> ? V : never | null = null;

    dateMap.forEach((data, date) => {
      // Score = available count (maybe counts as 0.5)
      const score = data.available + (data.maybe * 0.5);
      if (score > bestScore && data.voters.size > 0) {
        bestScore = score;
        bestDate = date;
        bestData = data;
      }
    });

    if (bestDate && bestData) {
      const totalVoters = (bestData as any).voters.size;
      const availableCount = (bestData as any).available;
      const availabilityPercent = totalVoters > 0 
        ? Math.round((availableCount / totalVoters) * 100)
        : 0;

      setTopDate({
        date: bestDate,
        availableCount,
        totalVoters,
        availabilityPercent,
        isLongWeekend: (bestData as any).isLongWeekend,
        holidayName: (bestData as any).holidayName,
      });
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = parseISO(dateString);
      return format(date, language === 'fr' ? 'EEEE d MMMM' : 'EEEE, MMMM d', {
        locale: language === 'fr' ? fr : enUS,
      });
    } catch {
      return dateString;
    }
  };

  useEffect(() => {
    calculateScores();
    calculateTopDate();

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
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'scenario_date_votes',
        },
        () => {
          calculateTopDate();
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

        {/* Top Date Display */}
        {topDate && (
          <div className="flex items-center gap-3 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
            <Calendar className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            <div className="flex-1">
              <p className="text-sm font-medium text-emerald-800 dark:text-emerald-200">
                {t.aiConcierge?.pulse?.dateAvailability?.topDate || 'Top Date'}: {formatDate(topDate.date)}
              </p>
              <p className="text-xs text-emerald-600 dark:text-emerald-400">
                {topDate.availabilityPercent}% {t.aiConcierge?.pulse?.dateAvailability?.groupAvailability || 'group availability'}
                {topDate.isLongWeekend && (
                  <span className="ml-2">🏖️ {topDate.holidayName || (t.aiConcierge?.pulse?.dateAvailability?.longWeekend || 'Long Weekend')}</span>
                )}
              </p>
            </div>
            <Badge variant="outline" className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700">
              {topDate.availableCount}/{topDate.totalVoters}
            </Badge>
          </div>
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