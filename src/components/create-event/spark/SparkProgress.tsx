import { useLanguage } from '@/i18n/LanguageContext';
import { Sparkles, MessageSquare, ClipboardCheck, Loader2 } from 'lucide-react';

type Phase = 'input' | 'clarify' | 'summary' | 'generating';

interface SparkProgressProps {
  currentPhase: Phase;
}

const phases: { key: Phase; icon: typeof Sparkles }[] = [
  { key: 'input', icon: Sparkles },
  { key: 'clarify', icon: MessageSquare },
  { key: 'summary', icon: ClipboardCheck },
  { key: 'generating', icon: Loader2 },
];

export const SparkProgress = ({ currentPhase }: SparkProgressProps) => {
  const { language } = useLanguage();
  
  const labels: Record<Phase, string> = language === 'fr'
    ? { input: 'Décrire', clarify: 'Préciser', summary: 'Valider', generating: 'Générer' }
    : { input: 'Describe', clarify: 'Clarify', summary: 'Review', generating: 'Generate' };

  const currentIndex = phases.findIndex(p => p.key === currentPhase);

  return (
    <div className="flex items-center justify-center gap-1 sm:gap-2 mb-6">
      {phases.map((phase, i) => {
        const Icon = phase.icon;
        const isActive = i === currentIndex;
        const isDone = i < currentIndex;
        return (
          <div key={phase.key} className="flex items-center gap-1 sm:gap-2">
            {i > 0 && (
              <div className={`h-px w-4 sm:w-8 transition-colors ${isDone ? 'bg-primary' : 'bg-border'}`} />
            )}
            <div className="flex flex-col items-center gap-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all text-xs ${
                isActive ? 'bg-primary text-primary-foreground scale-110' :
                isDone ? 'bg-primary/20 text-primary' :
                'bg-muted text-muted-foreground'
              }`}>
                <Icon className={`w-4 h-4 ${isActive && phase.key === 'generating' ? 'animate-spin' : ''}`} />
              </div>
              <span className={`text-[10px] sm:text-xs transition-colors ${
                isActive ? 'text-primary font-medium' : 'text-muted-foreground'
              }`}>
                {labels[phase.key]}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
