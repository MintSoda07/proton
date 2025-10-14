// src/main.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import i18n from "./i18n"; // 실제 i18n 인스턴스 import (side-effect X)

const rootEl = document.getElementById("root")!;

function applyHtmlAttrs(lng: string) {
  document.documentElement.lang = lng;
  document.documentElement.dir = i18n.dir(lng);
}

function applyTitle(lng: string) {
  // 리소스에 없으면 t로 폴백 (i18n 초기화 이후 호출 보장)
  const fromRes = i18n.getResource(lng, "translation", "meta.title") as string | undefined;
  document.title = fromRes || i18n.t("meta.title");
}

// i18n 준비를 보장하고 부트스트랩
(async () => {
  // 1) 저장된 언어 우선
  const stored = localStorage.getItem("proton:lang");

  // 2) i18n 초기화가 끝났는지 보장
  //    (여기서 ./i18n이 이미 init을 호출했다면 isInitialized가 true일 수 있음)
  if (!i18n.isInitialized) {
    await new Promise<void>((resolve) => {
      i18n.on("initialized", () => resolve());
    });
  }

  // 3) 언어 변경(필요 시)
  const targetLang = stored || i18n.resolvedLanguage || i18n.language || "ko";
  if (targetLang !== i18n.language) {
    await i18n.changeLanguage(targetLang);
  }

  // 4) 문서 속성/타이틀 적용
  applyHtmlAttrs(i18n.language);
  applyTitle(i18n.language);

  // 5) 언어 변경 시 후속 반영 (타이틀/HTML 속성/저장)
  i18n.on("languageChanged", (lng) => {
    try {
      localStorage.setItem("proton:lang", lng);
    } catch { }
    applyHtmlAttrs(lng);
    applyTitle(lng);
  });

  // 6) 렌더
  ReactDOM.createRoot(rootEl).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
})();
