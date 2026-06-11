import { supabase } from './supabase.js';

// Called after an API 401 — asks Supabase for a refreshed session and returns
// the new access token, or null if the user genuinely needs to sign in again.
// refreshSession() also fires onAuthStateChange, so AuthContext picks up the
// new session automatically.
export async function refreshAccessToken() {
  try {
    const { data, error } = await supabase.auth.refreshSession();
    if (error) return null;
    return data.session?.access_token || null;
  } catch {
    return null;
  }
}
