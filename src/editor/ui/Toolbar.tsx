/* eslint-disable @typescript-eslint/no-unused-vars */
// src/editor/ui/Toolbar.tsx
import React from "react";
import type { Axis, SelMode, Tool } from "../state/types";
import { useEditor } from "../state/EditorContext";


const toolLabels: Record<Tool, string> = {
    select: "Select",
    move: "Move",
    "add-vertex": "Add Vertex",
    "make-triangle": "Make Triangle",
    "extrude-face": "Extrude Face",
    "bevel-inset": "Bevel/Inset",
}; export const Toolbar: React.FC<{
    wireframe: boolean; onToggleWire: () => void;
    onMirror: () => void; onSmooth: () => void;
    onDuplicate: () => void; onDelete: () => void; onFrame: () => void;
}> = ({ wireframe, onToggleWire, onMirror, onSmooth, onDuplicate, onDelete, onFrame }) => {
    const { selMode, setSelMode, tool, setTool, axis, setAxis, snapOn, setSnapOn, snapStep, setSnapStep } = useEditor();


    return (
        <>
            {/* 라인 1 */}
            <div className="absolute top-3 left-3 right-3 z-10 flex flex-wrap items-center gap-2 bg-black/40 backdrop-blur px-3 py-2 rounded-xl text-sm">
                <div className="flex items-center gap-1">
                    <span className="text-xs opacity-70 mr-1">모드</span>
                    {(["vertex", "face"] as SelMode[]).map(m => (
                        <button key={m} onClick={() => setSelMode(m)} className={`px-2 py-1 rounded-lg ${selMode === m ? "bg-white/15" : "hover:bg-white/10"}`}>
                            {m === "vertex" ? "● 정점(1)" : "▱ 면(2)"}
                        </button>
                    ))}
                </div>
                <div className="w-px h-5 bg-white/10 mx-1" />
                <div className="flex flex-wrap gap-1">
                    {(["select", "move", "add-vertex", "make-triangle", "extrude-face", "bevel-inset"] as Tool[]).map(t => (
                        <button key={t} onClick={() => setTool(t)} className={`px-2 py-1 rounded-lg ${tool === t ? "bg-blue-500/30" : "hover:bg-white/10"}`}>{toolLabels[t]}</button>
                    ))}
                </div>
                <div className="w-px h-5 bg-white/10 mx-1" />
                <div className="flex items-center gap-1">
                    <span className="text-xs opacity-70 mr-1">축</span>
                    {(["x", "y", "z"] as Axis[]).map(ax => (
                        <button key={ax} onClick={() => setAxis(axis === ax ? "none" : ax)} className={`px-2 py-1 rounded-lg ${axis === ax ? "bg-white/15" : "hover:bg-white/10"}`}>{ax.toUpperCase()}</button>
                    ))}
                    <button onClick={() => setAxis("none")} className={`px-2 py-1 rounded-lg ${axis === "none" ? "bg-white/15" : "hover:bg-white/10"}`}>None</button>
                </div>
                <div className="w-px h-5 bg-white/10 mx-1" />
                <div className="flex items-center gap-2">
                    <button onClick={onToggleWire} className="px-2 py-1 rounded-lg hover:bg-white/10">Wireframe</button>
                    <button onClick={onMirror} className="px-2 py-1 rounded-lg hover:bg-white/10">Mirror X</button>
                    <button onClick={onSmooth} className="px-2 py-1 rounded-lg hover:bg-white/10">Smooth</button>
                    <button onClick={onDuplicate} className="px-2 py-1 rounded-lg hover:bg-white/10">Duplicate</button>
                    <button onClick={onDelete} className="px-2 py-1 rounded-lg hover:bg-white/10">Delete</button>
                    <button onClick={onFrame} className="px-2 py-1 rounded-lg hover:bg-white/10">Frame</button>
                </div>
            </div>
            {/* 라인 2 */}
            <div className="absolute top-[64px] left-3 right-3 z-10 flex flex-wrap items-center gap-2 bg-black/30 backdrop-blur px-3 py-2 rounded-xl text-xs">
                <div className="flex items-center gap-2">
                    <label className="flex items-center gap-2">
                        <input type="checkbox" checked={snapOn} onChange={e => setSnapOn(e.target.checked)} />
                        <span>Snap</span>
                    </label>
                    <div className="flex items-center gap-1">
                        <span className="opacity-70 mr-1">Step</span>
                        {[0.1, 0.25, 0.5, 1].map(s => (
                            <button key={s} onClick={() => setSnapStep(s)} className={`px-2 py-0.5 rounded ${snapStep === s ? "bg-white/15" : "hover:bg-white/10"}`}>{s}</button>
                        ))}
                        <span className="opacity-60">※ 드래그 중 Shift = 임시 스냅</span>
                    </div>
                </div>
            </div>
        </>
    );
};