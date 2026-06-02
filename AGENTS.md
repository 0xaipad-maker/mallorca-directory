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
- Routes: home with map/areas/categories, area/[name], list with filters, business/[id] with map
- Area normalization: all 908 businesses' `area` field normalized to lowercase IDs
- Area query fix: uses `area.id` (lowercase) for Firestore queries

### In Progress
- (none)

### Blocked
- (none)

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

## Relevant Files
- `scripts/fetch-osm.js`, `scripts/fetch-supermarkets.js`, `scripts/fetch-mercadona-official.js`
- `scripts/seed-data.js`, `scripts/fix-descriptions.js`
- `scripts/normalize-areas.js`, `normalize-areas-2.js`
- `utils/areas.ts`, `components/MallorcaMap.tsx`, `components/BusinessMap.tsx`
- `app/index.tsx`, `app/area/[name].tsx`, `app/list.tsx`, `app/business/[id].tsx`, `app/_layout.tsx`
- `.github/workflows/deploy-pages.yml`, `.github/workflows/auto-import.yml`
