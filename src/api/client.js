export const getToken = () => localStorage.getItem('drive_token');

export function getStreamUrl(fileId) {
  const token = getToken();
  const base = typeof window !== 'undefined' ? window.location.origin : '';
  return `${base}/api/files/stream/${fileId}${token ? `?token=${encodeURIComponent(token)}` : ''}`;
}

export async function api(path, options = {}) {
  const token = getToken();
  const res = await fetch(path.startsWith('http') ? path : `/api${path}`, {
    ...options,
    headers: {
      ...options.headers,
      ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
    },
    credentials: 'include',
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data;
}
