import React, { useEffect, useMemo, useRef, useState } from "react";

type NavItem = { key: string; label: string; href: string; icon?: React.ReactNode };

const Icon = {
    board: (cls = "w-6 h-6") => (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
            <rect x="3" y="4" width="18" height="4" rx="1" />
            <rect x="3" y="10" width="8" height="10" rx="1" />
            <rect x="13" y="10" width="8" height="10" rx="1" />
        </svg>
    ),
    project: (cls = "w-6 h-6") => (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
            <path d="M4 7h16M4 12h10M4 17h6" />
        </svg>
    ),
    library: (cls = "w-6 h-6") => (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
            <path d="M4 19V5a2 2 0 0 1 2-2h2v18H6a2 2 0 0 1-2-2Z" />
            <path d="M10 21V3h2a2 2 0 0 1 2 2v16h-4Z" />
            <path d="M18 21V7h2" />
        </svg>
    ),
    team: (cls = "w-6 h-6") => (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
            <circle cx="8" cy="8" r="3" />
            <circle cx="16" cy="8" r="3" />
            <path d="M3 21v-2a5 5 0 0 1 5-5h0" />
            <path d="M13 21v-2a5 5 0 0 1 5-5h0" />
        </svg>
    ),
    bell: (cls = "w-6 h-6") => (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
            <path d="M6 8a6 6 0 1 1 12 0c0 7 3 7 3 9H3c0-2 3-2 3-9" />
            <path d="M10 21h4" />
        </svg>
    ),
    user: (cls = "w-6 h-6") => (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
            <circle cx="12" cy="7" r="4" />
            <path d="M5.5 21a8.5 8.5 0 0 1 13 0" />
        </svg>
    ),
    atom: (cls = "w-5 h-5") => (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="#0B0F14" strokeWidth="1.8">
            <circle cx="12" cy="12" r="2.2" />
            <path d="M4 12c0-4.418 3.582-8 8-8m8 8c0 4.418-3.582 8-8 8M6 18c3-3 9-3 12 0M6 6c3 3 9 3 12 0" />
        </svg>
    ),
};

function useClickAway<T extends HTMLElement>(open: boolean, onClose: () => void) {
    const ref = useRef<T | null>(null);
    useEffect(() => {
        if (!open) return;
        const onDoc = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) onClose();
        };
        const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
        document.addEventListener("mousedown", onDoc);
        document.addEventListener("keydown", onKey);
        return () => {
            document.removeEventListener("mousedown", onDoc);
            document.removeEventListener("keydown", onKey);
        };
    }, [open, onClose]);
    return ref;
}

export function TopBar({ activeKey }: { activeKey?: string }) {
    const tabs = useMemo<NavItem[]>(() => [
        { key: "board", label: "메인보드", href: "/board", icon: Icon.board() },
        { key: "project", label: "프로젝트", href: "/projects", icon: Icon.project() },
        { key: "library", label: "리소스", href: "/resources", icon: Icon.library() },
        { key: "team", label: "같이하기", href: "/team", icon: Icon.team() },
    ], []);

    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useClickAway<HTMLDivElement>(menuOpen, () => setMenuOpen(false));

    const leftPair = tabs.slice(0, 2);
    const rightPair = tabs.slice(2, 4);

    return (
        <div className="topbar-proton">
            <div
                className="topbar-inner"
                style={{
                    display: "grid",
                    gridTemplateColumns: "1fr auto 1fr",
                    alignItems: "center",
                    padding: "0 1rem",
                    gap: 0,
                }}
            >
                {/* 좌측 로고 */}
                <div style={{ display: "flex", alignItems: "center", justifySelf: "start" }}>
                    <a href="/" className="nav-item logo-only" aria-label="홈">
                        <span className="icon">{Icon.atom()}</span>
                    </a>
                </div>

                {/* 중앙 Proton 허브 */}
                <div
                    style={{
                        display: "grid",
                        gridAutoFlow: "column",
                        alignItems: "center",
                        justifySelf: "center",
                        gap: 24,
                    }}
                >
                    <nav style={{ display: "flex", gap: 18 }}>
                        {leftPair.map(t => (
                            <a
                                key={t.key}
                                href={t.href}
                                className={`nav-item nav-underline ${activeKey === t.key ? "is-active" : ""}`}
                            >
                                {t.icon}
                                <span className="txt">{t.label}</span>
                            </a>
                        ))}
                    </nav>

                    <a href="/" className="brand-badge focus-ring">
                        {Icon.atom("w-4 h-4")}
                        <span>Proton</span>
                    </a>

                    <nav style={{ display: "flex", gap: 18 }}>
                        {rightPair.map(t => (
                            <a
                                key={t.key}
                                href={t.href}
                                className={`nav-item nav-underline ${activeKey === t.key ? "is-active" : ""}`}
                            >
                                {t.icon}
                                <span className="txt">{t.label}</span>
                            </a>
                        ))}
                    </nav>
                </div>

                {/* 우측: 알림 + 프로필 */}
                <div style={{ display: "flex", alignItems: "center", justifySelf: "end", gap: 16 }}>
                    <a href="/alerts" className="nav-item" title="알림">
                        {Icon.bell()}
                    </a>

                    <div className={`dropdown ${menuOpen ? "open" : ""}`} ref={menuRef} style={{ position: "relative" }}>
                        <button
                            className="profile-btn focus-ring dropdown-toggle"
                            aria-haspopup="menu"
                            aria-expanded={menuOpen}
                            onClick={() => setMenuOpen(v => !v)}
                        >
                            <img alt="" src="/avatar.svg" className="avatar" />
                            <span className="name txt">프로필</span>
                            <span className="chev" aria-hidden>▾</span>
                        </button>

                        {/* ✅ 드롭다운 개선 버전 */}
                        <div
                            className="dropdown-menu profile-panel"
                            role="menu"
                            style={{
                                position: "absolute",
                                right: 0,
                                top: "calc(100% + 10px)",
                                minWidth: 180,
                                borderRadius: 14,
                                padding: "8px 6px",
                                background: "color-mix(in oklab, white 8%, transparent)",
                                border: "1px solid color-mix(in oklab, white 14%, transparent)",
                                boxShadow:
                                    "0 18px 40px color-mix(in oklab, black 65%, transparent), 0 0 0 1px color-mix(in oklab, white 10%, transparent) inset",
                                backdropFilter: "blur(14px)",
                                transformOrigin: "top right",
                                transform: menuOpen ? "scale(1)" : "scale(0.96)",
                                opacity: menuOpen ? 1 : 0,
                                pointerEvents: menuOpen ? "auto" : "none",
                                transition: "transform .16s ease, opacity .16s ease",
                            }}
                        >
                            <div
                                className="profile-head"
                                style={{
                                    display: "grid",
                                    gridTemplateColumns: "40px 1fr",
                                    gap: ".7rem",
                                    alignItems: "center",
                                    padding: "6px 8px 10px",
                                    borderBottom: "1px solid color-mix(in oklab, white 10%, transparent)",
                                    marginBottom: 4,
                                }}
                            >
                                <div
                                    className="avatar-lg"
                                    style={{
                                        width: 40,
                                        height: 40,
                                        borderRadius: "999px",
                                        overflow: "hidden",
                                        background: "color-mix(in oklab, white 10%, transparent)",
                                    }}
                                >
                                    <img src="/avatar.svg" alt="" width={40} height={40} />
                                </div>
                                <div>
                                    <div className="who" style={{ fontWeight: 600 }}>MintSoda</div>
                                    <div className="mail" style={{ fontSize: ".82rem", opacity: 0.8 }}>mint@proton.dev</div>
                                </div>
                            </div>

                            {[
                                ["계정 전환", "/switch-account"],
                                ["내 프로필", "/me"],
                                ["구독제", "/subscribe"],
                                ["설정", "/settings"],
                                ["테마 변경", "/theme"],
                            ].map(([label, href]) => (
                                <div
                                    key={label}
                                    className="menu-item"
                                    role="menuitem"
                                    onClick={() => (window.location.href = href)}
                                    style={{
                                        padding: "8px 10px",
                                        borderRadius: 10,
                                        fontSize: ".88rem",
                                        cursor: "pointer",
                                        transition: "background .15s ease, color .15s ease",
                                    }}
                                    onMouseEnter={e => (e.currentTarget.style.background = "color-mix(in oklab, var(--accent) 16%, transparent)")}
                                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                                >
                                    {label}
                                </div>
                            ))}

                            <div style={{ height: 1, margin: "4px 6px", background: "color-mix(in oklab, white 14%, transparent)", opacity: 0.4 }} />

                            <div
                                className="menu-item"
                                style={{
                                    padding: "8px 10px",
                                    borderRadius: 10,
                                    fontWeight: 600,
                                    color: "var(--accent)",
                                    textAlign: "center",
                                    cursor: "pointer",
                                }}
                                onClick={() => (window.location.href = "/logout")}
                            >
                                로그아웃
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
