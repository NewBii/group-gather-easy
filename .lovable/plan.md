

## Problem

When an anonymous participant joins an event created by an authenticated user, they cannot save votes (availability, scenario votes, etc.). The error is "Error saving vote."

**Root cause**: The `owns_participant` database function controls write access for votes. For anonymous participants (`user_id IS NULL`), it only returns `TRUE` if the event was also created anonymously (`created_by IS NULL`). When the event was created by an authenticated user, anonymous participants are blocked by RLS.

Relevant code in `owns_participant`:
```sql
IF v_user_id IS NULL THEN
    SELECT created_by INTO v_event_created_by FROM events WHERE id = v_event_id;
    IF v_event_created_by IS NULL THEN
        RETURN TRUE;  -- Only allows anon participants in anon events
    END IF;
END IF;
RETURN FALSE;
```

## Fix

**Database migration**: Update the `owns_participant` function to allow anonymous participants to act on their own data regardless of who created the event. Change the anonymous participant block to return `TRUE` without checking `created_by`:

```sql
IF v_user_id IS NULL THEN
    RETURN TRUE;
END IF;
```

**Security tradeoff**: This means any unauthenticated request with a valid participant ID can act as that participant. This is the same trust model already used for anonymous events and is acceptable since anonymous participant IDs are UUIDs only known to the client that joined.

**No frontend changes needed** -- the AvailabilityPanel and vote components already have the correct Supabase calls; they just fail at the RLS layer.

