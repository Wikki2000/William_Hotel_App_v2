import { Cache } from './cache.js';

const cache = new Cache();

/**
 * Initialize all required IndexedDB stores for Wiventory
 */
export async function initAllStores(stores = INDEX_DB_STORES) {
  await cache.init(stores);
  return cache;
}
