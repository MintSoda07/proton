import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./index.css";
import i18n from "./i18n"; // 이미 프로젝트에 있는 i18n 인스턴스 사용

const rootEl = document.getElementById("root");
if (!rootEl) throw new Error("#root not found");

function applyHtmlAttrs(lng: string) {
  document.documentElement.lang = lng;
  document.documentElement.dir = i18n.dir(lng);
}

function applyTitle(lng: string) {
  const fromRes = i18n.getResource(lng, "translation", "meta.title") as string | undefined;
  document.title = fromRes || i18n.t("meta.title");
}

(async () => {
  const stored = localStorage.getItem("proton:lang");

  if (!i18n.isInitialized) {
    await new Promise<void>((resolve) => {
      i18n.on("initialized", () => resolve());
    });
  }

  const targetLang = stored || i18n.resolvedLanguage || i18n.language || "ko";
  if (targetLang !== i18n.language) await i18n.changeLanguage(targetLang);

  applyHtmlAttrs(i18n.language);
  applyTitle(i18n.language);

  i18n.on("languageChanged", (lng) => {
    try { localStorage.setItem("proton:lang", lng); } catch { console.log("failed to fetech localize")}
    applyHtmlAttrs(lng);
    applyTitle(lng);
  });

  ReactDOM.createRoot(rootEl).render(
    <React.StrictMode>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </React.StrictMode>
  );
})();
