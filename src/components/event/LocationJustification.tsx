import { MapPin, Info } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

export interface LocationInfo {
  townName: string;
  justification?: string;
  isLocked?: boolean;
}

interface LocationJustificationProps {
  location: LocationInfo;
  className?: string;
}

export const LocationJustification = ({ location, className }: LocationJustificationProps) => {
  if (!location?.townName) return null;

  return (
    <div className={cn('flex items-start gap-2', className)}>
      <Badge 
        variant={location.isLocked ? 'default' : 'secondary'} 
        className={cn(
          'gap-1.5 shrink-0',
          location.isLocked && 'bg-primary text-primary-foreground'
        )}
      >
        <MapPin className="h-3 w-3" />
        {location.townName}
      </Badge>
      
      {location.justification && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
                <Info className="h-3 w-3" />
                <span className="line-clamp-1 max-w-[180px] text-left">
                  {location.justification}
                </span>
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-[280px]">
              <p className="text-sm">{location.justification}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  );
};
