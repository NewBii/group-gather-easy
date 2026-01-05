import { UseFormReturn } from 'react-hook-form';
import { format } from 'date-fns';
import { CalendarIcon, MapPin, Users, Sparkles, X, Plus, CalendarOff, MapPinOff } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface DatePeriod {
  id: string;
  startDate: Date | undefined;
  endDate: Date | undefined;
}

interface Step2Props {
  form: UseFormReturn<any>;
  selectedDates: Date[];
  setSelectedDates: (dates: Date[]) => void;
  datePeriods: DatePeriod[];
  setDatePeriods: (periods: DatePeriod[]) => void;
  decideLaterDate: boolean;
  setDecideLaterDate: (value: boolean) => void;
  decideLaterLocation: boolean;
  setDecideLaterLocation: (value: boolean) => void;
}

const generateId = () => Math.random().toString(36).substring(2, 10);

export const Step2DateAndLocation = ({
  form,
  selectedDates,
  setSelectedDates,
  datePeriods,
  setDatePeriods,
  decideLaterDate,
  setDecideLaterDate,
  decideLaterLocation,
  setDecideLaterLocation,
}: Step2Props) => {
  const { t } = useLanguage();
  const eventType = form.watch('eventType');
  const locationType = form.watch('locationType');

  const removeDate = (dateToRemove: Date) => {
    setSelectedDates(
      selectedDates.filter(
        (d) => format(d, 'yyyy-MM-dd') !== format(dateToRemove, 'yyyy-MM-dd')
      )
    );
  };

  const addDatePeriod = () => {
    setDatePeriods([
      ...datePeriods,
      { id: generateId(), startDate: undefined, endDate: undefined },
    ]);
  };

  const removeDatePeriod = (id: string) => {
    if (datePeriods.length > 1) {
      setDatePeriods(datePeriods.filter((p) => p.id !== id));
    }
  };

  const updateDatePeriod = (
    id: string,
    field: 'startDate' | 'endDate',
    value: Date | undefined
  ) => {
    setDatePeriods(
      datePeriods.map((p) => (p.id === id ? { ...p, [field]: value } : p))
    );
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
    <div className="space-y-10">
      {/* Date Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-foreground">
              {t.createEvent.wizard.dateTitle}
            </h3>
            <p className="text-sm text-muted-foreground">
              {eventType === 'day_event'
                ? t.createEvent.form.selectDatesForVoting
                : t.createEvent.form.datePeriods}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="decide-later-date" className="text-sm text-muted-foreground">
              {t.createEvent.wizard.decideLater}
            </Label>
            <Switch
              id="decide-later-date"
              checked={decideLaterDate}
              onCheckedChange={setDecideLaterDate}
            />
          </div>
        </div>

        {decideLaterDate ? (
          <div className="flex items-center gap-3 p-6 rounded-2xl bg-muted/50 border border-border/50">
            <CalendarOff className="h-5 w-5 text-muted-foreground" />
            <p className="text-muted-foreground">
              {t.createEvent.wizard.decideLaterDateHint}
            </p>
          </div>
        ) : eventType === 'day_event' ? (
          <div className="space-y-4">
            <div className="rounded-2xl border border-border/50 p-4 bg-card">
              <Calendar
                mode="multiple"
                selected={selectedDates}
                onSelect={(dates) => setSelectedDates(dates || [])}
                disabled={(date) =>
                  date < new Date(new Date().setHours(0, 0, 0, 0))
                }
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
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg"
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
        ) : (
          <div className="space-y-4">
            {datePeriods.map((period, index) => (
              <div
                key={period.id}
                className="rounded-2xl border border-border/50 p-5 bg-card space-y-4"
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
                            'w-full pl-3 text-left font-normal rounded-xl',
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
                          onSelect={(date) =>
                            updateDatePeriod(period.id, 'startDate', date)
                          }
                          disabled={(date) =>
                            date < new Date(new Date().setHours(0, 0, 0, 0))
                          }
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
                            'w-full pl-3 text-left font-normal rounded-xl',
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
                          onSelect={(date) =>
                            updateDatePeriod(period.id, 'endDate', date)
                          }
                          disabled={(date) => {
                            const today = new Date(
                              new Date().setHours(0, 0, 0, 0)
                            );
                            return (
                              date < today ||
                              (period.startDate && date < period.startDate)
                            );
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

            <Button
              type="button"
              variant="outline"
              onClick={addDatePeriod}
              className="w-full rounded-xl"
            >
              <Plus className="h-4 w-4 mr-2" />
              {t.createEvent.form.addDatePeriod}
            </Button>
          </div>
        )}
      </div>

      {/* Location Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-foreground">
              {t.createEvent.wizard.locationTitle}
            </h3>
            <p className="text-sm text-muted-foreground">
              {t.createEvent.form.locationType}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="decide-later-location" className="text-sm text-muted-foreground">
              {t.createEvent.wizard.decideLater}
            </Label>
            <Switch
              id="decide-later-location"
              checked={decideLaterLocation}
              onCheckedChange={setDecideLaterLocation}
            />
          </div>
        </div>

        {decideLaterLocation ? (
          <div className="flex items-center gap-3 p-6 rounded-2xl bg-muted/50 border border-border/50">
            <MapPinOff className="h-5 w-5 text-muted-foreground" />
            <p className="text-muted-foreground">
              {t.createEvent.wizard.decideLaterLocationHint}
            </p>
          </div>
        ) : (
          <RadioGroup
            value={locationType}
            onValueChange={(value) => form.setValue('locationType', value)}
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
                    'flex items-start gap-4 rounded-2xl border-2 border-border/50 bg-card p-5 cursor-pointer transition-all',
                    'hover:bg-accent/50 hover:border-accent',
                    'peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5'
                  )}
                >
                  <div className="rounded-xl bg-secondary p-3">
                    <option.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{option.label}</p>
                    <p className="text-sm text-muted-foreground">
                      {option.description}
                    </p>
                  </div>
                </Label>
              </div>
            ))}
          </RadioGroup>
        )}
      </div>
    </div>
  );
};
