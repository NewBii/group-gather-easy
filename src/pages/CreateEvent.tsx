import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';
import { User } from '@supabase/supabase-js';
import { useLanguage } from '@/i18n/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { EventCreatedPrompt } from '@/components/EventCreatedPrompt';
import { ProgressIndicator } from '@/components/create-event/ProgressIndicator';
import { Step1NameAndVibe } from '@/components/create-event/Step1NameAndVibe';
import { Step2DateAndLocation } from '@/components/create-event/Step2DateAndLocation';
import { Step3HelpersWanted } from '@/components/create-event/Step3HelpersWanted';
import { ModeSelector } from '@/components/create-event/ModeSelector';
import { SparkPhase } from '@/components/create-event/SparkPhase';
import { WaitingRoom } from '@/components/create-event/WaitingRoom';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { toast } from 'sonner';

type OrganizationMode = 'manual' | 'ai_concierge';

interface DatePeriod {
  id: string;
  startDate: Date | undefined;
  endDate: Date | undefined;
}

const formSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100),
  description: z.string().max(500).optional(),
  eventType: z.enum(['day_event', 'trip']),
  locationType: z.enum(['set_venues', 'suggestions', 'fair_spot']),
});

type FormValues = z.infer<typeof formSchema>;

const generateSlug = () => Math.random().toString(36).substring(2, 10);
const generateId = () => Math.random().toString(36).substring(2, 10);

const CreateEvent = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  
  // Auth state
  const [user, setUser] = useState<User | null>(null);

  // Mode selection state
  const [selectedMode, setSelectedMode] = useState<OrganizationMode | null>(null);

  // AI Concierge state
  const [aiEventCreated, setAiEventCreated] = useState<{ id: string; slug: string; title?: string } | null>(null);

  // Manual wizard state
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdEvent, setCreatedEvent] = useState<{ id: string; slug: string } | null>(null);

  // Get current user session
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Date state
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [datePeriods, setDatePeriods] = useState<DatePeriod[]>([
    { id: generateId(), startDate: undefined, endDate: undefined },
  ]);
  const [decideLaterDate, setDecideLaterDate] = useState(false);
  const [decideLaterLocation, setDecideLaterLocation] = useState(false);

  // Tasks state (optional helpers)
  const [tasks, setTasks] = useState<string[]>([]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      eventType: 'day_event',
      locationType: 'suggestions',
    },
  });

  const eventType = form.watch('eventType');

  // Reset date selections when event type changes
  useEffect(() => {
    setSelectedDates([]);
    setDatePeriods([{ id: generateId(), startDate: undefined, endDate: undefined }]);
  }, [eventType]);

  const steps = [
    { number: 1, label: t.createEvent.wizard.steps.nameAndVibe },
    { number: 2, label: t.createEvent.wizard.steps.dateAndLocation },
    { number: 3, label: t.createEvent.wizard.steps.helpersWanted, optional: true },
  ];

  const validateStep1 = () => {
    const title = form.getValues('title');
    if (!title || title.trim() === '') {
      form.setError('title', { message: 'Title is required' });
      return false;
    }
    return true;
  };

  const validateStep2 = (): boolean => {
    // If decide later is checked, no date validation needed
    if (decideLaterDate) return true;

    if (eventType === 'day_event') {
      if (selectedDates.length === 0) {
        toast.error(t.createEvent.form.validation.minOneDateRequired);
        return false;
      }
    } else {
      const validPeriods = datePeriods.filter((p) => p.startDate && p.endDate);
      if (validPeriods.length === 0) {
        toast.error(t.createEvent.form.validation.minOnePeriodRequired);
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (currentStep === 1 && !validateStep1()) return;
    if (currentStep === 2 && !validateStep2()) return;
    setCurrentStep((prev) => Math.min(prev + 1, 3));
  };

  const handleBack = () => {
    if (currentStep === 1) {
      // Go back to mode selection
      setSelectedMode(null);
    } else {
      setCurrentStep((prev) => Math.max(prev - 1, 1));
    }
  };

  const handleSubmit = async () => {
    if (!validateStep1()) {
      setCurrentStep(1);
      return;
    }
    if (!validateStep2()) {
      setCurrentStep(2);
      return;
    }

    const values = form.getValues();
    setIsSubmitting(true);

    try {
      const slug = generateSlug();

      // Calculate date range bounds (nullable if decide later)
      let dateRangeStart: Date | null = null;
      let dateRangeEnd: Date | null = null;

      if (!decideLaterDate) {
        if (eventType === 'day_event' && selectedDates.length > 0) {
          dateRangeStart = selectedDates[0];
          dateRangeEnd = selectedDates[selectedDates.length - 1];
        } else if (eventType === 'trip') {
          const validPeriods = datePeriods.filter((p) => p.startDate && p.endDate);
          if (validPeriods.length > 0) {
            const allDates = validPeriods.flatMap((p) => [p.startDate!, p.endDate!]);
            dateRangeStart = new Date(Math.min(...allDates.map((d) => d.getTime())));
            dateRangeEnd = new Date(Math.max(...allDates.map((d) => d.getTime())));
          }
        }
      }

      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .insert({
          title: values.title,
          description: values.description || null,
          event_type: values.eventType,
          date_range_start: dateRangeStart ? format(dateRangeStart, 'yyyy-MM-dd') : null,
          date_range_end: dateRangeEnd ? format(dateRangeEnd, 'yyyy-MM-dd') : null,
          location_type: decideLaterLocation ? null : values.locationType,
          unique_slug: slug,
          status: 'active',
          created_by: user?.id ?? null,
          organization_mode: 'manual',
        })
        .select()
        .single();

      if (eventError) throw eventError;

      // Insert date options if dates were selected
      if (!decideLaterDate) {
        const dateOptionsToInsert =
          eventType === 'day_event'
            ? selectedDates.map((date) => ({
                event_id: eventData.id,
                start_date: format(date, 'yyyy-MM-dd'),
                end_date: null,
              }))
            : datePeriods
                .filter((p) => p.startDate && p.endDate)
                .map((period) => ({
                  event_id: eventData.id,
                  start_date: format(period.startDate!, 'yyyy-MM-dd'),
                  end_date: format(period.endDate!, 'yyyy-MM-dd'),
                }));

        if (dateOptionsToInsert.length > 0) {
          const { error: dateOptionsError } = await supabase
            .from('date_options')
            .insert(dateOptionsToInsert);

          if (dateOptionsError) throw dateOptionsError;
        }
      }

      // Insert tasks if any were added
      if (tasks.length > 0) {
        const tasksToInsert = tasks.map((title) => ({
          event_id: eventData.id,
          title,
        }));

        const { error: tasksError } = await supabase
          .from('event_tasks')
          .insert(tasksToInsert);

        if (tasksError) throw tasksError;
      }

      // Show success prompt
      setCreatedEvent({ id: eventData.id, slug: slug });
    } catch (error) {
      console.error('Error creating event:', error);
      toast.error(t.createEvent.error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAIEventCreated = async (eventId: string, slug: string) => {
    // Fetch the event title
    const { data } = await supabase
      .from('events')
      .select('title')
      .eq('id', eventId)
      .single();

    setAiEventCreated({ id: eventId, slug, title: data?.title });
  };

  // Show success prompt if manual event was created
  if (createdEvent) {
    return (
      <div className="container py-12 md:py-16">
        <EventCreatedPrompt
          eventSlug={createdEvent.slug}
          eventId={createdEvent.id}
          eventTitle={form.getValues('title')}
        />
      </div>
    );
  }

  // Show waiting room if AI event was created
  if (aiEventCreated) {
    return (
      <div className="container py-12 md:py-16">
        <div className="max-w-2xl mx-auto">
          <WaitingRoom
            eventId={aiEventCreated.id}
            eventSlug={aiEventCreated.slug}
            eventTitle={aiEventCreated.title}
          />
        </div>
      </div>
    );
  }

  // Mode Selection
  if (!selectedMode) {
    return (
      <div className="container py-8 md:py-12">
        <div className="max-w-2xl mx-auto">
          <div className="bg-card rounded-3xl border border-border/50 shadow-sm p-6 md:p-10">
            <ModeSelector
              selectedMode={selectedMode}
              onSelectMode={(mode) => setSelectedMode(mode)}
            />
            
            {/* Continue button */}
            <div className="mt-8 flex justify-end">
              <Button
                onClick={() => selectedMode && setSelectedMode(selectedMode)}
                disabled={!selectedMode}
                className="px-6"
              >
                {t.createEvent.wizard.continue}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // AI Concierge Mode - Spark Phase
  if (selectedMode === 'ai_concierge') {
    return (
      <div className="container py-8 md:py-12">
        <div className="max-w-2xl mx-auto">
          <div className="bg-card rounded-3xl border border-border/50 shadow-sm p-6 md:p-10">
            <SparkPhase
              onEventCreated={handleAIEventCreated}
              userId={user?.id}
            />
            
            {/* Back button */}
            <div className="mt-6 flex justify-start">
              <Button
                variant="ghost"
                onClick={() => setSelectedMode(null)}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                {t.createEvent.wizard.back}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Manual Mode - 3-step wizard
  return (
    <div className="container py-8 md:py-12">
      <div className="max-w-2xl mx-auto">
        {/* Progress Indicator */}
        <ProgressIndicator steps={steps} currentStep={currentStep} />

        {/* Form Card */}
        <div className="bg-card rounded-3xl border border-border/50 shadow-sm p-6 md:p-10">
          <Form {...form}>
            <form onSubmit={(e) => e.preventDefault()}>
              {/* Step 1: Name & Vibe */}
              {currentStep === 1 && <Step1NameAndVibe form={form} />}

              {/* Step 2: Date & Location */}
              {currentStep === 2 && (
                <Step2DateAndLocation
                  form={form}
                  selectedDates={selectedDates}
                  setSelectedDates={setSelectedDates}
                  datePeriods={datePeriods}
                  setDatePeriods={setDatePeriods}
                  decideLaterDate={decideLaterDate}
                  setDecideLaterDate={setDecideLaterDate}
                  decideLaterLocation={decideLaterLocation}
                  setDecideLaterLocation={setDecideLaterLocation}
                />
              )}

              {/* Step 3: Helpers Wanted */}
              {currentStep === 3 && <Step3HelpersWanted tasks={tasks} setTasks={setTasks} />}

              {/* Navigation Buttons */}
              <div className="flex items-center justify-between mt-10 pt-6 border-t border-border/50">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleBack}
                  className="gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  {t.createEvent.wizard.back}
                </Button>

                {currentStep < 3 ? (
                  <Button
                    type="button"
                    onClick={handleNext}
                    className="gap-2 px-6"
                  >
                    {t.createEvent.wizard.continue}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                ) : (
                  <div className="flex items-center gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleSubmit}
                      disabled={isSubmitting}
                      className="px-6"
                    >
                      {t.createEvent.wizard.helpers.skip}
                    </Button>
                    <Button
                      type="button"
                      onClick={handleSubmit}
                      disabled={isSubmitting}
                      className="gap-2 px-6"
                    >
                      {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                      {t.createEvent.wizard.createEvent}
                    </Button>
                  </div>
                )}
              </div>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
};

export default CreateEvent;
