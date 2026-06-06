// Aggregates the game data. Swap these JSON imports for API/DB calls later
// (e.g. fetch from /api/crops) without touching the page components.
import crops from './crops.json';
import caves from './caves.json';
import foraging from './foraging.json';
import npcs from './npcs.json';
import mineUnlocks from './mineUnlocks.json';

export { crops, caves, foraging, npcs, mineUnlocks };

export const GameData = { crops, caves, foraging, npcs, mineUnlocks };
