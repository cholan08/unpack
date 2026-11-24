/** What the learner opened from the palette lately (item keys, newest first), in this browser only. */
const KEY = 'unpacked:palette:recent:v1';
const MAX = 8;

export function loadRecent(): string[] {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? '[]');
    return Array.isArray(v) ? v.filter((k): k is string => typeof k === 'string').slice(0, MAX) : [];
  } catch {
    return [];
  }
}

export function pushRecent(key: string) {
  try {
    localStorage.setItem(KEY, JSON.stringify([key, ...loadRecent().filter((k) => k !== key)].slice(0, MAX)));
  } catch {
    /* storage blocked: no recents this time */
  }
}
