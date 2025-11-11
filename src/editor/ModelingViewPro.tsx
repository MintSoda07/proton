/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-expressions */
// src/editor/ModelingViewPro.tsx
/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { useThreeBasics } from "./hooks/useThreeBasics";
import { useUndo } from "./hooks/useUndo";
import { useAutosave } from "./hooks/useAutosave";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";
import { EditorProvider, useEditor } from "./state/EditorContext";
import type { Axis, Selection } from "./state/types";
import { Toolbar } from "./ui/Toolbar";
import { StatusBar } from "./ui/StatusBar";
import { JsonModal } from "./ui/JsonModal";
import EditableMesh from "./core/EditableMesh";
import { pickVertexOrFace, intersectGround } from "./core/picking";
import { extrudeFace, insetFace, faceCentroid } from "./core/meshOps";


const KEY = "modeling.autosave";


const Inner: React.FC = () => {
    const hostRef = useRef<HTMLDivElement | null>(null);
    const { editable, selection, triBuffer, raycaster, pointerNDC, selMode, tool, axis, snapOn, snapStep, setStatus } = useEditor();
    const refs = useThreeBasics(hostRef);


    const [wireframe, setWireframe] = useState(false);
    const [jsonModal, setJsonModal] = useState<null | { mode: "import" | "export"; text: string }>(null);
    const dragging = useRef<{ active: boolean; startPlaneHit?: THREE.Vector3 } | null>({ active: false });


    // Undo
    const serialize = useCallback(() => editable.toJSON(), [editable]);
    const restore = useCallback((data: any) => { editable.fromJSON(data); editable.needsSync = true; }, [editable]);
    const { snapshot, undo, redo } = useUndo(serialize, restore, 100);


    // Autosave
    const { tick } = useAutosave(KEY, serialize, (d) => restore(d));
    // helpers refreshers
    const refreshVertexHelpers = useCallback(() => {
        if (!refs.current.vertPts || !editable) return;
        const arr: number[] = [];
        for (const v of editable.vertices) arr.push(v.x, v.y, v.z);
        const g = new THREE.BufferGeometry();
        g.setAttribute("position", new THREE.Float32BufferAttribute(new Float32Array(arr), 3));
        refs.current.vertPts.geometry.dispose();
        refs.current.vertPts.geometry = g;
    }, [editable, refs]);


    const refreshFaceHelpers = useCallback(() => {
        if (!refs.current.faceLines || !editable) return;
        const arr: number[] = [];
        for (const [a, b, c] of editable.faces) {
            const va = editable.vertices[a], vb = editable.vertices[b], vc = editable.vertices[c];
            arr.push(va.x, va.y, va.z, vb.x, vb.y, vb.z);
            arr.push(vb.x, vb.y, vb.z, vc.x, vc.y, vc.z);
            arr.push(vc.x, vc.y, vc.z, va.x, va.y, va.z);
        }
        const g = new THREE.BufferGeometry();
        g.setAttribute("position", new THREE.Float32BufferAttribute(new Float32Array(arr), 3));
        refs.current.faceLines.geometry.dispose();
        refs.current.faceLines.geometry = g;
    }, [editable, refs]);


    // 초기 오브젝트 + 루프에서 동기화
    useEffect(() => {
        const r = refs.current;
        if (!r.scene || !r.mat) return;


        // 기본 모델 (로드 실패 시)
        if (editable.vertices.length === 0) {
            editable.addVertex(new THREE.Vector3(0, 0, 0));
            editable.addVertex(new THREE.Vector3(1, 0, 0));
            editable.addVertex(new THREE.Vector3(0, 0, 1));
            editable.addFace(0, 1, 2);
        }


        const mesh = new THREE.Mesh(editable.sync(), r.mat);
        r.scene.add(mesh);
        r.mesh = mesh;


        const pts = new THREE.Points(new THREE.BufferGeometry(), new THREE.PointsMaterial({ size: 8, sizeAttenuation: false, color: 0xffcc80 }));
        pts.renderOrder = 2; r.scene.add(pts); r.vertPts = pts;


        const faceLines = new THREE.LineSegments(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({}));
        faceLines.renderOrder = 1; r.scene.add(faceLines); r.faceLines = faceLines;


        const animate = (t = 0) => {
            if (!r.renderer) return;
            // 지오메트리 변경 동기화
            if (editable.needsSync && r.mesh) {
                r.mesh.geometry.dispose();
                r.mesh.geometry = editable.sync();
                refreshVertexHelpers();
                refreshFaceHelpers();
            }
            // Autosave tick
            tick(t);
            requestAnimationFrame(animate);
        };
        const id = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(id);
    }, [editable, refs, refreshFaceHelpers, refreshVertexHelpers, tick]);


    // wireframe 반영
    useEffect(() => { if (refs.current.mat) refs.current.mat.wireframe = wireframe; }, [wireframe, refs]);


    // pointer helpers
    const setPointerNDC = useCallback((ev: PointerEvent) => {
        const dom = refs.current.renderer!.domElement;
        const rect = dom.getBoundingClientRect();
        pointerNDC.x = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
        pointerNDC.y = -((ev.clientY - rect.top) / rect.height) * 2 + 1;
        raycaster.setFromCamera(pointerNDC, refs.current.camera!);
    }, [pointerNDC, raycaster, refs]);


    const snapVec = useCallback((v: THREE.Vector3, step = snapStep) => {
        v.x = Math.round(v.x / step) * step;
        v.y = Math.round(v.y / step) * step;
        v.z = Math.round(v.z / step) * step;
        return v;
    }, [snapStep]);


    // pointer handlers
    const onPointerDown = useCallback((ev: PointerEvent) => {
        if (!refs.current.renderer) return;
        setPointerNDC(ev);


        if (tool === "add-vertex") {
            const p = intersectGround(raycaster, refs.current.ground);
            if (!p) return;
            snapshot();
            if (snapOn || ev.shiftKey) snapVec(p);
            editable.addVertex(p);
            setStatus(`정점 추가: (${p.x.toFixed(2)}, ${p.y.toFixed(2)}, ${p.z.toFixed(2)})`);
            return;
        }


        if (tool === "make-triangle") {
            const hit = pickVertexOrFace("vertex", editable, raycaster, refs.current.camera!, pointerNDC);
            if (hit?.kind === "vertex") {
                triBuffer.current.push(hit.index);
                setStatus(`삼각형 생성: ${triBuffer.current.join(", ")}`);
                if (triBuffer.current.length === 3) {
                    snapshot();
                    const [a, b, c] = triBuffer.current;
                    editable.addFace(a, b, c);
                    triBuffer.current = [];
                    setStatus("삼각형 1개 추가");
                }
            }
            return;
        }


        if (tool === "select") {
            selection.current = pickVertexOrFace(selMode, editable, raycaster, refs.current.camera!, pointerNDC);
            const s = selection.current;
            setStatus(!s ? "선택 해제" : s.kind === "vertex" ? `정점 #${s.index} 선택` : `면 #${(s as any).index} 선택`);
            return;
        }


        if (tool === "move") {
            selection.current = pickVertexOrFace(selMode, editable, raycaster, refs.current.camera!, pointerNDC);
            if (!selection.current) { setStatus("이동할 대상 없음"); return; }
            const p = intersectGround(raycaster, refs.current.ground);
            dragging.current = { active: true, startPlaneHit: p ?? undefined };
            refs.current.controls && (refs.current.controls.enabled = false);
            setStatus(`드래그로 이동 ${axis !== "none" ? `[${axis.toUpperCase()} 고정]` : ""}`);
            snapshot();
            return;
        }
        if (tool === "extrude-face") {
            if (selMode !== "face") { setStatus("면 선택 모드(2)에서 선택 후 Extrude 하세요"); return; }
            selection.current = pickVertexOrFace("face", editable, raycaster, refs.current.camera!, pointerNDC);
            if (!selection.current || selection.current.kind !== "face") { setStatus("면을 먼저 선택하세요"); return; }
            snapshot();
            extrudeFace(editable, selection.current.index, 0.2);
            setStatus("면 Extrude +0.2");
            return;
        }


        if (tool === "bevel-inset") {
            if (selMode !== "face") { setStatus("면 선택 모드(2)에서 선택 후 Inset 하세요"); return; }
            selection.current = pickVertexOrFace("face", editable, raycaster, refs.current.camera!, pointerNDC);
            if (!selection.current || selection.current.kind !== "face") { setStatus("면을 먼저 선택하세요"); return; }
            snapshot();
            insetFace(editable, selection.current.index, 0.2, 0.0);
            setStatus("면 Inset 0.2");
            return;
        }
    }, [refs, setPointerNDC, tool, editable, selMode, selection, raycaster, pointerNDC, triBuffer, snapOn, snapVec, setStatus, axis, snapshot]);


    const onPointerMove = useCallback((ev: PointerEvent) => {
        if (!refs.current.renderer || !dragging.current?.active) return;
        setPointerNDC(ev);
        const cur = intersectGround(raycaster, refs.current.ground);
        if (!cur || !dragging.current.startPlaneHit) return;


        const delta = cur.clone().sub(dragging.current.startPlaneHit);
        if (axis === "x") delta.setY(0).setZ(0);
        if (axis === "y") delta.setX(0).setZ(0);
        if (axis === "z") delta.setX(0).setY(0);


        if (selection.current?.kind === "vertex") {
            const i = selection.current.index;
            const np = editable.vertices[i].clone().add(delta);
            if (snapOn || ev.shiftKey) snapVec(np);
            editable.vertices[i].copy(np);
            editable.needsSync = true;
            dragging.current.startPlaneHit = cur;
        } else if (selection.current?.kind === "face") {
            const [a, b, c] = editable.faces[(selection.current as any).index];
            [a, b, c].forEach(idx => {
                const np = editable.vertices[idx].clone().add(delta);
                if (snapOn || ev.shiftKey) snapVec(np);
                editable.vertices[idx].copy(np);
            });
            editable.needsSync = true;
            dragging.current.startPlaneHit = cur;
        }
    }, [refs, setPointerNDC, raycaster, axis, selection, editable, snapOn, snapVec]);
    const onPointerUp = useCallback(() => {
        if (!dragging.current?.active) return;
        dragging.current.active = false;
        refs.current.controls && (refs.current.controls.enabled = true);
        setStatus("이동 완료");
    }, [refs, setStatus]);


    // 이벤트 바인딩
    useEffect(() => {
        if (!refs.current.renderer) return;
        const dom = refs.current.renderer.domElement;
        dom.addEventListener("pointerdown", onPointerDown);
        window.addEventListener("pointermove", onPointerMove, { passive: true });
        window.addEventListener("pointerup", onPointerUp);
        return () => {
            dom.removeEventListener("pointerdown", onPointerDown);
            window.removeEventListener("pointermove", onPointerMove as any);
            window.removeEventListener("pointerup", onPointerUp);
        };
    }, [refs, onPointerDown, onPointerMove, onPointerUp]);


    // 키보드 숏컷
    useKeyboardShortcuts(useCallback((e: KeyboardEvent) => {
        const tag = (e.target as HTMLElement)?.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA") return;


        if (e.ctrlKey && e.key.toLowerCase() === "z") { e.preventDefault(); undo() && setStatus("Undo"); return; }
        if (e.ctrlKey && e.key.toLowerCase() === "y") { e.preventDefault(); redo() && setStatus("Redo"); return; }


        if (e.key === "1") { setStatus("Select Mode: Vertex"); /* selMode는 Context에서 변경 */ }
        if (e.key === "2") { setStatus("Select Mode: Face"); }


        if (e.key.toLowerCase() === "f") { frameSelection(); return; }
        if (e.key === "Delete") { doDelete(); return; }
        if (e.key.toLowerCase() === "d") { doDuplicate(); return; }
    }, [undo, redo]));
    // 액션들
    const doMirror = useCallback(() => { snapshot(); editable.mirrorX(1e-3); setStatus("X축 미러 + 용접"); }, [editable, snapshot, setStatus]);
    const doSmooth = useCallback(() => { snapshot(); editable.smooth(2, 0.5); setStatus("스무스(2회, λ=0.5)"); }, [editable, snapshot, setStatus]);
    const doDelete = useCallback(() => {
        if (!selection.current) return;
        snapshot();
        if (selection.current.kind === "face") { editable.removeFaceAt(selection.current.index); setStatus("면 삭제"); }
        else { const ok = editable.removeVertexIfIsolated(selection.current.index); setStatus(ok ? "정점 삭제" : "정점 삭제 불가(면에서 사용 중)"); }
    }, [editable, selection, snapshot, setStatus]);
    const doDuplicate = useCallback(() => {
        if (!selection.current) return;
        snapshot();
        if (selection.current.kind === "face") {
            const idx = selection.current.index; const [a, b, c] = editable.faces[idx];
            const va = editable.vertices[a], vb = editable.vertices[b], vc = editable.vertices[c];
            const n = new THREE.Vector3().copy(vb).sub(va).cross(new THREE.Vector3().copy(vc).sub(va)).normalize();
            const off = 0.05;
            const ia = editable.vertices.push(va.clone().addScaledVector(n, off)) - 1;
            const ib = editable.vertices.push(vb.clone().addScaledVector(n, off)) - 1;
            const ic = editable.vertices.push(vc.clone().addScaledVector(n, off)) - 1;
            editable.addFace(ia, ib, ic);
            setStatus("면 복제(+offset)");
        } else {
            const i = selection.current.index; const nv = editable.vertices[i].clone().add(new THREE.Vector3(0.05, 0, 0));
            editable.addVertex(nv); setStatus("정점 복제(+X)");
        }
    }, [editable, selection, snapshot, setStatus]);
    const frameSelection = useCallback(() => {
        const s = selection.current; if (!s || !refs.current.camera || !refs.current.controls) return;
        const center = s.kind === "vertex" ? editable.vertices[s.index].clone() : faceCentroid(editable, s.index);
        refs.current.controls.target.copy(center);
        refs.current.camera.position.sub(refs.current.controls.target).add(center);
        setStatus("프레이밍");
    }, [selection, refs, editable, setStatus]);
    // JSON Import/Export
    const doExportJSON = useCallback(() => setJsonModal({ mode: "export", text: JSON.stringify(editable.toJSON(), null, 2) }), [editable]);
    const doImportJSON = useCallback(() => setJsonModal({ mode: "import", text: "" }), []);
    const confirmImport = useCallback(() => {
        if (!jsonModal) return;
        try { snapshot(); editable.fromJSON(JSON.parse(jsonModal.text)); setJsonModal(null); setStatus("JSON Import 완료"); }
        catch (e) { setStatus("JSON 파싱 실패 :" + e); }
    }, [jsonModal, editable, snapshot, setStatus]);


    // 최초 material/mesh helper 생성 이후 wireframe 및 helpers는 위에서 관리
    useEffect(() => { if (refs.current.mat) refs.current.mat.wireframe = wireframe; }, [wireframe, refs]);


    return (
        <div ref={hostRef} className="relative w-full h-full" style={{ minHeight: 520 }}>
            <Toolbar
                wireframe={wireframe}
                onToggleWire={() => setWireframe(w => !w)}
                onMirror={doMirror}
                onSmooth={doSmooth}
                onDuplicate={doDuplicate}
                onDelete={doDelete}
                onFrame={frameSelection}
            />
            <div className="absolute top-[64px] left-3 right-3 z-10 flex gap-2 bg-black/30 backdrop-blur px-3 py-2 rounded-xl text-xs">
                <button onClick={() => { snapshot(); setStatus("상태 저장(Undo 스냅샷)"); }} className="px-2 py-1 rounded-lg hover:bg-white/10">Snapshot</button>
                <button onClick={() => undo() && setStatus("Undo")} className="px-2 py-1 rounded-lg hover:bg-white/10">Undo (Ctrl+Z)</button>
                <button onClick={() => redo() && setStatus("Redo")} className="px-2 py-1 rounded-lg hover:bg-white/10">Redo (Ctrl+Y)</button>
                <div className="w-px h-5 bg-white/10 mx-2" />
                <button onClick={doExportJSON} className="px-2 py-1 rounded-lg hover:bg-white/10">Export JSON</button>
                <button onClick={doImportJSON} className="px-2 py-1 rounded-lg hover:bg-white/10">Import JSON</button>
            </div>


            <StatusBar />
            <JsonModal
                mode={jsonModal?.mode ?? null}
                text={jsonModal?.text ?? ""}
                onChange={(s) => setJsonModal(m => (m ? { ...m, text: s } : m))}
                onClose={() => setJsonModal(null)}
                onConfirmImport={confirmImport}
            />
        </div>
    );
};


const ModelingViewPro: React.FC = () => (
    <EditorProvider>
        <Inner />
    </EditorProvider>
);


export default ModelingViewPro;