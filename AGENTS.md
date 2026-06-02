# Mallorca Directory — Session Context

## Goal
Complete and deploy a multilingual Mallorca business directory app (Expo SDK 56, Expo Router, Firebase) on GitHub Pages with area grouping, OSM map, maps on business details, and accurate geo data for all 908 businesses.

## Constraints & Preferences
- 4 languages: English, Spanish, German, Russian
- Published on GitHub Pages at `https://0xaipad-maker.github.io/mallorca-directory/`
- No NativeWind (crashed web build), use StyleSheet instead
- Businesses grouped by area, browsable as `Areas → Categories → Businesses`
- Descriptions must be multilingual object `{ en, es, de, ru }`
- OpenStreetMap for geo data (free, no API key)

## Progress

### Done
- Official Mercadona API discovered at `storage.googleapis.com/pro-bucket-wcorp-files/json/data.js` — full store locator JSON with addresses, coordinates, phone, hours
- `scripts/fetch-mercadona-official.js`: fetches and imports 47 stores (40 Mallorca after filtering Menorca/Ibiza via bbox `lat 39.2-40.1, lng 2.0-3.6`)
- 40 official Mercadona stores with phone, hours, coordinates, included in weekly auto-import
- Multilingual descriptions: `description` as `{ en, es, de, ru }` for all 908 businesses
- Fixed initial "Unmatched Route" via URL normalization + history interception
- `scripts/fetch-osm.js`: Overpass API scraper for 18 categories (3s delay, Mallorca bbox)
- **908 businesses in Firestore** (145 seed + ~700 OSM + 40 official Mercadona + Lidl/Eroski/Aldi from OSM)
- `auto-import.yml`: runs `fetch-osm.js --import` + `fetch-mercadona-official.js --import` + `fix-descriptions.js` weekly
- App: `utils/areas.ts` (27+ municipalities), `MallorcaMap.tsx`, `BusinessMap.tsx` (height 480px)
- Area normalization: all 908 businesses' `area` field normalized to lowercase IDs
- Area query fix: uses `area.id` (lowercase) for Firestore queries

### Mallorca Map Feature Set (June 2026)
**Major redesign matching mallorca-map.com functionality:**

1. **Map-first design** — `app/(tabs)/index.tsx`: Full-screen OSM iframe as primary navigation, translucent header with search, horizontal category pills, popular places carousel, nearby area buttons
2. **Bottom tab navigation** — `app/(tabs)/_layout.tsx`: 5 tabs (Explore 🗺️, Events 📅, Guides 📖, Favorites ⭐, Profile 👤) with blue/gray active/inactive styling
3. **Subcategories** — `utils/categories.ts`: 60+ subcategories across all categories (Italian, Pizza, Sushi, 5 Star, Boutique, Water Sports, Handyman, etc.) with full 4-language translations in `store/useStore.ts`
4. **Events system** — `app/(tabs)/events.tsx` (month-grouped list, pull-to-refresh, category filter), `app/events/[id].tsx` (detail with date, time, price, location, business link), `app/add-event.tsx` (form for logged-in users)
5. **Guides/Tips** — `app/(tabs)/guides.tsx` (card list with category chips), `app/guides/[slug].tsx` (full article with title/content in current language)
6. **Trip Planner** — `app/(tabs)/favorites.tsx`: Segmented control with Favorites + Trip Planner tabs, create trip days, add businesses to plan, Firestore-backed
7. **Premium Partners** — Business model `premium` + `premiumType` fields, gold badge on detail page, premium indicator in profile "My Businesses" section
8. **Claim Listing** — `app/claim-business.tsx` (search + select + submit claim), `app/edit-business/[id].tsx` (owner-only edit), `ClaimRequest` Firestore collection
9. **Business detail** — Updated `app/business/[id].tsx` with: premium/verified badges, action buttons (Call/Website/Directions), claim prompt for unclaimed businesses, edit button for owners
10. **Data model** — `types.ts` extended with `MallorcaEvent`, `Guide`, `TripDay`, `ClaimRequest` interfaces
11. **Root layout** — Tab group + all new routes registered in Stack navigator

### In Progress
- (none)

### Blocked
- (none)

## Next Steps
- Add seed data for events and guides (create scripts)
- Set up auto-deploy on push to main
- Verify claim listing flow end-to-end
- Consider Leaflet/MapLibre for interactive map with markers and clustering
- Add event/guide data import to weekly auto-import workflow

## Key Decisions
- `<div ref>` + `document.createElement('iframe')` for OSM maps (works in static export)
- Overpass API: POST raw `text/plain`
- Areas stored as lowercase IDs (`calvia`, `palma`) in Firestore
- Mallorca bbox for Mercadona filter: `lat 39.2-40.1, lng 2.0-3.6`

## Critical Context
- Site URL: `https://0xaipad-maker.github.io/mallorca-directory/` (trailing slash!)
- Overpass API: `https://overpass-api.de/api/interpreter`, POST `text/plain`
- Expo SDK 56.0.5, Expo Router ~56.2.6, Firebase 11, TypeScript 6
- `npx expo export --platform web` builds to `dist/`
- `.env` is gitignored; `EXPO_PUBLIC_*` vars in CI secrets
- **908 businesses in Firestore total**, all with normalized area
- No "Other" section
- Tab navigation: `(tabs)` group with Explore 🗺️, Events 📅, Guides 📖, Favorites ⭐, Profile 👤

## Relevant Files
### Core
- `scripts/fetch-osm.js`, `scripts/fetch-supermarkets.js`, `scripts/fetch-mercadona-official.js`
- `scripts/seed-data.js`, `scripts/fix-descriptions.js`
- `scripts/normalize-areas.js`, `normalize-areas-2.js`
- `utils/areas.ts`, `utils/categories.ts`, `utils/firebase.ts`
- `types.ts` — Business, MallorcaEvent, Guide, TripDay, ClaimRequest

### Components
- `components/MallorcaMap.tsx`, `components/BusinessMap.tsx`

### Screens
- `app/(tabs)/_layout.tsx` — Tab bar (5 tabs)
- `app/(tabs)/index.tsx` — Map-first home
- `app/(tabs)/events.tsx` — Events list (month-grouped)
- `app/(tabs)/guides.tsx` — Guides list
- `app/(tabs)/favorites.tsx` — Favorites + Trip Planner
- `app/(tabs)/profile.tsx` — Profile + My Businesses + Claim
- `app/area/[name].tsx`, `app/list.tsx` — Area/Category browsing
- `app/business/[id].tsx` — Detail with premium/claim
- `app/events/[id].tsx`, `app/guides/[slug].tsx` — Detail screens
- `app/claim-business.tsx` — Claim a business
- `app/add-event.tsx` — Add new event
- `app/edit-business/[id].tsx` — Owner edit business
- `app/login.tsx`, `app/add-business.tsx`
- `app/_layout.tsx` — Root Stack layout

### Store
- `store/useStore.ts` — Translations (60+ keys, 4 languages), categoryTranslations, subcategoryTranslations, favorites, plannedDays, user

### CI
- `.github/workflows/deploy-pages.yml`, `.github/workflows/auto-import.yml`
