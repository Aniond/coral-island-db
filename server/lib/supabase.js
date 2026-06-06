const { createClient } = require('@supabase/supabase-js');

// Service-role client — bypasses RLS, server-side only, never sent to client.
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

module.exports = supabase;
