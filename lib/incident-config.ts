/**
 * Configurable thresholds for incident display and categorization.
 * Backend may compute these; frontend uses for labels and any client-side logic.
 */

/** Hours since incident → criticality tier. */
export const CRITICALITY_TIME_THRESHOLDS = {
  critical_max_hours: 24,
  needs_support_max_hours: 72,
  // cleanup: > 72h
} as const;

/** Casualties estimate → category. */
export const CASUALTIES_RANGES = {
  few_max: 5,
  some_max: 20,
  // many: > 20
} as const;

/** Manpower estimate → category. */
export const MANPOWER_RANGES = {
  small_max: 5,
  moderate_max: 20,
  // large: > 20
} as const;

/** Number of posts → verification level. */
export const VERIFICATION_POST_THRESHOLDS = {
  initial_reports_max: 2,
  confident_max: 5,
  // verified: > 5
} as const;
