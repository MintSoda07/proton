import { useEffect, useRef, useState } from "react";
import { useAuthUI } from "../state/auth-ui";
import { useTranslation } from "react-i18next";

const DEMO_EMAIL = "admin@test.com";
const DEMO_PW = "Abcd1234@";
const DEFAULT_REDIRECT = "/proton";

function pickRedirectTarget() {
    const created = sessionStorage.getItem("created_url");
    if (created) return created;

    const sp = new URLSearchParams(window.location.search);
    const next = sp.get("next");
    if (next && /^\/[\w\-./?=&%]*$/.test(next)) return next;

    return DEFAULT_REDIRECT;
}

export default function LoginDialog() {
    const { t } = useTranslation();
    const { loginOpen, closeLogin } = useAuthUI();

    const panelRef = useRef<HTMLDivElement | null>(null);
    const firstFieldRef = useRef<HTMLInputElement | null>(null);

    const [email, setEmail] = useState("");
    const [pw, setPw] = useState("");
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [emailErr, setEmailErr] = useState<string | null>(null);
    const [pwErr, setPwErr] = useState<string | null>(null);

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

    useEffect(() => {
        if (!loginOpen) return;
        const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") closeLogin(); };
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

    const validateEmail = (v: string) => {
        if (!v) return t("auth.email.required", { defaultValue: "이메일을 입력해 주세요." });
        if (!v.includes("@")) return t("auth.email.atRequired", { defaultValue: "이메일 주소에 '@'를 포함해 주세요." });
        return null;
    };
    const validatePw = (v: string) => {
        if (!v) return t("auth.password.required", { defaultValue: "비밀번호를 입력해 주세요." });
        if (v.length < 6) return t("auth.password.tooShort", { defaultValue: "비밀번호는 6자 이상이어야 합니다." });
        return null;
    };

    if (!loginOpen) return null;

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const eErr = validateEmail(email);
        const pErr = validatePw(pw);
        setEmailErr(eErr);
        setPwErr(pErr);
        if (eErr || pErr) return;

        setBusy(true);
        setError(null);
        try {
            await new Promise((r) => setTimeout(r, 300));
            if (email === DEMO_EMAIL && pw === DEMO_PW) {
                sessionStorage.setItem("proton_authed", "1");
                closeLogin();
                const target = pickRedirectTarget();
                window.location.replace(target);
                return;
            }
            throw new Error("invalid");
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
                    <button className="btn btn-ghost focus-ring" aria-label={t("common.close", { defaultValue: "Close" })} onClick={closeLogin}>
                        ✕
                    </button>
                </div>

                <form className="mt-4 grid gap-3" noValidate onSubmit={onSubmit}>
                    <div className="relative">
                        <label className="grid gap-1">
                            <span className="text-sm text-white/80">{t("auth.email", { defaultValue: "Email" })}</span>
                            <input
                                ref={firstFieldRef}
                                type="email"
                                inputMode="email"
                                autoComplete="username"
                                className={`input-proton ${emailErr ? "is-error" : ""}`}
                                placeholder="you@example.com"
                                value={email}
                                onChange={(e) => {
                                    const v = e.currentTarget.value;
                                    setEmail(v);
                                    if (emailErr) setEmailErr(validateEmail(v));
                                }}
                                onBlur={() => setEmailErr(validateEmail(email))}
                                aria-invalid={!!emailErr}
                                aria-describedby={emailErr ? "email-error" : undefined}
                            />
                        </label>
                        {emailErr && (
                            <div id="email-error" role="alert" className="error-bubble">
                                <div className="row">
                                    <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                                        <line x1="12" y1="9" x2="12" y2="13" />
                                        <line x1="12" y1="17" x2="12.01" y2="17" />
                                    </svg>
                                    <span>{emailErr}</span>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="relative">
                        <label className="grid gap-1">
                            <span className="text-sm text-white/80">{t("auth.password", { defaultValue: "Password" })}</span>
                            <input
                                type="password"
                                autoComplete="current-password"
                                className={`input-proton ${pwErr ? "is-error" : ""}`}
                                placeholder={t("auth.password.placeholder", { defaultValue: "••••••••" })}
                                value={pw}
                                onChange={(e) => {
                                    const v = e.currentTarget.value;
                                    setPw(v);
                                    if (pwErr) setPwErr(validatePw(v));
                                }}
                                onBlur={() => setPwErr(validatePw(pw))}
                                aria-invalid={!!pwErr}
                                aria-describedby={pwErr ? "pw-error" : undefined}
                            />
                        </label>
                        {pwErr && (
                            <div id="pw-error" role="alert" className="error-bubble">
                                <div className="row">
                                    <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                                        <line x1="12" y1="9" x2="12" y2="13" />
                                        <line x1="12" y1="17" x2="12.01" y2="17" />
                                    </svg>
                                    <span>{pwErr}</span>
                                </div>
                            </div>
                        )}
                    </div>

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

                    <div className="mt-2 grid gap-2">
                    <button
    type="button"
    className="btn focus-ring hover-glow"
    disabled={busy}
    onClick={() => {
      // 서버가 세션 쿠키를 설정하므로 전체 리다이렉트로 가는 게 가장 확실
      const redirect = window.location.origin; // 로그인 후 돌아올 주소 (지금 메인)
      window.location.href = `http://localhost:4000/api/auth/google/start?redirect=${encodeURIComponent(redirect)}`;
    }}
  >
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
