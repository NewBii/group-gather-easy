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
  const [generationStep, setGenerationStep] = useState<string>('');

  const examples = [
    t.aiConcierge?.spark?.examples?.[0] || "Birthday dinner on Friday with the gang",
    t.aiConcierge?.spark?.examples?.[1] || "Weekend trip somewhere in the mountains, with kids",
    t.aiConcierge?.spark?.examples?.[2] || "Team lunch, people coming from Paris and Lyon",
    t.aiConcierge?.spark?.examples?.[3] || "Let's do something fun!",
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
      // Step 1: Analyze context for constraints
      setGenerationStep('Analyzing your idea...');
      const { data: contextResponse, error: contextError } = await supabase.functions.invoke('ai-event-assistant', {
        body: {
          action: 'analyze-context',
          sparkPrompt: sparkPrompt.trim(),
        },
      });

      if (contextError) throw contextError;
      if (!contextResponse?.success) throw new Error(contextResponse?.error || 'Context analysis failed');

      const contextAnalysis = contextResponse.data;
      console.log('Context analysis:', contextAnalysis);

      // Step 2: Generate draft based on analysis
      setGenerationStep('Creating your event...');
      const { data: aiResponse, error: aiError } = await supabase.functions.invoke('ai-event-assistant', {
        body: {
          action: 'generate-draft',
          sparkPrompt: sparkPrompt.trim(),
        },
      });

      if (aiError) throw aiError;
      if (!aiResponse?.success) throw new Error(aiResponse?.error || 'AI generation failed');

      const draft = aiResponse.data;
      const slug = generateSlug(contextAnalysis.eventTitle || draft.title);

      // Create the event with context metadata
      const { data: event, error: eventError } = await supabase
        .from('events')
        .insert({
          title: contextAnalysis.eventTitle || draft.title,
          description: contextAnalysis.suggestedDescription || draft.description,
          event_type: contextAnalysis.eventType || draft.eventType,
          organization_mode: 'ai_concierge',
          ai_phase: 'spark',
          spark_prompt: sparkPrompt.trim(),
          unique_slug: slug,
          status: 'active',
          created_by: userId ?? null,
          // Store context analysis in location_data for now (we can add a proper column later)
          location_data: {
            contextAnalysis: {
              constraints: contextAnalysis.constraints,
              specialRequirements: contextAnalysis.specialRequirements,
              participantOrigins: contextAnalysis.participantOrigins,
              vibeKeywords: contextAnalysis.vibeKeywords,
              isVague: contextAnalysis.isVague,
            }
          }
        })
        .select()
        .single();

      if (eventError) throw eventError;

      // Step 3: Generate context-aware scenarios
      setGenerationStep('Crafting personalized options...');
      const { data: scenarioResponse, error: scenarioError } = await supabase.functions.invoke('ai-event-assistant', {
        body: {
          action: 'generate-scenarios',
          sparkPrompt: sparkPrompt.trim(),
          eventId: event.id,
          contextAnalysis: contextAnalysis, // Pass context to scenario generation
        },
      });

      if (scenarioError) {
        console.error('Scenario generation error:', scenarioError);
      } else if (scenarioResponse?.success && scenarioResponse.data?.scenarios) {
        // Save scenarios with metadata
        const scenarios = scenarioResponse.data.scenarios.map((s: any) => ({
          event_id: event.id,
          scenario_label: `Option ${s.label}`,
          title: s.title,
          description: s.description,
          suggested_date: s.suggested_date,
          suggested_time_of_day: s.time_of_day,
          suggested_vibe: s.vibe,
          metadata: {
            constraints_applied: s.constraints_applied,
            special_traits: s.special_traits,
            midpoint_info: s.midpoint_info,
            date_is_flexible: s.date_is_flexible,
          }
        }));

        // Insert scenarios and get their IDs
        const { data: insertedScenarios, error: insertError } = await supabase
          .from('ai_scenarios')
          .insert(scenarios)
          .select('id');

        if (insertError) {
          console.error('Error saving scenarios:', insertError);
        }

        // Insert date options for each scenario if date is flexible
        const dateOptions = scenarioResponse.data.dateOptions;
        if (dateOptions && dateOptions.length > 0 && insertedScenarios) {
          const dateOptionsToInsert = insertedScenarios.flatMap((scenario: any) =>
            dateOptions.map((opt: any) => ({
              scenario_id: scenario.id,
              suggested_date: opt.date,
              is_long_weekend: opt.is_long_weekend,
              holiday_name: opt.holiday_name_fr || opt.holiday_name,
            }))
          );

          const { error: dateOptError } = await supabase
            .from('scenario_date_options')
            .insert(dateOptionsToInsert);

          if (dateOptError) {
            console.error('Error saving date options:', dateOptError);
          }

          // Also insert into event_candidate_dates for the AvailabilityPanel
          const eventCandidateDates = dateOptions.map((opt: any) => ({
            event_id: event.id,
            suggested_date: opt.date,
            is_long_weekend: opt.is_long_weekend,
            holiday_name: opt.holiday_name_fr || opt.holiday_name,
          }));

          const { error: eventDateError } = await supabase
            .from('event_candidate_dates')
            .insert(eventCandidateDates);

          if (eventDateError) {
            console.error('Error saving event candidate dates:', eventDateError);
          }
        }
      }

      toast({
        title: contextAnalysis.isVague 
          ? "Here are some starter concepts! ✨" 
          : t.aiConcierge?.spark?.waitingRoom?.title || 'Idea Sparked! ✨',
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
      setGenerationStep('');
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
          Describe your event idea in a few words. Be specific about dates, locations, or who's coming - or keep it vague and let us help!
        </p>
      </div>

      <Card className="border-2 border-dashed border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
        <CardContent className="pt-6">
          <Textarea
            value={sparkPrompt}
            onChange={(e) => setSparkPrompt(e.target.value)}
            placeholder="e.g., 'Birthday dinner on Friday downtown' or 'Weekend trip in May, people coming from Berlin and Munich, with kids'"
            className="min-h-[120px] text-lg border-none bg-transparent resize-none focus-visible:ring-0 placeholder:text-muted-foreground/60"
            disabled={isGenerating}
          />
        </CardContent>
      </Card>

      {/* Quick examples with context hints */}
      <div className="flex flex-wrap gap-2 justify-center">
        <span className="text-sm text-muted-foreground flex items-center gap-1">
          <Lightbulb className="w-4 h-4" />
          Try these:
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
            {generationStep || t.aiConcierge?.spark?.generating || 'Creating your event...'}
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