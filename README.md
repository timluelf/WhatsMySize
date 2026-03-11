# WhatsMySizeAI

**Stop guessing. Know your size.**

Data-driven clothing size prediction across 18+ brands. No AI, no avatars, no body scanning — just real sizing data from official brand charts.

## Brands Included (Men's & Women's)

Nike · Carhartt · Levi's · Lululemon · Adidas · Under Armour · H&M · Zara · Uniqlo · Ralph Lauren · Gap · Champion · American Eagle · Abercrombie & Fitch · Victoria's Secret · Old Navy · Aritzia · Forever 21

## How It Works

1. User enters height + weight + waist **OR** tells us what size they wear in a brand they know
2. System estimates body measurements (bust/chest from height+weight using NHANES regression model)
3. Compares against every brand's sizing data
4. Returns predicted size + confidence score for each brand
5. Generates a shareable Fit ID

## Tech Stack

- React 18
- Vite
- Deployed on Vercel

## Local Development

```bash
npm install
npm run dev
```

## Deploy to Vercel

1. Push this repo to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Click "New Project" → Import your GitHub repo
4. Vercel auto-detects Vite — just click "Deploy"
5. Done. You'll get a live URL in ~30 seconds.

## Adding a Custom Domain

1. Buy `whatsmysize.ai` (or .com) from Namecheap/Cloudflare
2. In Vercel dashboard → Settings → Domains → Add your domain
3. Update your DNS records as Vercel instructs
4. SSL is automatic

## Adding New Brands

Edit `src/App.jsx` and add entries to the `DB` object. Each brand needs:

```js
brandslug: {
  name: "Brand Name",
  i: "BN",          // 2-letter abbreviation
  c: "#HexColor",   // brand accent color
  tag: "Runs big/small/TTS",
  big: false,        // runs big?
  small: false,      // runs small?
  tts: true,         // true to size?
  mNote: "Men's fit notes...",
  wNote: "Women's fit notes...",
  mTops: [ { s: "M", bust: [38, 40], waist: [32, 35] }, ... ],
  mBot:  [ { s: "32", waist: [32, 33], hip: [38, 39] }, ... ],
  wTops: [ { s: "S (4-6)", bust: [34, 36], waist: [26, 29] }, ... ],
  wBot:  [ { s: "S (4-6)", waist: [26, 29], hip: [36, 38] }, ... ],
}
```

## Data Sources

All sizing data sourced from official brand size charts and authorized retailers:
- nike.com, carhartt.com, levi.com, lululemon.com, adidas.com
- underarmour.com, hm.com, zara.com, uniqlo.com
- ralphlauren.com, gap.com, champion.com
- ae.com, abercrombie.com, victoriassecret.com, oldnavy.com

Chest estimation formula based on NHANES anthropometric data (R²=0.815).
