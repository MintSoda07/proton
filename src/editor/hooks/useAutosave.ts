// src/editor/hooks/useAutosave.ts
import { useEffect, useRef } from "react";


export function useAutosave<T>(key: string, getter: () => T, setter: (data: T) => void, intervalMs = 3000) {
    const timer = useRef<number>(0);


    // load once
    useEffect(() => {
        const raw = localStorage.getItem(key);
        if (raw) {
            try { setter(JSON.parse(raw)); } catch { /* ignore */ }
        }
    }, [key, setter]);


    // tick-based save (requestAnimationFrame 프레임에서 호출)
    const tick = (t: number) => {
        if (t - timer.current > intervalMs) {
            localStorage.setItem(key, JSON.stringify(getter()));
            timer.current = t;
        }
    };


    return { tick };
}