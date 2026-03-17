

## Plan: Accommodation Locking in Lockdown View

Currently, the `AccommodationCard` already supports a "locked" state (with `isLocked`, `lockedName`, `lockedDescription`), but there's no UI to actually set this info. The accommodation data lives in the winning scenario's `metadata.accommodation` JSON — it's never editable after AI generation.

### Approach

Add an **Accommodation section** to `LockdownView` that:
- For **everyone**: shows the accommodation info from the winning scenario metadata (name, style, Booking/Airbnb search links derived from location + date)
- For the **organizer**: adds an inline form to "lock" accommodation — enter a name, optional description, and optional URL. This writes to the event's `final_location` JSONB field (which already exists and is updatable by organizers) under an `accommodation` key.
- Once locked, all participants see the confirmed accommodation with a green "Organizer's Choice" badge (reusing `AccommodationCard`'s locked display)

### Changes

**1. `src/components/event/LockdownView.tsx`**

- Expand the `WinningScenario` interface to include `metadata` (with `location`, `accommodation`)
- Add an `AccommodationLockdownSection` below the verdict card:
  - If `event.final_location?.accommodation` exists (locked), render `AccommodationCard` in locked mode
  - Otherwise, show Booking.com + Airbnb search links (dynamic, from town + date) so participants can browse
  - If `isOrganizer`, show a "Lock accommodation" button that expands a small form: name, description, link. On submit, update `events.final_location` JSONB with `{ accommodation: { name, description, url } }`
- Pass `event` object to `LockdownView` (or just the relevant fields)

**2. `src/pages/Event.tsx`**

- Pass additional props to `LockdownView`: the event's `final_location` and a callback to update it (or pass the full event object)

**3. No database changes needed**

The `events.final_location` JSONB column already exists and organizers can already update their events via existing RLS policies.

### Files to edit
- `src/components/event/LockdownView.tsx` — add accommodation section with lock form
- `src/pages/Event.tsx` — pass extra props to LockdownView

