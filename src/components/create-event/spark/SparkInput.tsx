import { Sparkles, Lightbulb, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { useLanguage } from '@/i18n/LanguageContext';

interface SparkInputProps {
  sparkPrompt: string;
  setSparkPrompt: (v: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
}

export const SparkInput = ({ sparkPrompt, setSparkPrompt, onSubmit, isLoading }: SparkInputProps) => {
  const { t } = useLanguage();

  const examples = [
    t.aiConcierge?.spark?.examples?.[0] || "Birthday dinner on Friday with the gang",
    t.aiConcierge?.spark?.examples?.[1] || "Weekend trip somewhere in the mountains, with kids",
    t.aiConcierge?.spark?.examples?.[2] || "Team lunch, people coming from Paris and Lyon",
    t.aiConcierge?.spark?.examples?.[3] || "Let's do something fun!",
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
          <Sparkles className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">
          {t.aiConcierge?.spark?.title || "What's the vibe?"}
        </h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          {t.aiConcierge?.spark?.description || 'Describe your event idea in a few words.'}
        </p>
      </div>

      <Card className="border-2 border-dashed border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
        <CardContent className="pt-6">
          <Textarea
            value={sparkPrompt}
            onChange={(e) => setSparkPrompt(e.target.value)}
            placeholder={t.aiConcierge?.spark?.placeholderHint || "e.g., 'Birthday dinner on Friday downtown'"}
            className="min-h-[120px] text-lg border-none bg-transparent resize-none focus-visible:ring-0 placeholder:text-muted-foreground/60"
            disabled={isLoading}
          />
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-2 justify-center">
        <span className="text-sm text-muted-foreground flex items-center gap-1">
          <Lightbulb className="w-4 h-4" />
          {t.aiConcierge?.spark?.tryThese || 'Try these:'}
        </span>
        {examples.map((example) => (
          <button
            key={example}
            onClick={() => setSparkPrompt(example)}
            disabled={isLoading}
            className="px-3 py-1.5 text-sm rounded-full border border-border bg-background hover:bg-muted transition-colors disabled:opacity-50"
          >
            {example}
          </button>
        ))}
      </div>

      <Button
        onClick={onSubmit}
        disabled={isLoading || !sparkPrompt.trim()}
        size="lg"
        className="w-full text-lg py-6"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            {t.aiConcierge?.spark?.analyzing || 'Analyzing...'}
          </>
        ) : (
          <>
            <Sparkles className="mr-2 h-5 w-5" />
            {t.aiConcierge?.spark?.generate || 'Spark the Idea ✨'}
          </>
        )}
      </Button>
    </div>
  );
};
