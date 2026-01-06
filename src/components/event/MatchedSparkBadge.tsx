import { Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useLanguage } from '@/i18n/LanguageContext';

interface MatchedSpark {
  id: string;
  text: string;
  participantName?: string;
}

interface MatchedSparkBadgeProps {
  matchedSparks: MatchedSpark[];
}

export const MatchedSparkBadge = ({ matchedSparks }: MatchedSparkBadgeProps) => {
  const { language } = useLanguage();

  if (!matchedSparks || matchedSparks.length === 0) return null;

  const t = {
    matchesYourRequest: language === 'fr' ? 'Correspond à votre souhait' : 'Matches your request for',
    from: language === 'fr' ? 'de' : 'from',
  };

  // Show first spark, with tooltip for more
  const firstSpark = matchedSparks[0];
  const truncatedText = firstSpark.text.length > 25 
    ? firstSpark.text.slice(0, 25) + '...' 
    : firstSpark.text;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge 
            variant="outline" 
            className="bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800 gap-1 animate-in fade-in-0 slide-in-from-bottom-2"
          >
            <Sparkles className="h-3 w-3" />
            {t.matchesYourRequest} "{truncatedText}"
            {matchedSparks.length > 1 && (
              <span className="ml-1 text-xs opacity-70">+{matchedSparks.length - 1}</span>
            )}
          </Badge>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <div className="space-y-1">
            {matchedSparks.map((spark) => (
              <div key={spark.id} className="text-sm">
                <span className="font-medium">"{spark.text}"</span>
                {spark.participantName && (
                  <span className="text-muted-foreground ml-1">
                    {t.from} {spark.participantName}
                  </span>
                )}
              </div>
            ))}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
