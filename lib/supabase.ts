import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Support multiple env variable names (Next.js loads .env automatically)
const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ??
  process.env.SUPABASE_URL ??
  "";
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ??
  process.env.SUPABASE_SERVICE_KEY ??
  "";

const isConfigured = Boolean(
  supabaseUrl && supabaseServiceKey && supabaseUrl.startsWith("https://")
);

if (!isConfigured && typeof window === "undefined") {
  console.warn(
    "[AidLink] Supabase not configured. Add to .env:\n" +
      "  NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co\n" +
      "  SUPABASE_SERVICE_ROLE_KEY=eyJ...\n" +
      "Alternatively: SUPABASE_URL and SUPABASE_SERVICE_KEY"
  );
}

/** Server-side Supabase client with service role. Use only in API routes / server components. */
export const supabase: SupabaseClient | null = isConfigured
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;
