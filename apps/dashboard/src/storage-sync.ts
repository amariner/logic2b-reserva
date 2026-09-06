export type StorageValueListener = (value: string | null) => void;

/**
 * Subscribe to changes made by another tab to one of the demo's local stores.
 *
 * The browser does not emit `storage` in the tab that performed the write, so
 * callers continue updating their own state after local mutations. A null key
 * represents `localStorage.clear()` and must reset every demo store.
 */
export function subscribeToStorageKey(key: string, listener: StorageValueListener): () => void {
  const handleStorage = (event: StorageEvent) => {
    if (event.storageArea !== null && event.storageArea !== window.localStorage) return;
    if (event.key === key) listener(event.newValue);
    else if (event.key === null) listener(null);
  };

  window.addEventListener('storage', handleStorage);
  return () => window.removeEventListener('storage', handleStorage);
}
