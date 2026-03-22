/**
 * JSON incident format from backend pipeline (Supabase-bound).
 * Attributes may be "gemini" (AI-extracted) or "human" (verified).
 */

export type CriticalityTier = "critical" | "needs support" | "cleanup";
export type CasualtiesCategory = "few" | "some" | "many";
export type ManpowerCategory = "small" | "moderate" | "large";
export type VerificationLevel = "initial_reports" | "confident" | "verified";

export interface IncidentMedia {
  type: "image" | "video";
  url: string;
}

export interface IncidentJson {
  incident_id: string;
  summary: string;
  time_of_incident: string; // ISO
  time_since_incident: string; // e.g. "143.4h"
  criticality: CriticalityTier;
  location_centre: { lat: number; lon: number };
  location_radius_km: number;
  location_source?: "gemini" | "human";
  casualties_estimate: number;
  casualties: CasualtiesCategory;
  casualties_source?: "gemini" | "human";
  manpower_needed_estimate: number;
  manpower_needed: ManpowerCategory;
  manpower_source?: "gemini" | "human";
  verification: VerificationLevel;
  posts: string[];
  media: IncidentMedia[];
  last_updated: string;
}

/** Unified incident shape for map display (supports both JSON and Prisma). */
export interface MapIncident {
  id: string;
  lat: number;
  lng: number;
  /** Radius in km for affected area (optional, JSON only). */
  radiusKm?: number;
  title: string;
  summary?: string;
  reportedAt: string; // ISO
  /** Time-since string for display, e.g. "143.4h" */
  timeSince?: string;
  criticality: CriticalityTier;
  casualtiesEstimate: number;
  casualtiesCategory: CasualtiesCategory;
  manpowerEstimate: number;
  manpowerCategory: ManpowerCategory;
  verification: VerificationLevel;
  posts: string[];
  media: IncidentMedia[];
  /** Source of key fields (gemini vs human verified). */
  source?: "json" | "prisma";
}
