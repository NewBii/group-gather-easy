import { useState } from 'react';
import { Pencil, Check, Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLanguage } from '@/i18n/LanguageContext';

export interface StructuredContext {
  when: string;
  who: string;
  what: string;
  where: string;
  budget: string;
}

interface SparkSummaryProps {
  context: StructuredContext;
  onContextChange: (ctx: StructuredContext) => void;
  onGenerate: () => void;
  isGenerating: boolean;
  generationStep: string;
}

const dimensions: { key: keyof StructuredContext; icon: string }[] = [
  { key: 'when', icon: '📅' },
  { key: 'who', icon: '👥' },
  { key: 'what', icon: '🎯' },
  { key: 'where', icon: '📍' },
  { key: 'budget', icon: '💶' },
];

export const SparkSummary = ({ context, onContextChange, onGenerate, isGenerating, generationStep }: SparkSummaryProps) => {
  const { language } = useLanguage();
  const [editing, setEditing] = useState<keyof StructuredContext | null>(null);

  const labels: Record<keyof StructuredContext, string> = language === 'fr'
    ? { when: 'Quand', who: 'Qui', what: 'Quoi', where: 'Où', budget: 'Budget' }
    : { when: 'When', who: 'Who', what: 'What', where: 'Where', budget: 'Budget' };

  const fallback = language === 'fr' ? 'À décider avec le groupe' : 'To be decided with group';
  const generateLabel = language === 'fr' ? 'Générer les scénarios →' : 'Generate scenarios →';
  const summaryTitle = language === 'fr' ? 'Voici ce que j\'ai compris' : "Here's what I understood";

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
      <p className="text-sm text-muted-foreground text-center">{summaryTitle}</p>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {dimensions.map(({ key, icon }) => (
          <div key={key} className="flex items-start gap-3 p-3 rounded-xl bg-muted/40 border border-border/50">
            <span className="text-lg mt-0.5">{icon}</span>
            <div className="flex-1 min-w-0">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{labels[key]}</span>
              {editing === key ? (
                <div className="flex items-center gap-1 mt-1">
                  <Input
                    value={context[key]}
                    onChange={(e) => onContextChange({ ...context, [key]: e.target.value })}
                    className="h-7 text-sm"
                    autoFocus
                    onKeyDown={(e) => e.key === 'Enter' && setEditing(null)}
                  />
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditing(null)}>
                    <Check className="w-3 h-3" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-1 mt-1">
                  <p className="text-sm truncate">{context[key] || fallback}</p>
                  <Button variant="ghost" size="icon" className="h-6 w-6 flex-shrink-0" onClick={() => setEditing(key)}>
                    <Pencil className="w-3 h-3" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <Button onClick={onGenerate} disabled={isGenerating} size="lg" className="w-full text-lg py-6 mt-4">
        {isGenerating ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            {generationStep}
          </>
        ) : (
          <>
            <Sparkles className="mr-2 h-5 w-5" />
            {generateLabel}
          </>
        )}
      </Button>
    </div>
  );
};
