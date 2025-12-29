-- Create event types enum
CREATE TYPE public.event_type AS ENUM ('day_event', 'trip');

-- Create event status enum
CREATE TYPE public.event_status AS ENUM ('draft', 'active', 'completed', 'cancelled');

-- Create location type enum
CREATE TYPE public.location_type AS ENUM ('set_venues', 'suggestions', 'fair_spot');

-- Create transport mode enum
CREATE TYPE public.transport_mode AS ENUM ('car', 'public_transit', 'bike', 'walk');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  email TEXT,
  language_preference TEXT DEFAULT 'fr' CHECK (language_preference IN ('fr', 'en')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create events table
CREATE TABLE public.events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  event_type public.event_type NOT NULL DEFAULT 'day_event',
  status public.event_status NOT NULL DEFAULT 'active',
  location_type public.location_type,
  location_data JSONB DEFAULT '{}',
  date_range_start DATE,
  date_range_end DATE,
  final_date DATE,
  final_location JSONB,
  unique_slug TEXT NOT NULL UNIQUE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create participants table
CREATE TABLE public.participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT,
  location_lat DOUBLE PRECISION,
  location_lng DOUBLE PRECISION,
  transport_mode public.transport_mode DEFAULT 'car',
  is_organizer BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.participants ENABLE ROW LEVEL SECURITY;

-- Profiles RLS Policies
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Events RLS Policies (public read via unique_slug, organizer can edit)
CREATE POLICY "Anyone can view events"
  ON public.events FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create events"
  ON public.events FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = created_by);

CREATE POLICY "Organizers can update their events"
  ON public.events FOR UPDATE
  USING (auth.uid() = created_by);

CREATE POLICY "Organizers can delete their events"
  ON public.events FOR DELETE
  USING (auth.uid() = created_by);

-- Participants RLS Policies
CREATE POLICY "Anyone can view participants of an event"
  ON public.participants FOR SELECT
  USING (true);

CREATE POLICY "Anyone can add themselves as participant"
  ON public.participants FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update their own participant entry"
  ON public.participants FOR UPDATE
  USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can delete their own participant entry"
  ON public.participants FOR DELETE
  USING (auth.uid() = user_id OR user_id IS NULL);

-- Create indexes
CREATE INDEX idx_events_unique_slug ON public.events(unique_slug);
CREATE INDEX idx_events_created_by ON public.events(created_by);
CREATE INDEX idx_participants_event_id ON public.participants(event_id);
CREATE INDEX idx_participants_user_id ON public.participants(user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON public.events
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_participants_updated_at
  BEFORE UPDATE ON public.participants
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'display_name', NEW.raw_user_meta_data ->> 'full_name'),
    NEW.email
  );
  RETURN NEW;
END;
$$;

-- Create trigger for automatic profile creation on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();