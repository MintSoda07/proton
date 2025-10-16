import { useEffect } from "react";
import { Routes, Route, useLocation, Navigate } from "react-router-dom";
import Header from "./components/Header";
import Hero from "./components/Hero";
import Features from "./components/Features";
import LoginDialog from "./components/LoginDialog";
import { AuthUIProvider, useAuthUI } from "./state/auth-ui";
import { isAuthed } from "./lib/auth";
import ProtonHome from "./pages/ProtonHome";
import New from "./pages/New";
import Project from "./pages/Project";

// 보호 라우트
function RequireAuth({ children }: { children: React.ReactNode }) {
  const loc = useLocation();
  if (isAuthed()) return <>{children}</>;
  const next = encodeURIComponent(loc.pathname + loc.search);
  return <Navigate to={`/?login=1&next=${next}`} replace />;
}

// 랜딩(초기 화면 유지)
function Landing() {
  return (
    <div className="min-h-screen bg-base text-white">
      <Header />
      <main>
        <Hero />
        <Features />
      </main>
      <footer className="border-t border-white/10">
        <div className="mx-auto max-w-7xl px-4 py-8 text-xs text-white/50">
          © {new Date().getFullYear()} Proton. All rights reserved.
        </div>
      </footer>
    </div>
  );
}

// 쿼리 ?login=1 이면 모달 자동 오픈
function GlobalLoginGate() {
  const { search, pathname } = useLocation();
  const { loginOpen, openLogin } = useAuthUI();
  useEffect(() => {
    const sp = new URLSearchParams(search);
    if ((sp.get("login") === "1" || pathname === "/login") && !loginOpen) openLogin();
  }, [search, pathname, loginOpen, openLogin]);
  return null;
}

export default function App() {
  return (
    <AuthUIProvider>
      <GlobalLoginGate />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/proton" element={<RequireAuth><ProtonHome /></RequireAuth>} />
        <Route path="/new" element={<RequireAuth><New /></RequireAuth>} />
        <Route path="/project/:id" element={<RequireAuth><Project /></RequireAuth>} />
        <Route path="/login" element={<Navigate to="/?login=1" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <LoginDialog />
    </AuthUIProvider>
  );
}
