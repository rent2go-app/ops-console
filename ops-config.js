/* Ops Console — Supabase client.
 * Uses the existing project. Run schema.sql once to create the ops_reports table.
 * Until then, the app runs fully on localStorage (seeded with sample reports).
 * To point at a different Supabase project, change the two values below.
 */
const OPS_SUPABASE_URL = 'https://btybvrojwbtkbifwvhik.supabase.co';
const OPS_SUPABASE_ANON_KEY = 'sb_publishable__X_HnLew786QZmT7lNuVow_MPLT_D0C';

try {
  if (typeof supabase !== 'undefined' && OPS_SUPABASE_ANON_KEY) {
    window._supabase = supabase.createClient(OPS_SUPABASE_URL, OPS_SUPABASE_ANON_KEY);
  }
} catch (e) {
  console.warn('[Ops Console] Supabase init skipped — running on local storage.', e);
}
