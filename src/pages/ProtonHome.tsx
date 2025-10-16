/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useMemo, useRef, useState, useEffect } from "react";
import { TopBar } from "../components/TopbarProton";

/* =========================
   Types & Icons
   ========================= */
type QuickItem = {
    key: string;
    label: string;
    href: string;
    tip?: string;
    icon?: React.ReactNode;
    kbd?: string; // 단축키 안내 (표시용)
};

const GearIcon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" width={24} height={24}
        fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" />
        <path d="M19.4 15a1 1 0 0 0 .2-1.1l-.6-1.2a7.8 7.8 0 0 0 0-1.4l.6-1.2a1 1 0 0 0-.2-1.1l-1.1-1.1a1 1 0 0 0-1.1-.2l-1.2.6c-.46-.1-.94-.16-1.42-.16l-1-.8a1 1 0 0 0-1.2 0l-1 .8c-.48 0-.96.06-1.42.16l-1.2-.6a1 1 0 0 0-1.1.2L4.6 8a1 1 0 0 0-.2 1.1l.6 1.2c-.06.46-.06.94 0 1.4l-.6 1.2a1 1 0 0 0 .2 1.1L5.7 16a1 1 0 0 0 1.1.2l1.2-.6c.46.1.94.16 1.42.16l1 .8a1 1 0 0 0 1.2 0l1-.8c.48 0 .96-.06 1.42-.16l1.2.6a1 1 0 0 0 1.1-.2l1.1-1.1Z" />
    </svg>
);

const CubeIcon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" width={24} height={24}
        fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M21 8l-9-5-9 5 9 5 9-5Z" />
        <path d="M3 8v8l9 5 9-5V8" />
    </svg>
);

const BrushIcon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" width={24} height={24}
        fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M11 19a4 4 0 0 1-7 0c0-1.5 1-2 2.5-2H11Z" />
        <path d="M20.7 7.3 13 15h-4l7.7-7.7a2.1 2.1 0 0 1 3 0v0a2.1 2.1 0 0 1 0 3Z" />
    </svg>
);

const GridUVIcon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" width={24} height={24}
        fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path d="M3 9h18M3 15h18M9 3v18M15 3v18" />
    </svg>
);

const BoneIcon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" width={24} height={24}
        fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M7 7c0-1.7-1.3-3-3-3S1 5.3 1 7s1.3 3 3 3c.2 0 .4 0 .6-.1l6.5 6.5c0 .2-.1.4-.1.6 0 1.7 1.3 3 3 3s3-1.3 3-3c0-1.6-1.3-3-3-3-.2 0-.4 0-.6.1L7.1 7.6C7 7.4 7 7.2 7 7Z" />
    </svg>
);

const SparkIcon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" width={24} height={24}
        fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 2v6M12 16v6M2 12h6M16 12h6" />
        <path d="M5 5l4 4M15 15l4 4M19 5l-4 4M9 15l-4 4" />
    </svg>
);

/* =========================
   Quick Button
   ========================= */
function QuickButton(
    { item, idx, focusRef, onKeyGrid }:
        { item: QuickItem; idx: number; focusRef: (el: HTMLAnchorElement | null, i: number) => void; onKeyGrid: (e: React.KeyboardEvent<HTMLAnchorElement>, i: number) => void }
) {
    return (
        <a
            ref={(el) => focusRef(el, idx)}
            href={item.href}
            className="quick-tile tooltip-proton focus-ring"
            data-tip={item.tip ?? item.label}
            aria-label={item.label}
            onKeyDown={(e) => onKeyGrid(e, idx)}
        >
            <div className="quick-ic">{item.icon ?? <GearIcon className="w-6 h-6" />}</div>
            <div className="quick-txt">
                <span className="label">{item.label}</span>
                {item.kbd && <kbd className="kbd">{item.kbd}</kbd>}
            </div>
        </a>
    );
}

/* =========================
   Page
   ========================= */
export default function ProtonHome() {
    const [q, setQ] = useState("");
    const gridRefs = useRef<(HTMLAnchorElement | null)[]>([]);
    const cols = 5; // 키보드 화살표 네비게이션 계산용

    const quickItems = useMemo<QuickItem[]>(
        () => [
            { key: "sketch", label: "스케치", href: "/new?type=sketch", tip: "새 스케치 캔버스", icon: <BrushIcon className="w-6 h-6" />, kbd: "S" },
            { key: "drawing", label: "드로잉", href: "/new?type=drawing", tip: "레이어 기반 드로잉", icon: <BrushIcon className="w-6 h-6" />, kbd: "D" },
            { key: "sculpt", label: "스컬핑", href: "/new?type=sculpt", tip: "하이폴 스컬핑", icon: <GearIcon className="w-6 h-6" />, kbd: "C" },
            { key: "modeling", label: "모델링", href: "/new?type=modeling", tip: "신규 3D 모델", icon: <CubeIcon className="w-6 h-6" />, kbd: "M" },
            { key: "texture", label: "텍스처", href: "/new?type=texture", tip: "PBR 텍스처 작업", icon: <GridUVIcon className="w-6 h-6" />, kbd: "T" },
            { key: "material", label: "머터리얼", href: "/new?type=material", tip: "머터리얼 그래프", icon: <SparkIcon className="w-6 h-6" />, kbd: "A" },
            { key: "uv", label: "UV", href: "/new?type=uv", tip: "UV 펼치기/패킹", icon: <GridUVIcon className="w-6 h-6" />, kbd: "U" },
            { key: "retopo", label: "리토폴로지", href: "/new?type=retopo", tip: "로우폴 재구성", icon: <CubeIcon className="w-6 h-6" />, kbd: "R" },
            { key: "rig", label: "리깅", href: "/new?type=rig", tip: "본/스킨/웨이트", icon: <BoneIcon className="w-6 h-6" />, kbd: "G" },
            { key: "ai", label: "AI 랩", href: "/lab/ai", tip: "업스케일/리페인트/프롬프트", icon: <SparkIcon className="w-6 h-6" />, kbd: "I" },
        ],
        []
    );

    // 키보드 네비: 화살표로 타일 이동
    const onKeyGrid = (e: React.KeyboardEvent<HTMLAnchorElement>, i: number) => {
        const total = quickItems.length;
        const row = Math.floor(i / cols);
        const col = i % cols;

        let next = i;
        switch (e.key) {
            case "ArrowRight": next = (col === cols - 1 || i + 1 >= total) ? i : i + 1; break;
            case "ArrowLeft": next = (col === 0) ? i : i - 1; break;
            case "ArrowDown": next = Math.min(i + cols, total - 1); break;
            case "ArrowUp": next = Math.max(i - cols, 0); break;
            default: return;
        }
        if (next !== i) {
            e.preventDefault();
            gridRefs.current[next]?.focus();
        }
    };

    // 단축키(포커스 된 상태가 아니어도)
    useEffect(() => {
        const onKey = (ev: KeyboardEvent) => {
            if (ev.target && (ev.target as HTMLElement).tagName === "INPUT") return;
            const key = ev.key.toLowerCase();
            const hit = quickItems.find(it => (it.kbd ?? "").toLowerCase() === key);
            if (hit) {
                window.location.href = hit.href;
            }
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [quickItems]);

    const onSearch = (e: React.FormEvent) => {
        e.preventDefault();
        const t = q.trim();
        if (!t) return;
        window.location.href = `/search?q=${encodeURIComponent(t)}`;
    };

    const setRefAt = (el: HTMLAnchorElement | null, i: number) => {
        gridRefs.current[i] = el;
    };

    return (
        <div className="w-full max-w-full overflow-x-hidden">
            {/* TopBar: 엣지-투-엣지 */}
            <TopBar activeKey="board" />

            {/* Hero */}
            <section className="hero-wrap">
                <div className="hero-gradient" aria-hidden="true" />
                <div className="hero-inner container-proton">
                    <div className="hero-copy">
                        <span className="overline">PROTON • CREATIVE HUB</span>
                        <h1 className="hero-title">
                            한 곳에서 <span className="gradtxt">만들고</span>, <span className="gradtxt">이어가고</span>, <span className="gradtxt">출시</span>까지.
                        </h1>
                        <p className="hero-sub">스케치부터 3D·머터리얼·UV·AI까지 — 워크플로우가 끊기지 않게 설계되었습니다.</p>

                        <form onSubmit={onSearch} role="search" aria-label="Proton 검색" className="hero-search">
                            <input
                                className="input-proton flex-1 min-w-0"
                                placeholder="프로젝트, 템플릿, 도구 검색…"
                                value={q}
                                onChange={(e) => setQ(e.target.value)}
                                aria-label="검색어 입력"
                            />
                            <button className="btn btn-primary pressable" type="submit">검색</button>
                        </form>

                        <div className="hero-chips" aria-label="바로가기 카테고리">
                            <a className="chip" href="/category/2d">2D</a>
                            <a className="chip" href="/category/3d">3D</a>
                            <a className="chip" href="/category/material">머터리얼</a>
                            <a className="chip" href="/lab/ai">AI</a>
                            <a className="chip" href="/category/template">템플릿</a>
                        </div>
                    </div>
                </div>
            </section>

            {/* 본문 */}
            <main className="container-proton py-10 w-full max-w-full">
                {/* 만들기 레일 */}
                <section aria-labelledby="make-title" className="mb-12 w-full max-w-full">
                    <div className="sec-head">
                        <h2 id="make-title" className="sec-title">만들기</h2>
                        <a href="/templates" className="sec-link nav-underline">템플릿 모두 보기</a>
                    </div>

                    <div className="quick-rail card hoverable p-4 w-full">
                        {quickItems.map((it, i) => (
                            <QuickButton key={it.key} item={it} idx={i} focusRef={setRefAt} onKeyGrid={onKeyGrid} />
                        ))}
                    </div>
                </section>

                {/* 계속하던 작업 */}
                <section aria-labelledby="continue-title" className="mb-12 w-full max-w-full">
                    <div className="sec-head">
                        <h2 id="continue-title" className="sec-title">이어하기</h2>
                        <a href="/projects" className="sec-link nav-underline">모든 프로젝트</a>
                    </div>

                    {/* 비어있을 때와 채워졌을 때 예시 */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <a
                                key={i}
                                href={`/project/${1000 + i}`}
                                className="proj-card card hoverable hover-glow focus-ring text-white"
                            >
                                <div className="thumb skeleton" />
                                <div className="meta">
                                    <div className="title">샘플 프로젝트 #{i + 1}</div>
                                    <div className="sub">업데이트 • 방금 전</div>
                                </div>
                            </a>
                        ))}
                    </div>
                </section>

                {/* 랩 & 리소스 */}
                <section aria-labelledby="labs-title" className="mb-16 w-full max-w-full">
                    <div className="sec-head">
                        <h2 id="labs-title" className="sec-title">랩 & 리소스</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <a href="/lab/ai" className="info-card card hoverable focus-ring">
                            <div className="info-body">
                                <div className="info-kicker">AI Lab</div>
                                <div className="info-title">업스케일·리페인트·프롬프트</div>
                                <p className="info-sub">반복 작업을 자동화하고 품질을 빠르게 끌어올리세요.</p>
                            </div>
                        </a>
                        <a href="/docs" className="info-card card hoverable focus-ring">
                            <div className="info-body">
                                <div className="info-kicker">Docs</div>
                                <div className="info-title">워크플로우 가이드</div>
                                <p className="info-sub">팀 온보딩과 규칙을 한 번에 정리.</p>
                            </div>
                        </a>
                        <a href="/market" className="info-card card hoverable focus-ring">
                            <div className="info-body">
                                <div className="info-kicker">Market</div>
                                <div className="info-title">프리셋 & 템플릿</div>
                                <p className="info-sub">머터리얼, 라이트셋, HDRI, 노드 그래프 등.</p>
                            </div>
                        </a>
                    </div>
                </section>
            </main>
        </div>
    );
}
