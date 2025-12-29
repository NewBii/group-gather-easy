import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, MapPin, Users, Sparkles, X, Plus } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { EventCreatedPrompt } from '@/components/EventCreatedPrompt';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

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

const generateSlug = () => {
  return Math.random().toString(36).substring(2, 10);
};

const generateId = () => {
  return Math.random().toString(36).substring(2, 10);
};

const CreateEvent = () => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Success state
  const [createdEvent, setCreatedEvent] = useState<{ id: string; slug: string } | null>(null);
  
  // Day event: multiple individual dates
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  
  // Trip: multiple date periods
  const [datePeriods, setDatePeriods] = useState<DatePeriod[]>([
    { id: generateId(), startDate: undefined, endDate: undefined }
  ]);

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

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;
    
    const dateExists = selectedDates.some(
      (d) => format(d, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
    );
    
    if (dateExists) {
      setSelectedDates(selectedDates.filter(
        (d) => format(d, 'yyyy-MM-dd') !== format(date, 'yyyy-MM-dd')
      ));
    } else {
      setSelectedDates([...selectedDates, date].sort((a, b) => a.getTime() - b.getTime()));
    }
  };

  const removeDate = (dateToRemove: Date) => {
    setSelectedDates(selectedDates.filter(
      (d) => format(d, 'yyyy-MM-dd') !== format(dateToRemove, 'yyyy-MM-dd')
    ));
  };

  const addDatePeriod = () => {
    setDatePeriods([...datePeriods, { id: generateId(), startDate: undefined, endDate: undefined }]);
  };

  const removeDatePeriod = (id: string) => {
    if (datePeriods.length > 1) {
      setDatePeriods(datePeriods.filter((p) => p.id !== id));
    }
  };

  const updateDatePeriod = (id: string, field: 'startDate' | 'endDate', value: Date | undefined) => {
    setDatePeriods(datePeriods.map((p) => 
      p.id === id ? { ...p, [field]: value } : p
    ));
  };

  const validateDates = (): boolean => {
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

  const onSubmit = async (values: FormValues) => {
    if (!validateDates()) return;
    
    setIsSubmitting(true);
    try {
      const slug = generateSlug();
      
      // Calculate date range bounds
      let dateRangeStart: Date;
      let dateRangeEnd: Date;
      
      if (eventType === 'day_event') {
        dateRangeStart = selectedDates[0];
        dateRangeEnd = selectedDates[selectedDates.length - 1];
      } else {
        const validPeriods = datePeriods.filter((p) => p.startDate && p.endDate);
        const allDates = validPeriods.flatMap((p) => [p.startDate!, p.endDate!]);
        dateRangeStart = new Date(Math.min(...allDates.map((d) => d.getTime())));
        dateRangeEnd = new Date(Math.max(...allDates.map((d) => d.getTime())));
      }
      
      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .insert({
          title: values.title,
          description: values.description || null,
          event_type: values.eventType,
          date_range_start: format(dateRangeStart, 'yyyy-MM-dd'),
          date_range_end: format(dateRangeEnd, 'yyyy-MM-dd'),
          location_type: values.locationType,
          unique_slug: slug,
          status: 'active',
        })
        .select()
        .single();

      if (eventError) throw eventError;

      // Insert date options
      const dateOptionsToInsert = eventType === 'day_event'
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

      const { error: dateOptionsError } = await supabase
        .from('date_options')
        .insert(dateOptionsToInsert);

      if (dateOptionsError) throw dateOptionsError;

      // Show success prompt instead of navigating
      setCreatedEvent({ id: eventData.id, slug: slug });
    } catch (error) {
      console.error('Error creating event:', error);
      toast.error(t.createEvent.error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const locationOptions = [
    {
      value: 'set_venues',
      icon: MapPin,
      label: t.createEvent.locationOptions.setVenues.label,
      description: t.createEvent.locationOptions.setVenues.description,
    },
    {
      value: 'suggestions',
      icon: Users,
      label: t.createEvent.locationOptions.suggestions.label,
      description: t.createEvent.locationOptions.suggestions.description,
    },
    {
      value: 'fair_spot',
      icon: Sparkles,
      label: t.createEvent.locationOptions.fairSpot.label,
      description: t.createEvent.locationOptions.fairSpot.description,
    },
  ];

  // Show success prompt if event was created
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

  return (
    <div className="container py-12 md:py-16">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
            {t.createEvent.title}
          </h1>
          <p className="text-lg text-muted-foreground">
            {t.createEvent.description}
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {/* Title */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t.createEvent.form.title}</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder={t.createEvent.form.titlePlaceholder} 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t.createEvent.form.description}</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={t.createEvent.form.descriptionPlaceholder}
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    {t.createEvent.form.descriptionHint}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Event Type */}
            <FormField
              control={form.control}
              name="eventType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t.createEvent.form.eventType}</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t.createEvent.form.selectEventType} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="day_event">
                        {t.createEvent.form.dayEvent}
                      </SelectItem>
                      <SelectItem value="trip">
                        {t.createEvent.form.trip}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Date Selection - Day Event */}
            {eventType === 'day_event' && (
              <div className="space-y-4">
                <Label>{t.createEvent.form.selectDatesForVoting}</Label>
                <div className="border border-border rounded-lg p-4 bg-card">
                  <Calendar
                    mode="multiple"
                    selected={selectedDates}
                    onSelect={(dates) => setSelectedDates(dates || [])}
                    disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                    className="pointer-events-auto mx-auto"
                  />
                </div>
                
                {selectedDates.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">
                      {t.createEvent.form.selectedDates} ({selectedDates.length})
                    </Label>
                    <div className="flex flex-wrap gap-2">
                      {selectedDates.map((date) => (
                        <Badge
                          key={format(date, 'yyyy-MM-dd')}
                          variant="secondary"
                          className="flex items-center gap-1 px-3 py-1"
                        >
                          {format(date, 'PPP')}
                          <button
                            type="button"
                            onClick={() => removeDate(date)}
                            className="ml-1 hover:text-destructive"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Date Selection - Trip */}
            {eventType === 'trip' && (
              <div className="space-y-4">
                <Label>{t.createEvent.form.datePeriods}</Label>
                
                <div className="space-y-4">
                  {datePeriods.map((period, index) => (
                    <div
                      key={period.id}
                      className="border border-border rounded-lg p-4 bg-card space-y-4"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-muted-foreground">
                          {t.createEvent.form.period} {index + 1}
                        </span>
                        {datePeriods.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeDatePeriod(period.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <X className="h-4 w-4 mr-1" />
                            {t.createEvent.form.remove}
                          </Button>
                        )}
                      </div>
                      
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label className="text-sm">{t.createEvent.form.startDate}</Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className={cn(
                                  'w-full pl-3 text-left font-normal',
                                  !period.startDate && 'text-muted-foreground'
                                )}
                              >
                                {period.startDate ? (
                                  format(period.startDate, 'PPP')
                                ) : (
                                  <span>{t.createEvent.form.pickDate}</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={period.startDate}
                                onSelect={(date) => updateDatePeriod(period.id, 'startDate', date)}
                                disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                                initialFocus
                                className="pointer-events-auto"
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                        
                        <div className="space-y-2">
                          <Label className="text-sm">{t.createEvent.form.endDate}</Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className={cn(
                                  'w-full pl-3 text-left font-normal',
                                  !period.endDate && 'text-muted-foreground'
                                )}
                              >
                                {period.endDate ? (
                                  format(period.endDate, 'PPP')
                                ) : (
                                  <span>{t.createEvent.form.pickDate}</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={period.endDate}
                                onSelect={(date) => updateDatePeriod(period.id, 'endDate', date)}
                                disabled={(date) => {
                                  const today = new Date(new Date().setHours(0, 0, 0, 0));
                                  return date < today || (period.startDate && date < period.startDate);
                                }}
                                initialFocus
                                className="pointer-events-auto"
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <Button
                  type="button"
                  variant="outline"
                  onClick={addDatePeriod}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {t.createEvent.form.addDatePeriod}
                </Button>
              </div>
            )}

            {/* Location Type */}
            <FormField
              control={form.control}
              name="locationType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t.createEvent.form.locationType}</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="grid gap-4"
                    >
                      {locationOptions.map((option) => (
                        <div key={option.value}>
                          <RadioGroupItem
                            value={option.value}
                            id={option.value}
                            className="peer sr-only"
                          />
                          <Label
                            htmlFor={option.value}
                            className={cn(
                              'flex items-start gap-4 rounded-lg border-2 border-border bg-card p-4 cursor-pointer transition-all',
                              'hover:bg-accent/50 hover:border-accent',
                              'peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5'
                            )}
                          >
                            <div className="rounded-full bg-secondary p-2">
                              <option.icon className="h-5 w-5 text-primary" />
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-foreground">
                                {option.label}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {option.description}
                              </p>
                            </div>
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Submit */}
            <Button
              type="submit"
              size="lg"
              className="w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? t.common.loading : t.createEvent.form.submit}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
};

export default CreateEvent;