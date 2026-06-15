// ── API client ───────────────────────────────────────────────────────────────
// Fetches from the Express backend and maps the DB row shapes into the shapes
// the UI components expect. Base URL is relative ("/api") so the Vite dev proxy
// and a Vercel rewrite both work; override with VITE_API_URL for a direct
// cross-origin call to the Railway backend.

import { refreshAccessToken } from '../lib/authToken.js';
import { API_BASE, timeoutSignal } from '../lib/apiBase.js';

async function getJson(path, params) {
  const qs = params
    ? '?' + new URLSearchParams(Object.entries(params).filter(([, v]) => v)).toString()
    : '';
  const res = await fetch(`${API_BASE}${path}${qs}`, { signal: timeoutSignal() });
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
    type: r.type,
    season: r.season,
    rank: r.town_rank,
    growTime: r.grow_days,
    seedPrice: r.seed_price,
    sellPrice: r.sell_price,
    priceBronze: r.price_bronze,
    priceSilver: r.price_silver,
    priceGold: r.price_gold,
    priceOsmium: r.price_osmium,
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

function mapCookingRecipe(r) {
  return {
    id: r.id,
    kind: 'cooking',
    name: r.name,
    utensil: r.utensil,                 // Oven, Pot, Grill, Chef Knife…
    ingredients: r.ingredients || [],   // [{name, amount, icon}]
    buff: r.buff,                       // 'Farming +3' | null
    buffDuration: r.buff_duration_min,  // minutes
    health: r.health,
    energy: r.energy,
    sellPrice: r.sell_price,
    description: r.description,
    image: r.image_url,
  };
}

function mapCraftingRecipe(r) {
  return {
    id: r.id,
    kind: 'crafting',
    name: r.name,
    outputAmount: r.output_amount,      // usually 1
    category: r.category,               // Misc, Farming, Artisan, Decor, Scarecrow
    masteryType: r.mastery_type,        // unlock skill | null
    masteryLevel: r.mastery_level,
    ingredients: r.ingredients || [],   // [{name, amount, icon}]
    description: r.description,
    image: r.image_url,
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
export async function fetchCookingRecipes()  { return (await getJson('/cooking')).map(mapCookingRecipe); }
export async function fetchCraftingRecipes() { return (await getJson('/crafting')).map(mapCraftingRecipe); }
export async function fetchOfferings()       { return await getJson('/offerings'); }
export async function fetchAnimalProducts()  { return await getJson('/products/animal'); }
export async function fetchArtisanProducts() { return await getJson('/products/artisan'); }
export async function fetchTools()           { return await getJson('/tools'); }

export async function fetchGlobalSearchIndex() {
  return await getJson('/search/index');
}

// POST /api/search — streams plain-text chunks; calls onChunk(text) as they arrive.
// token: optional Supabase access_token — included as Bearer for server-side logging.
// A 401 (expired token) triggers one session refresh + retry before failing.
export async function streamSearch(query, history, gameState, onChunk, token) {
  const request = (tok) => {
    const headers = { 'Content-Type': 'application/json' };
    if (tok) headers['Authorization'] = `Bearer ${tok}`;
    return fetch(`${API_BASE}/search`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ query, history, gameState }),
    });
  };
  let res = await request(token);
  if (res.status === 401 && token) {
    const fresh = await refreshAccessToken();
    if (fresh) res = await request(fresh);
  }
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

export async function fetchPlans(token) {
  const request = (tok) => {
    const headers = { 'Content-Type': 'application/json' };
    if (tok) headers['Authorization'] = `Bearer ${tok}`;
    return fetch(`${API_BASE}/plans`, { headers, cache: 'no-store' });
  };
  let res = await request(token);
  if (res.status === 401 && token) {
    const fresh = await refreshAccessToken();
    if (fresh) res = await request(fresh);
  }
  if (!res.ok) throw new Error(`Failed to fetch plans (${res.status})`);
  return res.json();
}

export async function savePlan(query, content, token) {
  const request = (tok) => {
    const headers = { 'Content-Type': 'application/json' };
    if (tok) headers['Authorization'] = `Bearer ${tok}`;
    return fetch(`${API_BASE}/plans`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ query, content }),
    });
  };
  let res = await request(token);
  if (res.status === 401 && token) {
    const fresh = await refreshAccessToken();
    if (fresh) res = await request(fresh);
  }
  if (!res.ok) throw new Error(`Failed to save plan (${res.status})`);
  return res.json();
}

export async function deletePlan(id, token) {
  const request = (tok) => {
    const headers = { 'Content-Type': 'application/json' };
    if (tok) headers['Authorization'] = `Bearer ${tok}`;
    return fetch(`${API_BASE}/plans/${id}`, {
      method: 'DELETE',
      headers,
    });
  };
  let res = await request(token);
  if (res.status === 401 && token) {
    const fresh = await refreshAccessToken();
    if (fresh) res = await request(fresh);
  }
  if (!res.ok) throw new Error(`Failed to delete plan (${res.status})`);
  return res.json();
}

export async function fetchSearchHistory(token) {
  const request = (tok) => {
    const headers = { 'Content-Type': 'application/json' };
    if (tok) headers['Authorization'] = `Bearer ${tok}`;
    return fetch(`${API_BASE}/search/history`, { headers });
  };
  let res = await request(token);
  if (res.status === 401 && token) {
    const fresh = await refreshAccessToken();
    if (fresh) res = await request(fresh);
  }
  if (!res.ok) throw new Error(`Failed to fetch search history (${res.status})`);
  return res.json();
}

// ── User Checklists ────────────────────────────────────────────────────────
export async function getChecklist(token) {
  if (!token) return { tasks: [] };
  const headers = { 'Authorization': `Bearer ${token}` };
  let res = await fetch(`${API_BASE}/checklists`, { headers });
  if (res.status === 401) {
    const fresh = await refreshAccessToken();
    if (fresh) {
      headers['Authorization'] = `Bearer ${fresh}`;
      res = await fetch(`${API_BASE}/checklists`, { headers });
    }
  }
  if (!res.ok) throw new Error(`Failed to fetch checklist (${res.status})`);
  return res.json();
}

export async function saveChecklist(tasks, token) {
  const request = (tok) => {
    const headers = { 'Content-Type': 'application/json' };
    if (tok) headers['Authorization'] = `Bearer ${tok}`;
    return fetch(`${API_BASE}/checklists`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ tasks }),
    });
  };
  let res = await request(token);
  if (res.status === 401 && token) {
    const fresh = await refreshAccessToken();
    if (fresh) res = await request(fresh);
  }
  if (!res.ok) throw new Error(`Failed to save checklist (${res.status})`);
  return res.json();
}

// ── Daily Itinerary ─────────────────────────────────────────────────────────
export async function fetchItinerary(gameState, token) {
  if (!token) return null;
  const request = (tok) => {
    const headers = { 'Authorization': `Bearer ${tok}` };
    const query = new URLSearchParams(gameState).toString();
    return fetch(`${API_BASE}/itinerary?${query}`, { headers });
  };
  let res = await request(token);
  if (res.status === 401 && token) {
    const fresh = await refreshAccessToken();
    if (fresh) res = await request(fresh);
  }
  if (!res.ok) throw new Error(`Failed to fetch itinerary (${res.status})`);
  return res.json();
}

export async function markOfferingComplete(itemName, token) {
  if (!token) return null;
  const request = (tok) => {
    const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tok}` };
    return fetch(`${API_BASE}/itinerary/offerings`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ itemName }),
    });
  };
  let res = await request(token);
  if (res.status === 401 && token) {
    const fresh = await refreshAccessToken();
    if (fresh) res = await request(fresh);
  }
  if (!res.ok) throw new Error(`Failed to mark offering complete (${res.status})`);
  return res.json();
}
