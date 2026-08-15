# Hearth — real estate discovery MVP

Hearth is a mobile-first Australian property discovery app built around transparent data, visual browsing and private agent messaging. It is an installable PWA for iOS, Android and desktop, backed by Neon Postgres and designed for Vercel.

**Live app:** [realestate.dynamiccode.app](https://realestate.dynamiccode.app)

## What works

- suburb, postcode and street search
- strict property, bedroom and price filtering
- transparent-price-only mode
- vertical property feed with swipeable galleries
- save/pass preference learning
- property detail and disclosure completeness
- inspection shortlist
- property-specific, privacy-first messaging
- responsive desktop three-pane workspace
- Geist and Inter sans-first Nordic design system
- Truth Lens for price confidence, fact completeness and listing freshness
- offline app shell and installable manifest

## Local setup

1. Copy `.env.example` to `.env.local` and set `DATABASE_URL`.
2. Run `npm install`.
3. Run `npm run db:setup` to create and seed the isolated `hearth_*` tables.
4. Run `npm run dev`.

## Quality checks

- `npm run lint`
- `npm run build`
- `node scripts/verify-app.mjs` with the local app running
- `node scripts/design-gate.mjs` for responsive, accessibility and font checks

Product discovery and the complaint-to-feature bridge are documented in `docs/research-and-product-bridge.md`.
The visual system and component rules are documented in `design-dna.md`.
