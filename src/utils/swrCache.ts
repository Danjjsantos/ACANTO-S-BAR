/**
 * SWR (Stale-While-Revalidate) & Persistent Local Storage Cache Manager
 *
 * Guaranteed instant loading for CardapioManager and CardapioDigitalPublico.
 * Ensures administrator updates to products, categories, and settings are
 * immediately available on the public digital menu without waiting for
 * Firestore sync latency or getting blocked by network quota limits.
 */

export interface CacheMetadata {
  key: string;
  timestamp: number;
  updatedBy: 'admin' | 'firestore' | 'storage_sync';
}

const META_PREFIX = 'fzp_swr_meta_';

/**
 * Reads cached data synchronously for Stale-First render
 */
export function getSWRCache<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return parsed !== null && parsed !== undefined ? (parsed as T) : fallback;
  } catch (err) {
    console.warn(`[SWR Cache] Error reading cache key "${key}":`, err);
    return fallback;
  }
}

/**
 * Saves data into persistent localStorage and triggers instant cross-context events
 */
export function setSWRCache<T>(key: string, value: T, updatedBy: 'admin' | 'firestore' = 'admin'): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const jsonString = JSON.stringify(value);
    localStorage.setItem(key, jsonString);

    const meta: CacheMetadata = {
      key,
      timestamp: Date.now(),
      updatedBy,
    };
    localStorage.setItem(`${META_PREFIX}${key}`, JSON.stringify(meta));

    // Dispatch DOM Custom Event for instant same-window component updates
    window.dispatchEvent(
      new CustomEvent('fzp_cache_update', {
        detail: { key, value: jsonString, meta },
      })
    );

    // Broadcast across open tabs and iframes
    if ('BroadcastChannel' in window) {
      try {
        const channel = new BroadcastChannel('fzp_app_sync');
        channel.postMessage({ key, timestamp: Date.now(), updatedBy });
        channel.close();
      } catch {}
    }

    return true;
  } catch (err) {
    console.warn(`[SWR Cache] Error writing cache key "${key}":`, err);
    return false;
  }
}

/**
 * Returns timestamp of the last local write/mutation
 */
export function getLastLocalMutationTimestamp(key: string): number {
  if (typeof window === 'undefined') return 0;
  try {
    const raw = localStorage.getItem(`${META_PREFIX}${key}`);
    if (!raw) return 0;
    const meta: CacheMetadata = JSON.parse(raw);
    return meta.timestamp || 0;
  } catch {
    return 0;
  }
}

/**
 * Checks if a recent local edit occurred (e.g. within last X ms)
 */
export function isRecentLocalMutation(key: string, maxAgeMs = 10000): boolean {
  const lastTime = getLastLocalMutationTimestamp(key);
  if (!lastTime) return false;
  return Date.now() - lastTime < maxAgeMs;
}
