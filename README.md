# BeMember Dashboard Client

Static frontend for the BeMember clinic dashboard MVP.

The current version is a pixel-aligned dashboard prototype based on the shared Figma mockups. It is intentionally static for now: mock data lives in `app.js`, and Supabase/Stripe integration will be wired in the backend phase.

## What Is Included

- Dashboard shell with sidebar navigation
- Home metrics and live activity preview
- Customer, orders, memberships, app settings, and payouts screens
- Account details drawer
- Transaction redemption modal
- German dashboard copy from the mockups
- Figma-matched logo, icons, fonts, and preview assets
- Static Vercel-ready deployment setup

## Project Structure

```text
.
├── index.html
├── styles.css
├── app.js
├── assets/
│   ├── figma-icons/
│   ├── fonts/
│   └── images
├── package.json
├── vercel.json
└── README.md
```

## Local Setup

No build step is required.

```sh
npm run dev
```

Then open:

```text
http://127.0.0.1:4174
```

You can also run the same server directly:

```sh
python3 -m http.server 4174
```

## Navigation

The dashboard uses hash-based routes:

```text
#zuhause
#kunden
#bestellungen
#mitgliedschaften
#app
#auszahlungen
```

The app settings page also supports a query parameter for the active tab:

```text
?settings=angebote#app
```

## Mock Data

Temporary UI data is stored in `app.js`.

Important sections:

- `routeTitles`
- `activities`
- `customerRows`
- `transactions`
- `failedPayments`
- `offerSets`
- `products`
- `memberships`
- `rewards`
- `points`
- `news`

During backend integration these arrays should be replaced with Supabase queries and mutations.

## Vercel Deployment

1. Import this GitHub repository in Vercel.
2. Framework preset: `Other`.
3. Build command: leave empty.
4. Output directory: leave empty or use root.
5. Deploy.

Because this is a static frontend, Vercel can serve `index.html` directly from the repository root.

## Backend Integration Plan

The next phase should connect this dashboard to Supabase and Stripe:

- Supabase Auth for clinic owner/admin login
- Clinic-scoped tables for customers, orders, memberships, rewards, offers, news, and settings
- Row Level Security policies per clinic
- Customer CSV import flow
- Dashboard metrics from database views/RPCs
- Stripe checkout, customer portal, and webhook functions
- Redemption action for `Transaktion einlösen`
- Deployment environment variables in Vercel

## Notes

- UI copy is intentionally kept in German.
- Current data is placeholder data for demo purposes.
- Do not commit `.env` files or Supabase service role keys.
