import { Sparkles, Users, Lock, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/i18n/LanguageContext';

type AIPhase = 'spark' | 'pulse' | 'lockdown';

interface AIProgressStepperProps {
  currentPhase: AIPhase;
  className?: string;
}

export const AIProgressStepper = ({ currentPhase, className }: AIProgressStepperProps) => {
  const { language, t } = useLanguage();

  const phases = [
    {
      id: 'spark' as AIPhase,
      icon: Sparkles,
      label: t.aiConcierge?.spark?.title || 'Spark',
      description: language === 'fr' ? 'Idée créée' : 'Idea created',
    },
    {
      id: 'pulse' as AIPhase,
      icon: Users,
      label: t.aiConcierge?.pulse?.title || 'Pulse',
      description: language === 'fr' ? 'Votes en cours' : 'Gathering votes',
    },
    {
      id: 'lockdown' as AIPhase,
      icon: Lock,
      label: t.aiConcierge?.lockdown?.title || 'Lockdown',
      description: language === 'fr' ? 'Finalisé' : 'Finalized',
    },
  ];

  const getPhaseIndex = (phase: AIPhase) => phases.findIndex(p => p.id === phase);
  const currentIndex = getPhaseIndex(currentPhase);

  return (
    <div className={cn('flex justify-center w-full', className)}>
      <div className="flex items-start justify-center gap-0">
        {phases.map((phase, index) => {
          const isCompleted = index < currentIndex;
          const isCurrent = index === currentIndex;
          const isLast = index === phases.length - 1;

          return (
            <div key={phase.id} className="flex items-start">
              {/* Step circle and label */}
              <div className="flex flex-col items-center w-28">
                <div
                  className={cn(
                    'w-12 h-12 rounded-full flex items-center justify-center transition-all duration-500',
                    isCompleted && 'bg-primary text-primary-foreground',
                    isCurrent && 'bg-primary text-primary-foreground ring-4 ring-primary/20 animate-pulse',
                    !isCompleted && !isCurrent && 'bg-muted text-muted-foreground border-2 border-dashed border-muted-foreground/30'
                  )}
                >
                  {isCompleted ? (
                    <Check className="h-6 w-6" />
                  ) : (
                    <phase.icon className="h-5 w-5" />
                  )}
                </div>
                <div className="mt-3 text-center">
                  <p className={cn(
                    'text-sm font-semibold',
                    isCurrent ? 'text-primary' : isCompleted ? 'text-foreground' : 'text-muted-foreground'
                  )}>
                    {phase.label}
                  </p>
                  <p className="text-xs text-muted-foreground hidden sm:block">
                    {phase.description}
                  </p>
                </div>
              </div>

              {/* Connector line */}
              {!isLast && (
                <div className="w-12 sm:w-16 mt-6">
                  <div
                    className={cn(
                      'h-1 rounded-full transition-all duration-500',
                      index < currentIndex ? 'bg-primary' : 'bg-muted border border-dashed border-muted-foreground/20'
                    )}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
