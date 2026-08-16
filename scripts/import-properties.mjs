import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";

const sourceRoot = path.resolve(process.argv[2] || "/Users/dynamiccode/Downloads/Real Estate Properties");
const outputRoot = path.resolve("public/property-media");
const dataFile = path.resolve("src/lib/property-listings.json");
const imageLimit = 8;

if (!existsSync(sourceRoot)) throw new Error(`Property source folder not found: ${sourceRoot}`);

const candidates = readdirSync(sourceRoot, { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && /^\d{2} - /.test(entry.name))
  .map((entry) => ({ name: entry.name, prefix: entry.name.slice(0, 2), modified: statSync(path.join(sourceRoot, entry.name)).mtimeMs }))
  .sort((a, b) => a.prefix.localeCompare(b.prefix) || a.modified - b.modified);

const selected = [];
for (const prefix of Array.from({ length: 30 }, (_, index) => String(index + 1).padStart(2, "0"))) {
  const match = candidates.find((candidate) => candidate.prefix === prefix);
  if (!match) throw new Error(`Missing property folder ${prefix}`);
  selected.push(match.name);
}

function decodeHtml(value) {
  const entities = { amp: "&", quot: '"', apos: "'", lt: "<", gt: ">", nbsp: " ", ndash: "–", mdash: "—", rsquo: "’", lsquo: "‘", rdquo: "”", ldquo: "“" };
  return value.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (match, entity) => {
    if (entity[0] === "#") {
      const hexadecimal = entity[1].toLowerCase() === "x";
      return String.fromCodePoint(Number.parseInt(entity.slice(hexadecimal ? 2 : 1), hexadecimal ? 16 : 10));
    }
    return entities[entity.toLowerCase()] ?? match;
  });
}

function cleanCopy(value) {
  const text = decodeHtml(String(value || ""))
    .replace(/<\s*br\s*\/?\s*>/gi, "\n")
    .replace(/<\s*\/p\s*>/gi, "\n\n")
    .replace(/<\s*li[^>]*>/gi, "• ")
    .replace(/<[^>]+>/g, "")
    .replace(/\r/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  return text.split(/\n\s*(?:Disclaimer|DISCLAIMER)\s*:?/)[0].trim();
}

function numericSize(value) {
  if (value == null) return null;
  const parsed = Number(String(value).replace(/[^\d.]/g, ""));
  return Number.isFinite(parsed) ? Math.round(parsed) : null;
}

function parsePrice(label) {
  const normalized = label.toLowerCase().replace(/\s+/g, " ");
  const values = [];
  for (const match of label.matchAll(/\$?\s*([\d,.]+)\s*(m|million|k)?/gi)) {
    let value = Number(match[1].replace(/,/g, ""));
    if (!Number.isFinite(value)) continue;
    const suffix = (match[2] || "").toLowerCase();
    if (suffix === "m" || suffix === "million") value *= 1_000_000;
    if (suffix === "k") value *= 1_000;
    if (value >= 100_000) values.push(Math.round(value));
  }
  if (!values.length || /auction|contact|request|for sale|expression|best offer|must be sold|brand new/i.test(normalized)) {
    return { min: null, max: null, confidence: "hidden" };
  }
  const exact = /^\s*\$[\d,]+(?:\.\d+)?\s*\+?\s*$/i.test(label);
  return { min: values[0], max: values[1] ?? (exact ? values[0] : null), confidence: exact ? "high" : "medium" };
}

function compactType(type) {
  if (/duplex/i.test(type)) return "duplex";
  if (/residential land/i.test(type)) return "land";
  return type.toLowerCase();
}

function titleFor(item, description) {
  const suburb = item.address?.suburb || "Gold Coast";
  const type = item.propertyType?.display || "Property";
  const lower = description.toLowerCase();
  if (/residential land/i.test(type)) return `Development opportunity in ${suburb}`;
  if (/acreage/i.test(type)) return `Acreage retreat in ${suburb}`;
  if (/waterfront|on the water|riverfront/.test(lower)) return `Waterfront living in ${suburb}`;
  if (/renovated|beautifully updated/.test(lower)) return `Renovated ${compactType(type)} in ${suburb}`;
  if (/brand new|newly completed|near new/.test(lower)) return `Contemporary living in ${suburb}`;
  if (/coastal|beachside|minutes from the beach/.test(lower)) return `Coastal living in ${suburb}`;
  return `${type} in ${suburb}`;
}

function quarterlyCost(description, labels) {
  const match = description.match(new RegExp(`(?:${labels.join("|")})[^$]{0,80}\\$\\s*([\\d,]+(?:\\.\\d+)?)\\s*([^\\n]{0,40})`, "i"));
  if (!match) return null;
  const amount = Number(match[1].replace(/,/g, ""));
  if (!Number.isFinite(amount)) return null;
  const period = match[2].toLowerCase();
  if (/week/.test(period)) return Math.round(amount * 13);
  if (/annual|year/.test(period)) return Math.round(amount / 4);
  if (/month/.test(period)) return Math.round(amount * 3);
  return Math.round(amount);
}

function featuresFor(item, description, landSize) {
  const features = [];
  const lower = description.toLowerCase();
  const add = (label, pattern) => { if (pattern.test(lower) && !features.includes(label)) features.push(label); };
  add("Waterfront", /waterfront|on the water|riverfront/);
  add("Swimming pool", /\bpool\b/);
  add("Renovated", /renovated|beautifully updated/);
  add("Air conditioning", /air condition/);
  add("Solar power", /\bsolar\b/);
  add("Outdoor entertaining", /entertain|alfresco|outdoor living/);
  add("Beachside location", /beachside|minutes from the beach|walk to the beach/);
  add("Secure parking", /secure parking|lock-up garage/);
  if ((item.generalFeatures?.studies?.value || 0) > 0) features.push(`${item.generalFeatures.studies.value} study`);
  if (landSize) features.push(`${landSize.toLocaleString("en-AU")} m² land`);
  if (!features.length) features.push(item.propertyType?.display || "Property", `${item.address?.suburb || "Gold Coast"} location`);
  return features.slice(0, 5);
}

function initials(name) {
  return name.split(/\s+|\s*&\s*/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}

function imageNumber(filename) {
  return Number(filename.match(/\d+/)?.[0] || Number.MAX_SAFE_INTEGER);
}

mkdirSync(outputRoot, { recursive: true });
const listings = selected.map((directory, index) => {
  const propertyRoot = path.join(sourceRoot, directory);
  const item = JSON.parse(readFileSync(path.join(propertyRoot, "listing-data.json"), "utf8"));
  const id = `rea-${item.id}`;
  const description = cleanCopy(item.description);
  const landSize = numericSize(item.propertySizes?.land?.displayValue);
  const priceLabel = String(item.price?.display || "Price on request").trim();
  const price = parsePrice(priceLabel);
  const agentName = String(item.listers?.[0]?.name || "Listing agent").trim();
  const mediaDirectory = path.join(outputRoot, id);
  mkdirSync(mediaDirectory, { recursive: true });

  const sourceImages = readdirSync(path.join(propertyRoot, "images"))
    .filter((filename) => /\.(?:jpe?g|png|webp)$/i.test(filename))
    .sort((a, b) => imageNumber(a) - imageNumber(b) || a.localeCompare(b))
    .slice(0, imageLimit);
  if (!sourceImages.length) throw new Error(`No listing images found in ${directory}`);

  const images = sourceImages.map((filename, imageIndex) => {
    const targetName = `${String(imageIndex + 1).padStart(2, "0")}.webp`;
    const target = path.join(mediaDirectory, targetName);
    execFileSync("magick", [path.join(propertyRoot, "images", filename), "-auto-orient", "-resize", "1600x1200>", "-strip", "-quality", "78", target]);
    return `/property-media/${id}/${targetName}`;
  });

  const listedAt = new Date(Date.UTC(2026, 7, 17, 0, 0, 0) - index * 3_600_000).toISOString();
  const latitude = Number(item.address?.display?.geocode?.latitude);
  const longitude = Number(item.address?.display?.geocode?.longitude);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) throw new Error(`Missing coordinates for ${directory}`);

  return {
    id,
    title: titleFor(item, description),
    address: item.address?.display?.shortAddress || item.address?.display?.fullAddress,
    suburb: item.address?.suburb,
    state: String(item.address?.state || "QLD").toUpperCase(),
    postcode: String(item.address?.postcode || ""),
    priceLabel,
    priceMin: price.min,
    priceMax: price.max,
    priceConfidence: price.confidence,
    beds: Number(item.generalFeatures?.bedrooms?.value || 0),
    baths: Number(item.generalFeatures?.bathrooms?.value || 0),
    parking: Number(item.generalFeatures?.parkingSpaces?.value || 0),
    landSize,
    propertyType: item.propertyType?.display || "Property",
    description,
    images,
    agentName,
    agencyName: String(item.listingCompany?.name || "Independent agent").trim(),
    agentInitials: initials(agentName),
    inspectionAt: null,
    listedAt,
    disclosureScore: Math.min(100, 72 + (price.confidence === "hidden" ? 0 : 10) + (landSize ? 6 : 0) + (description.length > 500 ? 6 : 0) + (images.length >= 6 ? 6 : 0)),
    strataFees: quarterlyCost(description, ["body corporate(?: fees)?", "strata(?: fees)?"]),
    councilRates: quarterlyCost(description, ["council rates?"]),
    features: featuresFor(item, description, landSize),
    latitude,
    longitude
  };
});

writeFileSync(dataFile, `${JSON.stringify(listings, null, 2)}\n`);
const totalBytes = listings.flatMap((listing) => listing.images).reduce((sum, image) => sum + statSync(path.join("public", image)).size, 0);
console.log(JSON.stringify({ selected, listings: listings.length, images: listings.reduce((sum, item) => sum + item.images.length, 0), mediaMb: Number((totalBytes / 1024 / 1024).toFixed(1)), dataFile }, null, 2));
