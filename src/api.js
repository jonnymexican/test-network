export async function apiGet(path, params) {
  const url = new URL(path, window.location.origin);
  for (const [key, value] of Object.entries(params || {})) {
    if (value !== undefined && value !== '') url.searchParams.set(key, value);
  }
  const res = await fetch(url);
  const data = await res.json().catch(() => ({ error: 'Invalid server response.' }));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}
