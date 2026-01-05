import { useState } from 'react';
import { Sparkles, Loader2, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { useLanguage } from '@/i18n/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface SparkPhaseProps {
  onEventCreated: (eventId: string, slug: string) => void;
  userId?: string | null;
}

const generateSlug = (title: string): string => {
  const base = title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .substring(0, 30);
  const suffix = Math.random().toString(36).substring(2, 8);
  return `${base}-${suffix}`;
};

export const SparkPhase = ({ onEventCreated, userId }: SparkPhaseProps) => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [sparkPrompt, setSparkPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const examples = [
    t.aiConcierge?.spark?.examples?.[0] || 'Birthday dinner',
    t.aiConcierge?.spark?.examples?.[1] || 'Weekend trip',
    t.aiConcierge?.spark?.examples?.[2] || 'Game night',
    t.aiConcierge?.spark?.examples?.[3] || 'Team lunch',
  ];

  const handleGenerate = async () => {
    if (!sparkPrompt.trim()) {
      toast({
        title: 'Please describe your event idea',
        variant: 'destructive',
      });
      return;
    }

    setIsGenerating(true);

    try {
      // Call AI to generate event draft
      const { data: aiResponse, error: aiError } = await supabase.functions.invoke('ai-event-assistant', {
        body: {
          action: 'generate-draft',
          sparkPrompt: sparkPrompt.trim(),
        },
      });

      if (aiError) throw aiError;
      if (!aiResponse?.success) throw new Error(aiResponse?.error || 'AI generation failed');

      const draft = aiResponse.data;
      const slug = generateSlug(draft.title);

      // Create the event
      const { data: event, error: eventError } = await supabase
        .from('events')
        .insert({
          title: draft.title,
          description: draft.description,
          event_type: draft.eventType,
          organization_mode: 'ai_concierge',
          ai_phase: 'spark',
          spark_prompt: sparkPrompt.trim(),
          unique_slug: slug,
          status: 'active',
          created_by: userId ?? null,
        })
        .select()
        .single();

      if (eventError) throw eventError;

      // Generate scenarios for the Pulse phase
      const { data: scenarioResponse, error: scenarioError } = await supabase.functions.invoke('ai-event-assistant', {
        body: {
          action: 'generate-scenarios',
          sparkPrompt: sparkPrompt.trim(),
          eventId: event.id,
        },
      });

      if (scenarioError) {
        console.error('Scenario generation error:', scenarioError);
        // Continue anyway, scenarios can be generated later
      } else if (scenarioResponse?.success && scenarioResponse.data?.scenarios) {
        // Save scenarios to database
        const scenarios = scenarioResponse.data.scenarios.map((s: any) => ({
          event_id: event.id,
          scenario_label: `Option ${s.label}`,
          title: s.title,
          description: s.description,
          suggested_date: s.suggested_date,
          suggested_time_of_day: s.time_of_day,
          suggested_vibe: s.vibe,
        }));

        const { error: insertError } = await supabase
          .from('ai_scenarios')
          .insert(scenarios);

        if (insertError) {
          console.error('Error saving scenarios:', insertError);
        }
      }

      toast({
        title: t.aiConcierge?.spark?.waitingRoom?.title || 'Idea Sparked! ✨',
      });

      onEventCreated(event.id, event.unique_slug);

    } catch (error) {
      console.error('Error creating AI event:', error);
      toast({
        title: t.createEvent?.error || 'Error creating event',
        description: error instanceof Error ? error.message : 'Please try again',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
          <Sparkles className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">
          {t.aiConcierge?.spark?.title || "What's the vibe?"}
        </h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          Describe your event idea in a few words. The more context, the better!
        </p>
      </div>

      <Card className="border-2 border-dashed border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
        <CardContent className="pt-6">
          <Textarea
            value={sparkPrompt}
            onChange={(e) => setSparkPrompt(e.target.value)}
            placeholder={t.aiConcierge?.spark?.placeholder || "e.g., A casual birthday dinner next week or a summer road trip with friends"}
            className="min-h-[120px] text-lg border-none bg-transparent resize-none focus-visible:ring-0 placeholder:text-muted-foreground/60"
            disabled={isGenerating}
          />
        </CardContent>
      </Card>

      {/* Quick examples */}
      <div className="flex flex-wrap gap-2 justify-center">
        <span className="text-sm text-muted-foreground flex items-center gap-1">
          <Lightbulb className="w-4 h-4" />
          {t.aiConcierge?.spark?.quickAdd || 'Quick ideas:'}
        </span>
        {examples.map((example) => (
          <button
            key={example}
            onClick={() => setSparkPrompt(example)}
            disabled={isGenerating}
            className="px-3 py-1.5 text-sm rounded-full border border-border bg-background hover:bg-muted transition-colors disabled:opacity-50"
          >
            {example}
          </button>
        ))}
      </div>

      <Button
        onClick={handleGenerate}
        disabled={isGenerating || !sparkPrompt.trim()}
        size="lg"
        className="w-full text-lg py-6"
      >
        {isGenerating ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            {t.aiConcierge?.spark?.generating || 'Creating your event...'}
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
