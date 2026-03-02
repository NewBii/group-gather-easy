

## Plan

### 1. Add "Étape 1" label above the voting section (PulseVoting.tsx)

Add a centered step label before the instruction banner, consistent with "Étape 2 · Vos disponibilités":

```
── Étape 1 · Classez les options ──
```

Style: a horizontal divider with centered text, matching the "Étape 2" separator style. This will be added inside `VotingHeader` at the top, before the instruction banner.

### 2. Fix "Voir l'événement" button placement (PulseVoting.tsx)

Currently it's buried inside the "Partager" tab (line 504-513), but from the screenshot it seems to also appear awkwardly near the header in OrganizerDashboard.

Move the "Voir l'événement" button to a small inline link next to the event title in `OrganizerDashboard.tsx` header section (lines 410-420), styled as a subtle `variant="ghost" size="sm"` button with the ExternalLink icon. Remove the duplicate from the "Partager" tab in PulseVoting.

### Files to edit
- `src/components/event/PulseVoting.tsx` — add "Étape 1" divider in VotingHeader, remove "Voir l'événement" from Partager tab
- `src/components/create-event/OrganizerDashboard.tsx` — add subtle "Voir l'événement" link next to the event title header

