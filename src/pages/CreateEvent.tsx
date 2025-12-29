import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, MapPin, Users, Sparkles } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
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

const formSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100),
  description: z.string().max(500).optional(),
  eventType: z.enum(['day_event', 'trip']),
  dateRangeStart: z.date({ required_error: 'Start date is required' }),
  dateRangeEnd: z.date({ required_error: 'End date is required' }),
  locationType: z.enum(['set_venues', 'suggestions', 'fair_spot']),
});

type FormValues = z.infer<typeof formSchema>;

const generateSlug = () => {
  return Math.random().toString(36).substring(2, 10);
};

const CreateEvent = () => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      eventType: 'day_event',
      locationType: 'suggestions',
    },
  });

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    try {
      const slug = generateSlug();
      
      const { data, error } = await supabase
        .from('events')
        .insert({
          title: values.title,
          description: values.description || null,
          event_type: values.eventType,
          date_range_start: format(values.dateRangeStart, 'yyyy-MM-dd'),
          date_range_end: format(values.dateRangeEnd, 'yyyy-MM-dd'),
          location_type: values.locationType,
          unique_slug: slug,
          status: 'active',
        })
        .select()
        .single();

      if (error) throw error;

      toast.success(t.createEvent.success);
      navigate(`/event/${slug}`);
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

            {/* Date Range */}
            <div className="grid gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="dateRangeStart"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>{t.createEvent.form.startDate}</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              'w-full pl-3 text-left font-normal',
                              !field.value && 'text-muted-foreground'
                            )}
                          >
                            {field.value ? (
                              format(field.value, 'PPP', { locale: language === 'fr' ? undefined : undefined })
                            ) : (
                              <span>{t.createEvent.form.pickDate}</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date < new Date()}
                          initialFocus
                          className="pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dateRangeEnd"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>{t.createEvent.form.endDate}</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              'w-full pl-3 text-left font-normal',
                              !field.value && 'text-muted-foreground'
                            )}
                          >
                            {field.value ? (
                              format(field.value, 'PPP')
                            ) : (
                              <span>{t.createEvent.form.pickDate}</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => {
                            const startDate = form.getValues('dateRangeStart');
                            return date < new Date() || (startDate && date < startDate);
                          }}
                          initialFocus
                          className="pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

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
