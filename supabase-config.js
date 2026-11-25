// supabase-config.js
// ---------------------------------------------------------------------------
// Supabase connection settings.
//
// These two values are PUBLIC by design. The anon/publishable key is meant to
// be shipped in browser code — it only proves "this is a Supabase client".
// It does NOT grant admin rights. Your Row Level Security (RLS) policies in
// supabase-setup.sql are what actually protect the data.
//
// NEVER paste a `service_role` key or a database password into this file.
// ---------------------------------------------------------------------------

// The Project URL shown in Supabase Dashboard -> Project Settings -> API.
// It identifies which Supabase project the browser should talk to.
export const SUPABASE_URL = "https://viamrnqhyeqqzkpyhfim.supabase.co";

// The anon / publishable key. Safe to expose. Rotate it from the Supabase
// dashboard if it ever leaks in a way that concerns you — RLS still holds.
export const SUPABASE_ANON_KEY = "sb_publishable_Z3IamKJMYkoYGE_dA3fuJg_Xgem_MA3";