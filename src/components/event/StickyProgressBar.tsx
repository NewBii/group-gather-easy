import { Trophy, Users, TrendingUp } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface StickyProgressBarProps {
  votersCount: number;
  totalParticipants: number;
  frontrunnerLabel?: string;
  frontrunnerConsensus?: number;
  className?: string;
}

export const StickyProgressBar = ({
  votersCount,
  totalParticipants,
  frontrunnerLabel,
  frontrunnerConsensus,
  className,
}: StickyProgressBarProps) => {
  const progressPercent = totalParticipants > 0 
    ? Math.round((votersCount / totalParticipants) * 100) 
    : 0;

  return (
    <div 
      className={cn(
        'sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border',
        'px-4 py-2 shadow-sm',
        className
      )}
    >
      <div className="flex items-center justify-between gap-4 max-w-md mx-auto">
        {/* Voting progress */}
        <div className="flex items-center gap-2 flex-1">
          <Users className="h-4 w-4 text-muted-foreground shrink-0" />
          <div className="flex-1 space-y-1">
            <Progress value={progressPercent} className="h-2" />
          </div>
          <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">
            {votersCount}/{totalParticipants}
          </span>
        </div>

        {/* Frontrunner indicator */}
        {frontrunnerLabel && frontrunnerConsensus !== undefined && frontrunnerConsensus > 0 && (
          <div className="flex items-center gap-1.5">
            <Trophy className="h-4 w-4 text-primary shrink-0" />
            <Badge 
              variant={frontrunnerConsensus >= 60 ? 'default' : 'secondary'}
              className="text-xs px-2 py-0.5"
            >
              {frontrunnerLabel}: {frontrunnerConsensus}%
            </Badge>
          </div>
        )}
      </div>
    </div>
  );
};
