import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { z } from 'zod';

const participantIdSchema = z.string().uuid();

// Session expires after 48 hours for anonymous participants
const SESSION_DURATION_MS = 48 * 60 * 60 * 1000;

interface StoredParticipantSession {
  participantId: string;
  expiresAt: number;
}

const storedSessionSchema = z.object({
  participantId: z.string().uuid(),
  expiresAt: z.number(),
});

export interface CurrentParticipant {
  id: string;
  name: string;
  email: string | null;
  user_id: string | null;
  is_organizer: boolean;
}

// Clear all participant localStorage entries (call on logout)
export const clearParticipantStorage = () => {
  Object.keys(localStorage)
    .filter(key => key.startsWith('participant_'))
    .forEach(key => localStorage.removeItem(key));
};

export const useParticipant = (eventId: string | undefined) => {
  const [currentParticipant, setCurrentParticipant] = useState<CurrentParticipant | null>(null);
  const [loading, setLoading] = useState(true);

  const getStorageKey = (eventId: string) => `participant_${eventId}`;

  // Store participant session with expiration
  const storeParticipantSession = (eventId: string, participantId: string) => {
    const session: StoredParticipantSession = {
      participantId,
      expiresAt: Date.now() + SESSION_DURATION_MS,
    };
    localStorage.setItem(getStorageKey(eventId), JSON.stringify(session));
  };

  // Get participant ID from storage, validating expiration
  const getStoredParticipantId = (eventId: string): string | null => {
    const stored = localStorage.getItem(getStorageKey(eventId));
    if (!stored) return null;

    try {
      const parsed = JSON.parse(stored);
      const result = storedSessionSchema.safeParse(parsed);
      
      if (!result.success) {
        // Handle legacy format (plain ID string)
        const legacyResult = participantIdSchema.safeParse(stored);
        if (legacyResult.success) {
          // Migrate to new format
          storeParticipantSession(eventId, stored);
          return stored;
        }
        localStorage.removeItem(getStorageKey(eventId));
        return null;
      }

      // Check expiration
      if (result.data.expiresAt < Date.now()) {
        localStorage.removeItem(getStorageKey(eventId));
        return null;
      }

      return result.data.participantId;
    } catch {
      // Invalid JSON, check if it's a legacy plain ID
      const legacyResult = participantIdSchema.safeParse(stored);
      if (legacyResult.success) {
        storeParticipantSession(eventId, stored);
        return stored;
      }
      localStorage.removeItem(getStorageKey(eventId));
      return null;
    }
  };

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
          // Also store in localStorage for convenience (with expiration)
          storeParticipantSession(eventId, userParticipant.id);
          setLoading(false);
          return;
        }
      }

      // Check localStorage for anonymous participant (with expiration validation)
      const storedId = getStoredParticipantId(eventId);
      
      if (storedId) {
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

      if (user) {
        // Authenticated user: can use insert().select() with updated RLS policy
        const { data: participant, error } = await supabase
          .from('participants')
          .insert({
            event_id: eventId,
            name: name.trim(),
            email: email?.trim() || null,
            user_id: user.id,
            is_organizer: false,
          })
          .select('id, name, email, user_id, is_organizer')
          .single();

        if (error) throw error;

        if (participant) {
          setCurrentParticipant(participant);
          storeParticipantSession(eventId, participant.id);
        }

        return participant;
      } else {
        // Anonymous user: insert without select, then fetch separately
        const { error: insertError } = await supabase
          .from('participants')
          .insert({
            event_id: eventId,
            name: name.trim(),
            email: email?.trim() || null,
            user_id: null,
            is_organizer: false,
          });

        if (insertError) throw insertError;

        // Fetch the participant we just created (works for anonymous events)
        const { data: participant, error: selectError } = await supabase
          .from('participants')
          .select('id, name, email, user_id, is_organizer')
          .eq('event_id', eventId)
          .eq('name', name.trim())
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (selectError) throw selectError;

        if (participant) {
          setCurrentParticipant(participant);
          storeParticipantSession(eventId, participant.id);
        }

        return participant;
      }
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
