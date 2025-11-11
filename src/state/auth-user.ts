// src/state/auth-user.ts
import { create } from "zustand";

export type Me = {
  id: string;
  email: string;
  name?: string | null;
  picture?: string | null;
} | null;

type AuthState = {
  me: Me;
  loading: boolean;
  fetchMe: () => Promise<void>;
  logout: () => Promise<void>;
  /** 구글 로그인 시작 URL (redirect 미지정 시 현재 오리진 루트로 복귀) */
  loginUrl: (redirect?: string) => string;
};

// 백엔드 베이스 (환경변수 없으면 로컬 기본)
const API = import.meta.env.VITE_API_BASE ?? "http://localhost:4000";

export const useAuthUser = create<AuthState>((set) => ({
  me: null,
  loading: false,

  fetchMe: async () => {
    set({ loading: true });
    try {
      const res = await fetch(`${API}/api/me`, { credentials: "include" });
      if (res.ok) {
        set({ me: await res.json(), loading: false });
      } else {
        set({ me: null, loading: false });
      }
    } catch {
      set({ me: null, loading: false });
    }
  },

  logout: async () => {
    try {
      await fetch(`${API}/api/logout`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });
    } finally {
      set({ me: null });
      // 깔끔하게 홈으로
      window.location.href = "/";
    }
  },

  loginUrl: (redirect?: string) => {
    const to = redirect ?? window.location.origin + "/";
    return `${API}/api/auth/google/start?redirect=${encodeURIComponent(to)}`;
  },
}));
