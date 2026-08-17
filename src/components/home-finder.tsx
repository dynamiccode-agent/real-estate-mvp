"use client";

import Image from "next/image";
import {
  ArrowCounterClockwise as RotateCcw,
  ArrowLeft,
  Bathtub as Bath,
  Bed as BedDouble,
  Bell,
  CalendarDots as CalendarDays,
  Car as SquareParking,
  ChatCircle as MessageCircle,
  CaretRight as ChevronRight,
  Check,
  DotsThree as MoreHorizontal,
  Heart,
  House as Home,
  NavigationArrow as Navigation,
  PaperPlaneTilt as Send,
  MagnifyingGlass as Search,
  SlidersHorizontal,
  Sparkle as Sparkles,
  UserCircle as CircleUserRound,
  X
} from "@phosphor-icons/react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import ServiceWorker from "./service-worker";
import PropertyImageSwiper from "./property-image-swiper";
import type { Listing, Message } from "@/lib/types";

type Tab = "explore" | "saved" | "inspections" | "messages" | "profile";
type Filter = { query: string; propertyType: string; minBeds: number; maxPrice: number; transparentOnly: boolean };

const initialFilter: Filter = { query: "", propertyType: "Any home", minBeds: 0, maxPrice: 5000000, transparentOnly: false };

const navItems: { id: Tab; label: string; icon: typeof Home }[] = [
  { id: "explore", label: "Explore", icon: Home },
  { id: "saved", label: "Saved", icon: Heart },
  { id: "inspections", label: "Inspections", icon: CalendarDays },
  { id: "messages", label: "Messages", icon: MessageCircle },
  { id: "profile", label: "You", icon: CircleUserRound }
];

function getUserId() {
  if (typeof window === "undefined") return "demo-user";
  const existing = localStorage.getItem("propertysearch-user-id");
  if (existing) return existing;
  const next = crypto.randomUUID();
  localStorage.setItem("propertysearch-user-id", next);
  return next;
}

function formatPrice(value: number) {
  if (value >= 1000000) return `$${(value / 1000000).toFixed(value % 1000000 ? 1 : 0)}m`;
  return `$${Math.round(value / 1000)}k`;
}

function displayPriceLabel(listing: Listing) {
  return listing.priceConfidence === "hidden" || /contact agent/i.test(listing.priceLabel)
    ? "Price not disclosed"
    : listing.priceLabel;
}

function formatInspection(value: string | null, compact = false) {
  if (!value) return "Inspection by appointment";
  return new Intl.DateTimeFormat("en-AU", compact
    ? { weekday: "short", hour: "numeric", minute: "2-digit" }
    : { weekday: "long", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }
  ).format(new Date(value));
}

function daysFresh(value: string) {
  const days = Math.max(1, Math.ceil((Date.now() - new Date(value).getTime()) / 86400000));
  return `${days}d fresh`;
}

function matchScore(listing: Listing) {
  const seed = [...listing.id].reduce((sum, character) => sum + character.charCodeAt(0), 0);
  return 84 + (seed % 14);
}

export default function HomeFinder() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState<"neon" | "local">("local");
  const [activeTab, setActiveTab] = useState<Tab>("explore");
  const [selectedId, setSelectedId] = useState<string>("");
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);
  const [inspectionIds, setInspectionIds] = useState<string[]>([]);
  const [filter, setFilter] = useState<Filter>(initialFilter);
  const [draftFilter, setDraftFilter] = useState<Filter>(initialFilter);
  const [showFilters, setShowFilters] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [toast, setToast] = useState("");
  const [messageListingId, setMessageListingId] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSavedIds(JSON.parse(localStorage.getItem("propertysearch-saved") || "[]"));
      setDismissedIds(JSON.parse(localStorage.getItem("propertysearch-dismissed") || "[]"));
      setInspectionIds(JSON.parse(localStorage.getItem("propertysearch-inspections") || "[]"));
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams({ q: filter.query, transparent: String(filter.transparentOnly) });
    fetch(`/api/listings?${params}`, { signal: controller.signal })
      .then((response) => response.json())
      .then((data) => {
        setListings(data.listings || []);
        setSource(data.source || "local");
        setSelectedId((current) => current || data.listings?.[0]?.id || "");
      })
      .catch(() => undefined)
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [filter.query, filter.transparentOnly]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 2600);
    return () => clearTimeout(timer);
  }, [toast]);

  const visibleListings = useMemo(() => listings.filter((item) => {
    if (dismissedIds.includes(item.id)) return false;
    if (filter.propertyType !== "Any home" && item.propertyType !== filter.propertyType) return false;
    if (item.beds < filter.minBeds) return false;
    if (item.priceMin && item.priceMin > filter.maxPrice) return false;
    return true;
  }), [listings, dismissedIds, filter]);

  const selected = listings.find((item) => item.id === selectedId) || visibleListings[0] || listings[0];

  function persist(key: string, values: string[]) {
    localStorage.setItem(key, JSON.stringify(values));
  }

  async function track(listingId: string, action: "save" | "dismiss" | "inspection") {
    fetch("/api/interactions", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: getUserId(), listingId, action })
    }).catch(() => undefined);
  }

  function toggleSave(id: string) {
    const isSaved = savedIds.includes(id);
    const next = isSaved ? savedIds.filter((value) => value !== id) : [...savedIds, id];
    setSavedIds(next); persist("propertysearch-saved", next);
    if (!isSaved) track(id, "save");
    setToast(isSaved ? "Removed from saved homes" : "Saved — PropertySearch will learn from this");
  }

  function dismiss(id: string) {
    const next = [...new Set([...dismissedIds, id])];
    setDismissedIds(next); persist("propertysearch-dismissed", next); track(id, "dismiss");
    setToast("Skipped. You can undo this.");
  }

  function undoDismiss() {
    const last = dismissedIds.at(-1);
    if (!last) return;
    const next = dismissedIds.slice(0, -1);
    setDismissedIds(next); persist("propertysearch-dismissed", next);
    setToast("Home returned to your feed");
  }

  function toggleInspection(id: string) {
    const added = !inspectionIds.includes(id);
    const next = added ? [...inspectionIds, id] : inspectionIds.filter((value) => value !== id);
    setInspectionIds(next); persist("propertysearch-inspections", next);
    if (added) track(id, "inspection");
    setToast(added ? "Inspection added to your Saturday" : "Inspection removed");
  }

  function openMessages(listing: Listing) {
    setMessageListingId(listing.id);
    setActiveTab("messages");
  }

  function applyFilters(event: FormEvent) {
    event.preventDefault();
    setFilter(draftFilter); setShowFilters(false);
  }

  function handleTab(id: Tab) {
    setActiveTab(id); setShowDetails(false);
  }

  return (
    <div className="app-shell">
      <ServiceWorker />
      <DesktopNav activeTab={activeTab} onTab={handleTab} source={source} />

      <main className="main-stage">
        {activeTab === "explore" && (
          <>
            <SearchHeader filter={filter} onOpen={() => { setDraftFilter(filter); setShowFilters(true); }} />
            <div className="discovery-grid">
              <section className="feed" aria-label="Property discovery feed">
                {loading ? <FeedSkeleton /> : visibleListings.length ? visibleListings.map((listing, index) => (
                  <PropertyCard
                    key={listing.id}
                    listing={listing}
                    priority={index === 0}
                    saved={savedIds.includes(listing.id)}
                    selected={selected?.id === listing.id}
                    onSelect={() => setSelectedId(listing.id)}
                    onSave={() => toggleSave(listing.id)}
                    onDismiss={() => dismiss(listing.id)}
                    onDetails={() => { setSelectedId(listing.id); setShowDetails(true); }}
                    onMessage={() => openMessages(listing)}
                  />
                )) : <EmptyFeed onReset={() => { setDismissedIds([]); persist("propertysearch-dismissed", []); setFilter(initialFilter); }} />}
              </section>
              {selected && <ContextPanel listing={selected} saved={savedIds.includes(selected.id)} inspectionSaved={inspectionIds.includes(selected.id)} onSave={() => toggleSave(selected.id)} onInspection={() => toggleInspection(selected.id)} onMessage={() => openMessages(selected)} />}
            </div>
          </>
        )}

        {activeTab === "saved" && <CollectionView title="Homes worth another look" eyebrow={`${savedIds.length} saved`} listings={listings.filter((item) => savedIds.includes(item.id))} emptyText="Save a home and it’ll wait here—no spreadsheet required." onOpen={(item) => { setSelectedId(item.id); setShowDetails(true); }} onAction={toggleSave} actionLabel="Remove" />}
        {activeTab === "inspections" && <InspectionView listings={listings.filter((item) => inspectionIds.includes(item.id))} onRemove={toggleInspection} />}
        {activeTab === "messages" && <MessagesView listings={listings} initialListingId={messageListingId} userId={getUserId()} />}
        {activeTab === "profile" && <ProfileView savedCount={savedIds.length} dismissedCount={dismissedIds.length} onUndo={undoDismiss} transparent={filter.transparentOnly} onTransparent={(value) => setFilter({ ...filter, transparentOnly: value })} />}
      </main>

      <MobileNav activeTab={activeTab} onTab={handleTab} savedCount={savedIds.length} />
      {showFilters && <FilterSheet value={draftFilter} onChange={setDraftFilter} onClose={() => setShowFilters(false)} onSubmit={applyFilters} />}
      {showDetails && selected && <DetailSheet listing={selected} saved={savedIds.includes(selected.id)} inspectionSaved={inspectionIds.includes(selected.id)} onClose={() => setShowDetails(false)} onSave={() => toggleSave(selected.id)} onInspection={() => toggleInspection(selected.id)} onMessage={() => openMessages(selected)} />}
      {toast && <div className="toast" role="status"><Check size={16} />{toast}</div>}
    </div>
  );
}

function BrandMark() {
  return <div className="brand-mark" aria-label="PropertySearch home"><Image src="/propertysearch-mark.svg" alt="" width={32} height={32} priority /><strong><span>Property</span><em>Search</em></strong></div>;
}

function DesktopNav({ activeTab, onTab, source }: { activeTab: Tab; onTab: (tab: Tab) => void; source: "neon" | "local" }) {
  return (
    <aside className="desktop-nav">
      <BrandMark />
      <nav aria-label="Primary navigation">
        {navItems.map(({ id, label, icon: Icon }) => <button key={id} className={activeTab === id ? "nav-button active" : "nav-button"} onClick={() => onTab(id)}><Icon size={20} weight={activeTab === id ? "bold" : "regular"} /><span>{label}</span></button>)}
      </nav>
      <div className="db-status"><span />{source === "neon" ? "Property feed live" : "Offline property feed"}</div>
      <button className="profile-chip" onClick={() => onTab("profile")}><span>TF</span><span><strong>Ty</strong><small>My home brief</small></span></button>
    </aside>
  );
}

function MobileNav({ activeTab, onTab, savedCount }: { activeTab: Tab; onTab: (tab: Tab) => void; savedCount: number }) {
  return (
    <nav className="mobile-nav" aria-label="Primary navigation">
      {navItems.map(({ id, label, icon: Icon }) => <button key={id} className={activeTab === id ? "active" : ""} onClick={() => onTab(id)} aria-current={activeTab === id ? "page" : undefined}><span className="nav-icon"><Icon size={21} weight={activeTab === id ? "bold" : "regular"} />{id === "saved" && savedCount > 0 && <i>{savedCount}</i>}</span><small>{label}</small></button>)}
    </nav>
  );
}

function SearchHeader({ filter, onOpen }: { filter: Filter; onOpen: () => void }) {
  return (
    <header className="search-header reveal">
      <div className="mobile-brand"><BrandMark /><button className="icon-button" aria-label="Notifications"><Bell size={20} /></button></div>
      <div className="search-copy" style={{ "--i": 0 } as React.CSSProperties}>
        <p className="eyebrow">Gold Coast / 30 properties</p>
        <h1>Find the right property, faster.</h1>
      </div>
      <button className="search-bar" onClick={onOpen} style={{ "--i": 1 } as React.CSSProperties}>
        <Search size={20} /><span>{filter.query || "Suburb, postcode or street"}</span><SlidersHorizontal size={19} /><i>{[filter.transparentOnly, filter.minBeds > 0, filter.propertyType !== "Any home"].filter(Boolean).length || ""}</i>
      </button>
      <div className="quick-filters" style={{ "--i": 2 } as React.CSSProperties}>
        <button onClick={onOpen}>Buy <ChevronRight size={15} /></button>
        <button onClick={onOpen}>Up to {formatPrice(filter.maxPrice)} <ChevronRight size={15} /></button>
        {filter.transparentOnly && <button className="truth-chip" onClick={onOpen}><Check size={14} /> Visible prices</button>}
      </div>
    </header>
  );
}

function PropertyCard({ listing, priority, saved, selected, onSelect, onSave, onDismiss, onDetails, onMessage }: { listing: Listing; priority: boolean; saved: boolean; selected: boolean; onSelect: () => void; onSave: () => void; onDismiss: () => void; onDetails: () => void; onMessage: () => void }) {
  const cardImages = useMemo(() => listing.id === "rea-152022108" && listing.images.length > 2
    ? [listing.images[2], listing.images[0], listing.images[1], ...listing.images.slice(3)]
    : listing.images, [listing.id, listing.images]);
  return (
    <article className={`property-card ${selected ? "selected" : ""}`} onMouseEnter={onSelect} onFocus={onSelect}>
      <button className="card-open-target" onClick={onDetails} aria-label={`Open ${listing.address}, ${listing.suburb}`} />
      <PropertyImageSwiper images={cardImages} title={listing.title} suburb={listing.suburb} priority={priority}>
        <div className="media-meta"><span className="match-pill"><Sparkles size={13} /> {matchScore(listing)}% match</span><button className={saved ? "media-save saved" : "media-save"} onClick={onSave} aria-label={saved ? `Remove ${listing.title} from saved homes` : `Save ${listing.title}`}><Heart weight={saved ? "fill" : "regular"} /></button></div>
      </PropertyImageSwiper>
      <div className="property-summary">
        <h2 className="card-address">{listing.address}</h2>
        <p className="card-kicker">{listing.suburb} · {listing.propertyType}</p>
        <strong className="card-price">{displayPriceLabel(listing)}</strong>
        <div className="facts"><span aria-label={`${listing.beds} bedrooms`}><BedDouble />{listing.beds}</span><span aria-label={`${listing.baths} bathrooms`}><Bath />{listing.baths}</span><span aria-label={`${listing.parking} parking spaces`}><SquareParking />{listing.parking}</span>{listing.landSize && <span>{listing.landSize.toLocaleString("en-AU")} m²</span>}</div>
        {listing.inspectionAt && <div className="inspection-line"><CalendarDays size={17} /><span><strong>{formatInspection(listing.inspectionAt, true)}</strong> · Open home</span></div>}
        <div className="decision-row">
          <button className="decision pass" onClick={onDismiss} aria-label={`Pass on ${listing.title}`}><X /><span>Pass</span></button>
          <button className="decision message" onClick={onMessage} aria-label={`Message the agent about ${listing.title}`}><MessageCircle /><span>Ask agent</span></button>
        </div>
      </div>
    </article>
  );
}

function ContextPanel({ listing, saved, inspectionSaved, onSave, onInspection, onMessage }: { listing: Listing; saved: boolean; inspectionSaved: boolean; onSave: () => void; onInspection: () => void; onMessage: () => void }) {
  return (
    <aside className="context-panel" aria-label="Selected property details">
      <div className="mini-map"><span className="river-line" /><span className="road-loop" /><i className="pin one" /><i className="pin two" /><i className="pin current"><Home size={15} /></i><span className="map-label l1">Burleigh</span><span className="map-label l2">Mermaid Waters</span><span className="map-label cbd">Coast · 8 min</span><span className="map-label west">Tallebudgera</span><span className="river-label">Gold Coast waterways</span><button><Navigation size={15} /> Draw an area</button></div>
      <div className="context-content">
        <p className="eyebrow">Why it fits</p><h3>Good light. Honest numbers.</h3>
        <ul className="fit-list"><li><Check />Within your {formatPrice(5000000)} ceiling</li><li><Check />{listing.disclosureScore}% of key facts supplied</li><li><Check />{listing.parking > 1 ? "Two-car parking" : "Off-street parking"}</li></ul>
        <div className="cost-ledger"><div><span>Price</span><strong>{displayPriceLabel(listing)}</strong></div><div><span>Council rates</span><strong>{listing.councilRates ? `$${listing.councilRates}/qtr` : "Not supplied"}</strong></div>{listing.strataFees && <div><span>Body corporate</span><strong>${listing.strataFees}/qtr</strong></div>}</div>
        <button className="primary-button" onClick={onInspection}>{inspectionSaved ? <><Check /> Viewing saved</> : <><CalendarDays /> {listing.inspectionAt ? "Add inspection" : "Save viewing"}</>}</button>
        <div className="context-actions"><button onClick={onMessage}><MessageCircle /> Message {listing.agentName.split(" ")[0]}</button><button onClick={onSave}><Heart weight={saved ? "fill" : "regular"} />{saved ? "Saved" : "Save"}</button></div>
        <p className="privacy-note">Your mobile number stays private until you choose to share it.</p>
      </div>
    </aside>
  );
}

function FilterSheet({ value, onChange, onClose, onSubmit }: { value: Filter; onChange: (next: Filter) => void; onClose: () => void; onSubmit: (event: FormEvent) => void }) {
  return (
    <div className="sheet-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="filter-sheet" role="dialog" aria-modal="true" aria-labelledby="filter-title">
        <div className="sheet-header"><div><p className="eyebrow">Your home brief</p><h2 id="filter-title">What should we find?</h2></div><button className="icon-button" onClick={onClose} aria-label="Close filters"><X /></button></div>
        <form onSubmit={onSubmit}>
          <label className="field-label" htmlFor="location">Where</label>
          <div className="location-input"><Search /><input id="location" autoFocus value={value.query} onChange={(event) => onChange({ ...value, query: event.target.value })} placeholder="Try Burleigh Waters or 4220" /></div>
          <fieldset><legend>Property type</legend><div className="choice-row">{["Any home", "House", "Townhouse", "Duplex/Semi-detached", "Acreage", "Villa", "Residential Land"].map((item) => <button type="button" key={item} className={value.propertyType === item ? "selected" : ""} onClick={() => onChange({ ...value, propertyType: item })}>{item}</button>)}</div></fieldset>
          <fieldset><legend>Minimum bedrooms</legend><div className="choice-row numbers">{[0, 1, 2, 3, 4].map((item) => <button type="button" key={item} className={value.minBeds === item ? "selected" : ""} onClick={() => onChange({ ...value, minBeds: item })}>{item === 0 ? "Any" : `${item}+`}</button>)}</div></fieldset>
          <label className="range-label" htmlFor="max-price"><span>Maximum price</span><strong>{formatPrice(value.maxPrice)}</strong></label>
          <input className="price-range" id="max-price" type="range" min="500000" max="5000000" step="50000" value={value.maxPrice} onChange={(event) => onChange({ ...value, maxPrice: Number(event.target.value) })} />
          <label className="switch-row"><span><strong>Show transparent prices only</strong><small>Hide listings that withhold their price.</small></span><input type="checkbox" checked={value.transparentOnly} onChange={(event) => onChange({ ...value, transparentOnly: event.target.checked })} /><i /></label>
          <div className="filter-footer"><button type="button" className="text-button" onClick={() => onChange(initialFilter)}>Clear all</button><button className="primary-button" type="submit">Show matching homes</button></div>
        </form>
      </section>
    </div>
  );
}

function DetailSheet({ listing, saved, inspectionSaved, onClose, onSave, onInspection, onMessage }: { listing: Listing; saved: boolean; inspectionSaved: boolean; onClose: () => void; onSave: () => void; onInspection: () => void; onMessage: () => void }) {
  const descriptionSummary = listing.description.split(/\n\s*\n/).find((paragraph) => paragraph.trim()) || listing.description;
  const viewingLabel = inspectionSaved ? "Viewing saved" : listing.inspectionAt ? "Add inspection" : "Save viewing";
  return (
    <div className="sheet-backdrop detail-backdrop" role="presentation">
      <section className="detail-sheet" role="dialog" aria-modal="true" aria-labelledby="detail-title">
        <div className="detail-layout">
          <div className="detail-hero">
            <PropertyImageSwiper images={listing.images} title={listing.address} suburb={listing.suburb} priority variant="detail" />
            <div className="detail-hero-actions"><button className="icon-button back" onClick={onClose} aria-label="Close details"><ArrowLeft /></button><button className={`icon-button heart ${saved ? "saved" : ""}`} onClick={onSave} aria-label={saved ? "Remove saved property" : "Save property"}><Heart weight={saved ? "fill" : "regular"} /></button></div>
          </div>
          <aside className="detail-summary" aria-label="Property overview">
            <div className="detail-title-row"><div><p className="eyebrow">{listing.propertyType} · {listing.suburb}</p><h2 id="detail-title">{listing.address}</h2><p>{listing.suburb}, {listing.state} {listing.postcode}</p></div></div>
            <div className="detail-price-block"><span>Price</span><strong className="detail-price">{displayPriceLabel(listing)}</strong>{listing.priceConfidence === "hidden" && <small>The agent has not supplied a guide.</small>}</div>
            <div className="facts large"><span><BedDouble />{listing.beds} beds</span><span><Bath />{listing.baths} baths</span><span><SquareParking />{listing.parking} {listing.parking === 1 ? "car" : "cars"}</span>{listing.landSize && <span>{listing.landSize.toLocaleString("en-AU")} m²</span>}</div>
            {listing.inspectionAt && <div className="detail-inspection"><CalendarDays /><span><small>Next inspection</small><strong>{formatInspection(listing.inspectionAt)}</strong></span></div>}
            <div className="detail-data" aria-label="Key property data"><div><span>Key facts supplied</span><strong>{listing.disclosureScore}%</strong></div><div><span>Updated</span><strong>{daysFresh(listing.listedAt)}</strong></div><div><span>Council rates</span><strong>{listing.councilRates ? `$${listing.councilRates.toLocaleString("en-AU")}/qtr` : "Not supplied"}</strong></div><div><span>Body corporate</span><strong>{listing.strataFees ? `$${listing.strataFees.toLocaleString("en-AU")}/qtr` : "Not applicable"}</strong></div></div>
            <div className="agent-row"><span>{listing.agentInitials}</span><div><small>Listed by</small><strong>{listing.agentName}</strong><small>{listing.agencyName}</small></div><button onClick={onMessage}><MessageCircle /> Ask {listing.agentName.split(" ")[0]}</button></div>
            <div className="detail-primary-actions"><button className="secondary-button" onClick={onInspection}><CalendarDays /> {viewingLabel}</button><button className="primary-button" onClick={onMessage}><MessageCircle /> Message agent</button></div>
          </aside>
          <div className="detail-body">
            <section className="detail-highlights" aria-labelledby="highlight-title">
              <p className="eyebrow">Why it stands out</p>
              <h3 id="highlight-title">{listing.title}</h3>
              <div className="feature-list">{listing.features.slice(0, 6).map((item) => <span key={item}><Check />{item}</span>)}</div>
            </section>
            <section className="detail-about" aria-labelledby="about-title">
              <h3 id="about-title">About this home</h3>
              <p className="description-summary">{descriptionSummary}</p>
              <details className="description-disclosure"><summary>Read the agent description</summary><p>{listing.description}</p></details>
            </section>
          </div>
        </div>
      </section>
    </div>
  );
}

function CollectionView({ title, eyebrow, listings, emptyText, onOpen, onAction, actionLabel }: { title: string; eyebrow: string; listings: Listing[]; emptyText: string; onOpen: (item: Listing) => void; onAction: (id: string) => void; actionLabel: string }) {
  return (
    <section className="page-view"><header><p className="eyebrow">{eyebrow}</p><h1>{title}</h1></header>{listings.length ? <div className="collection-grid">{listings.map((listing) => <article className="collection-card" key={listing.id}><button className="collection-image" onClick={() => onOpen(listing)}><Image src={listing.images[0]} fill alt={listing.title} sizes="(max-width: 700px) 100vw, 360px" /></button><div><p>{listing.suburb} · {listing.propertyType}</p><h2>{listing.title}</h2><strong>{displayPriceLabel(listing)}</strong><div className="facts"><span><BedDouble />{listing.beds}</span><span><Bath />{listing.baths}</span><span><SquareParking />{listing.parking}</span></div><button className="text-button danger" onClick={() => onAction(listing.id)}>{actionLabel}</button></div></article>)}</div> : <div className="empty-state"><Heart /><h2>No homes here yet</h2><p>{emptyText}</p></div>}</section>
  );
}

function InspectionView({ listings, onRemove }: { listings: Listing[]; onRemove: (id: string) => void }) {
  const byDay = listings.reduce<Record<string, Listing[]>>((acc, listing) => { const key = listing.inspectionAt ? new Intl.DateTimeFormat("en-AU", { weekday: "long", day: "numeric", month: "long" }).format(new Date(listing.inspectionAt)) : "By appointment"; (acc[key] ||= []).push(listing); return acc; }, {});
  return <section className="page-view inspection-view"><header><p className="eyebrow">Your weekend, sorted</p><h1>Inspection plan</h1><p>Drive less, see the right homes, keep every question in one place.</p></header>{listings.length ? Object.entries(byDay).map(([day, items]) => <div className="day-group" key={day}><h2>{day}</h2>{items.map((item, index) => <article className="timeline-item" key={item.id}><div className="timeline-time">{item.inspectionAt ? new Intl.DateTimeFormat("en-AU", { hour: "numeric", minute: "2-digit" }).format(new Date(item.inspectionAt)) : "TBC"}<span>{index === 0 ? "Start" : "12 min drive"}</span></div><div className="timeline-image"><Image src={item.images[0]} alt="" fill sizes="96px" /></div><div><p>{item.suburb}</p><h3>{item.title}</h3><span>{item.address}</span></div><button className="icon-button" onClick={() => onRemove(item.id)} aria-label={`Remove ${item.title} inspection`}><X /></button></article>)}</div>) : <div className="empty-state"><CalendarDays /><h2>Your Saturday is open</h2><p>Add an inspection from any property. We’ll organise the day here.</p></div>}</section>;
}

function MessagesView({ listings, initialListingId, userId }: { listings: Listing[]; initialListingId: string; userId: string }) {
  const [listingId, setListingId] = useState(initialListingId);
  const [messages, setMessages] = useState<Message[]>([]);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const active = listings.find((item) => item.id === listingId) || listings[0];
  const activeId = active?.id;

  useEffect(() => { if (!activeId) return; fetch(`/api/messages?listingId=${activeId}`).then((r) => r.json()).then((data) => setMessages(data.messages || [])); }, [activeId]);
  async function send(event: FormEvent) { event.preventDefault(); if (!body.trim() || !active) return; setSending(true); const id = crypto.randomUUID(); const response = await fetch("/api/messages", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, listingId: active.id, userId, body }) }); const data = await response.json(); setMessages((items) => [...items, data.message]); setBody(""); setSending(false); }
  if (!active) return <section className="page-view"><div className="empty-state"><MessageCircle /><h2>No conversations yet</h2><p>Ask a question from a property to start one.</p></div></section>;
  return (
    <section className="messages-page">
      <aside className="thread-list"><header><p className="eyebrow">Private by default</p><h1>Messages</h1></header>{listings.slice(0, 3).map((listing, index) => <button className={listing.id === active.id ? "active" : ""} key={listing.id} onClick={() => setListingId(listing.id)}><span className="thread-photo"><Image src={listing.images[0]} alt="" fill sizes="54px" /></span><span><strong>{listing.agentName}</strong><small>{index === 0 ? "Thanks — the report is attached…" : `About ${listing.address}`}</small></span>{index === 0 && <i>1</i>}</button>)}</aside>
      <div className="conversation"><header><span className="agent-avatar">{active.agentInitials}</span><div><strong>{active.agentName}</strong><small>{active.agencyName} · replies in ~12 min</small></div><button className="icon-button"><MoreHorizontal /></button></header><div className="property-context"><span><Image src={active.images[0]} alt="" fill sizes="54px" /></span><div><strong>{active.address}</strong><small>{displayPriceLabel(active)}</small></div><ChevronRight /></div><div className="message-stream">{messages.length ? messages.map((message) => <div className={`bubble ${message.senderType}`} key={message.id}><p>{message.body}</p><time>{new Intl.DateTimeFormat("en-AU", { hour: "numeric", minute: "2-digit" }).format(new Date(message.createdAt))}</time></div>) : <div className="conversation-empty"><MessageCircle /><p>Ask {active.agentName.split(" ")[0]} about this home. Your phone number stays private.</p></div>}</div><form className="composer" onSubmit={send}><button type="button" aria-label="Add attachment">+</button><input aria-label="Message" value={body} onChange={(event) => setBody(event.target.value)} placeholder="Message agent…" /><button className="send-button" disabled={sending || !body.trim()} aria-label="Send message"><Send /></button></form></div>
    </section>
  );
}

function ProfileView({ savedCount, dismissedCount, onUndo, transparent, onTransparent }: { savedCount: number; dismissedCount: number; onUndo: () => void; transparent: boolean; onTransparent: (value: boolean) => void }) {
  return <section className="page-view profile-view"><header><p className="eyebrow">Your property brief</p><h1>Hi, Ty.</h1><p>PropertySearch uses only your saves and skips to make the feed more useful.</p></header><div className="profile-hero"><span>TF</span><div><h2>Looking to buy on the Gold Coast</h2><p>Up to $5m · 2+ beds · all property types</p></div><button className="secondary-button">Edit brief</button></div><div className="stats-row"><div><strong>{savedCount}</strong><span>Saved homes</span></div><div><strong>{dismissedCount}</strong><span>Skipped homes</span></div><div><strong>8</strong><span>Suburbs watched</span></div></div><div className="settings-card"><h2>Search controls</h2><label className="switch-row"><span><strong>Transparent prices only</strong><small>Keep withheld-price listings out of Explore.</small></span><input type="checkbox" checked={transparent} onChange={(event) => onTransparent(event.target.checked)} /><i /></label><button className="settings-row" onClick={onUndo} disabled={!dismissedCount}><RotateCcw /><span><strong>Undo latest skip</strong><small>{dismissedCount ? `${dismissedCount} skipped homes can be recovered` : "No skipped homes"}</small></span><ChevronRight /></button></div><div className="privacy-card"><p className="eyebrow">Privacy promise</p><h2>Your details aren’t the product.</h2><p>Agents receive only the message you send and the property it relates to. Phone and email stay private until you choose to share them.</p></div></section>;
}

function FeedSkeleton() { return <div className="feed-skeleton"><div /><span /><span /><span /></div>; }
function EmptyFeed({ onReset }: { onReset: () => void }) { return <div className="empty-state feed-empty"><Home /><h2>You’ve seen every match</h2><p>Reset your skips or widen your brief to keep exploring.</p><button className="primary-button" onClick={onReset}>Reset my feed</button></div>; }
