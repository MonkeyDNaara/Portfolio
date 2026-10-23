export const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:8000").replace(/\/$/, "");

export class ApiError extends Error {
  constructor(status, message, retryAfter = null) {
    super(message);
    this.status = status;
    this.retryAfter = retryAfter; // seconds, from the Retry-After header (429)
  }
}

function formatDetail(detail) {
  if (Array.isArray(detail)) {
    return detail
      .map((d) => `${d.loc?.[d.loc.length - 1] ?? "field"}: ${d.msg}`)
      .join("; ");
  }
  return typeof detail === "string" ? detail : "Something went wrong";
}

export async function api(path, { method = "GET", body, token } = {}) {
  const headers = {};
  const isForm = body instanceof FormData;
  if (body !== undefined && !isForm) headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : isForm ? body : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(0, "Can't reach the API. The free-tier server may be waking up, try again in about 30 seconds.");
  }

  if (res.status === 204) return null;
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const retryAfter = Number(res.headers.get("Retry-After")) || null;
    throw new ApiError(res.status, formatDetail(data?.detail), retryAfter);
  }
  return data;
}

// Public image URL of a project, or null. `?v=` changes on every upload so browsers refetch.
export function imageUrl(project) {
  if (!project.image_version || !project.is_published) return null;
  return `${API_URL}/projects/${project.id}/image?v=${project.image_version}`;
}
