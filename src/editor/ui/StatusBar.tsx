// src/editor/ui/StatusBar.tsx
import React from "react";
import { useEditor } from "../state/EditorContext";


export const StatusBar: React.FC = () => {
    const { status, axis, snapOn, snapStep } = useEditor();
    return (
        <div className="absolute bottom-3 left-3 z-10 bg-black/40 backdrop-blur px-3 py-1 rounded-lg text-xs text-white/80">
            {status || "준비됨"} {axis !== "none" ? `| Axis: ${axis.toUpperCase()}` : ""} {snapOn ? `| Snap ${snapStep}` : ""}
        </div>
    );
};