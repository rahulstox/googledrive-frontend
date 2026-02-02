export const getToken = () => localStorage.getItem("drive_token");

const getApiBase = () => {
  const env = typeof import.meta !== "undefined" && import.meta.env;
  const base = env?.VITE_API_URL ?? "";
  return base.replace(/\/$/, "");
};

export function getStreamUrl(fileId) {
  const token = getToken();
  const base =
    getApiBase() ||
    (typeof window !== "undefined" ? window.location.origin : "");
  return `${base}/api/files/stream/${fileId}${
    token ? `?token=${encodeURIComponent(token)}` : ""
  }`;
}

export async function api(path, options = {}) {
  const token = getToken();
  const base = getApiBase();
  const url = path.startsWith("http")
    ? path
    : base
    ? `${base}/api${path}`
    : `/api${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
    },
    credentials: "include",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || "Request failed");
  return data;
}

export async function downloadFile(url, filename) {
  const token = getToken();
  const res = await fetch(url, {
    method: "GET",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    credentials: "include",
  });
  if (!res.ok) throw new Error("Download failed.");
  const blob = await res.blob();
  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = objectUrl;
  a.download = filename || "download";
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(objectUrl);
}
