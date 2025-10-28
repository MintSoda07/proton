// src/components/Header.tsx
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import LocaleSwitcher from "./LocaleSwitcher";
import { useAuthUI } from "../state/auth-ui.tsx";
import { useAuthUser } from "../state/auth-user";

function initials(name?: string, email?: string) {
  const base = (name || email || "").trim();
  if (!base) return "U";
  const parts = base.split(/\s+/).slice(0, 2);
  const chars =
    parts.length >= 2 ? parts[0][0] + parts[1][0] : parts[0].slice(0, 2);
  return chars.toUpperCase();
}

export default function Header() {
  const { t } = useTranslation();
  const { openLogin } = useAuthUI();
  const { me, logout } = useAuthUser();

  const [atTop, setAtTop] = useState(true);
  const [open, setOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false); // 데스크톱 프로필 메뉴

  const btnRef = useRef<HTMLButtonElement | null>(null);
  const drawerRef = useRef<HTMLDivElement | null>(null);
  const firstLinkRef = useRef<HTMLAnchorElement | null>(null);
  const menuBtnRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  // 상단 스크롤 섀도우 토글
  useEffect(() => {
    const onScroll = () => setAtTop(window.scrollY < 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // 모바일 드로어 열릴 때 스크롤 락 + 첫 포커스 + 닫힐 때 트리거로 포커스 복귀
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    firstLinkRef.current?.focus();
    return () => {
      document.body.style.overflow = prev;
      btnRef.current?.focus();
    };
  }, [open]);

  // ESC / 바깥 클릭으로 드로어 닫기
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onClickOutside = (e: MouseEvent) => {
      if (!drawerRef.current) return;
      const target = e.target as Node;
      if (
        !drawerRef.current.contains(target) &&
        btnRef.current &&
        !btnRef.current.contains(target)
      ) {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("mousedown", onClickOutside);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mousedown", onClickOutside);
    };
  }, [open]);

  // 데스크톱 프로필 메뉴: ESC / 바깥 클릭 닫기
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    const onClickOutside = (e: MouseEvent) => {
      const t = e.target as Node;
      if (
        menuRef.current &&
        !menuRef.current.contains(t) &&
        menuBtnRef.current &&
        !menuBtnRef.current.contains(t)
      ) {
        setMenuOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("mousedown", onClickOutside);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mousedown", onClickOutside);
    };
  }, [menuOpen]);

  // 드로어 내부 링크 클릭 시 닫기
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const closeOnClick = <E extends HTMLElement>(_e: React.MouseEvent<E>) =>
    setOpen(false);

  return (
    <header
      role="banner"
      className={`w-full sticky top-0 z-40 border-b border-white/10 bg-base/70 backdrop-blur transition-[box-shadow] duration-200 ${
        atTop ? "" : "shadow-[0_8px_24px_rgba(0,0,0,.25)]"
      }`}
    >
      <div className="container-proton py-3 flex items-center gap-3">
        {/* Logo */}
        <a
          href="/"
          className="flex items-center gap-2 focus-ring"
          aria-label={t("nav.home", { defaultValue: "Home" })}
        >
          <div
            className="w-7 h-7 rounded-lg bg-gradient-to-br from-accent to-violet"
            aria-hidden
          />
          <span className="font-semibold tracking-wide">Proton</span>
        </a>

        {/* Desktop nav */}
        <nav
          aria-label={t("nav.primary", { defaultValue: "Primary" })}
          className="hidden md:block ml-6"
        >
          <ul className="flex items-center gap-6 text-sm text-white/90">
            <li>
              <a className="nav-underline hover:text-white focus-ring" href="#design">
                {t("nav.design", { defaultValue: "Design" })}
              </a>
            </li>
            <li>
              <a className="nav-underline hover:text-white focus-ring" href="#products">
                {t("nav.products", { defaultValue: "Products" })}
              </a>
            </li>
            <li>
              <a className="nav-underline hover:text-white focus-ring" href="#pricing">
                {t("nav.pricing", { defaultValue: "Pricing" })}
              </a>
            </li>
            <li>
              <a className="nav-underline hover:text-white focus-ring" href="#business">
                {t("nav.business", { defaultValue: "Business" })}
              </a>
            </li>
            <li>
              <a className="nav-underline hover:text-white focus-ring" href="#education">
                {t("nav.education", { defaultValue: "Education" })}
              </a>
            </li>
            <li>
              <a className="nav-underline hover:text-white focus-ring" href="#help">
                {t("nav.help", { defaultValue: "Help" })}
              </a>
            </li>
          </ul>
        </nav>

        <div className="flex-1" />

        {/* Desktop controls */}
        <div className="hidden md:flex items-center gap-3">
          <LocaleSwitcher variant="plain" />

          {!me ? (
            <>
              <button
                className="btn btn-ghost focus-ring text-sm"
                onClick={() => openLogin()}
              >
                {t("nav.login", { defaultValue: "Log in" })}
              </button>
              <button
                className="btn btn-primary focus-ring text-sm"
                onClick={closeOnClick}
              >
                {t("nav.signup", { defaultValue: "Sign up" })}
              </button>
            </>
          ) : (
            <div className="relative">
              <button
                ref={menuBtnRef}
                className="focus-ring glass rounded-full px-2 py-1.5 flex items-center gap-2"
                onClick={() => setMenuOpen((v) => !v)}
                aria-haspopup="menu"
                aria-expanded={menuOpen}
              >
                {me.picture ? (
                  <img
                    src={me.picture}
                    alt={me.name || me.email || "profile"}
                    className="w-7 h-7 rounded-full object-cover"
                  />
                ) : (
                  <div
                    className="w-7 h-7 rounded-full grid place-items-center text-xs font-semibold"
                    style={{
                      backgroundImage:
                        "linear-gradient(135deg, var(--accent), var(--violet))",
                      color: "#0B0F14",
                    }}
                    aria-hidden
                  >
                    {initials(me.name, me.email)}
                  </div>
                )}
                <span className="text-sm">{me.name || me.email}</span>
                <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden>
                  <path
                    fill="currentColor"
                    d="M7 10l5 5 5-5z"
                  />
                </svg>
              </button>

              {/* dropdown */}
              <div
                ref={menuRef}
                className={`dropdown-menu mt-2 right-0 ${menuOpen ? "open" : ""}`}
                role="menu"
              >
                <div className="menu-item is-active" role="menuitem" tabIndex={0}>
                  {me.email}
                </div>
                <div className="menu-sep" />
                <a className="menu-item" role="menuitem" href="#account">
                  {t("nav.account", { defaultValue: "My account" })}
                </a>
                <button
                  className="menu-item"
                  role="menuitem"
                  onClick={async () => {
                    setMenuOpen(false);
                    await logout();
                  }}
                >
                  {t("nav.logout", { defaultValue: "Log out" })}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Mobile: 메뉴 버튼 */}
        <button
          ref={btnRef}
          className="md:hidden inline-flex items-center gap-2 btn btn-ghost focus-ring text-sm"
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={t("nav.menu", { defaultValue: "Menu" })}
          onClick={() => setOpen((v) => !v)}
          data-ripple
        >
          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
            <path fill="currentColor" d="M3 6h18v2H3zm0 5h18v2H3zm0 5h18v2H3z" />
          </svg>
          {t("nav.menu", { defaultValue: "Menu" })}
        </button>
      </div>

      {/* Mobile drawer */}
      <div
        id="mobile-menu"
        ref={drawerRef}
        className={`md:hidden origin-top border-t border-white/10 bg-base/95 backdrop-blur-sm transition-[opacity,transform] duration-200 ${
          open ? "opacity-100 translate-y-0" : "pointer-events-none opacity-0 -translate-y-2"
        }`}
        aria-hidden={!open}
      >
        <div className="container-proton py-3 flex flex-col gap-2">
          {/* 로그인 사용자 헤더 */}
          {me ? (
            <div className="flex items-center gap-3 py-2">
              {me.picture ? (
                <img
                  src={me.picture}
                  alt={me.name || me.email || "profile"}
                  className="w-9 h-9 rounded-full object-cover"
                />
              ) : (
                <div
                  className="w-9 h-9 rounded-full grid place-items-center text-sm font-semibold"
                  style={{
                    backgroundImage:
                      "linear-gradient(135deg, var(--accent), var(--violet))",
                    color: "#0B0F14",
                  }}
                  aria-hidden
                >
                  {initials(me.name, me.email)}
                </div>
              )}
              <div className="text-sm">
                <div className="font-semibold">{me.name || t("nav.account", { defaultValue: "My account" })}</div>
                <div className="text-white/70">{me.email}</div>
              </div>
            </div>
          ) : null}

          <a
            ref={firstLinkRef}
            className="focus-ring py-2"
            href="#design"
            onClick={closeOnClick}
          >
            {t("nav.design", { defaultValue: "Design" })}
          </a>
          <a className="focus-ring py-2" href="#products" onClick={closeOnClick}>
            {t("nav.products", { defaultValue: "Products" })}
          </a>
          <a className="focus-ring py-2" href="#pricing" onClick={closeOnClick}>
            {t("nav.pricing", { defaultValue: "Pricing" })}
          </a>
          <a className="focus-ring py-2" href="#business" onClick={closeOnClick}>
            {t("nav.business", { defaultValue: "Business" })}
          </a>
          <a className="focus-ring py-2" href="#education" onClick={closeOnClick}>
            {t("nav.education", { defaultValue: "Education" })}
          </a>
          <a className="focus-ring py-2" href="#help" onClick={closeOnClick}>
            {t("nav.help", { defaultValue: "Help" })}
          </a>

          {/* 하단 액션 + 언어 */}
          <div className="flex items-center gap-2 pt-3">
            <LocaleSwitcher variant="plain" />

            {!me ? (
              <>
                <button
                  className="btn btn-ghost focus-ring text-sm"
                  onClick={(e) => {
                    closeOnClick(e);
                    openLogin();
                  }}
                >
                  {t("nav.login", { defaultValue: "Log in" })}
                </button>
                <button
                  className="btn btn-primary focus-ring text-sm"
                  onClick={closeOnClick}
                >
                  {t("nav.signup", { defaultValue: "Sign up" })}
                </button>
              </>
            ) : (
              <button
                className="btn btn-primary focus-ring text-sm"
                onClick={async (e) => {
                  closeOnClick(e);
                  await logout();
                }}
              >
                {t("nav.logout", { defaultValue: "Log out" })}
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
