# Design DNA — PropertySearch

**Last updated:** 2026-08-17 · **Property:** realestate.dynamiccode.app · **Repo:** dynamiccode-agent/real-estate-mvp

## Thesis

> PropertySearch brings editorial calm to a noisy market: sharp black typography, neutral daylight surfaces and one electric-lime signal make photo-led property decisions feel immediate without competing with the homes.

## Personality sliders

warm —◐———— cold · playful ——◐—— serious · minimal —◐——— maximal · classic ———◐— futuristic · loud ——◐—— quiet

## Signature element

The **Lime Signal** joins the identity and product. The logo places a simple house inside an electric-lime search lens; the same colour appears only on the match indicator, selected states and the single primary card action. Property photography remains dominant.

## Logo system

- **Primary emblem:** electric-lime search lens + ink core + white house.
- **Wordmark:** `Property` in ink, `Search` in deep moss; Geist Variable at 760 weight with tight tracking.
- **Minimum digital size:** 28px emblem; use the emblem alone below 150px available width.
- **Clear space:** at least one door-width around the emblem.
- **Assets:** `/public/propertysearch-mark.svg`, `/public/propertysearch-logo.svg`, `/public/icon.svg`.

## Tokens

- **Display font:** Geist Sans Variable (650–780) — compact, decisive and product-native.
- **Body font:** Inter Variable (400–700) · **Data:** Inter tabular numerals.
- **Brand lime:** signal `#ccfa01` paired with ink `#161915`; deep moss `#3e5000` is reserved for accessible brand copy on light surfaces.
- **Neutrals:** search-paper `#f5f7f2`, mist `#e9ede5`, white `#ffffff`, search ink `#161915`.
- **Semantics:** electric lime marks matches and selection; forest green marks verified/success states; red remains error-only.
- **Glass:** fixed navigation, sheets and action docks only. Listing content remains opaque for image and text clarity.
- **Radius voice:** 12px controls, 18px utilities, 24px property shells; the circular lens is the only repeated perfect circle.
- **Elevation:** neutral diffuse shadows · **Motion:** restrained photo scale and card lift; 100/200/350/650ms with expo-out movement.

## Composition rules

- Product-in-context: the property feed is the home screen.
- One dominant property image per viewport; lime is a signal, never a field or oversized panel.
- Desktop uses a three-part workspace: navigation, visual feed and decision context.
- Feed cards use a quiet, 21st-inspired image swiper with match, save and image count inside the photo. The body is limited to location, address, price, essential facts, a real inspection time when supplied, and one decision row.
- Detail views are buyer briefs, not agent brochures: gallery, address, price, core facts, highlights, inspection and enquiry come first. Agent marketing headlines are secondary and the raw description stays collapsed until requested.
- Property cards keep explicit gesture alternatives below the essentials: Skip / View details / Ask in one row.
- Do not place duplicate CTAs over photography or add disclosure strips that compete with price and address.

## Voice

- Tone: direct, energetic, candid and Australian without slang theatre.
- Proof language: visible price, data completeness, freshness, inspection timing.
- A withheld price is labelled `Price not disclosed`, never `Contact agent`.
- Preferred verbs: search, compare, view, save, ask.
- Banned: “dream home”, urgency theatre, “contact for price” euphemisms and fake scarcity.

## Data and imagery rules

- Demo properties must identify `PropertySearch Demo` as the agency.
- Never present licensed demonstration imagery as the actual property photographed.
- REA inventory enters only through the authorised Listing Export API with customer approval and `listing:listings:export` scope.
- Do not scrape or republish portal photography.

## Do-not-touch list

Lime Signal restraint, lime/ink/neutral identity, transparent-price control, explicit gesture alternatives, sans-only typography, accessible contrast and photo-first hierarchy.

## Changelog

- 2026-08-16: created as Hearth for the research-led MVP.
- 2026-08-16: introduced Geist + Inter, Phosphor iconography and the original Truth Lens.
- 2026-08-16: rebranded to PropertySearch; introduced the house + magnifying-lens logo, high-signal orange palette and renamed the signature system Search Lens.
- 2026-08-17: replaced orange with electric lime `#ccfa01`; removed the duplicate in-image CTA and oversized disclosure strip; rebuilt cards from 21st.dev property-card and image-swiper patterns.
- 2026-08-17: streamlined discovery cards to image, address, price, essential facts and actions; moved long-form copy into the detail sheet and preloaded adjacent gallery images for instant navigation.
- 2026-08-17: rebuilt property details around current portal research; removed image-overlay headlines, made address/price the title, added structured highlights and buyer data, and collapsed raw agent copy by default.
