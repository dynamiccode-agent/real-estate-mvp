# Design DNA — Hearth

**Last updated:** 2026-08-16 · **Property:** realestate.dynamiccode.app · **Repo:** dynamiccode-agent / Real Estate MVP

## Thesis

> Nordic calm, Australian light, decision-grade clarity: a crisp sans-only product system frames generous property photography while the Truth Lens makes every important fact immediately scannable.

## Personality sliders

warm ——◐—— cold · playful ———◐— serious · minimal —◐——— maximal · classic ————◐ futuristic · loud ————◐ quiet

## Signature element

The **Truth Lens** appears once on every property card and detail view. It is a compact, precision-machined disclosure strip combining price confidence, listing freshness and disclosure completeness before any contact action. It uses a solid high-contrast surface on scrolling content and glass only when it becomes persistent.

## Tokens

- **Display font:** Geist Sans Variable (600–760) — geometric, compact and recognisably product-led without serif nostalgia.
- **Body font:** Inter Variable (400–700) · **Data:** Inter tabular numerals
- **Neutrals:** Nordic daylight `oklch(0.978 0.004 150)`, cool mist `oklch(0.935 0.008 150)`, graphite `oklch(0.20 0.018 160)`
- **Brand color:** deep eucalyptus `oklch(0.32 0.065 160)` · **Accent:** hospitality coral `oklch(0.65 0.24 22)` — only truth states, primary decisions and live indicators
- **Glass:** restricted to fixed or sticky navigation, sheets and action docks; scrolling content uses opaque mist/white surfaces for speed and legibility
- **Radius voice:** controlled Nordic softness — 12px controls, 18px utility cards, 24px property shells; capsules only for search and compact status controls
- **Elevation:** diffuse daylight shadows, no hard drop shadows · **Motion:** signature = decisive card drift; 100/200/350/650ms with expo-out entrances

## Composition rules

- Hero archetype: product-in-context; the listing feed is the home screen.
- One dominant photograph per viewport. Listing summaries remain solid warm white; glass is reserved for controls, navigation, filters and the functional Truth Lens.
- Desktop transforms into a three-part workspace: quiet navigation rail, dominant visual feed, and a precise decision context.
- Mobile actions remain above the safe-area bottom navigation and never rely on gesture alone.
- Translucency is progressive enhancement: reduced-transparency users receive opaque warm-white surfaces with the same hierarchy.

## Voice

- Tone: candid, calm, neighbourly.
- Proof language: data completeness, freshness and exact visible values only.
- Banned on this brand: “dream home”, urgency theatre, “contact for price” euphemisms, buyer-blaming errors.

## Do-not-touch list

Truth Lens semantics, deep-green/coral identity, transparent-price control, gesture alternatives, sans-only typography, restrained glass hierarchy, and photo-first content.

## Changelog

- 2026-08-16: created for research-led MVP.
- 2026-08-16: evolved the visual system into Apple-style functional glass plus Airbnb-style warm, dimensional content; renamed the signature disclosure strip Truth Lens.
- 2026-08-16: removed the editorial serif system; introduced Geist + Inter, lighter Phosphor iconography, Nordic graphite/pine surfaces, tighter radii and glass restricted to persistent controls.
