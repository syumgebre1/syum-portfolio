import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "./supabase-config.js";

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
export const supabase = isSupabaseConfigured
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

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

export function publicFileUrl(path) {
  if (!path || !supabase) return path || "";
  return supabase.storage.from("portfolio-files").getPublicUrl(path).data.publicUrl;
}