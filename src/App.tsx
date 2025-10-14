// src/App.tsx
import Header from "./components/Header";
import Hero from "./components/Hero";
import Features from "./components/Features";
import LoginDialog from "./components/LoginDialog";
import { AuthUIProvider } from "./state/auth-ui";

export default function App() {
  return (
    <AuthUIProvider>
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

        {/* 로그인 모달은 전역 위치에 */}
        <LoginDialog />
      </div>
    </AuthUIProvider>
  );
}
