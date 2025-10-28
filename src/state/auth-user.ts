// src/state/auth-user.ts
import { create } from "zustand";

export type Me = { id: string; email: string; name?: string; picture?: string } | null;

type AuthState = {
  me: Me;
  loading: boolean;
  fetchMe: () => Promise<void>;
  logout: () => Promise<void>;
};

export const useAuthUser = create<AuthState>((set) => ({
  me: null,
  loading: false,
  fetchMe: async () => {
    set({ loading: true });
    try {
      const res = await fetch("http://localhost:4000/api/me", {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        set({ me: data, loading: false });
      } else {
        set({ me: null, loading: false });
      }
    } catch {
      set({ me: null, loading: false });
    }
  },
  logout: async () => {
    try {
      await fetch("http://localhost:4000/api/logout", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });
    } finally {
      set({ me: null });
      // 필요하면 새로고침
      // window.location.reload();
    }
  },
}));
