/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useCallback, useMemo } from "react";

export type AuthUIContextValue = {
    loginOpen: boolean;
    openLogin: () => void;
    closeLogin: () => void;
};

const AuthUIContext = createContext<AuthUIContextValue | null>(null);
AuthUIContext.displayName = "AuthUIContext";

export function AuthUIProvider({ children }: { children: React.ReactNode }) {
    const [loginOpen, setLoginOpen] = useState(false);
    const openLogin = useCallback(() => setLoginOpen(true), []);
    const closeLogin = useCallback(() => setLoginOpen(false), []);
    const value = useMemo(() => ({ loginOpen, openLogin, closeLogin }), [loginOpen, openLogin, closeLogin]);
    return <AuthUIContext.Provider value={value}>{children}</AuthUIContext.Provider>;
}

export function useAuthUI(): AuthUIContextValue {
    const ctx = useContext(AuthUIContext);
    if (!ctx) throw new Error("useAuthUI must be used within <AuthUIProvider>");
    return ctx;
}
