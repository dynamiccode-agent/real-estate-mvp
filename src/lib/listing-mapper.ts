import type { Listing } from "./types";

type Row = Record<string, unknown>;

export function mapListing(row: Row): Listing {
  return {
    id: String(row.id),
    title: String(row.title),
    address: String(row.address),
    suburb: String(row.suburb),
    state: String(row.state),
    postcode: String(row.postcode),
    priceLabel: String(row.price_label),
    priceMin: row.price_min == null ? null : Number(row.price_min),
    priceMax: row.price_max == null ? null : Number(row.price_max),
    priceConfidence: row.price_confidence as Listing["priceConfidence"],
    beds: Number(row.beds),
    baths: Number(row.baths),
    parking: Number(row.parking),
    landSize: row.land_size == null ? null : Number(row.land_size),
    propertyType: String(row.property_type),
    description: String(row.description),
    images: (row.images as string[]) || [],
    agentName: String(row.agent_name),
    agencyName: String(row.agency_name),
    agentInitials: String(row.agent_initials),
    inspectionAt: row.inspection_at == null ? null : new Date(String(row.inspection_at)).toISOString(),
    listedAt: new Date(String(row.listed_at)).toISOString(),
    disclosureScore: Number(row.disclosure_score),
    strataFees: row.strata_fees == null ? null : Number(row.strata_fees),
    councilRates: row.council_rates == null ? null : Number(row.council_rates),
    features: (row.features as string[]) || [],
    latitude: Number(row.latitude),
    longitude: Number(row.longitude)
  };
}

