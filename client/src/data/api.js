// ── API client ───────────────────────────────────────────────────────────────
// Fetches from the Express backend and maps the DB row shapes into the shapes
// the UI components expect. Base URL is relative ("/api") so the Vite dev proxy
// and a Vercel rewrite both work; override with VITE_API_URL for a direct
// cross-origin call to the Railway backend.

const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '') + '/api';

async function getJson(path, params) {
  const qs = params
    ? '?' + new URLSearchParams(Object.entries(params).filter(([, v]) => v)).toString()
    : '';
  const res = await fetch(`${API_BASE}${path}${qs}`);
  if (!res.ok) {
    let msg = `Request failed (${res.status})`;
    try { const j = await res.json(); if (j && j.error) msg = j.error; } catch { /* ignore */ }
    throw new Error(msg);
  }
  return res.json();
}

// ── Row mappers (DB shape -> UI shape) ──────────────────────────────────────

function mapCrop(r) {
  return {
    id: r.id,
    name: r.name,
    type: r.type,                       // 'seed' | 'fruit_plant' | 'fruit_tree' | 'ocean_crop'
    season: r.season,                   // may be a combo like 'summer/fall' or 'all'
    rank: r.town_rank,                  // 'F'..'A'
    growTime: r.grow_days,              // may be null (fruit plants/trees)
    sellPrice: r.sell_price,
    regrows: r.regrowth_days != null,
    regrowthDays: r.regrowth_days,
    notes: r.notes,
  };
}

function mapCave(r) {
  return {
    id: r.id,
    name: r.item_name,
    type: r.item_type,                  // 'ore' | 'gem' | 'geode' | 'monster_drop' | 'fish' | 'scavengeable'
    mine: r.cave,                       // 'earth' | 'water' | 'wind' | 'fire' | 'memories'
    floors: r.floor_range,              // 'all floors' | '1-20' | 'water pockets' | ...
    notes: r.notes,
  };
}

function mapForageable(r) {
  return {
    id: r.id,
    name: r.name,
    season: r.season,                   // 'spring'..'winter' | 'all' | combos
    location: r.location,
    area: r.area,                       // tag: 'land' | 'beach' | 'ocean' | 'forest' | 'misc'
    notes: r.notes,
    sellPrice: r.sell_price,
    image: r.image_url,
  };
}

function mapCollectible(r) {
  return {
    id: r.id,
    category: r.category,               // 'fish'|'insect'|'sea_critter'|'fossil'|'artifact'|'gem'
    name: r.name,
    sellPrice: r.sell_price,
    rarity: r.rarity,
    seasons: r.seasons,
    locations: r.locations,
    timeOfDay: r.time_of_day,
    description: r.description,
    image: r.icon,
    sortOrder: r.sort_order,
  };
}

const NPC_PALETTE = ['#0369a1', '#15803d', '#b45309', '#9333ea', '#0f766e', '#dc2626', '#d97706', '#ec4899'];

function mapNpc(r, i) {
  return {
    id: r.id,
    name: r.name,
    initials: (r.name || '').trim().slice(0, 2).toUpperCase(),
    role: r.role,
    location: r.location,
    schedule: r.schedule,
    birthday: r.birthday,
    image: r.image_url,
    lovedGifts: (r.loved_gifts || '').split(',').map(s => s.trim()).filter(Boolean),
    likedGifts: (r.liked_gifts || '').split(',').map(s => s.trim()).filter(Boolean),
    quest: r.quest_summary,
    color: NPC_PALETTE[i % NPC_PALETTE.length],
  };
}

// ── Public fetchers ──────────────────────────────────────────────────────────

export async function fetchCrops()      { return (await getJson('/crops')).map(mapCrop); }
export async function fetchCaves()       { return (await getJson('/caves')).map(mapCave); }
export async function fetchForageables() { return (await getJson('/forageables')).map(mapForageable); }
export async function fetchNpcs()        { return (await getJson('/npcs')).map(mapNpc); }
export async function fetchCollectibles() { return (await getJson('/collectibles')).map(mapCollectible); }

// POST /api/search — streams plain-text chunks; calls onChunk(text) as they arrive.
// token: optional Supabase access_token — included as Bearer for server-side logging.
export async function streamSearch(query, onChunk, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}/search`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ query }),
  });
  if (!res.ok) {
    let msg = `Request failed (${res.status})`;
    try { const j = await res.json(); if (j && j.error) msg = j.error; } catch { /* ignore */ }
    throw new Error(msg);
  }
  if (!res.body) {                      // very old browsers — fall back to full text
    onChunk(await res.text());
    return;
  }
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    if (value) onChunk(decoder.decode(value, { stream: true }));
  }
}
