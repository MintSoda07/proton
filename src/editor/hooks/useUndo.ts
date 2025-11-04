// src/editor/hooks/useUndo.ts
import { useRef } from "react";


export function useUndo<T>(serialize: () => T, restore: (data: T) => void, max = 100) {
    const undoStack = useRef<T[]>([]);
    const redoStack = useRef<T[]>([]);


    const snapshot = () => {
        undoStack.current.push(serialize());
        if (undoStack.current.length > max) undoStack.current.shift();
        redoStack.current = [];
    };
    const undo = () => {
        if (!undoStack.current.length) return false;
        const cur = serialize();
        const prev = undoStack.current.pop()!;
        redoStack.current.push(cur);
        restore(prev);
        return true;
    };
    const redo = () => {
        if (!redoStack.current.length) return false;
        const cur = serialize();
        const next = redoStack.current.pop()!;
        undoStack.current.push(cur);
        restore(next);
        return true;
    };


    return { snapshot, undo, redo };
}