# SET. Workout Tracker

Local-first workout tracker for building routines, logging sets, resting between sets, and tracking personal bests. Works offline as an installable phone app.

## Run on this computer

```bash
npm install
npm run dev
```

Open the Local URL Vite prints (usually `http://localhost:5173`).

## Use at the gym (phone)

After the app is deployed to GitHub Pages:

1. On your phone, open: **https://alexhaltom.github.io/workout/**
2. **Add to Home Screen**
   - **iPhone (Safari):** Share → **Add to Home Screen**
   - **Android (Chrome):** Menu ⋮ → **Install app** / **Add to Home screen**
3. Open **SET.** from your home screen at the gym — it works offline; your logs stay on the phone.

First visit needs network once so the app can install. After that, gym Wi‑Fi is optional.

## Deploy

Push to `main` and GitHub Actions publishes the site. In the GitHub repo: **Settings → Pages → Source: GitHub Actions**.

```bash
git add .
git commit -m "Add PWA and GitHub Pages deploy"
git push -u origin main
```

## Features

- Create routines (Push / Pull / Legs, etc.) with ordered exercises
- Start a workout and log weight × reps per set
- Automatic 1:30 rest timer after each logged set
- Personal best detection and weight/reps suggestions per lift
- Stats page with weekly activity, volume, PBs, and lift progress
- Installable PWA with offline support
