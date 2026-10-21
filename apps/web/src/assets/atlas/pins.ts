/**
 * Small catalogue loader for the address editor.
 * Data lives in /atlas/pins.json (public/) and is fetched on first use so the
 * main bundle stays small.
 */
let cache: string[] | null = null;
let pending: Promise<string[]> | null = null;

export async function loadPins(): Promise<string[]> {
  if (cache) return cache;
  if (!pending) {
    pending = fetch("/atlas/pins.json")
      .then((res) => res.json() as Promise<string[]>)
      .then((list) => {
        cache = Array.isArray(list) ? list : [];
        return cache;
      })
      .catch(() => {
        cache = [];
        return cache;
      });
  }
  return pending;
}

/** Pick a random entry from the catalogue. */
export async function pickPin(): Promise<string> {
  const list = await loadPins();
  return list.length ? list[Math.floor(Math.random() * list.length)] : "";
}
