/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useCallback } from "react";

type AuthUIContextValue = {
    loginOpen: boolean;
    openLogin: () => void;
    closeLogin: () => void;
};

const AuthUIContext = createContext<AuthUIContextValue | null>(null);

export function AuthUIProvider({ children }: { children: React.ReactNode }) {
    const [loginOpen, setLoginOpen] = useState(false);

    const openLogin = useCallback(() => setLoginOpen(true), []);
    const closeLogin = useCallback(() => setLoginOpen(false), []);

    return (
        <AuthUIContext.Provider value={{ loginOpen, openLogin, closeLogin }}>
            {children}
        </AuthUIContext.Provider>
    );
}

export function useAuthUI() {
    const ctx = useContext(AuthUIContext);
    if (!ctx) throw new Error("useAuthUI must be used within <AuthUIProvider>");
    return ctx;
}
