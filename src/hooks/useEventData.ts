import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface DateOption {
  id: string;
  start_date: string;
  end_date: string | null;
  event_id: string;
}

export interface DateVote {
  id: string;
  date_option_id: string;
  participant_id: string;
  vote: 'yes' | 'no' | 'maybe';
}

export interface Activity {
  id: string;
  event_id: string;
  name: string;
  description: string | null;
  suggested_by: string | null;
}

export interface ActivityVote {
  id: string;
  activity_id: string;
  participant_id: string;
  vote: 'yes' | 'no' | 'maybe';
}

export interface LocationSuggestion {
  id: string;
  event_id: string;
  name: string;
  address: string | null;
  suggested_by: string | null;
}

export interface LocationVote {
  id: string;
  location_suggestion_id: string;
  participant_id: string;
  vote: 'yes' | 'no' | 'maybe';
}

// Public participant data (excludes PII like email, location)
export interface Participant {
  id: string;
  event_id: string | null;
  name: string | null;
  is_organizer: boolean | null;
  created_at: string | null;
}

// Full participant data with location (for authenticated participants only)
export interface FullParticipant {
  id: string;
  event_id: string;
  name: string;
  email: string | null;
  user_id: string | null;
  is_organizer: boolean;
  location_lat: number | null;
  location_lng: number | null;
  transport_mode: 'car' | 'public_transit' | 'bike' | 'walk' | null;
  created_at: string;
}

export interface Event {
  id: string;
  title: string;
  description: string | null;
  unique_slug: string;
  event_type: 'day_event' | 'multi_day_event';
  status: 'active' | 'finalized' | 'cancelled';
  location_type: 'set_venues' | 'suggestions' | 'fair_spot' | null;
  location_data: Record<string, unknown> | null;
  date_range_start: string | null;
  date_range_end: string | null;
  final_date: string | null;
  final_location: Record<string, unknown> | null;
  created_by: string | null;
  created_at: string;
}

export const useEventData = (slugOrId: string | undefined) => {
  const { toast } = useToast();
  const [event, setEvent] = useState<Event | null>(null);
  const [dateOptions, setDateOptions] = useState<DateOption[]>([]);
  const [dateVotes, setDateVotes] = useState<DateVote[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [activityVotes, setActivityVotes] = useState<ActivityVote[]>([]);
  const [locationSuggestions, setLocationSuggestions] = useState<LocationSuggestion[]>([]);
  const [locationVotes, setLocationVotes] = useState<LocationVote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch event and all related data
  const fetchEventData = async (isRealtime = false) => {
    if (!slugOrId) return;

    try {
      // Only show loading spinner on initial load, not realtime updates
      if (!isRealtime) {
        setLoading(true);
      }
      setError(null);

      // Try to find by slug first, then by id
      let eventQuery = supabase
        .from('events')
        .select('*')
        .eq('unique_slug', slugOrId)
        .single();

      let { data: eventData, error: eventError } = await eventQuery;

      // If not found by slug, try by id
      if (eventError && eventError.code === 'PGRST116') {
        const { data: eventById, error: idError } = await supabase
          .from('events')
          .select('*')
          .eq('id', slugOrId)
          .single();

        if (idError) throw idError;
        eventData = eventById;
      } else if (eventError) {
        throw eventError;
      }

      if (!eventData) {
        setError('Event not found');
        return;
      }

      setEvent(eventData as Event);

      // Fetch all related data in parallel
      const [
        { data: dates },
        { data: votes },
        { data: parts },
        { data: acts },
        { data: actVotes },
        { data: locSuggs },
        { data: locVotes },
      ] = await Promise.all([
        supabase.from('date_options').select('*').eq('event_id', eventData.id),
        supabase.from('date_votes').select('*').in('date_option_id', 
          (await supabase.from('date_options').select('id').eq('event_id', eventData.id)).data?.map(d => d.id) || []
        ),
        supabase.from('participants_public').select('*').eq('event_id', eventData.id),
        supabase.from('activities').select('*').eq('event_id', eventData.id),
        supabase.from('activity_votes').select('*').in('activity_id',
          (await supabase.from('activities').select('id').eq('event_id', eventData.id)).data?.map(a => a.id) || []
        ),
        supabase.from('location_suggestions').select('*').eq('event_id', eventData.id),
        supabase.from('location_votes').select('*').in('location_suggestion_id',
          (await supabase.from('location_suggestions').select('id').eq('event_id', eventData.id)).data?.map(l => l.id) || []
        ),
      ]);

      setDateOptions((dates as DateOption[]) || []);
      setDateVotes((votes as DateVote[]) || []);
      setParticipants((parts as Participant[]) || []);
      setActivities((acts as Activity[]) || []);
      setActivityVotes((actVotes as ActivityVote[]) || []);
      setLocationSuggestions((locSuggs as LocationSuggestion[]) || []);
      setLocationVotes((locVotes as LocationVote[]) || []);

    } catch (err) {
      console.error('Error fetching event data:', err);
      setError('Failed to load event');
    } finally {
      if (!isRealtime) {
        setLoading(false);
      }
    }
  };

  // Subscribe to realtime updates
  useEffect(() => {
    if (!event?.id) return;

    const channel = supabase
      .channel(`event-${event.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'participants', filter: `event_id=eq.${event.id}` }, 
        () => fetchEventData(true)
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'date_votes' }, 
        () => fetchEventData(true)
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'activities', filter: `event_id=eq.${event.id}` }, 
        () => fetchEventData(true)
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'activity_votes' }, 
        () => fetchEventData(true)
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'location_suggestions', filter: `event_id=eq.${event.id}` }, 
        () => fetchEventData(true)
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'location_votes' }, 
        () => fetchEventData(true)
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [event?.id]);

  useEffect(() => {
    fetchEventData();
  }, [slugOrId]);

  return {
    event,
    dateOptions,
    dateVotes,
    participants,
    activities,
    activityVotes,
    locationSuggestions,
    locationVotes,
    loading,
    error,
    refetch: fetchEventData,
  };
};
