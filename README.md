# Naaptol — Indian Price Guessing Game

Vercel-ready React/Vite frontend for the daily Indian product-price game.

## Run

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Deploy

Push this folder to GitHub and import it into Vercel. Vercel will detect Vite automatically. The `/api` routes are Vercel serverless functions.

## Dataset

`data.json` is the final supplied product dataset. The browser receives the daily product without its price; the price is checked through `/api/guess`.


## Game rules

- The title is branded as **नापतोल / NAAPTOL**.
- All gameplay UI copy is in English.
- Players get 6 guesses.
- If the actual price is ₹163, guesses from ₹160 through ₹165 count as correct.
- After the 6th unsuccessful guess, the actual price is revealed.
