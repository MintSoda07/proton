// src/editor/hooks/useKeyboardShortcuts.ts
import { useEffect } from "react";


export function useKeyboardShortcuts(bind: (e: KeyboardEvent) => void) {
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => bind(e);
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [bind]);
}