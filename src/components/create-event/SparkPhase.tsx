import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/i18n/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { SparkProgress } from './spark/SparkProgress';
import { SparkInput } from './spark/SparkInput';
import { SparkClarify, type ClarifyQuestion } from './spark/SparkClarify';
import { SparkSummary, type StructuredContext } from './spark/SparkSummary';

interface SparkPhaseProps {
  onEventCreated: (eventId: string, slug: string) => void;
  userId?: string | null;
}

type Phase = 'input' | 'clarify' | 'summary' | 'generating';

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

// Client-side fallback if edge function doesn't support clarify-context
const fallbackClarify = (prompt: string, lang: string): { alreadyKnown: Record<string, string | null>; questionsToAsk: ClarifyQuestion[] } => {
  const lower = prompt.toLowerCase();
  const alreadyKnown: Record<string, string | null> = { when: null, who: null, what: null, where: null, budget: null };
  const questions: ClarifyQuestion[] = [];

  // Simple keyword detection
  if (/\b(lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche|monday|tuesday|wednesday|thursday|friday|saturday|sunday|janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre|january|february|march|april|may|june|july|august|september|october|november|december|\d{1,2}\/\d{1,2})\b/i.test(lower)) {
    alreadyKnown.when = 'mentioned';
  } else {
    questions.push({
      dimension: 'when',
      question: lang === 'fr' ? "C'est prévu pour quand ?" : "When are you thinking?",
      answerType: 'chips',
      chips: lang === 'fr'
        ? ['Date fixe', 'Période flexible', 'Les participants décident']
        : ['Fixed date', 'Flexible period', 'Let participants decide'],
    });
  }

  if (/\b(\d+\s*(personnes?|amis?|potes?|collègues?|people|friends|colleagues|guests?))\b/i.test(lower)) {
    alreadyKnown.who = 'mentioned';
  } else if (questions.length < 3) {
    questions.push({
      dimension: 'who',
      question: lang === 'fr' ? "Vous serez combien environ ?" : "How many people roughly?",
      answerType: 'chips+text',
      chips: [],
    });
  }

  if (/\b(budget|€|\$|euros?|cher|pas cher|cheap|expensive|premium)\b/i.test(lower)) {
    alreadyKnown.budget = 'mentioned';
  } else if (questions.length < 3) {
    questions.push({
      dimension: 'budget',
      question: lang === 'fr' ? "Vous avez un budget en tête ?" : "Any budget in mind?",
      answerType: 'chips',
      chips: lang === 'fr'
        ? ['< 50€/pers', '50-150€', '150-300€', '> 300€', 'Pas de contrainte']
        : ['< €50/person', '€50-150', '€150-300', '> €300', 'No constraint'],
    });
  }

  return { alreadyKnown, questionsToAsk: questions.slice(0, 3) };
};

export const SparkPhase = ({ onEventCreated, userId }: SparkPhaseProps) => {
  const { t, language } = useLanguage();
  const { toast } = useToast();

  const [phase, setPhase] = useState<Phase>('input');
  const [sparkPrompt, setSparkPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [clarifyingQuestions, setClarifyingQuestions] = useState<ClarifyQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [alreadyKnown, setAlreadyKnown] = useState<Record<string, string | null>>({});
  const [generationStep, setGenerationStep] = useState('');

  const buildStructuredContext = (): StructuredContext => ({
    when: alreadyKnown.when || answers.when || '',
    who: alreadyKnown.who || answers.who || '',
    what: alreadyKnown.what || answers.what || '',
    where: alreadyKnown.where || answers.where || '',
    budget: alreadyKnown.budget || answers.budget || '',
  });

  const [structuredContext, setStructuredContext] = useState<StructuredContext>({
    when: '', who: '', what: '', where: '', budget: '',
  });

  // Step 1 → Step 2: Get clarifying questions
  const handleSparkSubmit = async () => {
    if (!sparkPrompt.trim()) {
      toast({ title: t.aiConcierge?.spark?.emptyPrompt || 'Please describe your event idea', variant: 'destructive' });
      return;
    }
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-event-assistant', {
        body: { action: 'clarify-context', sparkPrompt: sparkPrompt.trim() },
      });

      if (error || !data?.success) {
        console.warn('clarify-context failed, using fallback:', error);
        const fb = fallbackClarify(sparkPrompt, language);
        setAlreadyKnown(fb.alreadyKnown);
        if (fb.questionsToAsk.length === 0) {
          // Everything is known, skip to summary
          setStructuredContext(buildStructuredContext());
          setPhase('summary');
        } else {
          setClarifyingQuestions(fb.questionsToAsk);
          setPhase('clarify');
        }
      } else {
        const result = data.data;
        setAlreadyKnown(result.alreadyKnown || {});
        if (!result.questionsToAsk || result.questionsToAsk.length === 0) {
          const ctx = {
            when: result.alreadyKnown?.when || '',
            who: result.alreadyKnown?.who || '',
            what: result.alreadyKnown?.what || '',
            where: result.alreadyKnown?.where || '',
            budget: result.alreadyKnown?.budget || '',
          };
          setStructuredContext(ctx);
          setPhase('summary');
        } else {
          setClarifyingQuestions(result.questionsToAsk);
          setPhase('clarify');
        }
      }
    } catch (err) {
      console.error('Error in clarify:', err);
      const fb = fallbackClarify(sparkPrompt, language);
      setAlreadyKnown(fb.alreadyKnown);
      setClarifyingQuestions(fb.questionsToAsk);
      setPhase(fb.questionsToAsk.length > 0 ? 'clarify' : 'summary');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2 → Step 3: Build summary from answers
  const handleClarifyDone = () => {
    const ctx: StructuredContext = {
      when: alreadyKnown.when || answers.when || '',
      who: alreadyKnown.who || answers.who || '',
      what: alreadyKnown.what || answers.what || '',
      where: alreadyKnown.where || answers.where || '',
      budget: alreadyKnown.budget || answers.budget || '',
    };
    setStructuredContext(ctx);
    setPhase('summary');
  };

  // Step 3 → Step 4: Generate scenarios (same logic as before)
  const handleGenerate = async () => {
    setPhase('generating');
    try {
      setGenerationStep(t.aiConcierge?.spark?.analyzing || 'Analyzing your idea...');
      const { data: contextResponse, error: contextError } = await supabase.functions.invoke('ai-event-assistant', {
        body: { action: 'analyze-context', sparkPrompt: sparkPrompt.trim() },
      });
      if (contextError) throw contextError;
      if (!contextResponse?.success) throw new Error(contextResponse?.error || 'Context analysis failed');
      const contextAnalysis = contextResponse.data;

      setGenerationStep(t.aiConcierge?.spark?.creating || 'Creating your event...');
      const { data: aiResponse, error: aiError } = await supabase.functions.invoke('ai-event-assistant', {
        body: { action: 'generate-draft', sparkPrompt: sparkPrompt.trim() },
      });
      if (aiError) throw aiError;
      if (!aiResponse?.success) throw new Error(aiResponse?.error || 'AI generation failed');
      const draft = aiResponse.data;
      const slug = generateSlug(contextAnalysis.eventTitle || draft.title);

      const eventInsert = {
          title: contextAnalysis.eventTitle || draft.title,
          description: contextAnalysis.suggestedDescription || draft.description,
          event_type: (contextAnalysis.eventType || draft.eventType) as 'day_event' | 'trip',
          organization_mode: 'ai_concierge',
          ai_phase: 'spark',
          spark_prompt: sparkPrompt.trim(),
          unique_slug: slug,
          status: 'active' as const,
          created_by: userId ?? null,
          location_data: {
            contextAnalysis: {
              constraints: contextAnalysis.constraints,
              specialRequirements: contextAnalysis.specialRequirements,
              participantOrigins: contextAnalysis.participantOrigins,
              vibeKeywords: contextAnalysis.vibeKeywords,
              isVague: contextAnalysis.isVague,
            },
            structuredContext: { ...structuredContext },
          } as any
        };

      const { data: event, error: eventError } = await supabase
        .from('events')
        .insert([eventInsert])
        .select()
        .single();
      if (eventError) throw eventError;

      setGenerationStep(t.aiConcierge?.spark?.crafting || 'Crafting personalized options...');
      const { data: scenarioResponse, error: scenarioError } = await supabase.functions.invoke('ai-event-assistant', {
        body: {
          action: 'generate-scenarios',
          sparkPrompt: sparkPrompt.trim(),
          eventId: event.id,
          contextAnalysis: { ...contextAnalysis, structuredContext },
        },
      });

      if (scenarioError) {
        console.error('Scenario generation error:', scenarioError);
      } else if (scenarioResponse?.success && scenarioResponse.data?.scenarios) {
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
            location: s.location,
            budget: s.budget,
            accommodation: s.accommodation,
          }
        }));

        const { data: insertedScenarios, error: insertError } = await supabase
          .from('ai_scenarios')
          .insert(scenarios)
          .select('id');
        if (insertError) console.error('Error saving scenarios:', insertError);

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
          await supabase.from('scenario_date_options').insert(dateOptionsToInsert);

          const eventCandidateDates = dateOptions.map((opt: any) => ({
            event_id: event.id,
            suggested_date: opt.date,
            is_long_weekend: opt.is_long_weekend,
            holiday_name: opt.holiday_name_fr || opt.holiday_name,
          }));
          await supabase.from('event_candidate_dates').insert(eventCandidateDates);
        }
      }

      toast({
        title: contextAnalysis.isVague
          ? (t.aiConcierge?.spark?.starterConcepts || "Here are some starter concepts! ✨")
          : t.aiConcierge?.spark?.waitingRoom?.title || 'Idea Sparked! ✨',
      });
      onEventCreated(event.id, event.unique_slug);

    } catch (error) {
      console.error('Error creating AI event:', error);
      toast({
        title: t.createEvent?.error || 'Error creating event',
        description: error instanceof Error ? error.message : (t.aiConcierge?.spark?.tryAgain || 'Please try again'),
        variant: 'destructive',
      });
      setPhase('summary');
    } finally {
      setGenerationStep('');
    }
  };

  const handleBack = () => {
    if (phase === 'clarify') setPhase('input');
    else if (phase === 'summary') setPhase(clarifyingQuestions.length > 0 ? 'clarify' : 'input');
  };

  return (
    <div className="space-y-4">
      <SparkProgress currentPhase={phase} />

      {phase === 'input' && (
        <SparkInput
          sparkPrompt={sparkPrompt}
          setSparkPrompt={setSparkPrompt}
          onSubmit={handleSparkSubmit}
          isLoading={isLoading}
        />
      )}

      {phase === 'clarify' && (
        <SparkClarify
          questions={clarifyingQuestions}
          answers={answers}
          onAnswersChange={setAnswers}
          onDone={handleClarifyDone}
        />
      )}

      {(phase === 'summary' || phase === 'generating') && (
        <SparkSummary
          context={structuredContext}
          onContextChange={setStructuredContext}
          onGenerate={handleGenerate}
          isGenerating={phase === 'generating'}
          generationStep={generationStep}
        />
      )}

      {(phase === 'clarify' || phase === 'summary') && (
        <Button variant="ghost" onClick={handleBack} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          {language === 'fr' ? 'Retour' : 'Back'}
        </Button>
      )}
    </div>
  );
};
