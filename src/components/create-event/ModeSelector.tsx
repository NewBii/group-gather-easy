import { Sparkles, ClipboardList } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/i18n/LanguageContext';

type OrganizationMode = 'manual' | 'ai_concierge';

interface ModeSelectorProps {
  selectedMode: OrganizationMode | null;
  onSelectMode: (mode: OrganizationMode) => void;
}

export const ModeSelector = ({ selectedMode, onSelectMode }: ModeSelectorProps) => {
  const { t } = useLanguage();

  const modes = [
    {
      id: 'manual' as OrganizationMode,
      icon: ClipboardList,
      title: t.aiConcierge?.modeSelector?.manual?.title || 'Direct Organizer',
      description: t.aiConcierge?.modeSelector?.manual?.description || 'I know what I want - set up voting options myself',
      gradient: 'from-muted/50 to-muted',
      borderColor: 'border-border',
      selectedBorder: 'border-primary',
    },
    {
      id: 'ai_concierge' as OrganizationMode,
      icon: Sparkles,
      title: t.aiConcierge?.modeSelector?.ai?.title || 'AI Concierge',
      description: t.aiConcierge?.modeSelector?.ai?.description || 'Help me decide - describe your idea and let everyone shape it',
      gradient: 'from-primary/10 via-primary/5 to-accent/10',
      borderColor: 'border-primary/30',
      selectedBorder: 'border-primary',
      recommended: true,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-foreground">
          {t.aiConcierge?.modeSelector?.title || 'How would you like to plan?'}
        </h2>
        <p className="text-muted-foreground">
          Choose your planning style
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {modes.map((mode) => (
          <button
            key={mode.id}
            onClick={() => onSelectMode(mode.id)}
            className={cn(
              'relative flex flex-col items-center p-6 rounded-xl border-2 transition-all duration-300',
              'hover:shadow-lg hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-primary/50',
              `bg-gradient-to-br ${mode.gradient}`,
              selectedMode === mode.id
                ? `${mode.selectedBorder} shadow-md ring-2 ring-primary/20`
                : mode.borderColor
            )}
          >
            {mode.recommended && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 text-xs font-medium bg-primary text-primary-foreground rounded-full">
                {t.aiConcierge?.modeSelector?.ai?.recommended || 'Recommended'}
              </span>
            )}

            <div className={cn(
              'w-16 h-16 rounded-full flex items-center justify-center mb-4',
              mode.id === 'ai_concierge' 
                ? 'bg-primary/20 text-primary' 
                : 'bg-muted-foreground/10 text-muted-foreground'
            )}>
              <mode.icon className={cn(
                'w-8 h-8',
                mode.id === 'ai_concierge' && 'animate-pulse'
              )} />
            </div>

            <h3 className="text-lg font-semibold text-foreground mb-2">
              {mode.title}
            </h3>
            <p className="text-sm text-muted-foreground text-center">
              {mode.description}
            </p>

            {selectedMode === mode.id && (
              <div className="absolute top-4 right-4 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                <svg className="w-4 h-4 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};
