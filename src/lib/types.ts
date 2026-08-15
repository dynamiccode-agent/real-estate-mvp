export type Listing = {
  id: string;
  title: string;
  address: string;
  suburb: string;
  state: string;
  postcode: string;
  priceLabel: string;
  priceMin: number | null;
  priceMax: number | null;
  priceConfidence: "high" | "medium" | "hidden";
  beds: number;
  baths: number;
  parking: number;
  landSize: number | null;
  propertyType: string;
  description: string;
  images: string[];
  agentName: string;
  agencyName: string;
  agentInitials: string;
  inspectionAt: string | null;
  listedAt: string;
  disclosureScore: number;
  strataFees: number | null;
  councilRates: number | null;
  features: string[];
  latitude: number;
  longitude: number;
};

export type Message = {
  id: string;
  listingId: string;
  senderType: "user" | "agent";
  body: string;
  createdAt: string;
};

