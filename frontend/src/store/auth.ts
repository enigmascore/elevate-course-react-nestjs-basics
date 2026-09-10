import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AuthTokens, UserView } from "../api/types";

/**
 * App-wide state with zustand: WHO is logged in and their tokens.
 * Persisted to localStorage so a page reload keeps the session.
 * Components subscribe to a SLICE ( useAuthStore((s) => s.user) ),
 * not the whole store.
 */
interface AuthState {
  user: UserView | null;
  accessToken: string | null;
  refreshToken: string | null;
  setAuth: (tokens: AuthTokens) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      setAuth: (tokens) =>
        set({
          user: tokens.user,
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
        }),
      clearAuth: () => set({ user: null, accessToken: null, refreshToken: null }),
    }),
    { name: "blog-auth" },
  ),
);
