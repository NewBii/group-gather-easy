import { UseFormReturn } from 'react-hook-form';
import { Sparkles, CalendarDays, Plane } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { cn } from '@/lib/utils';

interface Step1Props {
  form: UseFormReturn<any>;
}

export const Step1NameAndVibe = ({ form }: Step1Props) => {
  const { t } = useLanguage();
  const eventType = form.watch('eventType');

  const eventTypeOptions = [
    {
      value: 'day_event',
      icon: CalendarDays,
      label: t.createEvent.form.dayEvent,
    },
    {
      value: 'trip',
      icon: Plane,
      label: t.createEvent.form.trip,
    },
  ];

  return (
    <div className="space-y-8">
      {/* Event Name */}
      <FormField
        control={form.control}
        name="title"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-base font-medium">
              {t.createEvent.form.title}
            </FormLabel>
            <FormControl>
              <Input
                placeholder={t.createEvent.form.titlePlaceholder}
                className="h-14 text-lg rounded-xl border-border/50 bg-background"
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Vibe Description */}
      <FormField
        control={form.control}
        name="description"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-base font-medium flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              {t.createEvent.wizard.vibeLabel}
            </FormLabel>
            <FormControl>
              <Textarea
                placeholder={t.createEvent.wizard.vibePlaceholder}
                className="min-h-[120px] resize-none rounded-xl border-border/50 bg-background"
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Event Type Toggle Cards */}
      <div className="space-y-3">
        <Label className="text-base font-medium">{t.createEvent.form.eventType}</Label>
        <div className="grid grid-cols-2 gap-4">
          {eventTypeOptions.map((option) => {
            const isSelected = eventType === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => form.setValue('eventType', option.value)}
                className={cn(
                  'relative flex flex-col items-center justify-center gap-3 p-6 rounded-2xl border-2 transition-all duration-200',
                  'hover:border-primary/50 hover:bg-accent/50',
                  isSelected
                    ? 'border-primary bg-primary/5 shadow-sm'
                    : 'border-border/50 bg-background'
                )}
              >
                <div
                  className={cn(
                    'p-3 rounded-xl transition-colors',
                    isSelected ? 'bg-primary/10' : 'bg-muted'
                  )}
                >
                  <option.icon
                    className={cn(
                      'h-6 w-6 transition-colors',
                      isSelected ? 'text-primary' : 'text-muted-foreground'
                    )}
                  />
                </div>
                <span
                  className={cn(
                    'font-medium text-sm',
                    isSelected ? 'text-foreground' : 'text-muted-foreground'
                  )}
                >
                  {option.label}
                </span>
                {isSelected && (
                  <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-primary" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
