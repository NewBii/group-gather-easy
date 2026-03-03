
CREATE OR REPLACE FUNCTION public.owns_participant(p_participant_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id uuid;
  v_event_id uuid;
BEGIN
  SELECT user_id, event_id INTO v_user_id, v_event_id
  FROM participants
  WHERE id = p_participant_id;
  
  IF v_event_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  IF auth.uid() IS NOT NULL AND v_user_id = auth.uid() THEN
    RETURN TRUE;
  END IF;
  
  IF v_user_id IS NULL THEN
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$function$;
