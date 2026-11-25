// supabase-client.js
// ---------------------------------------------------------------------------
// Single shared Supabase client + table name constants + file URL helper.
//
// Every module that talks to the database imports from here so that:
//   1. Only ONE Supabase client instance exists per page.
//   2. Table names are defined in one place.
//   3. Public file URLs are built the same way everywhere.
// ---------------------------------------------------------------------------

// Official Supabase JS v2 client, loaded from esm.sh so the browser can use it
// as a native ES module. No bundler, no npm install — this is a static site.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Connection settings (URL + anon key). See supabase-config.js for what is
// safe to expose and why.
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "./supabase-config.js";

// True only when BOTH values are non-empty strings. Used by callers to decide
// whether to attempt network calls or fall back to the hard-coded HTML defaults.
export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

// The shared client. `null` when config is missing so callers can guard with
// `if (!supabase) return;` instead of try/catching at import time.
export const supabase = isSupabaseConfigured
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

// Central registry of table names. Callers import TABLES.projects instead of
// hard-coding the string "portfolio_projects" so a rename is a one-line change.
export const TABLES = {
  profile: "portfolio_profile",
  projects: "portfolio_projects",
  certificates: "portfolio_certificates",
  experience: "portfolio_experience",
  education: "portfolio_education",
  skills: "portfolio_skills",
  highlights: "portfolio_highlights",
  messages: "contact_messages",
  settings: "site_settings",
};

// Convert a stored file path (e.g. "projects/abc-uuid.png") into a full public
// URL that <img> and <a> can use directly. Returns "" for empty paths so
// templates can safely do `${publicFileUrl(path)}` without producing "null".
export function publicFileUrl(path) {
  if (!path || !supabase) return path || "";
  return supabase.storage.from("portfolio-files").getPublicUrl(path).data.publicUrl;
}