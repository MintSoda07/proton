/* eslint-disable react-refresh/only-export-components */
// src/editor/state/EditorContext.tsx
import React, { createContext, useContext, useMemo, useState } from "react";
import * as THREE from "three";
import EditableMesh from "../core/EditableMesh";
import type { Axis, SelMode, Selection, Tool } from "./types";

interface EditorCtx {
    editable: EditableMesh;
    selection: React.MutableRefObject<Selection>;
    triBuffer: React.MutableRefObject<number[]>;
    raycaster: THREE.Raycaster;
    pointerNDC: THREE.Vector2;


    selMode: SelMode; setSelMode: (m: SelMode) => void;
    tool: Tool; setTool: (t: Tool) => void;
    axis: Axis; setAxis: (a: Axis) => void;
    snapOn: boolean; setSnapOn: (v: boolean) => void;
    snapStep: number; setSnapStep: (n: number) => void;
    status: string; setStatus: (s: string) => void;
}

const Ctx = createContext<EditorCtx | null>(null);
export const useEditor = () => {
    const v = useContext(Ctx);
    if (!v) throw new Error("EditorContext not found");
    return v;
};
export const EditorProvider: React.FC<{ children: React.ReactNode }>
    = ({ children }) => {
        const [selMode, setSelMode] = useState<SelMode>("vertex");
        const [tool, setTool] = useState<Tool>("select");
        const [axis, setAxis] = useState<Axis>("none");
        const [snapOn, setSnapOn] = useState(false);
        const [snapStep, setSnapStep] = useState(0.5);
        const [status, setStatus] = useState("");
        const value = useMemo<EditorCtx>(() => ({
            editable: new EditableMesh(),
            selection: { current: null },
            triBuffer: { current: [] },
            raycaster: new THREE.Raycaster(),
            pointerNDC: new THREE.Vector2(),
            selMode, setSelMode,
            tool, setTool,
            axis, setAxis,
            snapOn, setSnapOn,
            snapStep, setSnapStep,
            status, setStatus,
            // eslint-disable-next-line react-hooks/exhaustive-deps
        }), []); // ★ 인스턴스는 고정
        // 변하는 값은 별도로 동기화
        value.selMode = selMode;
        value.setSelMode = setSelMode;
        value.tool = tool;
        value.setTool = setTool;
        value.axis = axis;
        value.setAxis = setAxis;
        value.snapOn = snapOn;
        value.setSnapOn = setSnapOn;
        value.snapStep = snapStep;
        value.setSnapStep = setSnapStep;
        value.status = status;
        value.setStatus = setStatus;


        return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
    };