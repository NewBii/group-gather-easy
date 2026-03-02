import { Lock, Vote, HelpCircle, Baby, Accessibility, Utensils, DollarSign, MapPin, PartyPopper, Mountain, Home } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/i18n/LanguageContext';

interface ConstraintBadgeProps {
  type: 'fixed' | 'flexible' | 'missing';
  category: 'date' | 'location' | 'time';
  displayLabel: string;
  className?: string;
}

const categoryIcons = {
  date: '📅',
  location: '📍',
  time: '🕐',
};

export const ConstraintBadge = ({ type, category, displayLabel, className }: ConstraintBadgeProps) => {
  const icon = categoryIcons[category];
  const { language } = useLanguage();
  
  if (type === 'fixed') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge 
              variant="default" 
              className={cn(
                'bg-primary text-primary-foreground font-medium gap-1',
                className
              )}
            >
              <Lock className="h-3 w-3" />
              {icon} {displayLabel}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>{language === 'fr' ? 'Fixé par l\'organisateur' : 'This is locked by the organizer'}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }
  
  if (type === 'flexible') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge 
              variant="outline" 
              className={cn(
                'border-amber-500 text-amber-700 dark:text-amber-400 gap-1',
                className
              )}
            >
              <Vote className="h-3 w-3" />
              {icon} {displayLabel}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>{language === 'fr' ? 'Le groupe votera' : 'The group will vote on this'}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }
  
  // Missing
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge 
            variant="secondary" 
            className={cn(
              'text-muted-foreground gap-1',
              className
            )}
          >
            <HelpCircle className="h-3 w-3" />
            {icon} {displayLabel}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>{language === 'fr' ? 'À décider' : 'To be decided'}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

interface SpecialTraitBadgeProps {
  type: 'kid_friendly' | 'accessibility' | 'dietary' | 'budget' | 'midpoint' | 'nightlife' | 'outdoor' | 'indoor';
  label: string;
  description?: string;
  className?: string;
}

const traitConfig = {
  kid_friendly: { icon: Baby, color: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400' },
  accessibility: { icon: Accessibility, color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  dietary: { icon: Utensils, color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  budget: { icon: DollarSign, color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
  midpoint: { icon: MapPin, color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
  nightlife: { icon: PartyPopper, color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' },
  outdoor: { icon: Mountain, color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  indoor: { icon: Home, color: 'bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-400' },
};

export const SpecialTraitBadge = ({ type, label, description, className }: SpecialTraitBadgeProps) => {
  const config = traitConfig[type];
  const Icon = config.icon;
  
  if (description) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge className={cn(config.color, 'gap-1', className)}>
              <Icon className="h-3 w-3" />
              {label}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>{description}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }
  
  return (
    <Badge className={cn(config.color, 'gap-1', className)}>
      <Icon className="h-3 w-3" />
      {label}
    </Badge>
  );
};

interface MidpointInfoProps {
  suggestedLocation: string;
  travelLogic: string;
  className?: string;
}

export const MidpointInfo = ({ suggestedLocation, travelLogic, className }: MidpointInfoProps) => {
  return (
    <div className={cn('p-3 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800', className)}>
      <div className="flex items-center gap-2 mb-1">
        <MapPin className="h-4 w-4 text-purple-600 dark:text-purple-400" />
        <span className="font-medium text-purple-700 dark:text-purple-300">Fair Midpoint</span>
      </div>
      <p className="text-sm font-medium text-foreground">{suggestedLocation}</p>
      <p className="text-xs text-muted-foreground mt-1">{travelLogic}</p>
    </div>
  );
};