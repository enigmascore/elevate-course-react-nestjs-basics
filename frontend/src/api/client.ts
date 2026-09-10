import { useAuthStore } from "../store/auth";
import type { AuthTokens, Interest, Paged, PostView } from "./types";

/**
 * The one place the frontend talks HTTP. In dev the urls are relative
 * and Vite proxies /api to the backend; in tests they resolve against
 * localhost and MSW intercepts them.
 */
const BASE = import.meta.env.MODE === "test" ? "http://localhost:3000" : "";

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

interface RequestOptions {
  method?: string;
  body?: unknown;
  auth?: boolean;
  retrying?: boolean;
}

async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, auth = true, retrying = false } = options;

  const headers: Record<string, string> = {};
  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }
  const { accessToken } = useAuthStore.getState();
  if (auth && accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`;
  }

  const response = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  // SILENT REFRESH: an expired access token answers 401 - trade the
  // refresh token for a new pair once, then retry the original call
  if (response.status === 401 && auth && !retrying) {
    const refreshed = await tryRefresh();
    if (refreshed) {
      return apiFetch<T>(path, { ...options, retrying: true });
    }
  }

  if (!response.ok) {
    const problem = await response.json().catch(() => ({}));
    const message = Array.isArray(problem.message)
      ? problem.message.join(", ")
      : (problem.message ?? response.statusText);
    throw new ApiError(response.status, message);
  }
  return (await response.json()) as T;
}

async function tryRefresh(): Promise<boolean> {
  const { refreshToken, setAuth, clearAuth } = useAuthStore.getState();
  if (!refreshToken) {
    return false;
  }
  const response = await fetch(`${BASE}/api/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });
  if (!response.ok) {
    clearAuth();
    return false;
  }
  setAuth((await response.json()) as AuthTokens);
  return true;
}

/** The API, one function per endpoint. */
export const api = {
  interests: () => apiFetch<Interest[]>("/api/interests", { auth: false }),

  register: (input: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    interestIds: string[];
  }) => apiFetch<{ message: string }>("/api/auth/register", { method: "POST", body: input, auth: false }),

  activate: (token: string) =>
    apiFetch<{ message: string }>("/api/auth/activate", { method: "POST", body: { token }, auth: false }),

  login: (email: string, password: string) =>
    apiFetch<AuthTokens>("/api/auth/login", { method: "POST", body: { email, password }, auth: false }),

  logout: (refreshToken: string) =>
    apiFetch<{ message: string }>("/api/auth/logout", { method: "POST", body: { refreshToken } }),

  myPosts: (page: number, size = 10) =>
    apiFetch<Paged<PostView>>(`/api/users/me/posts?page=${page}&size=${size}`),

  post: (id: string) => apiFetch<PostView>(`/api/posts/${id}`),

  createPost: (input: { title: string; body: string }) =>
    apiFetch<PostView>("/api/posts", { method: "POST", body: input }),

  updatePost: (id: string, input: { title: string; body: string }) =>
    apiFetch<PostView>(`/api/posts/${id}`, { method: "PUT", body: input }),
};
