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

## Train with an AI coach

SET. works with ChatGPT, Claude, Gemini, or any AI agent. No API keys; everything goes through copy and paste.

1. **Set up**: open **Coach**, fill in the optional "about me" fields, then tap **Copy setup prompt** and paste it into a new chat. (Or **Download .md** and attach it.) For a coach that always remembers the format, put the **format reference** in a ChatGPT custom GPT/Project, a Claude Project, or a Gemini Gem.
2. **Import**: copy the weekly plan the AI writes, then **Import plan → Paste from clipboard**. Review the preview and import. Missing exercises and one routine per workout name (Push, Pull…) are created for you.
3. **Train**: home shows **This week** with the next day up. Each set's target weight × reps is shown and prefilled.
4. **Check in**: tap **Finish**, then **Copy results for coach** and paste into the same chat. Planned vs. actual is included. After the last day, the copy asks for next week's plan, and you import it the same way.

If the coach changes the plan mid-week, import it with **Update this week** so finished days stay checked off.

### Plan format

```markdown
# Week 1: Strength base
Units: lbs

## Day 1: Push
### Barbell Bench Press
- 135 x 8
- 3 x 6 @ 155
- Note: pause on the chest
### Push-up
- 2 x 15 @ BW
```

`#` week title · `##` day (`Day N: Name`) · `###` exercise · one bullet per set (`weight x reps`, or `sets x reps @ weight`). The importer also tolerates code fences, chatty intros, `lbs`/`reps` suffixes, `×`, and rep ranges (it uses the low end).

## Features

- Create routines (Push / Pull / Legs, etc.) with ordered exercises
- Start a workout and log weight × reps per set
- Automatic 1:30 rest timer after each logged set
- AI coach loop: setup prompt, weekly plan import, per-set targets, one-tap check-ins
- Personal best detection and weight/reps suggestions per lift
- Stats page with weekly activity, volume, PBs, and lift progress
- Installable PWA with offline support
