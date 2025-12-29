-- Create a validation trigger function for events table
CREATE OR REPLACE FUNCTION public.validate_event_input()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  -- Validate title length (1-100 characters)
  IF NEW.title IS NULL OR length(NEW.title) < 1 THEN
    RAISE EXCEPTION 'Title cannot be empty';
  END IF;
  
  IF length(NEW.title) > 100 THEN
    RAISE EXCEPTION 'Title must be 100 characters or less';
  END IF;
  
  -- Validate description length (max 500 characters)
  IF NEW.description IS NOT NULL AND length(NEW.description) > 500 THEN
    RAISE EXCEPTION 'Description must be 500 characters or less';
  END IF;
  
  -- Validate unique_slug length (max 50 characters)
  IF NEW.unique_slug IS NOT NULL AND length(NEW.unique_slug) > 50 THEN
    RAISE EXCEPTION 'Slug must be 50 characters or less';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to validate on INSERT and UPDATE
CREATE TRIGGER validate_event_input_trigger
  BEFORE INSERT OR UPDATE ON public.events
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_event_input();