// src/components/Header.tsx
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import LocaleSwitcher from "./LocaleSwitcher";
import { useAuthUI } from "../state/auth-ui.tsx";

export default function Header() {
    const { t } = useTranslation();
    const { openLogin } = useAuthUI();

    const [atTop, setAtTop] = useState(true);
    const [open, setOpen] = useState(false);

    const btnRef = useRef<HTMLButtonElement | null>(null);
    const drawerRef = useRef<HTMLDivElement | null>(null);
    const firstLinkRef = useRef<HTMLAnchorElement | null>(null);

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
            if (!drawerRef.current.contains(target) && btnRef.current && !btnRef.current.contains(target)) {
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

    // 드로어 내부 링크 클릭 시 닫기
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const closeOnClick = <E extends HTMLElement>(_e: React.MouseEvent<E>) => setOpen(false);

    return (
        <header
            role="banner"
            className={`w-full sticky top-0 z-40 border-b border-white/10 bg-base/70 backdrop-blur transition-[box-shadow] duration-200 ${atTop ? "" : "shadow-[0_8px_24px_rgba(0,0,0,.25)]"
                }`}
        >
            <div className="container-proton py-3 flex items-center gap-3">
                {/* Logo */}
                <a
                    href="/"
                    className="flex items-center gap-2 focus-ring"
                    aria-label={t("nav.home", { defaultValue: "Home" })}
                >
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-accent to-violet" aria-hidden />
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
                className={`md:hidden origin-top border-t border-white/10 bg-base/95 backdrop-blur-sm transition-[opacity,transform] duration-200 ${open ? "opacity-100 translate-y-0" : "pointer-events-none opacity-0 -translate-y-2"
                    }`}
                aria-hidden={!open}
            >
                <div className="container-proton py-3 flex flex-col gap-2">
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
                    </div>
                </div>
            </div>
        </header>
    );
}
