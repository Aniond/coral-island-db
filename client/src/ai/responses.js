// ── AI Guide keyword-response engine ────────────────────────────────────────
// Design-time stand-in for a real LLM call. To wire up the backend later,
// replace getResponse() with a POST to /api/search and stream the reply.

export const SUGGESTED_QS = [
  "What food boosts my Fishing skill?",
  "How do I craft a Furnace? Show me the recipe.",
  "What gifts does Macy love?",
  "Where do I catch Salmon and what season?",
  "What's the best crop to plant in spring?",
];

const AI_KB = {
  spring:  "Spring is perfect for high-value crops 🌸\n\n**Strawberries** (Rank A · 120g · regrows) are the undisputed best. Plant on Day 1 so they regrow as many times as possible before summer.\n\n**Cauliflower** (Rank B · 90g) is great for a one-time big payout. **Tulips** are low-value but Lily adores them as gifts.",
  summer:  "Summer is hot and profitable ☀️\n\n**Blueberries** (Rank B · 80g · regrows) are your best friend — plant once, harvest multiple times. **Tomatoes** (35g · regrows) are a budget staple. **Corn** regrows too and can carry into Fall if you plant early.",
  fall:    "Fall is harvest festival season 🍂\n\n**Cranberries** (Rank A · 130g · regrows) are the most valuable seasonal crop. **Eggplant** (30g · regrows) is a reliable low-effort earner. **Pumpkin** is crowd-pleasing but doesn't regrow, so plant it Day 1.",
  winter:  "Winter farming is challenging but rewarding ❄️\n\n**Crystal Berry** (Rank B · 110g) is your top earner. **Snow Peas** regrow and are consistent. The season is short — plant early and consider spending time in the mines instead.",
  mine:    "The 5 elemental mines unlock progressively 🪨\n\n**Earth Mine** — Day 1, no requirements\n**Water Mine** — Town Rank D (donate 30 items to museum)\n**Wind Mine** — Town Rank C (complete Tidal's quest)\n**Fire Mine** — Town Rank B (clear all 40 Wind Mine floors)\n**Memories Mine** — Town Rank A (secret seasonal event)",
  water:   "The **Water Mine** unlocks at Town Rank D — donate 30 items to the island museum to reach it.\n\nInside: Coral Fragments (floors 1–15), Sea Crystals (16–25, very valuable!), and rare Pearls (26–40). Tidal's quest will walk you through the unlock.",
  lily:    "Lily is the island's **Botanist** at the Greenhouse (7am–4pm, Park afternoons) 🌿\n\nShe absolutely loves: Rare Flowers, Honey, and Crystal Berry.\n\nHer quest line asks for exotic plant specimens — completing it unlocks new seed varieties and, eventually, expands your farming options.",
  gift:    "Gift-giving tips 🎁\n\nEach NPC has 3 loved gifts visible on their card. Universal safe bets: Gems, Sea Crystals, and high-quality produce. **Never** give junk or recycled items — it hurts your friendship score. Birthday gifts give **8× friendship points**, so mark those dates!",
  money:   "Early money-making strategies 💰\n\n1. Plant regrow crops (Strawberries → Blueberries → Cranberries)\n2. Mine copper & iron — sell raw or smelt for tools/upgrades\n3. Forage daily — it's completely free gold\n4. Fishing at the Harbor earns decent cash and Sam's friendship\n5. Sell direct at the market on festival days for a price bonus",
  forage:  "Foraging by season 🌿\n\n**Spring:** Wild Berries (Forest Trail), Fiddlehead Fern (River Bank)\n**Summer:** Coconut & Palm Fruit (Coastal), Sea Urchin (Tide Pools)\n**Fall:** Wild Mushroom & Chanterelle (Deep Forest — most valuable!)\n**Winter:** Holly Berry (Snow Fields), Ice Crystal (Frozen Lake)\n**Year-round:** Seaweed (Shoreline) — useful for crafting",
  npc:     "There are 8 island residents to befriend 👥\n\n**Sam** (Harbor) loves fish · **Lily** (Greenhouse) loves flowers · **Marcus** (Restaurant) loves truffles · **Elena** (Clinic) loves herbs & gems · **Tidal** (Research Center) loves sea items · **Naomi** (Mayor) loves relics · **Keanu** (Beach) loves coastal finds · **Mira** (Studio) loves gems & flowers",
  rank:    "Town Rank is the backbone of Coral Island's progression 🏆\n\nDonate items to the museum, complete NPC quests, and ship crops to raise your rank from F → E → D → C → B → A. Each rank unlocks new mines, areas, and events. Talk to Mayor Naomi for rank-up guidance.",
  default: "Happy to help with all things Coral Island! 🌴\n\nTry asking about:\n• **Seasonal crops** and their profit tiers\n• **Mine unlocks** and what to find inside\n• **NPC gifts** and quest rewards\n• **Foraging spots** by season\n• **Money-making** strategies",
};

export function getResponse(q) {
  const s = q.toLowerCase();
  if (s.includes('spring'))                                       return AI_KB.spring;
  if (s.includes('summer'))                                       return AI_KB.summer;
  if (s.includes('fall') || s.includes('autumn'))                 return AI_KB.fall;
  if (s.includes('winter'))                                       return AI_KB.winter;
  if (s.includes('water mine'))                                   return AI_KB.water;
  if ((s.includes('unlock') && s.includes('mine')) || (s.includes('mine') && !s.includes('yours'))) return AI_KB.mine;
  if (s.includes('lily'))                                         return AI_KB.lily;
  if (s.includes('gift') || s.includes('love') || s.includes('give')) return AI_KB.gift;
  if (s.includes('money') || s.includes('earn') || s.includes('gold') || s.includes('profit') || s.includes('fast')) return AI_KB.money;
  if (s.includes('forage') || s.includes('find') || s.includes('pick')) return AI_KB.forage;
  if (s.includes('npc') || s.includes('resident') || s.includes('friend')) return AI_KB.npc;
  if (s.includes('rank') || s.includes('town'))                   return AI_KB.rank;
  return AI_KB.default;
}
