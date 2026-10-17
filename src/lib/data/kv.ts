/**
 * Tiny observable key/value cell backed by localStorage or sessionStorage.
 * This (with store.ts) is the ONLY place browser storage is touched.
 */
export function createKV<T>(key: string, kind: "local" | "session", initial: T) {
  let cache: T = initial;
  let loaded = false;
  const listeners = new Set<() => void>();
  let bound = false;

  const area = () => (kind === "local" ? window.localStorage : window.sessionStorage);

  function load() {
    try {
      const raw = area().getItem(key);
      cache = raw ? (JSON.parse(raw) as T) : initial;
    } catch {
      cache = initial;
    }
    loaded = true;
  }
  function emit() {
    listeners.forEach((l) => l());
  }

  return {
    get(): T {
      if (typeof window === "undefined") return initial;
      if (!loaded) load();
      return cache;
    },
    getServer(): T {
      return initial;
    },
    set(value: T) {
      cache = value;
      loaded = true;
      try {
        if (value === null || value === undefined) area().removeItem(key);
        else area().setItem(key, JSON.stringify(value));
      } catch {
        /* storage blocked: keep in memory only */
      }
      emit();
    },
    subscribe(listener: () => void) {
      listeners.add(listener);
      if (!bound && typeof window !== "undefined" && kind === "local") {
        bound = true;
        window.addEventListener("storage", (e) => {
          if (e.key === key || e.key === null) {
            load();
            emit();
          }
        });
      }
      return () => {
        listeners.delete(listener);
      };
    },
  };
}
