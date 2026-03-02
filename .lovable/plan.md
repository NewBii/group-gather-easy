

## Inconsistencies Found

Looking at the screenshot and code, the UI has these style mismatches:

1. **"Étape 1" uses a separator-divider style** (centered text between two horizontal lines), but **"Étape 2" uses a collapsible-trigger style** (bg-muted/30 rounded box with chevron). They should look the same.

2. **The instruction banner repeats the Étape 1 text** — "Étape 1 · Classez les options" followed immediately by "Classez les options de 1 à 3 et signalez les impossibilités". This is redundant.

3. **"Vos disponibilités" header** says "📅 Étape 2 · Vos disponibilités" inside a collapsible trigger, while the **"Ajouter une idée"** wishes section uses the same collapsible style but has no step number — it's inconsistent whether this is a "step" or not.

4. **Organizer view** has wishes outside the tabs (lines 520+) as a standalone section, while availability is inside a tab. These should both be in consistent locations.

## Plan

### 1. Unify step label style (PulseVoting.tsx)
Use the **same separator-divider style** for both Étape 1 and Étape 2. The collapsible trigger for availability keeps the chevron but the step label above it should use the divider pattern:

```
── Étape 1 · Classez les options ──
[instruction banner]
[cards]

── Étape 2 · Vos disponibilités ──
[collapsible availability content]
```

Change the `AvailabilitySection` collapsible trigger to remove the "Étape 2" text from inside the trigger. Instead, add a separator-divider label **above** the collapsible, matching Étape 1's style. The collapsible trigger text becomes just "📅 Indiquez vos disponibilités" / "📅 Enter your availability".

### 2. Remove redundancy in instruction banner
Shorten the instruction banner text since "Étape 1" divider already says "Classez les options". Change the banner to just: "Classez de 1 à 3 · Marquez les impossibilités" (shorter, no repetition of "les options").

### 3. Make wishes section consistent
Add "── Étape 3 · Vos idées ──" divider above the wishes collapsible for participants. Change the trigger text to just "✨ Partagez une idée ou contrainte". For organizers, move the wishes section into the "Résultats" tab (it's already there via GroupWishlist) and remove the standalone wishes section below the tabs.

### Files to edit
- `src/components/event/PulseVoting.tsx` — unify divider styles, fix redundancy, reorganize wishes

