

## Plan: Structural Fixes Across CreateEvent, Event, and OrganizerDashboard

This is a solid set of fixes that addresses real UX gaps. Here's the plan:

### 1. Unify Organizer Dashboard in Event.tsx

In the AI Concierge section of `Event.tsx` (line ~457), when `isOrganizer` is true and `aiPhase !== 'lockdown'`, replace the raw `PulseVoting` render with `OrganizerDashboard`. This gives the organizer the same dashboard experience when returning to the event page.

- Import `OrganizerDashboard` (already imported at line 20 via `OrganizerTaskManager`, need to add the create-event one)
- Wrap the non-lockdown branch: if `isOrganizer`, render `OrganizerDashboard`; otherwise render current `PulseVoting` block

### 2. Fix Launch Screen Persistence

In `OrganizerDashboard.tsx`, change `sessionStorage` to `localStorage` for the launch state (lines 77 and 413). Two spots:
- `sessionStorage.getItem(`launched-${eventId}`)` → `localStorage.getItem(...)`
- `sessionStorage.setItem(`launched-${eventId}`, 'true')` → `localStorage.setItem(...)`

### 3. Hide ParticipantNudge for Organizer

In `Event.tsx`, wrap both `ParticipantNudge` renders (lines 477-482 and 512-517) with `{!isOrganizer && (...)}`.

### 4. Move Step3HelpersWanted to LockdownView

- Remove any reference to `Step3HelpersWanted` from `CreateEvent.tsx` (currently not referenced there, so no change needed)
- In `LockdownView.tsx`, import `Step3HelpersWanted` and render it below the `TaskSplitter` section, only when the viewer is the organizer. Add a section title "🙌 Répartir les tâches"
- `LockdownView` needs a new `isOrganizer` prop
- In `Event.tsx`, pass `isOrganizer` to `LockdownView`
- For Manual mode, wrap `OrganizerTaskManager` (line 511) to also ensure it's below all voting sections (already is) and only shown to organizer (already is)

### 5. Add Manual Mode Post-Creation Note

In `EventCreatedPrompt.tsx`, below the primary CTA button (line ~156), add a muted helper text:
```
"Vous pourrez suivre les votes depuis la page de l'événement."
```
Style: `text-xs text-muted-foreground text-center mt-2`

### Files to edit
- `src/pages/Event.tsx` — changes 1, 3, 4
- `src/components/create-event/OrganizerDashboard.tsx` — change 2
- `src/components/event/LockdownView.tsx` — change 4
- `src/components/EventCreatedPrompt.tsx` — change 5

