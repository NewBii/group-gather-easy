-- Add notification preferences column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS notification_preferences jsonb 
DEFAULT '{"event_updates": true, "new_participants": true, "voting_reminders": true, "event_finalized": true}'::jsonb;