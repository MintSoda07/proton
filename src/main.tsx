// src/main.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./index.css";
import i18n from "./i18n";

// #root 체크
const rootEl = document.getElementById("root");
if (!rootEl) throw new Error("#root not found");

// HTML lang/dir 반영
function applyHtmlAttrs(lng: string) {
  document.documentElement.lang = lng;
  document.documentElement.dir = i18n.dir(lng);
}

// <title> 반영
function applyTitle(lng: string) {
  const fromRes = i18n.getResource(lng, "translation", "meta.title") as string | undefined;
  document.title = fromRes || i18n.t("meta.title");
}

(async () => {
  // 1) 언어 부트스트랩
  const stored = localStorage.getItem("proton:lang");

  if (!i18n.isInitialized) {
    await new Promise<void>((resolve) => {
      i18n.on("initialized", () => resolve());
    });
  }

  const targetLang = stored || i18n.resolvedLanguage || i18n.language || "ko";
  if (targetLang !== i18n.language) {
    await i18n.changeLanguage(targetLang);
  }

  applyHtmlAttrs(i18n.language);
  applyTitle(i18n.language);

  i18n.on("languageChanged", (lng) => {
    try {
      localStorage.setItem("proton:lang", lng);
    } catch {}
    applyHtmlAttrs(lng);
    applyTitle(lng);
  });
  

  // 2) **Google 로그인 세션 복구**
  // zustand 스토어(useAuthUser)에서 fetchMe 함수를 동적 import로 꺼내와 호출
  try {
    const mod = await import("./state/auth-user");
    // zustand는 getState()로 현재 스토어 접근
    const fetchMe = mod.useAuthUser.getState().fetchMe;
    await fetchMe(); // 서버 쿠키가 있으면 /api/me 호출 → me 채워짐
  } catch (e) {
    console.warn("[main] fetchMe failed (ignored):", e);
  }

  // 3) 렌더
  ReactDOM.createRoot(rootEl).render(
    <React.StrictMode>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </React.StrictMode>
  );
})();
