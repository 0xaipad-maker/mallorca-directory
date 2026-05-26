# Mallorca Directory

A multilingual business directory for Mallorca built with Expo (React Native) and Firebase. Web-first, iOS and Android compatible.

## Features

- **18 Categories** — Restaurants, Cafés, Hotels, Beaches, Parks, Activities, Shopping, Supermarkets, Services, Transport, Hospitals, Pharmacies, Police, Gas Stations, Veterinarians, Banks, Post Office, and Industrial Estates
- **Area Grouping** — Businesses are grouped by location (Palma, Calvià, Inca, Manacor, Alcúdia, etc.) within each category
- **Multilingual** — English, Spanish, German, Russian with full UI and category translations
- **Search** — Debounced full-text search across all businesses
- **Favorites** — Save businesses to your personal favorites list
- **User Accounts** — Email/password authentication via Firebase Auth
- **Add Business** — Registered users can submit new businesses
- **Business Details** — Address, phone, website, hours, rating, Google Maps link

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Expo SDK 56 (React Native) |
| Router | Expo Router v4 |
| UI | React Native StyleSheet (no NativeWind) |
| State | Zustand with persist |
| Backend | Firebase (Firestore, Auth) |
| Languages | ES, EN, DE, RU |
| Deployment | GitHub Pages + Actions |
| Auto-import | Cloud Functions (weekly cron) |

## Project Structure

```
mallorca-directory-v1/
├── app/                    # Expo Router pages
│   ├── _layout.tsx         # Stack navigator config
│   ├── index.tsx           # Home screen (categories grid + search)
│   ├── list.tsx            # Category list (grouped by area)
│   ├── login.tsx           # Auth screen
│   ├── profile.tsx         # User profile
│   ├── favorites.tsx       # Saved businesses
│   ├── add-business.tsx    # Add new business form
│   ├── map.tsx             # Map view
│   └── business/
│       └── [id].tsx        # Business detail screen
├── store/
│   └── useStore.ts         # Zustand store, translations, category translations
├── utils/
│   ├── firebase.ts         # Firebase init
│   └── categories.ts       # Category definitions (emoji, color)
├── scripts/
│   ├── seed-data.js        # Initial data seeding (150+ businesses)
│   ├── migrate-areas.js    # Adds area field to existing docs
│   └── ...                 # Other utility scripts
├── functions/
│   └── index.js            # Cloud Function for auto-import (weekly)
├── .github/workflows/
│   ├── deploy-pages.yml    # Build + deploy to GitHub Pages
│   └── auto-import.yml     # Weekly cron job for data import
├── app.json                # Expo config (baseUrl, plugins)
└── package.json
```

## Setup

### Prerequisites

- Node.js 22+
- npm
- Firebase project with Firestore and Auth enabled

### 1. Clone and install

```bash
git clone https://github.com/0xaipad-maker/mallorca-directory.git
cd mallorca-directory-v1
npm install
```

### 2. Configure Firebase

Copy `.env.example` to `.env` and fill in your Firebase config values:

```bash
cp .env.example .env
```

The `.env` file requires these values from Firebase Console → Project Settings → Web App:

```
EXPO_PUBLIC_FIREBASE_API_KEY=...
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=...
EXPO_PUBLIC_FIREBASE_PROJECT_ID=...
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=...
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
EXPO_PUBLIC_FIREBASE_APP_ID=...
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=...
```

### 3. Enable Auth

In Firebase Console → Authentication → Sign-in method:
- Enable **Email/Password** provider

### 4. Seed the database

```bash
node scripts/seed-data.js
```

To add `area` fields to existing documents (if upgrading from an older version):
```bash
node scripts/migrate-areas.js
```

### 5. Run locally

```bash
npx expo start --web
```

Or for iOS/Android:
```bash
npx expo start
```

## Deployment

The app is auto-deployed to GitHub Pages on every push to `main` via `.github/workflows/deploy-pages.yml`.

### GitHub Secrets

Add these repository secrets (Settings → Secrets and variables → Actions):

| Secret | Value |
|--------|-------|
| `FIREBASE_API_KEY` | From Firebase config |
| `FIREBASE_AUTH_DOMAIN` | From Firebase config |
| `FIREBASE_PROJECT_ID` | From Firebase config |
| `FIREBASE_STORAGE_BUCKET` | From Firebase config |
| `FIREBASE_MESSAGING_SENDER_ID` | From Firebase config |
| `FIREBASE_APP_ID` | From Firebase config |
| `GOOGLE_MAPS_API_KEY` | (optional) |

### Auto-Import (Weekly)

The `auto-import.yml` workflow runs weekly (Wednesdays) and triggers a Cloud Function that imports data from Open Data CAIB and Google Places API.

## Business Data

Businesses include:

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | Business name |
| `address` | string | Full street address |
| `area` | string | Mallorca area (Palma, Calvià, Inca, etc.) |
| `category` | string | Category ID |
| `phone` | string | Contact phone |
| `website` | string | Website URL |
| `rating` | number | 1-5 star rating |
| `verified` | boolean | Manually verified |
| `location` | {lat, lng} | GPS coordinates |
| `hours` | {open, close} | Operating hours |
| `description` | string | Short description |

## Areas Covered

Businesses are organized into these Mallorca areas:

Palma, Calvià, Santa Ponsa, Alcúdia, Pollença, Sóller, Deià, Valldemossa, Andratx, Inca, Manacor, Marratxí, Santanyí (Cala d'Or), Campos, Muro, Bunyola, Alaró, Capdepera, Artà, Felanitx, Llucmajor, Sa Pobla, Santa Maria del Camí, Binissalem, Consell, Ses Salines.

## License

MIT
