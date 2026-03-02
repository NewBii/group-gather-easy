

## Analysis of the Screenshot

The screenshot reveals several UX problems on desktop:

1. **Sidebar still appearing** — The "Baromètre de décision", "Liste de souhaits", and share panel are rendered in a right sidebar alongside the cards, squeezing the main content area. This contradicts the intended single-column + tabs layout.

2. **Duplicate header section** — "Choisissez votre préférence" header with constraint badges appears ABOVE the instruction banner, creating two competing headings before the cards even start.

3. **Weak visual hierarchy** — The instruction banner ("Classez les options de 1 à 3...") blends into the background. The constraint badges (date, location) look like interactive elements but aren't actionable for participants.

4. **Cards cut off** — Only 2 of 3 cards are visible, and the vote buttons are below the fold, making the primary CTA invisible without scrolling.

5. **No clear CTA** — The "Save" button is hidden below the cards; there's no sticky or prominent save action.

This means the sidebar is likely being rendered by the parent component (OrganizerDashboard or Event page) wrapping PulseVoting in a grid layout.

## Plan

### 1. Fix the parent layout (OrganizerDashboard.tsx)
Remove any remaining grid/sidebar wrapper around PulseVoting. Ensure PulseVoting renders in a full-width `max-w-4xl mx-auto` container with no adjacent sidebar columns.

### 2. Simplify the header hierarchy (PulseVoting.tsx)
- Remove the "Choisissez votre préférence" / "Choose Your Preference" h2 heading — it's redundant with the instruction banner.
- Keep only the instruction banner as the single directive: "Classez les options de 1 à 3 et signalez les impossibilités".
- Move constraint badges (date, location) into a subtle inline row above the cards, smaller and less prominent.

### 3. Make scenario cards more scannable (ScenarioCard.tsx)
- Add a colored left border to each card to visually differentiate options (e.g., Option A = blue, B = amber, C = green).
- Move the scenario label badge inline with the title instead of above it to save vertical space.
- Make the vote buttons slightly larger with clearer selected/unselected contrast.

### 4. Add a sticky save bar (PulseVoting.tsx)
- When `hasChanges` is true, render a sticky bottom bar (`fixed bottom-0`) with the save button and the progress indicator ("X/3 classées"), so the CTA is always visible regardless of scroll position.
- Remove the inline save button to avoid duplication.

### 5. Tighten spacing and card grid
- On desktop (lg), use `grid-cols-3` with `gap-6` and ensure cards have equal height via `h-full` on the Card component.
- Reduce card padding from `p-6` to `p-4` in the header/content areas to fit more content above the fold.

### Files to edit
- `src/components/create-event/OrganizerDashboard.tsx` — remove sidebar grid if still present
- `src/components/event/PulseVoting.tsx` — remove duplicate heading, add sticky save bar, tighten layout
- `src/components/event/ScenarioCard.tsx` — colored left border, compact header, larger vote buttons

