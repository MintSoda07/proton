import { useEffect, useRef, useState } from "react";
import { useAuthUI } from "../state/auth-ui";
import { useTranslation } from "react-i18next";

export default function LoginDialog() {
    const { t } = useTranslation();
    const { loginOpen, closeLogin } = useAuthUI();

    // 훅은 전부 최상단
    const panelRef = useRef<HTMLDivElement | null>(null);
    const firstFieldRef = useRef<HTMLInputElement | null>(null);

    // 폼 상태 (모달 닫혀 있어도 선언되어야 함)
    const [email, setEmail] = useState("");
    const [pw, setPw] = useState("");
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // 열릴 때 첫 포커스 + 스크롤 락
    useEffect(() => {
        if (!loginOpen) return;
        const tm = setTimeout(() => firstFieldRef.current?.focus(), 0);
        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            clearTimeout(tm);
            document.body.style.overflow = prev;
        };
    }, [loginOpen]);

    // ESC / 바깥 클릭 닫기
    useEffect(() => {
        if (!loginOpen) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") closeLogin();
        };
        const onClickOutside = (e: MouseEvent) => {
            if (!panelRef.current) return;
            const target = e.target as Node;
            if (!panelRef.current.contains(target)) closeLogin();
        };
        window.addEventListener("keydown", onKey);
        window.addEventListener("mousedown", onClickOutside);
        return () => {
            window.removeEventListener("keydown", onKey);
            window.removeEventListener("mousedown", onClickOutside);
        };
    }, [loginOpen, closeLogin]);

    // ✅ 렌더만 조건부
    if (!loginOpen) return null;

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setBusy(true);
        setError(null);
        try {
            // TODO: 실제 auth API 연동
            await new Promise((r) => setTimeout(r, 600));
            closeLogin();
        } catch {
            setError(t("auth.failed", { defaultValue: "Login failed. Try again." }));
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="modal-proton" role="dialog" aria-modal="true" aria-labelledby="login-title">
            <div className="backdrop" />
            <div ref={panelRef} className="panel card ring-accent-20">
                <div className="flex items-center justify-between">
                    <h2 id="login-title" className="text-xl font-semibold">
                        {t("nav.login", { defaultValue: "Log in" })}
                    </h2>
                    <button
                        className="btn btn-ghost focus-ring"
                        aria-label={t("common.close", { defaultValue: "Close" })}
                        onClick={closeLogin}
                    >
                        ✕
                    </button>
                </div>

                <form className="mt-4 grid gap-3" onSubmit={onSubmit}>
                    <label className="grid gap-1">
                        <span className="text-sm text-white/80">{t("auth.email", { defaultValue: "Email" })}</span>
                        <input
                            ref={firstFieldRef}
                            type="email"
                            required
                            className="input-proton"
                            placeholder="you@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.currentTarget.value)}
                        />
                    </label>

                    <label className="grid gap-1">
                        <span className="text-sm text-white/80">{t("auth.password", { defaultValue: "Password" })}</span>
                        <input
                            type="password"
                            required
                            minLength={6}
                            className="input-proton"
                            placeholder={t("auth.password.placeholder", { defaultValue: "••••••••" })}
                            value={pw}
                            onChange={(e) => setPw(e.currentTarget.value)}
                        />
                    </label>

                    <div className="flex items-center justify-between">
                        <label className="checkbox-proton">
                            <input className="control-input" type="checkbox" />
                            <span className="control" />
                            <span className="text-sm">{t("auth.remember", { defaultValue: "Remember me" })}</span>
                        </label>

                        <a href="#forgot" className="nav-underline text-sm focus-ring">
                            {t("auth.forgot", { defaultValue: "Forgot password?" })}
                        </a>
                    </div>

                    {error && <div className="text-sm text-red-400">{error}</div>}

                    <button type="submit" className="btn btn-primary focus-ring pressable" disabled={busy}>
                        {busy ? t("common.loading", { defaultValue: "Loading..." }) : t("nav.login", { defaultValue: "Log in" })}
                    </button>

                    {/* 소셜 버튼 (옵션) */}
                    <div className="mt-2 grid gap-2">
                        <button type="button" className="btn focus-ring hover-glow" disabled={busy}>
                            {t("auth.continueWith", { defaultValue: "Continue with" })} Google
                        </button>
                        <button type="button" className="btn focus-ring hover-glow" disabled={busy}>
                            {t("auth.continueWith", { defaultValue: "Continue with" })} GitHub
                        </button>
                    </div>

                    <p className="mt-2 text-sm text-white/70">
                        {t("auth.noAccount", { defaultValue: "No account?" })}{" "}
                        <a href="#signup" className="nav-underline focus-ring">
                            {t("nav.signup", { defaultValue: "Sign up" })}
                        </a>
                    </p>
                </form>
            </div>
        </div>
    );
}
