// Single source of truth for the backend base URL. An empty VITE_API_URL means
// relative paths, which both the Vite dev proxy and a Vercel rewrite handle;
// set it for a direct cross-origin call to the Railway backend.
export const API_ROOT = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
export const API_BASE = API_ROOT + '/api';

// Abort signal for non-streaming API calls so a hung server doesn't leave the
// UI waiting on the browser's multi-minute default. Not for streamed responses.
export function timeoutSignal(ms = 30000) {
  return typeof AbortSignal.timeout === 'function' ? AbortSignal.timeout(ms) : undefined;
}
