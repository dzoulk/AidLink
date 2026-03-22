export type IncidentVerificationStatus =
  | "UNVERIFIED"
  | "PARTIALLY_VERIFIED"
  | "VERIFIED"
  | "FALSE_REPORT"
  | "DUPLICATE";

export type IncidentOperationalStatus =
  | "NEW"
  | "ACTIVE"
  | "ASSIGNED"
  | "RESOLVED";

export type VolunteerStatus =
  | "AVAILABLE"
  | "INTERESTED"
  | "ASSIGNED"
  | "CONFIRMED"
  | "CHECKED_IN"
  | "COMPLETED"
  | "OFFLINE";

export type UrgencyLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export const VERIFICATION_COLORS = {
  UNVERIFIED: "destructive",
  PARTIALLY_VERIFIED: "warning",
  VERIFIED: "success",
  FALSE_REPORT: "muted",
  DUPLICATE: "secondary",
} as const;

export const OPERATIONAL_COLORS = {
  NEW: "bg-blue-500/20 text-blue-600",
  ACTIVE: "bg-amber-500/20 text-amber-600",
  ASSIGNED: "bg-purple-500/20 text-purple-600",
  RESOLVED: "bg-emerald-500/20 text-emerald-600",
} as const;

export const VOLUNTEER_STATUS_COLORS = {
  AVAILABLE: "bg-slate-500/20 text-slate-600",
  INTERESTED: "bg-blue-500/20 text-blue-600",
  ASSIGNED: "bg-purple-500/20 text-purple-600",
  CONFIRMED: "bg-cyan-500/20 text-cyan-600",
  CHECKED_IN: "bg-emerald-500/20 text-emerald-600",
  COMPLETED: "bg-green-500/20 text-green-600",
  OFFLINE: "bg-gray-400/20 text-gray-500",
} as const;

export const SKILLS = [
  "medical",
  "search",
  "transport",
  "logistics",
  "translation",
  "shelter",
  "food_distribution",
  "general_support",
] as const;

export const INCIDENT_TYPES = [
  "rescue",
  "medical",
  "food",
  "shelter",
  "transport",
] as const;
