import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Check, X, HelpCircle, Plus, MapPin, Car, Train, Bike, Footprints } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLanguage } from '@/i18n/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import type { Event, LocationSuggestion, LocationVote, Participant } from '@/hooks/useEventData';

const locationSchema = z.object({
  name: z.string().min(1, 'Location name is required').max(100),
  address: z.string().max(200).optional(),
});

const participantLocationSchema = z.object({
  location: z.string().min(1, 'Location is required').max(200),
  transportMode: z.enum(['car', 'public_transport', 'bike', 'walk']),
});

type LocationFormValues = z.infer<typeof locationSchema>;
type ParticipantLocationValues = z.infer<typeof participantLocationSchema>;

interface LocationSectionProps {
  event: Event;
  locationSuggestions: LocationSuggestion[];
  locationVotes: LocationVote[];
  participants: Participant[];
  participantId: string | undefined;
  onUpdateLocation: (lat: number, lng: number, transportMode: string) => Promise<void>;
}

type VoteType = 'yes' | 'no' | 'maybe';

export const LocationSection = ({ 
  event,
  locationSuggestions, 
  locationVotes, 
  participants,
  participantId,
  onUpdateLocation,
}: LocationSectionProps) => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [isAdding, setIsAdding] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [voting, setVoting] = useState<string | null>(null);

  const form = useForm<LocationFormValues>({
    resolver: zodResolver(locationSchema),
    defaultValues: {
      name: '',
      address: '',
    },
  });

  const locationForm = useForm<ParticipantLocationValues>({
    resolver: zodResolver(participantLocationSchema),
    defaultValues: {
      location: '',
      transportMode: 'car',
    },
  });

  const getVoteCounts = (locationId: string) => {
    const votes = locationVotes.filter(v => v.location_suggestion_id === locationId);
    return {
      yes: votes.filter(v => v.vote === 'yes').length,
      no: votes.filter(v => v.vote === 'no').length,
      maybe: votes.filter(v => v.vote === 'maybe').length,
    };
  };

  const getCurrentVote = (locationId: string): VoteType | null => {
    if (!participantId) return null;
    const vote = locationVotes.find(v => v.location_suggestion_id === locationId && v.participant_id === participantId);
    return vote?.vote || null;
  };

  const handleAddLocation = async (values: LocationFormValues) => {
    if (!participantId) {
      toast({
        title: t.eventPage.location.joinFirst,
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('location_suggestions')
        .insert({
          event_id: event.id,
          name: values.name.trim(),
          address: values.address?.trim() || null,
          suggested_by: participantId,
        });

      if (error) throw error;

      form.reset();
      setIsAdding(false);
      toast({
        title: t.eventPage.location.addSuccess,
      });
    } catch (err) {
      console.error('Error adding location:', err);
      toast({
        title: t.eventPage.location.addError,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVote = async (locationId: string, vote: VoteType) => {
    if (!participantId) {
      toast({
        title: t.eventPage.location.joinFirst,
        variant: 'destructive',
      });
      return;
    }

    setVoting(locationId);

    try {
      const existingVote = locationVotes.find(
        v => v.location_suggestion_id === locationId && v.participant_id === participantId
      );

      if (existingVote) {
        const { error } = await supabase
          .from('location_votes')
          .update({ vote })
          .eq('id', existingVote.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('location_votes')
          .insert({
            location_suggestion_id: locationId,
            participant_id: participantId,
            vote,
          });

        if (error) throw error;
      }
    } catch (err) {
      console.error('Error voting:', err);
      toast({
        title: t.eventPage.location.voteError,
        variant: 'destructive',
      });
    } finally {
      setVoting(null);
    }
  };

  const handleParticipantLocation = async (values: ParticipantLocationValues) => {
    // For now, we'll use a simple geocoding simulation
    // In production, you'd integrate with a geocoding API
    setIsSubmitting(true);
    try {
      // Placeholder coordinates - in real app, geocode the address
      await onUpdateLocation(48.8566, 2.3522, values.transportMode);
      toast({
        title: t.eventPage.location.locationSaved,
      });
    } catch (err) {
      console.error('Error saving location:', err);
      toast({
        title: t.eventPage.location.locationError,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTransportIcon = (mode: string) => {
    switch (mode) {
      case 'car': return <Car className="h-4 w-4" />;
      case 'public_transport': return <Train className="h-4 w-4" />;
      case 'bike': return <Bike className="h-4 w-4" />;
      case 'walk': return <Footprints className="h-4 w-4" />;
      default: return <Car className="h-4 w-4" />;
    }
  };

  // Sort by yes votes
  const sortedLocations = [...locationSuggestions].sort((a, b) => {
    const aYes = getVoteCounts(a.id).yes;
    const bYes = getVoteCounts(b.id).yes;
    return bYes - aYes;
  });

  const bestLocation = sortedLocations[0];
  const bestYesCount = bestLocation ? getVoteCounts(bestLocation.id).yes : 0;

  // Render fair_spot mode
  if (event.location_type === 'fair_spot') {
    const currentParticipant = participants.find(p => p.id === participantId);
    const hasLocation = currentParticipant?.location_lat && currentParticipant?.location_lng;
    const participantsWithLocation = participants.filter(p => p.location_lat && p.location_lng);

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            <span>{t.eventPage.location.title}</span>
          </CardTitle>
          <CardDescription>
            {t.eventPage.location.fairSpotExplanation}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {participantId && !hasLocation && (
            <div className="p-4 rounded-lg border bg-muted/50">
              <Form {...locationForm}>
                <form onSubmit={locationForm.handleSubmit(handleParticipantLocation)} className="space-y-3">
                  <FormField
                    control={locationForm.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.eventPage.location.yourLocation}</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder={t.eventPage.location.locationPlaceholder} 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={locationForm.control}
                    name="transportMode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.eventPage.location.transportMode}</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="car">
                              <div className="flex items-center gap-2">
                                <Car className="h-4 w-4" />
                                {t.eventPage.location.transportModes.car}
                              </div>
                            </SelectItem>
                            <SelectItem value="public_transport">
                              <div className="flex items-center gap-2">
                                <Train className="h-4 w-4" />
                                {t.eventPage.location.transportModes.publicTransport}
                              </div>
                            </SelectItem>
                            <SelectItem value="bike">
                              <div className="flex items-center gap-2">
                                <Bike className="h-4 w-4" />
                                {t.eventPage.location.transportModes.bike}
                              </div>
                            </SelectItem>
                            <SelectItem value="walk">
                              <div className="flex items-center gap-2">
                                <Footprints className="h-4 w-4" />
                                {t.eventPage.location.transportModes.walk}
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" size="sm" disabled={isSubmitting}>
                    {t.eventPage.location.saveLocation}
                  </Button>
                </form>
              </Form>
            </div>
          )}

          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              {t.eventPage.location.participantsWithLocation.replace('{count}', participantsWithLocation.length.toString())}
            </p>
            {participantsWithLocation.map(p => (
              <div key={p.id} className="flex items-center gap-2 text-sm">
                {getTransportIcon(p.transport_mode || 'car')}
                <span>{p.name}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Render suggestions mode or set_venues mode
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            <span>{t.eventPage.location.title}</span>
          </div>
          {event.location_type === 'suggestions' && !isAdding && participantId && (
            <Button size="sm" variant="outline" onClick={() => setIsAdding(true)}>
              <Plus className="h-4 w-4 mr-2" />
              {t.eventPage.location.addSuggestion}
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isAdding && (
          <div className="p-4 rounded-lg border bg-muted/50">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleAddLocation)} className="space-y-3">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input 
                          placeholder={t.eventPage.location.namePlaceholder} 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input 
                          placeholder={t.eventPage.location.addressPlaceholder} 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex gap-2">
                  <Button type="submit" size="sm" disabled={isSubmitting}>
                    {t.eventPage.location.add}
                  </Button>
                  <Button 
                    type="button" 
                    size="sm" 
                    variant="ghost" 
                    onClick={() => {
                      setIsAdding(false);
                      form.reset();
                    }}
                  >
                    {t.common.cancel}
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        )}

        {locationSuggestions.length === 0 && !isAdding ? (
          <p className="text-muted-foreground text-center py-4">
            {t.eventPage.location.noLocations}
          </p>
        ) : (
          sortedLocations.map(location => {
            const counts = getVoteCounts(location.id);
            const currentVote = getCurrentVote(location.id);
            const isBest = bestYesCount > 0 && counts.yes === bestYesCount;

            return (
              <div 
                key={location.id} 
                className={cn(
                  "p-4 rounded-lg border transition-colors",
                  isBest && "border-primary bg-primary/5"
                )}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex-1">
                    <p className={cn("font-medium", isBest && "text-primary")}>
                      {location.name}
                    </p>
                    {location.address && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {location.address}
                      </p>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Check className="h-3 w-3 text-green-600" />
                        {counts.yes}
                      </span>
                      <span className="flex items-center gap-1">
                        <HelpCircle className="h-3 w-3 text-yellow-600" />
                        {counts.maybe}
                      </span>
                      <span className="flex items-center gap-1">
                        <X className="h-3 w-3 text-red-600" />
                        {counts.no}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant={currentVote === 'yes' ? 'default' : 'outline'}
                      className={cn(
                        currentVote === 'yes' && 'bg-green-600 hover:bg-green-700'
                      )}
                      onClick={() => handleVote(location.id, 'yes')}
                      disabled={voting === location.id || !participantId}
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant={currentVote === 'maybe' ? 'default' : 'outline'}
                      className={cn(
                        currentVote === 'maybe' && 'bg-yellow-600 hover:bg-yellow-700'
                      )}
                      onClick={() => handleVote(location.id, 'maybe')}
                      disabled={voting === location.id || !participantId}
                    >
                      <HelpCircle className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant={currentVote === 'no' ? 'default' : 'outline'}
                      className={cn(
                        currentVote === 'no' && 'bg-red-600 hover:bg-red-700'
                      )}
                      onClick={() => handleVote(location.id, 'no')}
                      disabled={voting === location.id || !participantId}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
};
