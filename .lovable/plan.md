

## Issues Identified

### 1. Tracker (AIProgressStepper) not centered with content
The `OrganizerDashboard` wraps everything in `<div className="space-y-6">` with no max-width, but `PulseVoting` inside it uses `max-w-5xl mx-auto`. The stepper and header sit outside PulseVoting, so they stretch full width while the cards are constrained. Fix: add `max-w-5xl mx-auto` to the OrganizerDashboard wrapper.

### 2. Missing "Étape 2" in organizer view
The `AvailabilitySection` only renders when `isDateFlexible` is true (line 305). Even when it does render, in the organizer view it's buried inside the "Disponibilités" tab with `collapsible={false}`, which just renders a raw `AvailabilityPanel` with no step divider. The tab label says "📅 Disponibilités" but there's no "Étape 2" separator. Fix: add the step divider inside the organizer "Disponibilités" tab content, and also show the tab even when date is not flexible (with a message like "No flexible dates").

### 3. Mixed English and French on same page
Multiple hardcoded English strings throughout:
- **AIProgressStepper.tsx** (line 21-33): descriptions "Idea created", "Gathering votes", "Finalized"
- **ConstraintBadge.tsx** (lines 38-39, 62-63, 87-88): tooltips "This is locked by the organizer", "The group will vote on this", "To be decided"  
- **ConstraintBadge.tsx**: fallback displayLabels in PulseVoting lines 430-445: "Date locked", "Vote on date", "Location set", "Location TBD", etc.
- **OrganizerDashboard.tsx** (lines 293-295, 452-453, 466, 472): "Scenarios are being generated...", "Generate Scenarios", "Setting up your organizer profile...", error toasts
- **PulseVoting.tsx**: subtitle fallback "Review the scenarios..." (line 430 in OrganizerDashboard)
- **ConsensusScore** title "Baromètre de décision" appears French but subtitle "0/1 ont voté" — need to check

### Files to edit
- **`src/components/create-event/OrganizerDashboard.tsx`** — add `max-w-5xl mx-auto` wrapper, translate all hardcoded English strings
- **`src/components/create-event/AIProgressStepper.tsx`** — translate descriptions using `language` check
- **`src/components/event/ConstraintBadge.tsx`** — translate tooltip text using `useLanguage`
- **`src/components/event/PulseVoting.tsx`** — translate ConstraintBadge fallback labels, add "Étape 2" divider in organizer availability tab

