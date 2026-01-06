import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Check, X, HelpCircle, Plus, MapPin, Car, Train, Bike, Footprints, Edit2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { useLanguage } from '@/i18n/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { LocationInput } from './LocationInput';
import { FairSpotMap } from './FairSpotMap';
import type { Event, LocationSuggestion, LocationVote, Participant, FullParticipant } from '@/hooks/useEventData';

const locationSchema = z.object({
  name: z.string().min(1, 'Location name is required').max(100),
  address: z.string().max(200).optional(),
});

const participantLocationSchema = z.object({
  location: z.string().min(1, 'Location is required').max(200),
  transportMode: z.enum(['car', 'public_transit', 'bike', 'walk']),
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
  const [currentParticipantFull, setCurrentParticipantFull] = useState<FullParticipant | null>(null);
  const [participantsWithLocation, setParticipantsWithLocation] = useState<FullParticipant[]>([]);

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

  // Fetch current participant's full data (including location) - RLS protected
  useEffect(() => {
    const fetchCurrentParticipantData = async () => {
      if (!participantId || !event.id) return;
      
      const { data, error } = await supabase
        .from('participants')
        .select('id, event_id, name, is_organizer, location_lat, location_lng, transport_mode, created_at, email, user_id')
        .eq('id', participantId)
        .single();

      if (!error && data) {
        setCurrentParticipantFull(data as FullParticipant);
      }
    };

    fetchCurrentParticipantData();
  }, [participantId, event.id, participants]);

  // Fetch all participants with location for fair spot calculation
  useEffect(() => {
    const fetchLocationData = async () => {
      if (!event.id) return;
      
      const { data, error } = await supabase
        .from('participants')
        .select('id, event_id, name, is_organizer, location_lat, location_lng, transport_mode, created_at')
        .eq('event_id', event.id)
        .not('location_lat', 'is', null)
        .not('location_lng', 'is', null);

      if (!error && data) {
        setParticipantsWithLocation(data as FullParticipant[]);
      }
    };

    if (event.location_type === 'fair_spot') {
      fetchLocationData();
    }
  }, [event.id, event.location_type, participants]);

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
      case 'public_transit': return <Train className="h-4 w-4" />;
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

  // State for fair spot mode
  const [isEditingLocation, setIsEditingLocation] = useState(false);
  const [fairSpotAddress, setFairSpotAddress] = useState<string | null>(null);

  // Fetch fair spot address when we have 2+ participants with location
  const fetchFairSpotAddress = useCallback(async () => {
    if (participantsWithLocation.length < 2) {
      setFairSpotAddress(null);
      return;
    }

    // Calculate weighted centroid
    const TRANSPORT_WEIGHTS: Record<string, number> = {
      car: 1.0,
      public_transit: 1.2,
      bike: 1.5,
      walk: 2.0,
    };

    let totalWeightedLat = 0;
    let totalWeightedLng = 0;
    let totalWeight = 0;

    participantsWithLocation.forEach(p => {
      const weight = TRANSPORT_WEIGHTS[p.transport_mode || 'car'] || 1.0;
      totalWeightedLat += (p.location_lat || 0) * weight;
      totalWeightedLng += (p.location_lng || 0) * weight;
      totalWeight += weight;
    });

    const fairLat = totalWeightedLat / totalWeight;
    const fairLng = totalWeightedLng / totalWeight;

    try {
      const { data, error } = await supabase.functions.invoke('reverse-geocode', {
        body: { lat: fairLat, lng: fairLng },
      });

      if (!error && data.address) {
        setFairSpotAddress(data.address);
      }
    } catch (err) {
      console.error('Error fetching fair spot address:', err);
    }
  }, [participantsWithLocation]);

  useEffect(() => {
    if (event.location_type === 'fair_spot') {
      fetchFairSpotAddress();
    }
  }, [event.location_type, fetchFairSpotAddress]);

  // Handle location confirmation from LocationInput
  const handleLocationConfirm = async (lat: number, lng: number, address: string, transportMode: string) => {
    try {
      await onUpdateLocation(lat, lng, transportMode);
      setIsEditingLocation(false);
      // Refresh the current participant data
      if (participantId) {
        const { data } = await supabase
          .from('participants')
          .select('id, event_id, name, is_organizer, location_lat, location_lng, transport_mode, created_at, email, user_id')
          .eq('id', participantId)
          .single();
        if (data) {
          setCurrentParticipantFull(data as FullParticipant);
        }
      }
      toast({
        title: t.eventPage.location.locationSaved,
      });
    } catch (err) {
      console.error('Error saving location:', err);
      toast({
        title: t.eventPage.location.locationError,
        variant: 'destructive',
      });
    }
  };

  // Render fair_spot mode
  if (event.location_type === 'fair_spot') {
    const hasLocation = currentParticipantFull?.location_lat && currentParticipantFull?.location_lng;

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
          {/* Location Input for participant without location */}
          {participantId && !hasLocation && !isEditingLocation && (
            <div className="p-4 rounded-lg border bg-muted/50">
              <LocationInput
                onConfirm={handleLocationConfirm}
                initialTransportMode={currentParticipantFull?.transport_mode || 'car'}
              />
            </div>
          )}

          {/* Edit location button for participant with location */}
          {participantId && hasLocation && !isEditingLocation && (
            <div className="p-4 rounded-lg border bg-muted/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{t.eventPage.location.locationSaved}</span>
                </div>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => setIsEditingLocation(true)}
                >
                  <Edit2 className="h-4 w-4 mr-2" />
                  {t.eventPage.location.updateLocation}
                </Button>
              </div>
            </div>
          )}

          {/* Editing location */}
          {participantId && isEditingLocation && (
            <div className="p-4 rounded-lg border bg-muted/50">
              <LocationInput
                onConfirm={handleLocationConfirm}
                onCancel={() => setIsEditingLocation(false)}
                initialTransportMode={currentParticipantFull?.transport_mode || 'car'}
              />
            </div>
          )}

          {/* Fair Spot Map */}
          <FairSpotMap 
            participants={participants}
            eventId={event.id}
            fairSpotAddress={fairSpotAddress}
          />
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