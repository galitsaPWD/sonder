/* SONDER - Supabase Initialization */

const SUPABASE_URL = 'https://dtkalsaxrrdavciejvpm.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_fEd82YvNiBcUWAteAcQfxQ_HUgVBuvH';

// Initialize the Supabase client
// The CDN script exposes 'supabase' as a global library object.
// We use it to create our client instance and store it globally.
const client = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
window.supabase = client;

// Supabase is now ready for use via window.supabase
