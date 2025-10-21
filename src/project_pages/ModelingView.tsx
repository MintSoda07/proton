/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-explicit-any */
// ModelingViewPro.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

/** ====================== EditableMesh ====================== */
class EditableMesh {
    vertices: THREE.Vector3[] = [];
    faces: number[][] = []; // triangles [a,b,c]
    geom: THREE.BufferGeometry;
    needsSync = true;

    constructor() {
        this.geom = new THREE.BufferGeometry();
    }

    addVertex(v: THREE.Vector3) {
        this.vertices.push(v.clone());
        this.needsSync = true;
    }

    addFace(a: number, b: number, c: number) {
        if ([a, b, c].some(i => i < 0 || i >= this.vertices.length)) return;
        if (a === b || b === c || c === a) return;
        this.faces.push([a, b, c]);
        this.needsSync = true;
    }

    removeFaceAt(index: number) {
        if (index < 0 || index >= this.faces.length) return;
        this.faces.splice(index, 1);
        this.needsSync = true;
    }

    /** vertex를 지우되, 그 vertex를 쓰는 face가 없어야 함 */
    removeVertexIfIsolated(index: number) {
        const used = this.faces.some(f => f[0] === index || f[1] === index || f[2] === index);
        if (used) return false;
        // 인덱스 재매핑
        const remap: number[] = [];
        for (let i = 0, j = 0; i < this.vertices.length; i++) {
            if (i === index) { remap[i] = -1; continue; }
            remap[i] = j++;
        }
        this.vertices.splice(index, 1);
        this.faces = this.faces.map(([a, b, c]) => [remap[a], remap[b], remap[c]]);
        this.needsSync = true;
        return true;
    }

    buildAdjacency(): Map<number, Set<number>> {
        const adj = new Map<number, Set<number>>();
        const add = (i: number, j: number) => {
            const s = adj.get(i) ?? new Set<number>();
            s.add(j);
            adj.set(i, s);
        };
        for (const [a, b, c] of this.faces) {
            add(a, b); add(b, a);
            add(b, c); add(c, b);
            add(c, a); add(a, c);
        }
        return adj;
    }

    smooth(iterations = 1, lambda = 0.5) {
        const adj = this.buildAdjacency();
        for (let it = 0; it < iterations; it++) {
            const next = this.vertices.map(v => v.clone());
            this.vertices.forEach((v, i) => {
                const nb = Array.from(adj.get(i) ?? []);
                if (!nb.length) return;
                const avg = new THREE.Vector3();
                for (const j of nb) avg.add(this.vertices[j]);
                avg.multiplyScalar(1 / nb.length);
                next[i].lerp(avg, lambda);
            });
            this.vertices = next;
        }
        this.needsSync = true;
    }

    mirrorX(eps = 1e-4) {
        const baseCount = this.vertices.length;
        for (let i = 0; i < baseCount; i++) {
            const v = this.vertices[i];
            if (v.x > eps) this.vertices.push(new THREE.Vector3(-v.x, v.y, v.z));
        }
        const facesSnapshot = this.faces.slice();
        for (const [a, b, c] of facesSnapshot) {
            const va = this.vertices[a], vb = this.vertices[b], vc = this.vertices[c];
            if (va.x > eps || vb.x > eps || vc.x > eps) {
                const ia = this.findMirroredIndex(a, eps);
                const ib = this.findMirroredIndex(b, eps);
                const ic = this.findMirroredIndex(c, eps);
                this.faces.push([ic, ib, ia]); // 반전
            }
        }
        this.weld(eps);
        this.needsSync = true;
    }

    private findMirroredIndex(i: number, eps: number) {
        const v = this.vertices[i];
        const tx = -v.x;
        for (let j = 0; j < this.vertices.length; j++) {
            const u = this.vertices[j];
            if (Math.abs(u.x - tx) < eps && Math.abs(u.y - v.y) < eps && Math.abs(u.z - v.z) < eps) {
                return j;
            }
        }
        this.vertices.push(new THREE.Vector3(-v.x, v.y, v.z));
        return this.vertices.length - 1;
    }

    private weld(eps: number) {
        const map = new Map<string, number>();
        const keyOf = (v: THREE.Vector3) =>
            `${Math.round(v.x / eps)}_${Math.round(v.y / eps)}_${Math.round(v.z / eps)}`;

        const remap: number[] = new Array(this.vertices.length);
        const newVerts: THREE.Vector3[] = [];
        for (let i = 0; i < this.vertices.length; i++) {
            const k = keyOf(this.vertices[i]);
            if (map.has(k)) {
                remap[i] = map.get(k)!;
            } else {
                const ni = newVerts.length;
                map.set(k, ni);
                newVerts.push(this.vertices[i]);
                remap[i] = ni;
            }
        }
        this.vertices = newVerts;
        this.faces = this.faces.map(([a, b, c]) => [remap[a], remap[b], remap[c]]);
    }

    sync() {
        if (!this.needsSync) return this.geom;
        const pos: number[] = [];
        const nrm: number[] = [];
        for (const [a, b, c] of this.faces) {
            const va = this.vertices[a], vb = this.vertices[b], vc = this.vertices[c];
            pos.push(va.x, va.y, va.z, vb.x, vb.y, vb.z, vc.x, vc.y, vc.z);
            const n = new THREE.Vector3().copy(vb).sub(va).cross(new THREE.Vector3().copy(vc).sub(va)).normalize();
            for (let i = 0; i < 3; i++) nrm.push(n.x, n.y, n.z);
        }
        const g = this.geom;
        g.setAttribute("position", new THREE.Float32BufferAttribute(new Float32Array(pos), 3));
        g.setAttribute("normal", new THREE.Float32BufferAttribute(new Float32Array(nrm), 3));
        g.computeBoundingSphere();
        this.needsSync = false;
        return g;
    }

    /** ---------- Serialize ---------- */
    toJSON() {
        return {
            vertices: this.vertices.map(v => [v.x, v.y, v.z]),
            faces: this.faces.map(f => [...f]),
        };
    }
    fromJSON(data: { vertices: number[][]; faces: number[][] }) {
        this.vertices = data.vertices.map(([x, y, z]) => new THREE.Vector3(x, y, z));
        this.faces = data.faces.map(([a, b, c]) => [a, b, c]);
        this.needsSync = true;
    }
}

/** ====================== Types ====================== */
type SelMode = "vertex" | "edge" | "face";
type Tool = "select" | "move" | "add-vertex" | "make-triangle" | "extrude-face" | "bevel-inset";
type Axis = "none" | "x" | "y" | "z";
type Selection =
    | { kind: "vertex"; index: number }
    | { kind: "face"; index: number }
    | null;

/** ====================== Component ====================== */
export default function ModelingView() {
    const hostRef = useRef<HTMLDivElement | null>(null);

    // UI states
    const [wireframe, setWireframe] = useState(false);
    const [selMode, setSelMode] = useState<SelMode>("vertex");
    const [tool, setTool] = useState<Tool>("select");
    const [status, setStatus] = useState<string>("");

    const [axis, setAxis] = useState<Axis>("none");
    const [snapOn, setSnapOn] = useState<boolean>(false);
    const [snapStep, setSnapStep] = useState<number>(0.5);

    const [jsonModal, setJsonModal] = useState<null | { mode: "import" | "export"; text: string }>(null);

    // three refs
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
    const sceneRef = useRef<THREE.Scene | null>(null);
    const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
    const controlsRef = useRef<OrbitControls | null>(null);
    const raycaster = useMemo(() => new THREE.Raycaster(), []);
    const pointerNDC = useMemo(() => new THREE.Vector2(), []);

    // editables
    const editable = useRef<EditableMesh>(new EditableMesh());
    const meshRef = useRef<THREE.Mesh<THREE.BufferGeometry, THREE.Material> | null>(null);
    const materialRef = useRef<THREE.MeshStandardMaterial | null>(null);
    const helperPointsRef = useRef<THREE.Points<THREE.BufferGeometry, THREE.PointsMaterial> | null>(null);
    const faceHelperRef = useRef<THREE.LineSegments<THREE.BufferGeometry, THREE.LineBasicMaterial> | null>(null);
    const groundRef = useRef<THREE.Mesh<THREE.PlaneGeometry, THREE.Material> | null>(null);

    const selection = useRef<Selection>(null);
    const triBuffer = useRef<number[]>([]);
    const dragging = useRef<{ active: boolean; startPlaneHit?: THREE.Vector3; startCentroid?: THREE.Vector3 }>({ active: false });

    // undo/redo
    const undoStack = useRef<any[]>([]);
    const redoStack = useRef<any[]>([]);
    const pushUndo = () => {
        undoStack.current.push(JSON.stringify(editable.current.toJSON()));
        if (undoStack.current.length > 100) undoStack.current.shift();
        redoStack.current = [];
    };
    const doUndo = () => {
        if (!undoStack.current.length) return;
        const cur = JSON.stringify(editable.current.toJSON());
        redoStack.current.push(cur);
        const prev = undoStack.current.pop();
        editable.current.fromJSON(JSON.parse(prev));
        editable.current.needsSync = true;
        setStatus("Undo");
    };
    const doRedo = () => {
        if (!redoStack.current.length) return;
        const cur = JSON.stringify(editable.current.toJSON());
        undoStack.current.push(cur);
        const next = redoStack.current.pop();
        editable.current.fromJSON(JSON.parse(next));
        editable.current.needsSync = true;
        setStatus("Redo");
    };

    useEffect(() => {
        if (!hostRef.current) return;

        /** renderer */
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        // @ts-ignore outputEncoding (old) vs outputColorSpace (new)
        if ((renderer as any).outputEncoding !== undefined) {
            // @ts-ignore
            (renderer as any).outputEncoding = THREE.sRGBEncoding;
        } else {
            // @ts-ignore
            renderer.outputColorSpace = THREE.SRGBColorSpace;
        }
        renderer.setPixelRatio(window.devicePixelRatio);
        hostRef.current.appendChild(renderer.domElement);
        rendererRef.current = renderer;

        /** scene & camera */
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x0b0f14);
        sceneRef.current = scene;

        const camera = new THREE.PerspectiveCamera(50, 1, 0.01, 200);
        camera.position.set(4, 3, 6);
        cameraRef.current = camera;

        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.target.set(0, 0.5, 0);
        controlsRef.current = controls;

        /** lighting */
        scene.add(new THREE.AmbientLight(0xffffff, 0.55));
        const dir = new THREE.DirectionalLight(0xffffff, 0.95);
        dir.position.set(5, 7, 3);
        scene.add(dir);

        /** grid & ground plane */
        const grid = new THREE.GridHelper(40, 40, 0x3a4455, 0x252f3b);
        grid.visible = true;
        grid.name = "editor.grid";
        scene.add(grid);

        const ground = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), new THREE.MeshBasicMaterial({ visible: false }));
        ground.rotateX(-Math.PI / 2);
        scene.add(ground);
        groundRef.current = ground;

        /** editable prim (try load autosave) */
        const ed = editable.current;
        const autosave = localStorage.getItem("modeling.autosave");
        if (autosave) {
            try {
                ed.fromJSON(JSON.parse(autosave));
            } catch {
                // ignore
            }
        }
        if (ed.vertices.length === 0) {
            ed.addVertex(new THREE.Vector3(0, 0, 0));
            ed.addVertex(new THREE.Vector3(1, 0, 0));
            ed.addVertex(new THREE.Vector3(0, 0, 1));
            ed.addFace(0, 1, 2);
        }

        const mat = new THREE.MeshStandardMaterial({
            color: 0x90caf9,
            metalness: 0.2,
            roughness: 0.65,
            wireframe,
            polygonOffset: true,
            polygonOffsetFactor: 1,
            polygonOffsetUnits: 1,
        });
        materialRef.current = mat;

        const mesh = new THREE.Mesh(ed.sync(), mat);
        scene.add(mesh);
        meshRef.current = mesh;

        /** helpers */
        const pts = new THREE.Points(
            new THREE.BufferGeometry(),
            new THREE.PointsMaterial({ size: 8, sizeAttenuation: false, color: 0xffcc80 })
        );
        pts.renderOrder = 2;
        scene.add(pts);
        helperPointsRef.current = pts;
        refreshVertexHelpers();

        const faceLines = new THREE.LineSegments(
            new THREE.BufferGeometry(),
            new THREE.LineBasicMaterial({})
        );
        faceLines.renderOrder = 1;
        scene.add(faceLines);
        faceHelperRef.current = faceLines;
        refreshFaceHelpers();

        /** size & first layout */
        const fit = () => {
            if (!hostRef.current || !cameraRef.current) return;
            const w = hostRef.current.clientWidth || 1;
            const h = hostRef.current.clientHeight || 1;
            renderer.setSize(w, h, false);
            camera.aspect = w / h;
            camera.updateProjectionMatrix();
        };
        fit();
        const ro = new ResizeObserver(fit);
        ro.observe(hostRef.current);

        /** loop (autosave 주기 포함) */
        let raf = 0;
        let autosaveTimer = 0;
        const loop = (t = 0) => {
            controls.update();
            if (editable.current.needsSync && meshRef.current) {
                meshRef.current.geometry.dispose();
                meshRef.current.geometry = editable.current.sync();
                refreshVertexHelpers();
                refreshFaceHelpers();
            }
            renderer.render(scene, camera);

            // 간단 autosave: 3초마다 저장
            if (t - autosaveTimer > 3000) {
                localStorage.setItem("modeling.autosave", JSON.stringify(editable.current.toJSON()));
                autosaveTimer = t;
            }

            raf = requestAnimationFrame(loop);
        };
        raf = requestAnimationFrame(loop);

        /** events */
        const onPointerDown = (ev: PointerEvent) => handlePointerDown(ev);
        const onPointerMove = (ev: PointerEvent) => handlePointerMove(ev);
        const onPointerUp = () => handlePointerUp();

        renderer.domElement.addEventListener("pointerdown", onPointerDown);
        window.addEventListener("pointermove", onPointerMove, { passive: true });
        window.addEventListener("pointerup", onPointerUp);

        const onKey = (e: KeyboardEvent) => handleKey(e);
        window.addEventListener("keydown", onKey);

        /** cleanup */
        return () => {
            cancelAnimationFrame(raf);
            renderer.domElement.removeEventListener("pointerdown", onPointerDown);
            window.removeEventListener("pointermove", onPointerMove as any);
            window.removeEventListener("pointerup", onPointerUp);
            window.removeEventListener("keydown", onKey);
            ro.disconnect();

            // dispose safely
            scene.traverse(obj => {
                const anyObj = obj as any;
                if (anyObj.geometry && typeof anyObj.geometry.dispose === "function") {
                    anyObj.geometry.dispose();
                }
                if (anyObj.material) {
                    if (Array.isArray(anyObj.material)) {
                        anyObj.material.forEach((m: any) => m?.dispose?.());
                    } else {
                        anyObj.material.dispose?.();
                    }
                }
            });
            renderer.dispose();
            hostRef.current?.removeChild(renderer.domElement);
            rendererRef.current = null;
            sceneRef.current = null;
            cameraRef.current = null;
            controlsRef.current = null;
            helperPointsRef.current = null;
            faceHelperRef.current = null;
            meshRef.current = null;
            materialRef.current = null;
            groundRef.current = null;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    /** helpers refresh */
    function refreshVertexHelpers() {
        const pts = helperPointsRef.current;
        if (!pts) return;
        const ed = editable.current;
        const arr: number[] = [];
        for (const v of ed.vertices) arr.push(v.x, v.y, v.z);
        const g = new THREE.BufferGeometry();
        g.setAttribute("position", new THREE.Float32BufferAttribute(new Float32Array(arr), 3));
        pts.geometry.dispose();
        pts.geometry = g;
    }

    function refreshFaceHelpers() {
        const lines = faceHelperRef.current;
        if (!lines) return;
        const ed = editable.current;
        const arr: number[] = [];
        for (const [a, b, c] of ed.faces) {
            const va = ed.vertices[a], vb = ed.vertices[b], vc = ed.vertices[c];
            arr.push(va.x, va.y, va.z, vb.x, vb.y, vb.z);
            arr.push(vb.x, vb.y, vb.z, vc.x, vc.y, vc.z);
            arr.push(vc.x, vc.y, vc.z, va.x, va.y, va.z);
        }
        const g = new THREE.BufferGeometry();
        g.setAttribute("position", new THREE.Float32BufferAttribute(new Float32Array(arr), 3));
        lines.geometry.dispose();
        lines.geometry = g;
    }

    /** pointer → ray */
    function setPointerNDC(ev: PointerEvent) {
        const dom = rendererRef.current!.domElement;
        const rect = dom.getBoundingClientRect();
        pointerNDC.x = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
        pointerNDC.y = -((ev.clientY - rect.top) / rect.height) * 2 + 1;
        raycaster.setFromCamera(pointerNDC, cameraRef.current!);
    }

    function intersectGround(): THREE.Vector3 | null {
        const g = groundRef.current;
        if (!g) return null;
        const hit = raycaster.intersectObject(g, false)[0];
        return hit ? hit.point.clone() : null;
    }

    function pickVertexOrFace(): Selection {
        const ed = editable.current;
        const cam = cameraRef.current!;
        const toScreen = (v: THREE.Vector3) => {
            const p = v.clone().project(cam);
            return new THREE.Vector2(p.x, p.y);
        };
        const mouse = new THREE.Vector2(pointerNDC.x, pointerNDC.y);

        if (selMode === "vertex") {
            let best = -1, bestD = 1e9;
            ed.vertices.forEach((v, i) => {
                const s = toScreen(v);
                const d = s.distanceTo(mouse);
                if (d < bestD) { bestD = d; best = i; }
            });
            if (best >= 0 && bestD < 0.05) return { kind: "vertex", index: best };
            return null;
        }

        if (selMode === "face") {
            const ray = raycaster.ray;
            let bestIdx = -1;
            let bestT = Infinity;
            for (let i = 0; i < ed.faces.length; i++) {
                const [a, b, c] = ed.faces[i];
                const va = ed.vertices[a], vb = ed.vertices[b], vc = ed.vertices[c];
                const hit = new THREE.Vector3();
                const ok = ray.intersectTriangle(va, vb, vc, false, hit);
                if (ok) {
                    const t = hit.distanceTo(ray.origin);
                    if (t < bestT) { bestT = t; bestIdx = i; }
                }
            }
            if (bestIdx >= 0) return { kind: "face", index: bestIdx };
            return null;
        }

        return null;
    }

    /** centroid of face */
    function faceCentroid(faceIndex: number) {
        const ed = editable.current;
        const [a, b, c] = ed.faces[faceIndex];
        const va = ed.vertices[a], vb = ed.vertices[b], vc = ed.vertices[c];
        return new THREE.Vector3().add(va).add(vb).add(vc).multiplyScalar(1 / 3);
    }

    /** snap helper */
    const snapVec = (v: THREE.Vector3, step = snapStep) => {
        v.x = Math.round(v.x / step) * step;
        v.y = Math.round(v.y / step) * step;
        v.z = Math.round(v.z / step) * step;
        return v;
    };

    /** pointer handlers */
    function handlePointerDown(ev: PointerEvent) {
        if (!rendererRef.current) return;
        setPointerNDC(ev);

        if (tool === "add-vertex") {
            const p = intersectGround();
            if (!p) return;
            pushUndo();
            if (snapOn || ev.shiftKey) snapVec(p);
            editable.current.addVertex(p);
            setStatus(`정점 추가: (${p.x.toFixed(2)}, ${p.y.toFixed(2)}, ${p.z.toFixed(2)})`);
            return;
        }

        if (tool === "make-triangle") {
            const hit = pickVertexOrFace();
            if (hit?.kind === "vertex") {
                triBuffer.current.push(hit.index);
                setStatus(`삼각형 생성: ${triBuffer.current.join(", ")}`);
                if (triBuffer.current.length === 3) {
                    pushUndo();
                    const [a, b, c] = triBuffer.current;
                    editable.current.addFace(a, b, c);
                    triBuffer.current = [];
                    setStatus("삼각형 1개 추가");
                }
            }
            return;
        }

        if (tool === "select") {
            selection.current = pickVertexOrFace();
            const s = selection.current;
            if (!s) setStatus("선택 해제");
            else setStatus(s.kind === "vertex" ? `정점 #${s.index} 선택` : `면 #${(s as any).index} 선택`);
            return;
        }

        if (tool === "move") {
            selection.current = pickVertexOrFace();
            if (!selection.current) {
                setStatus("이동할 대상 없음");
                return;
            }
            const p = intersectGround();
            dragging.current = {
                active: true,
                startPlaneHit: p ?? undefined,
                startCentroid: selection.current?.kind === "face" ? faceCentroid(selection.current.index) : undefined,
            };
            if (controlsRef.current) controlsRef.current.enabled = false;
            setStatus(`드래그로 이동 ${axis !== "none" ? `[${axis.toUpperCase()} 고정]` : ""}`);
            pushUndo();
            return;
        }

        if (tool === "extrude-face") {
            if (selMode !== "face") {
                setStatus("면 선택 모드(2)에서 선택 후 Extrude 하세요");
                return;
            }
            selection.current = pickVertexOrFace();
            if (!selection.current || selection.current.kind !== "face") {
                setStatus("면을 먼저 선택하세요");
                return;
            }
            pushUndo();
            extrudeFace(selection.current.index, 0.2);
            setStatus("면 Extrude +0.2");
            return;
        }

        if (tool === "bevel-inset") {
            if (selMode !== "face") {
                setStatus("면 선택 모드(2)에서 선택 후 Inset 하세요");
                return;
            }
            selection.current = pickVertexOrFace();
            if (!selection.current || selection.current.kind !== "face") {
                setStatus("면을 먼저 선택하세요");
                return;
            }
            pushUndo();
            insetFace(selection.current.index, 0.2, 0.0); // inset 0.2, 높이 0
            setStatus("면 Inset 0.2");
            return;
        }
    }

    function handlePointerMove(ev: PointerEvent) {
        if (!rendererRef.current || !dragging.current.active) return;
        setPointerNDC(ev);
        const cur = intersectGround();
        if (!cur || !dragging.current.startPlaneHit) return;

        const delta = cur.clone().sub(dragging.current.startPlaneHit);
        if (axis === "x") delta.setY(0).setZ(0);
        if (axis === "y") delta.setX(0).setZ(0);
        if (axis === "z") delta.setX(0).setY(0);

        const ed = editable.current;

        if (selection.current?.kind === "vertex") {
            const i = selection.current.index;
            const np = ed.vertices[i].clone().add(delta);
            if (snapOn || ev.shiftKey) snapVec(np);
            ed.vertices[i].copy(np);
            ed.needsSync = true;
            dragging.current.startPlaneHit = cur;
        } else if (selection.current?.kind === "face") {
            const [a, b, c] = ed.faces[(selection.current as any).index];
            [a, b, c].forEach(idx => {
                const np = ed.vertices[idx].clone().add(delta);
                if (snapOn || ev.shiftKey) snapVec(np);
                ed.vertices[idx].copy(np);
            });
            ed.needsSync = true;
            dragging.current.startPlaneHit = cur;
        }
    }

    function handlePointerUp() {
        if (!dragging.current.active) return;
        dragging.current.active = false;
        if (controlsRef.current) controlsRef.current.enabled = true;
        setStatus("이동 완료");
    }

    /** actions */
    function extrudeFace(faceIndex: number, height = 0.2) {
        const ed = editable.current;
        const [a, b, c] = ed.faces[faceIndex];
        const va = ed.vertices[a], vb = ed.vertices[b], vc = ed.vertices[c];
        const n = new THREE.Vector3().copy(vb).sub(va).cross(new THREE.Vector3().copy(vc).sub(va)).normalize();
        const ia = ed.vertices.push(va.clone().addScaledVector(n, height)) - 1;
        const ib = ed.vertices.push(vb.clone().addScaledVector(n, height)) - 1;
        const ic = ed.vertices.push(vc.clone().addScaledVector(n, height)) - 1;
        // top
        ed.addFace(ia, ib, ic);
        // sides
        ed.addFace(a, b, ib); ed.addFace(a, ib, ia);
        ed.addFace(b, c, ic); ed.addFace(b, ic, ib);
        ed.addFace(c, a, ia); ed.addFace(c, ia, ic);
    }

    /** 간단 Inset(Bevel): 면 중심으로 정점 이동 후 테두리 면 생성 (높이는 0이면 평면 Inset) */
    function insetFace(faceIndex: number, inset = 0.2, height = 0) {
        const ed = editable.current;
        const [a, b, c] = ed.faces[faceIndex];
        const va = ed.vertices[a], vb = ed.vertices[b], vc = ed.vertices[c];

        // face normal & centroid
        const n = new THREE.Vector3().copy(vb).sub(va).cross(new THREE.Vector3().copy(vc).sub(va)).normalize();
        const centroid = new THREE.Vector3().add(va).add(vb).add(vc).multiplyScalar(1 / 3);

        // inner verts (toward centroid by 'inset', then optional height along normal)
        const moveToward = (v: THREE.Vector3) => {
            const dir = new THREE.Vector3().subVectors(centroid, v).setLength(inset);
            return v.clone().add(dir).addScaledVector(n, height);
        };
        const ia = ed.vertices.push(moveToward(va)) - 1;
        const ib = ed.vertices.push(moveToward(vb)) - 1;
        const ic = ed.vertices.push(moveToward(vc)) - 1;

        // replace original face with inner face
        ed.removeFaceAt(faceIndex);
        ed.addFace(ia, ib, ic);

        // ring quads (triangulated)
        ed.addFace(a, b, ib); ed.addFace(a, ib, ia);
        ed.addFace(b, c, ic); ed.addFace(b, ic, ib);
        ed.addFace(c, a, ia); ed.addFace(c, ia, ic);
    }

    function doMirror() {
        pushUndo();
        editable.current.mirrorX(1e-3);
        setStatus("X축 미러 + 용접");
    }

    function doSmooth() {
        pushUndo();
        editable.current.smooth(2, 0.5);
        setStatus("스무스(2회, λ=0.5)");
    }

    function doDelete() {
        if (!selection.current) return;
        pushUndo();
        if (selection.current.kind === "face") {
            editable.current.removeFaceAt(selection.current.index);
            setStatus("면 삭제");
        } else if (selection.current.kind === "vertex") {
            const ok = editable.current.removeVertexIfIsolated(selection.current.index);
            setStatus(ok ? "정점 삭제" : "정점 삭제 불가(면에서 사용 중)");
        }
    }

    function doDuplicate() {
        if (!selection.current) return;
        pushUndo();
        if (selection.current.kind === "face") {
            // 작은 오프셋으로 복제 (normal 방향)
            const idx = selection.current.index;
            const ed = editable.current;
            const [a, b, c] = ed.faces[idx];
            const va = ed.vertices[a], vb = ed.vertices[b], vc = ed.vertices[c];
            const n = new THREE.Vector3().copy(vb).sub(va).cross(new THREE.Vector3().copy(vc).sub(va)).normalize();
            const off = 0.05;
            const ia = ed.vertices.push(va.clone().addScaledVector(n, off)) - 1;
            const ib = ed.vertices.push(vb.clone().addScaledVector(n, off)) - 1;
            const ic = ed.vertices.push(vc.clone().addScaledVector(n, off)) - 1;
            ed.addFace(ia, ib, ic);
            setStatus("면 복제(+offset)");
        } else if (selection.current.kind === "vertex") {
            const i = selection.current.index;
            const ed = editable.current;
            const nv = ed.vertices[i].clone().add(new THREE.Vector3(0.05, 0, 0));
            ed.addVertex(nv);
            setStatus("정점 복제(+X)");
        }
    }

    function frameSelection() {
        const s = selection.current;
        if (!s || !cameraRef.current || !controlsRef.current) return;
        const ed = editable.current;
        let center: THREE.Vector3 | null = null;
        if (s.kind === "vertex") center = ed.vertices[s.index].clone();
        else if (s.kind === "face") center = faceCentroid(s.index);
        if (center) {
            controlsRef.current.target.copy(center);
            cameraRef.current.position.sub(controlsRef.current.target).add(center);
            setStatus("프레이밍");
        }
    }

    function handleKey(e: KeyboardEvent) {
        if ((e.target as HTMLElement)?.tagName === "INPUT" || (e.target as HTMLElement)?.tagName === "TEXTAREA") return;

        // Undo/Redo
        if (e.ctrlKey && e.key.toLowerCase() === "z") { e.preventDefault(); doUndo(); return; }
        if (e.ctrlKey && e.key.toLowerCase() === "y") { e.preventDefault(); doRedo(); return; }

        // Select mode
        if (e.key === "1") { setSelMode("vertex"); setStatus("Select Mode: Vertex"); return; }
        if (e.key === "2") { setSelMode("face"); setStatus("Select Mode: Face"); return; }

        // Tools
        if (e.key.toLowerCase() === "q") { setTool("select"); setStatus("Tool: Select"); return; }
        if (e.key.toLowerCase() === "w") { setTool("move"); setStatus("Tool: Move"); return; }
        if (e.key.toLowerCase() === "a") { setTool("add-vertex"); setStatus("Tool: Add Vertex"); return; }
        if (e.key.toLowerCase() === "t") { setTool("make-triangle"); setStatus("Tool: Make Triangle"); return; }
        if (e.key.toLowerCase() === "e") { setTool("extrude-face"); setStatus("Tool: Extrude Face"); return; }
        if (e.key.toLowerCase() === "r") { setTool("bevel-inset"); setStatus("Tool: Bevel/Inset"); return; }

        // Wireframe
        if (e.shiftKey && e.key.toLowerCase() === "w") { setWireframe(v => !v); setStatus("Wireframe Toggle"); return; }

        // Axis lock
        if (e.key.toLowerCase() === "x") { setAxis(a => a === "x" ? "none" : "x"); setStatus(`Axis: ${axis === "x" ? "none" : "X"}`); return; }
        if (e.key.toLowerCase() === "y") { setAxis(a => a === "y" ? "none" : "y"); setStatus(`Axis: ${axis === "y" ? "none" : "Y"}`); return; }
        if (e.key.toLowerCase() === "z") { setAxis(a => a === "z" ? "none" : "z"); setStatus(`Axis: ${axis === "z" ? "none" : "Z"}`); return; }

        // Frame (F), Delete, Duplicate(D)
        if (e.key.toLowerCase() === "f") { frameSelection(); return; }
        if (e.key === "Delete") { doDelete(); return; }
        if (e.key.toLowerCase() === "d") { doDuplicate(); return; }
    }

    // wireframe 토글 반영
    useEffect(() => { if (materialRef.current) materialRef.current.wireframe = wireframe; }, [wireframe]);

    // ===== JSON Import/Export =====
    const doExportJSON = () => {
        const text = JSON.stringify(editable.current.toJSON(), null, 2);
        setJsonModal({ mode: "export", text });
    };
    const doImportJSON = () => {
        setJsonModal({ mode: "import", text: "" });
    };
    const confirmImport = () => {
        if (!jsonModal) return;
        try {
            pushUndo();
            const data = JSON.parse(jsonModal.text);
            editable.current.fromJSON(data);
            setJsonModal(null);
            setStatus("JSON Import 완료");
        } catch (e) {
            setStatus("JSON 파싱 실패 :"+e);
        }
    };

    return (
        <div ref={hostRef} className="relative w-full h-full" style={{ minHeight: 520 }}>
            {/* ── Toolbar: Line 1 (Modes & Tools) ── */}
            <div className="absolute top-3 left-3 right-3 z-10 flex flex-wrap items-center gap-2 bg-black/40 backdrop-blur px-3 py-2 rounded-xl text-sm">
                {/* Select mode */}
                <div className="flex items-center gap-1">
                    <span className="text-xs opacity-70 mr-1">모드</span>
                    {(["vertex", "face"] as SelMode[]).map(m => (
                        <button
                            key={m}
                            onClick={() => setSelMode(m)}
                            className={`px-2 py-1 rounded-lg ${selMode === m ? "bg-white/15" : "hover:bg-white/10"}`}
                            title={`선택 모드 (${m === "vertex" ? "1" : "2"})`}
                        >
                            {m === "vertex" ? "● 정점(1)" : "▱ 면(2)"}
                        </button>
                    ))}
                </div>

                <div className="w-px h-5 bg-white/10 mx-1" />

                {/* Tools */}
                <div className="flex flex-wrap gap-1">
                    {([
                        ["select", "Q"], ["move", "W"], ["add-vertex", "A"],
                        ["make-triangle", "T"], ["extrude-face", "E"], ["bevel-inset", "R"],
                    ] as [Tool, string][]).map(([t, key]) => (
                        <button
                            key={t}
                            onClick={() => { setTool(t); setStatus(`Tool: ${t}`); }}
                            className={`px-2 py-1 rounded-lg ${tool === t ? "bg-blue-500/30" : "hover:bg-white/10"}`}
                            title={`${t} (${key})`}
                        >
                            {labelOfTool(t)} ({key})
                        </button>
                    ))}
                </div>

                <div className="w-px h-5 bg-white/10 mx-1" />

                {/* Axis & Snap */}
                <div className="flex items-center gap-1">
                    <span className="text-xs opacity-70 mr-1">축</span>
                    {(["x", "y", "z"] as Axis[]).map(ax => (
                        <button
                            key={ax}
                            onClick={() => setAxis(prev => prev === ax ? "none" : ax)}
                            className={`px-2 py-1 rounded-lg ${axis === ax ? "bg-white/15" : "hover:bg-white/10"}`}
                            title={`축 고정 (${ax.toUpperCase()})`}
                        >
                            {ax.toUpperCase()}
                        </button>
                    ))}
                    <button
                        onClick={() => setAxis("none")}
                        className={`px-2 py-1 rounded-lg ${axis === "none" ? "bg-white/15" : "hover:bg-white/10"}`}
                        title="축 해제"
                    >
                        None
                    </button>
                </div>

                <div className="w-px h-5 bg-white/10 mx-1" />

                <div className="flex items-center gap-2">
                    <button onClick={() => setWireframe(w => !w)} className="px-2 py-1 rounded-lg hover:bg-white/10" title="Shift+W">
                        Wireframe
                    </button>
                    <button onClick={doMirror} className="px-2 py-1 rounded-lg hover:bg-white/10">Mirror X</button>
                    <button onClick={doSmooth} className="px-2 py-1 rounded-lg hover:bg-white/10">Smooth</button>
                    <button onClick={doDuplicate} className="px-2 py-1 rounded-lg hover:bg-white/10" title="D">Duplicate</button>
                    <button onClick={doDelete} className="px-2 py-1 rounded-lg hover:bg-white/10" title="Del">Delete</button>
                    <button onClick={frameSelection} className="px-2 py-1 rounded-lg hover:bg-white/10" title="F">Frame</button>
                </div>
            </div>

            {/* ── Toolbar: Line 2 (Snap & JSON) ── */}
            <div className="absolute top-[64px] left-3 right-3 z-10 flex flex-wrap items-center gap-2 bg-black/30 backdrop-blur px-3 py-2 rounded-xl text-xs">
                <div className="flex items-center gap-2">
                    <label className="flex items-center gap-2">
                        <input type="checkbox" checked={snapOn} onChange={e => setSnapOn(e.target.checked)} />
                        <span>Snap</span>
                    </label>
                    <div className="flex items-center gap-1">
                        <span className="opacity-70 mr-1">Step</span>
                        {[0.1, 0.25, 0.5, 1].map(s => (
                            <button
                                key={s}
                                onClick={() => setSnapStep(s)}
                                className={`px-2 py-0.5 rounded ${snapStep === s ? "bg-white/15" : "hover:bg-white/10"}`}
                            >
                                {s}
                            </button>
                        ))}
                        <span className="opacity-60">※ 드래그 중 Shift = 임시 스냅</span>
                    </div>
                </div>

                <div className="w-px h-5 bg-white/10 mx-2" />

                <div className="flex items-center gap-2">
                    <button onClick={() => { pushUndo(); setStatus("상태 저장(Undo 스냅샷)"); }} className="px-2 py-1 rounded-lg hover:bg-white/10">Snapshot</button>
                    <button onClick={doUndo} className="px-2 py-1 rounded-lg hover:bg-white/10">Undo (Ctrl+Z)</button>
                    <button onClick={doRedo} className="px-2 py-1 rounded-lg hover:bg-white/10">Redo (Ctrl+Y)</button>
                </div>

                <div className="w-px h-5 bg-white/10 mx-2" />

                <div className="flex items-center gap-2">
                    <button onClick={doExportJSON} className="px-2 py-1 rounded-lg hover:bg-white/10">Export JSON</button>
                    <button onClick={doImportJSON} className="px-2 py-1 rounded-lg hover:bg-white/10">Import JSON</button>
                </div>
            </div>

            {/* 상태 바 */}
            <div className="absolute bottom-3 left-3 z-10 bg-black/40 backdrop-blur px-3 py-1 rounded-lg text-xs text-white/80">
                {status || "준비됨"} {axis !== "none" ? `| Axis: ${axis.toUpperCase()}` : ""} {snapOn ? `| Snap ${snapStep}` : ""}
            </div>

            {/* JSON 모달 */}
            {jsonModal && (
                <div className="absolute inset-0 z-20 bg-black/60 flex items-center justify-center">
                    <div className="w-[min(800px,90vw)] bg-[#0f141a] border border-white/10 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-2">
                            <div className="font-semibold text-sm">{jsonModal.mode === "export" ? "Export JSON" : "Import JSON"}</div>
                            <button className="px-2 py-1 rounded hover:bg-white/10" onClick={() => setJsonModal(null)}>닫기</button>
                        </div>
                        <textarea
                            value={jsonModal.text}
                            onChange={e => setJsonModal(m => (m ? { ...m, text: e.target.value } : m))}
                            className="w-full h-[40vh] p-2 rounded bg-black/40 border border-white/10 outline-none"
                            placeholder={jsonModal.mode === "import" ? "여기에 JSON 붙여넣기" : ""}
                        />
                        <div className="mt-2 flex gap-2 justify-end">
                            {jsonModal.mode === "export" ? (
                                <button
                                    className="px-3 py-1 rounded bg-white/10 hover:bg-white/15"
                                    onClick={() => navigator.clipboard?.writeText(jsonModal.text)}
                                >
                                    클립보드로 복사
                                </button>
                            ) : (
                                <button className="px-3 py-1 rounded bg-blue-500/20 hover:bg-blue-500/30" onClick={confirmImport}>
                                    Import 적용
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

/** labels */
function labelOfTool(t: Tool) {
    switch (t) {
        case "select": return "Select";
        case "move": return "Move";
        case "add-vertex": return "Add Vertex";
        case "make-triangle": return "Make Triangle";
        case "extrude-face": return "Extrude Face";
        case "bevel-inset": return "Bevel/Inset";
    }
}
