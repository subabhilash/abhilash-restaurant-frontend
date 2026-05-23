import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8099/api/v1";

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 15000,
  withCredentials: true, // Always send cookies (httpOnly access_token + refresh_token)
});

// ── Request interceptor ───────────────────────────────────────────────────────
// Attach Authorization header from localStorage as SECONDARY mechanism.
// Primary: httpOnly cookie (set by backend, sent automatically by browser).
// Secondary: localStorage token (kept for SSR / non-browser contexts).
apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("access_token");
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// ── Response interceptor: silent token refresh on 401 ────────────────────────
let isRefreshing = false;
let failedQueue: { resolve: (t: string) => void; reject: (e: unknown) => void }[] = [];

function drainQueue(error: unknown, token: string | null) {
  failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token!)));
  failedQueue = [];
}

apiClient.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !original._retry) {
      if (isRefreshing) {
        return new Promise<string>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          original.headers.Authorization = `Bearer ${token}`;
          return apiClient(original);
        });
      }

      original._retry = true;
      isRefreshing = true;

      try {
        // Call refresh — browser sends httpOnly refresh_token cookie automatically.
        // Also pass it in body for backward compat with non-cookie flows.
        const storedRefresh = typeof window !== "undefined"
          ? localStorage.getItem("refresh_token")
          : null;

        const { data } = await axios.post(
          `${BASE_URL}/auth/refresh`,
          storedRefresh ? { refresh: storedRefresh } : {},
          { withCredentials: true },
        );

        const newAccess: string = data.access;
        if (typeof window !== "undefined") {
          localStorage.setItem("access_token", newAccess);
          if (data.refresh) localStorage.setItem("refresh_token", data.refresh);
        }
        drainQueue(null, newAccess);
        original.headers.Authorization = `Bearer ${newAccess}`;
        return apiClient(original);
      } catch (e) {
        drainQueue(e, null);
        clearAuthAndRedirect();
        return Promise.reject(e);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

function clearAuthAndRedirect() {
  if (typeof window === "undefined") return;
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  if (!window.location.pathname.startsWith("/login")) {
    window.location.href = "/login";
  }
}

export function syncAuthCookie(token: string) {
  // Keep a JS-readable cookie for Next.js middleware (not httpOnly)
  // The actual auth uses the httpOnly cookie set by the backend.
  if (typeof document === "undefined") return;
  document.cookie = `access_token=${token}; path=/; max-age=${60 * 15}; SameSite=Lax`;
}
