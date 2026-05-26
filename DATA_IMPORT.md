# Data Population

## Current Data
The app has **75 seed businesses** across 17 categories (restaurants, cafes, hotels, beaches, parks, pharmacies, supermarkets, etc.).

## How Auto-Population Works

### 1. GitHub Actions (easiest)
This repo includes `.github/workflows/auto-import.yml` — a scheduled workflow that runs every Monday and imports data from the seed script.

**To enable:**
1. Push to GitHub
2. Go to Settings → Secrets → Actions
3. Add your Firebase config values as secrets:
   - `FIREBASE_API_KEY`
   - `FIREBASE_AUTH_DOMAIN`
   - `FIREBASE_PROJECT_ID`
   - `FIREBASE_STORAGE_BUCKET`
   - `FIREBASE_MESSAGING_SENDER_ID`
   - `FIREBASE_APP_ID`
4. The workflow runs automatically every Monday (or manually via "Run workflow")

### 2. Firebase Cloud Functions (advanced)
The `functions/` folder contains a scheduled Cloud Function (`autoImportOpenData`) that fetches from Open Data CAIB API.

**To deploy:**
```bash
npm install -g firebase-tools
firebase login
firebase init functions
firebase deploy --only functions
```

### 3. Manual Import
```bash
# Clear existing data
node scripts/clear-data.js

# Seed with fresh data
node scripts/seed-data.js
```

## Open Data Sources (Mallorca)
- **Open Data Illes Balears**: https://intranet.caib.es/opendatacataleg/
- **Pharmacies**: dataset `farmacia`
- **Tourism businesses**: daily updates
- **Coordinates**: UTM + GPS format

## Google Places API (optional)
The `scripts/import-google-places.js` script can import:
- Restaurants, supermarkets, hotels, services
- Ratings and reviews
- Opening hours
- Photos

Requires Google Places API key with billing enabled.
