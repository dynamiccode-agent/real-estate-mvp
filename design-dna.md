# Design DNA — PropertySearch

**Last updated:** 2026-08-16 · **Property:** realestate.dynamiccode.app · **Repo:** dynamiccode-agent/real-estate-mvp

## Thesis

> PropertySearch is the orange signal in a noisy market: sharp black typography, warm off-white surfaces, and a house-inside-a-search-lens emblem turn transparent property facts into immediate, confident decisions.

## Personality sliders

warm —◐———— cold · playful ——◐—— serious · minimal —◐——— maximal · classic ———◐— futuristic · loud ——◐—— quiet

## Signature element

The **Search Lens** joins the identity and the product. The logo places a simple house inside an orange magnifying lens; each property card repeats that instrument logic in the docked Price / Facts / Updated strip. Orange marks an active search or decision, never passive decoration.

## Logo system

- **Primary emblem:** orange search lens + ink core + warm-white house.
- **Wordmark:** `Property` in ink, `Search` in orange; Geist Variable at 760 weight with tight tracking.
- **Minimum digital size:** 28px emblem; use the emblem alone below 150px available width.
- **Clear space:** at least one door-width around the emblem.
- **Assets:** `/public/propertysearch-mark.svg`, `/public/propertysearch-logo.svg`, `/public/icon.svg`.

## Tokens

- **Display font:** Geist Sans Variable (650–780) — compact, decisive and product-native.
- **Body font:** Inter Variable (400–700) · **Data:** Inter tabular numerals.
- **Brand orange:** signal `#ff5a1f`; accessible interactive orange `oklch(0.67 0.225 42)` paired with ink text; dark orange `oklch(0.47 0.19 34)` for orange-on-paper copy.
- **Neutrals:** search-paper `oklch(0.978 0.012 65)`, warm mist `oklch(0.938 0.018 62)`, search ink `oklch(0.19 0.018 48)`.
- **Semantics:** green is reserved for verified/success states; red for errors; orange never stands in for both.
- **Glass:** fixed navigation, sheets and action docks only. Listing content remains opaque for image and text clarity.
- **Radius voice:** 12px controls, 18px utilities, 24px property shells; the circular lens is the only repeated perfect circle.
- **Elevation:** warm diffuse shadows · **Motion:** lens-lock; 100/200/350/650ms with expo-out movement.

## Composition rules

- Product-in-context: the property feed is the home screen.
- One dominant property image per viewport; orange decisions sit against warm paper, never over a full orange page.
- Desktop uses a three-part workspace: navigation, visual feed and decision context.
- Mobile keeps an explicit `View home` action on the image and gesture alternatives in the action row.
- The Search Lens always sits at the image/content threshold to connect emotional photography with decision-grade facts.

## Voice

- Tone: direct, energetic, candid and Australian without slang theatre.
- Proof language: visible price, data completeness, freshness, inspection timing.
- Preferred verbs: search, compare, view, save, ask.
- Banned: “dream home”, urgency theatre, “contact for price” euphemisms and fake scarcity.

## Data and imagery rules

- Demo properties must identify `PropertySearch Demo` as the agency.
- Never present licensed demonstration imagery as the actual property photographed.
- REA inventory enters only through the authorised Listing Export API with customer approval and `listing:listings:export` scope.
- Do not scrape or republish portal photography.

## Do-not-touch list

Search Lens semantics, orange/ink/cream identity, transparent-price control, explicit gesture alternatives, sans-only typography, accessible orange contrast and photo-first hierarchy.

## Changelog

- 2026-08-16: created as Hearth for the research-led MVP.
- 2026-08-16: introduced Geist + Inter, Phosphor iconography and the original Truth Lens.
- 2026-08-16: rebranded to PropertySearch; introduced the house + magnifying-lens logo, high-signal orange palette and renamed the signature system Search Lens.
