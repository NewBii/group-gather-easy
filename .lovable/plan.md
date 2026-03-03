

## Plan: Dynamic Booking & Airbnb Search Links in Scenario Cards

### Current State
`ScenarioCard.tsx` only shows booking links if `metadata.accommodation.booking_url` or `airbnb_url` are pre-populated. Most scenarios don't have these, so links rarely appear.

`AccommodationCard.tsx` already has helper functions (`generateBookingUrl`, `generateAirbnbUrl`) that build search URLs from location, check-in, and check-out data.

### Changes

**1. Extract URL generators to a shared utility**

Move `generateBookingUrl` and `generateAirbnbUrl` from `AccommodationCard.tsx` into a new file `src/lib/bookingLinks.ts` so both components can use them.

**2. Update `ScenarioCard.tsx`**

- Import the shared URL generators
- When `metadata.accommodation.booking_url` / `airbnb_url` exist, use those (current behavior)
- Otherwise, if `locationInfo.townName` and `scenario.suggested_date` exist, dynamically generate search URLs using the town name and date (derive a weekend check-in/check-out from `suggested_date`)
- This makes the "Explorer l'hébergement" section appear on virtually all scenarios that have location data

**3. Keep `AccommodationCard.tsx` working**

- Replace the inline functions with imports from the shared utility. No behavior change.

### No backend changes needed

