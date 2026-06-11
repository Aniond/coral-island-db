const { createClient } = require('@supabase/supabase-js');

// Service-role client — bypasses RLS, server-side only, never sent to client.
// Lazily initialized so a missing env var produces a clear error on the first
// auth call instead of crashing the whole server at require time.
let client = null;

function getClient() {
  if (!client) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      throw new Error(
        'SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set (see .env.example) — auth endpoints cannot work without them'
      );
    }
    client = createClient(url, key, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }
  return client;
}

module.exports = new Proxy({}, { get: (_, prop) => getClient()[prop] });
