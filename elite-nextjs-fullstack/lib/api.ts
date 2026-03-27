const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL || "").replace(/\/$/, "");

export class ApiError extends Error {
  public readonly status: number;
  public readonly details?: unknown;

  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

export function buildApiUrl(path: string): string {
  return API_BASE_URL ? `${API_BASE_URL}${path}` : path;
}

export async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(buildApiUrl(path), {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {})
    }
  });

  const isJson = response.headers.get("content-type")?.includes("application/json");
  const payload = isJson ? await response.json() : null;

  if (!response.ok) {
    throw new ApiError(
      response.status,
      payload?.error || payload?.message || "Request failed.",
      payload?.details
    );
  }

  return payload as T;
}

export function getAdminHeaders(secret: string): HeadersInit {
  return {
    "x-admin-secret": secret
  };
}

export async function apiBlobRequest(path: string, init?: RequestInit): Promise<Blob> {
  const response = await fetch(buildApiUrl(path), init);

  if (!response.ok) {
    let payload: { error?: string; message?: string; details?: unknown } | null = null;

    try {
      payload = (await response.json()) as typeof payload;
    } catch {
      payload = null;
    }

    throw new ApiError(
      response.status,
      payload?.error || payload?.message || "Request failed.",
      payload?.details
    );
  }

  return response.blob();
}
