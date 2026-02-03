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
  if (!res.ok) {
    const error = new Error(data.message || "Request failed");
    error.status = res.status;
    throw error;
  }
  return data;
}

export async function uploadFile(path, formData, onProgress) {
  const token = getToken();
  const base = getApiBase();
  const url = base ? `${base}/api${path}` : `/api${path}`;

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    if (token) {
      xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    }
    // Note: Content-Type is set automatically with FormData

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        const percent = Math.round((event.loaded / event.total) * 100);
        onProgress(percent);
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText);
          resolve(data);
        } catch (e) {
          resolve({});
        }
      } else {
        try {
          const data = JSON.parse(xhr.responseText);
          reject(new Error(data.message || "Upload failed"));
        } catch (e) {
          reject(new Error("Upload failed"));
        }
      }
    };

    xhr.onerror = () => reject(new Error("Network error during upload"));
    xhr.send(formData);
  });
}

export async function downloadFile(url, filename) {
  // For signed URLs (which contain auth params), we must NOT send the Authorization header
  // as it will cause a signature mismatch or CORS error.
  // We simply trigger a browser download.
  const a = document.createElement("a");
  a.href = url;
  a.download = filename || "download";
  a.target = "_blank"; // Open in new tab if it's a viewable file, or trigger download
  a.rel = "noopener noreferrer";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
