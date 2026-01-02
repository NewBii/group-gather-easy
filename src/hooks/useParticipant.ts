import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { z } from 'zod';

const participantIdSchema = z.string().uuid();

export interface CurrentParticipant {
  id: string;
  name: string;
  email: string | null;
  user_id: string | null;
  is_organizer: boolean;
}

export const useParticipant = (eventId: string | undefined) => {
  const [currentParticipant, setCurrentParticipant] = useState<CurrentParticipant | null>(null);
  const [loading, setLoading] = useState(true);

  const getStorageKey = (eventId: string) => `participant_${eventId}`;

  // Check if participant exists in localStorage or by user_id
  const checkExistingParticipant = async () => {
    if (!eventId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // First check if user is logged in
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        // Check for participant linked to this user
        const { data: userParticipant } = await supabase
          .from('participants')
          .select('id, name, email, user_id, is_organizer')
          .eq('event_id', eventId)
          .eq('user_id', user.id)
          .single();

        if (userParticipant) {
          setCurrentParticipant(userParticipant);
          // Also store in localStorage for convenience
          localStorage.setItem(getStorageKey(eventId), userParticipant.id);
          setLoading(false);
          return;
        }
      }

      // Check localStorage for anonymous participant
      const storedId = localStorage.getItem(getStorageKey(eventId));
      
      if (storedId) {
        // Validate stored ID format
        const parseResult = participantIdSchema.safeParse(storedId);
        if (!parseResult.success) {
          localStorage.removeItem(getStorageKey(eventId));
          setLoading(false);
          return;
        }

        // Verify participant still exists in database
        const { data: participant } = await supabase
          .from('participants')
          .select('id, name, email, user_id, is_organizer')
          .eq('id', storedId)
          .eq('event_id', eventId)
          .single();

        if (participant) {
          setCurrentParticipant(participant);
          
          // If user is now logged in, link this participant to user
          if (user && !participant.user_id) {
            await supabase
              .from('participants')
              .update({ user_id: user.id })
              .eq('id', participant.id);
            
            setCurrentParticipant({ ...participant, user_id: user.id });
          }
        } else {
          // Participant no longer exists, clear localStorage
          localStorage.removeItem(getStorageKey(eventId));
        }
      }
    } catch (err) {
      console.error('Error checking existing participant:', err);
    } finally {
      setLoading(false);
    }
  };

  // Join event as participant
  const joinEvent = async (name: string, email?: string) => {
    if (!eventId) return null;

    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { data: participant, error } = await supabase
        .from('participants')
        .insert({
          event_id: eventId,
          name: name.trim(),
          email: email?.trim() || null,
          user_id: user?.id || null,
          is_organizer: false,
        })
        .select('id, name, email, user_id, is_organizer')
        .single();

      if (error) throw error;

      if (participant) {
        setCurrentParticipant(participant);
        localStorage.setItem(getStorageKey(eventId), participant.id);
      }

      return participant;
    } catch (err) {
      console.error('Error joining event:', err);
      throw err;
    }
  };

  // Update participant location (for fair_spot)
  const updateLocation = async (lat: number, lng: number, transportMode: string) => {
    if (!currentParticipant) return;

    try {
      const { error } = await supabase
        .from('participants')
        .update({
          location_lat: lat,
          location_lng: lng,
          transport_mode: transportMode as 'car' | 'public_transit' | 'bike' | 'walk',
        })
        .eq('id', currentParticipant.id);

      if (error) throw error;
    } catch (err) {
      console.error('Error updating location:', err);
      throw err;
    }
  };

  // Link anonymous participant to logged-in user
  const linkToUser = async () => {
    if (!currentParticipant) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      const { error } = await supabase
        .from('participants')
        .update({ user_id: user.id })
        .eq('id', currentParticipant.id);

      if (error) throw error;

      setCurrentParticipant({ ...currentParticipant, user_id: user.id });
    } catch (err) {
      console.error('Error linking participant to user:', err);
      throw err;
    }
  };

  useEffect(() => {
    checkExistingParticipant();
  }, [eventId]);

  // Listen to auth state changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      checkExistingParticipant();
    });

    return () => subscription.unsubscribe();
  }, [eventId]);

  return {
    currentParticipant,
    loading,
    joinEvent,
    updateLocation,
    linkToUser,
    refetch: checkExistingParticipant,
  };
};
