/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-explicit-any */

// ModelingViewPro.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

/** ====================== Types ====================== */
type SelMode = "vertex" | "edge" | "face";
type Tool =
  | "select"
  | "move"
  | "rotate"
  | "scale"
  | "add-vertex"
  | "make-triangle"
  | "extrude-face"
  | "bevel-inset";
type Axis = "none" | "x" | "y" | "z";
type Selection =
  | { kind: "vertex"; indices: number[] }
  | { kind: "edge"; indices: number[] } // edge = flat index into edges[] list
  | { kind: "face"; indices: number[] }
  | null;

type HoverHit =
  | { kind: "vertex"; index: number }
  | { kind: "edge"; index: number }
  | { kind: "face"; index: number }
  | null;

/** ====================== EditableMesh ====================== */
class EditableMesh {
  vertices: THREE.Vector3[] = [];
  faces: number[][] = []; // triangles [a,b,c]
  // derived
  edges: number[][] = []; // unique undirected edges [i,j] with i<j
  edgeToFaces: Map<string, number[]> = new Map();

  geom: THREE.BufferGeometry;
  needsSync = true;
  liveSymmetryX = false; // live symmetric edit about X=0

  constructor() {
    this.geom = new THREE.BufferGeometry();
  }

  // ---- basic ops ----
  addVertex(v: THREE.Vector3) {
    this.vertices.push(v.clone());
    if (this.liveSymmetryX && v.x > 1e-6) {
      this.vertices.push(new THREE.Vector3(-v.x, v.y, v.z));
    }
    this.needsSync = true;
  }

  addFace(a: number, b: number, c: number) {
    if ([a, b, c].some((i) => i < 0 || i >= this.vertices.length)) return;
    if (a === b || b === c || c === a) return;
    this.faces.push([a, b, c]);
    if (this.liveSymmetryX) {
      const va = this.vertices[a],
        vb = this.vertices[b],
        vc = this.vertices[c];
      if (va.x > 1e-6 || vb.x > 1e-6 || vc.x > 1e-6) {
        const ia = this.findMirroredIndex(a, 1e-6);
        const ib = this.findMirroredIndex(b, 1e-6);
        const ic = this.findMirroredIndex(c, 1e-6);
        this.faces.push([ic, ib, ia]); // reversed winding
      }
    }
    this.needsSync = true;
  }

  removeFaceAt(index: number) {
    if (index < 0 || index >= this.faces.length) return;
    this.faces.splice(index, 1);
    this.needsSync = true;
  }

  /** remove vertex only if not referenced */
  removeVertexIfIsolated(index: number) {
    const used = this.faces.some(
      (f) => f[0] === index || f[1] === index || f[2] === index
    );
    if (used) return false;
    // build remap
    const remap: number[] = [];
    for (let i = 0, j = 0; i < this.vertices.length; i++) {
      if (i === index) {
        remap[i] = -1;
        continue;
      }
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
      add(a, b);
      add(b, a);
      add(b, c);
      add(c, b);
      add(c, a);
      add(a, c);
    }
    return adj;
  }

  // ---- smoothing (Laplacian) ----
  smooth(iterations = 1, lambda = 0.5) {
    const adj = this.buildAdjacency();
    for (let it = 0; it < iterations; it++) {
      const next = this.vertices.map((v) => v.clone());
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
    if (this.liveSymmetryX) this.symmetryProject(1e-6);
    this.needsSync = true;
  }

  // ---- mirror ----
  mirrorX(eps = 1e-4) {
    const baseCount = this.vertices.length;
    for (let i = 0; i < baseCount; i++) {
      const v = this.vertices[i];
      if (v.x > eps) this.vertices.push(new THREE.Vector3(-v.x, v.y, v.z));
    }
    const facesSnapshot = this.faces.slice();
    for (const [a, b, c] of facesSnapshot) {
      const va = this.vertices[a],
        vb = this.vertices[b],
        vc = this.vertices[c];
      if (va.x > eps || vb.x > eps || vc.x > eps) {
        const ia = this.findMirroredIndex(a, eps);
        const ib = this.findMirroredIndex(b, eps);
        const ic = this.findMirroredIndex(c, eps);
        this.faces.push([ic, ib, ia]); // reversed winding
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
      if (
        Math.abs(u.x - tx) < eps &&
        Math.abs(u.y - v.y) < eps &&
        Math.abs(u.z - v.z) < eps
      ) {
        return j;
      }
    }
    this.vertices.push(new THREE.Vector3(-v.x, v.y, v.z));
    return this.vertices.length - 1;
  }

  /** project symmetric pairs to exact plane X=0 */
  private symmetryProject(eps: number) {
    for (let i = 0; i < this.vertices.length; i++) {
      const v = this.vertices[i];
      if (Math.abs(v.x) < eps) v.x = 0;
    }
  }

  weld(eps: number) {
    const map = new Map<string, number>();
    const keyOf = (v: THREE.Vector3) =>
      `${Math.round(v.x / eps)}_${Math.round(v.y / eps)}_${Math.round(
        v.z / eps
      )}`;

    const remap: number[] = new Array(this.vertices.length);
    const newVerts: THREE.Vector3[] = [];
    for (let i = 0; i < this.vertices.length; i++) {
      const k = keyOf(this.vertices[i]);
      if (map.has(k)) {
        remap[i] = map.get(k)!;
      } else {
        const ni = newVerts.length;
        map.set(k, ni);
        newVerts.push(this.vertices[i].clone());
        remap[i] = ni;
      }
    }
    this.vertices = newVerts;
    this.faces = this.faces.map(([a, b, c]) => [remap[a], remap[b], remap[c]]);
    this.needsSync = true;
  }

  /** weld by distance (euclidean) */
  weldByDistance(threshold = 1e-3) {
    const remap = new Int32Array(this.vertices.length).fill(-1);
    let nextIdx = 0;
    const newVerts: THREE.Vector3[] = [];
    for (let i = 0; i < this.vertices.length; i++) {
      if (remap[i] >= 0) continue;
      const base = this.vertices[i];
      remap[i] = nextIdx;
      for (let j = i + 1; j < this.vertices.length; j++) {
        if (remap[j] >= 0) continue;
        if (base.distanceToSquared(this.vertices[j]) <= threshold * threshold) {
          remap[j] = nextIdx;
        }
      }
      newVerts.push(base.clone());
      nextIdx++;
    }
    this.vertices = newVerts;
    this.faces = this.faces.map(([a, b, c]) => [remap[a], remap[b], remap[c]]);
    this.needsSync = true;
  }

  /** recompute derived edge list and adjacency (after geom change) */
  private rebuildEdges() {
    const set = new Set<string>();
    const key = (i: number, j: number) => (i < j ? `${i}_${j}` : `${j}_${i}`);
    const eArr: number[][] = [];
    const e2f: Map<string, number[]> = new Map();

    for (let fi = 0; fi < this.faces.length; fi++) {
      const [a, b, c] = this.faces[fi];
      const trip = [
        [a, b],
        [b, c],
        [c, a],
      ];
      for (const [i, j] of trip) {
        const k = key(i, j);
        if (!set.has(k)) {
          set.add(k);
          eArr.push(i < j ? [i, j] : [j, i]);
        }
        const arr = e2f.get(k) ?? [];
        arr.push(fi);
        e2f.set(k, arr);
      }
    }
    this.edges = eArr;
    this.edgeToFaces = e2f;
  }

  /** recompute normals (per-face) and push geometry buffers */
  sync() {
    if (!this.needsSync) return this.geom;

    // prune degenerate faces
    this.faces = this.faces.filter(([a, b, c]) => {
      const va = this.vertices[a],
        vb = this.vertices[b],
        vc = this.vertices[c];
      return (
        a !== b &&
        b !== c &&
        c !== a &&
        !va.equals(vb) &&
        !vb.equals(vc) &&
        !vc.equals(va) &&
        new THREE.Vector3()
          .copy(vb)
          .sub(va)
          .cross(new THREE.Vector3().copy(vc).sub(va))
          .lengthSq() > 1e-12
      );
    });

    const pos = new Float32Array(this.faces.length * 9);
    const nrm = new Float32Array(this.faces.length * 9);

    const va = new THREE.Vector3(),
      vb = new THREE.Vector3(),
      vc = new THREE.Vector3(),
      ab = new THREE.Vector3(),
      ac = new THREE.Vector3(),
      n = new THREE.Vector3();

    let p = 0,
      q = 0;
    for (const [a, b, c] of this.faces) {
      va.copy(this.vertices[a]);
      vb.copy(this.vertices[b]);
      vc.copy(this.vertices[c]);

      pos[p++] = va.x;
      pos[p++] = va.y;
      pos[p++] = va.z;
      pos[p++] = vb.x;
      pos[p++] = vb.y;
      pos[p++] = vb.z;
      pos[p++] = vc.x;
      pos[p++] = vc.y;
      pos[p++] = vc.z;

      n.copy(ab.copy(vb).sub(va).cross(ac.copy(vc).sub(va))).normalize();
      for (let i = 0; i < 3; i++) {
        nrm[q++] = n.x;
        nrm[q++] = n.y;
        nrm[q++] = n.z;
      }
    }

    const g = this.geom;
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("normal", new THREE.BufferAttribute(nrm, 3));
    g.computeBoundingSphere();

    this.rebuildEdges();
    this.needsSync = false;
    return g;
  }

  // ---- Serialize ----
  toJSON() {
    return {
      vertices: this.vertices.map((v) => [v.x, v.y, v.z]),
      faces: this.faces.map((f) => [...f]),
      liveSymmetryX: this.liveSymmetryX,
    };
  }
  fromJSON(data: { vertices: number[][]; faces: number[][]; liveSymmetryX?: boolean }) {
    this.vertices = data.vertices.map(
      ([x, y, z]) => new THREE.Vector3(x, y, z)
    );
    this.faces = data.faces.map(([a, b, c]) => [a, b, c]);
    this.liveSymmetryX = !!data.liveSymmetryX;
    this.needsSync = true;
  }
}

/** ====================== Component ====================== */
export default function ModelingViewPro() {
  const hostRef = useRef<HTMLDivElement | null>(null);

  // UI states
  const [wireframe, setWireframe] = useState(false);
  const [selMode, setSelMode] = useState<SelMode>("vertex");
  const [tool, setTool] = useState<Tool>("select");
  const [status, setStatus] = useState<string>("");

  const [axis, setAxis] = useState<Axis>("none");
  const [snapOn, setSnapOn] = useState<boolean>(false);
  const [snapStep, setSnapStep] = useState<number>(0.5);
  const [snapAngle, setSnapAngle] = useState<number>(15); // deg
  const [snapScale, setSnapScale] = useState<number>(0.1);

  const [jsonModal, setJsonModal] = useState<null | { mode: "import" | "export"; text: string }>(null);
  const [helpOpen, setHelpOpen] = useState<boolean>(false);
  const [primitiveOpen, setPrimitiveOpen] = useState<boolean>(false);

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
  const edgeHelperRef = useRef<THREE.LineSegments<THREE.BufferGeometry, THREE.LineBasicMaterial> | null>(null);
  const hoverHelperRef = useRef<THREE.Object3D | null>(null);
  const groundRef = useRef<THREE.Mesh<THREE.PlaneGeometry, THREE.Material> | null>(null);

  const selection = useRef<Selection>(null);
  const hoverHit = useRef<HoverHit>(null);
  const triBuffer = useRef<number[]>([]);
  const dragging = useRef<{
    active: boolean;
    startPoint?: THREE.Vector3;
    lastPoint?: THREE.Vector3;
    startVerts?: Map<number, THREE.Vector3>; // for transform
    startCenter?: THREE.Vector3;
  }>({ active: false });

  // undo/redo
  const undoStack = useRef<string[]>([]);
  const redoStack = useRef<string[]>([]);
  const pushUndo = () => {
    undoStack.current.push(JSON.stringify(editable.current.toJSON()));
    if (undoStack.current.length > 200) undoStack.current.shift();
    redoStack.current = [];
  };
  const doUndo = () => {
    if (!undoStack.current.length) return;
    const cur = JSON.stringify(editable.current.toJSON());
    redoStack.current.push(cur);
    const prev = undoStack.current.pop()!;
    editable.current.fromJSON(JSON.parse(prev));
    editable.current.needsSync = true;
    setStatus("Undo");
  };
  const doRedo = () => {
    if (!redoStack.current.length) return;
    const cur = JSON.stringify(editable.current.toJSON());
    undoStack.current.push(cur);
    const next = redoStack.current.pop()!;
    editable.current.fromJSON(JSON.parse(next));
    editable.current.needsSync = true;
    setStatus("Redo");
  };

  // ===== init =====
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

    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(400, 400),
      new THREE.MeshBasicMaterial({ visible: false })
    );
    ground.rotateX(-Math.PI / 2);
    scene.add(ground);
    groundRef.current = ground;

    /** editable prim (autosave) */
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
    pts.renderOrder = 3;
    scene.add(pts);
    helperPointsRef.current = pts;

    const edgeLines = new THREE.LineSegments(
      new THREE.BufferGeometry(),
      new THREE.LineBasicMaterial({ color: 0x6aa0ff, opacity: 0.85, transparent: true })
    );
    edgeLines.renderOrder = 2;
    scene.add(edgeLines);
    edgeHelperRef.current = edgeLines;

    const faceLines = new THREE.LineSegments(
      new THREE.BufferGeometry(),
      new THREE.LineBasicMaterial({ color: 0xffffff, opacity: 0.08, transparent: true })
    );
    faceLines.renderOrder = 1;
    scene.add(faceLines);
    faceHelperRef.current = faceLines;

    // hover helper container
    const hoverRoot = new THREE.Object3D();
    scene.add(hoverRoot);
    hoverHelperRef.current = hoverRoot;

    refreshHelpersFull();

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
        refreshHelpersFull();
      }
      renderer.render(scene, camera);

      // 간단 autosave: 3초마다 저장
      if (t - autosaveTimer > 3000) {
        localStorage.setItem(
          "modeling.autosave",
          JSON.stringify(editable.current.toJSON())
        );
        autosaveTimer = t;
      }

      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    /** events */
    const onPointerDown = (ev: PointerEvent) => handlePointerDown(ev);
    const onPointerMove = (ev: PointerEvent) => handlePointerMove(ev);
    const onPointerUp = () => handlePointerUp();
    const onDrop = (e: DragEvent) => handleDrop(e);
    const onDrag = (e: DragEvent) => e.preventDefault();

    renderer.domElement.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerup", onPointerUp);
    renderer.domElement.addEventListener("dragover", onDrag);
    renderer.domElement.addEventListener("drop", onDrop);

    const onKey = (e: KeyboardEvent) => handleKey(e);
    window.addEventListener("keydown", onKey);

    /** cleanup */
    return () => {
      cancelAnimationFrame(raf);
      renderer.domElement.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove as any);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("keydown", onKey);
      renderer.domElement.removeEventListener("dragover", onDrag);
      renderer.domElement.removeEventListener("drop", onDrop);
      ro.disconnect();

      // dispose safely
      scene.traverse((obj) => {
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
      edgeHelperRef.current = null;
      meshRef.current = null;
      materialRef.current = null;
      groundRef.current = null;
      hoverHelperRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // wireframe 반영
  useEffect(() => {
    if (materialRef.current) materialRef.current.wireframe = wireframe;
  }, [wireframe]);

  /** ===== Helpers refresh ===== */
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

  function refreshEdgeHelpers() {
    const lines = edgeHelperRef.current;
    if (!lines) return;
    const ed = editable.current;
    const arr: number[] = [];
    for (const [i, j] of ed.edges) {
      const vi = ed.vertices[i], vj = ed.vertices[j];
      arr.push(vi.x, vi.y, vi.z, vj.x, vj.y, vj.z);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(new Float32Array(arr), 3));
    lines.geometry.dispose();
    lines.geometry = g;
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

  function refreshHelpersFull() {
    refreshVertexHelpers();
    refreshEdgeHelpers();
    refreshFaceHelpers();
    refreshHoverHelper();
  }

  function refreshHoverHelper() {
    const root = hoverHelperRef.current;
    if (!root) return;
    // clear
    while (root.children.length) {
      const c = root.children.pop()!;
      (c as any).geometry?.dispose?.();
      const mat = (c as any).material;
      if (Array.isArray(mat)) mat.forEach((m: any) => m?.dispose?.());
      else mat?.dispose?.();
    }

    if (!hoverHit.current) return;
    const ed = editable.current;

    if (hoverHit.current.kind === "vertex") {
      const i = hoverHit.current.index;
      const v = ed.vertices[i];
      const g = new THREE.BufferGeometry().setFromPoints([v]);
      const m = new THREE.PointsMaterial({ size: 10, sizeAttenuation: false, color: 0xfff176 });
      const pts = new THREE.Points(g, m);
      pts.renderOrder = 5;
      root.add(pts);
    } else if (hoverHit.current.kind === "edge") {
      const [i, j] = ed.edges[hoverHit.current.index];
      const a = ed.vertices[i], b = ed.vertices[j];
      const arr = new Float32Array([a.x, a.y, a.z, b.x, b.y, b.z]);
      const g = new THREE.BufferGeometry();
      g.setAttribute("position", new THREE.BufferAttribute(arr, 3));
      const m = new THREE.LineBasicMaterial({ color: 0xfff176, linewidth: 2 });
      const ln = new THREE.LineSegments(g, m);
      ln.renderOrder = 5;
      root.add(ln);
    } else if (hoverHit.current.kind === "face") {
      const [a, b, c] = ed.faces[hoverHit.current.index];
      const va = ed.vertices[a], vb = ed.vertices[b], vc = ed.vertices[c];
      const arr = new Float32Array([
        va.x, va.y, va.z, vb.x, vb.y, vb.z,
        vb.x, vb.y, vb.z, vc.x, vc.y, vc.z,
        vc.x, vc.y, vc.z, va.x, va.y, va.z,
      ]);
      const g = new THREE.BufferGeometry();
      g.setAttribute("position", new THREE.BufferAttribute(arr, 3));
      const m = new THREE.LineBasicMaterial({ color: 0xfff176, linewidth: 2 });
      const ln = new THREE.LineSegments(g, m);
      ln.renderOrder = 5;
      root.add(ln);
    }
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

  /** screen helper */
  function toScreen(v: THREE.Vector3) {
    const cam = cameraRef.current!;
    const p = v.clone().project(cam);
    return new THREE.Vector2(p.x, p.y);
  }

  /** picking */
  function pickHover(): HoverHit {
    const ed = editable.current;
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

    if (selMode === "edge") {
      let best = -1, bestD = 1e9;
      const p = new THREE.Vector2(), q = new THREE.Vector2();
      for (let i = 0; i < ed.edges.length; i++) {
        const [a, b] = ed.edges[i];
        p.copy(toScreen(ed.vertices[a]));
        q.copy(toScreen(ed.vertices[b]));
        const d = distancePointToSegment(mouse, p, q);
        if (d < bestD) { bestD = d; best = i; }
      }
      if (best >= 0 && bestD < 0.03) return { kind: "edge", index: best };
      return null;
    }

    // face ray test
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

  function distancePointToSegment(p: THREE.Vector2, a: THREE.Vector2, b: THREE.Vector2) {
    const ab = b.clone().sub(a);
    const t = Math.max(0, Math.min(1, p.clone().sub(a).dot(ab) / ab.lengthSq()));
    const proj = a.clone().add(ab.multiplyScalar(t));
    return proj.distanceTo(p);
  }

  /** centroid utils */
  function faceCentroid(faceIndex: number) {
    const ed = editable.current;
    const [a, b, c] = ed.faces[faceIndex];
    const va = ed.vertices[a], vb = ed.vertices[b], vc = ed.vertices[c];
    return new THREE.Vector3().add(va).add(vb).add(vc).multiplyScalar(1 / 3);
  }
  function selectionCenter(sel: Selection): THREE.Vector3 | null {
    const ed = editable.current;
    if (!sel) return null;
    const sum = new THREE.Vector3();
    let cnt = 0;
    if (sel.kind === "vertex") {
      for (const i of sel.indices) { sum.add(ed.vertices[i]); cnt++; }
    } else if (sel.kind === "edge") {
      for (const eIdx of sel.indices) {
        const [a, b] = ed.edges[eIdx];
        sum.add(ed.vertices[a]).add(ed.vertices[b]); cnt += 2;
      }
    } else if (sel.kind === "face") {
      for (const f of sel.indices) { sum.add(faceCentroid(f)); cnt++; }
    }
    if (!cnt) return null;
    return sum.multiplyScalar(1 / cnt);
  }

  /** snap helpers */
  const snapVec = (v: THREE.Vector3, step = snapStep) => {
    v.x = Math.round(v.x / step) * step;
    v.y = Math.round(v.y / step) * step;
    v.z = Math.round(v.z / step) * step;
    return v;
  };
  const snapDeg = (deg: number) => Math.round(deg / snapAngle) * snapAngle;
  const snapS = (s: number) => Math.round(s / snapScale) * snapScale;

  /** ===== pointer handlers ===== */
  function handlePointerDown(ev: PointerEvent) {
    if (!rendererRef.current) return;
    setPointerNDC(ev);

    // hover update
    hoverHit.current = pickHover();
    refreshHoverHelper();

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
      const hit = pickHover();
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
      const hit = pickHover();
      const multi = (ev.shiftKey || ev.ctrlKey || ev.metaKey);
      applySelectionFromHit(hit, multi, ev.ctrlKey || ev.metaKey);
      return;
    }

    if (tool === "move" || tool === "rotate" || tool === "scale") {
      if (!selection.current) {
        setStatus("선택 후 변환하세요");
        return;
      }
      const p = intersectGround();
      const center = selectionCenter(selection.current) ?? p ?? new THREE.Vector3();
      dragging.current = {
        active: true,
        startPoint: p ?? undefined,
        lastPoint: p ?? undefined,
        startCenter: center.clone(),
        startVerts: captureSelectedVertices(selection.current),
      };
      if (controlsRef.current) controlsRef.current.enabled = false;
      setStatus(`드래그로 ${tool} ${axis !== "none" ? `[${axis.toUpperCase()} 고정]` : ""}`);
      pushUndo();
      return;
    }

    if (tool === "extrude-face") {
      if (selMode !== "face") { setStatus("면 모드에서 Extrude"); return; }
      const hit = pickHover();
      if (!hit || hit.kind !== "face") { setStatus("면을 선택하세요"); return; }
      ensureSelectionKind("face");
      addOrReplaceSelectionIndices([hit.index], ev.shiftKey, ev.ctrlKey || ev.metaKey);
      pushUndo();
      for (const f of (selection.current as any).indices) extrudeFace(f, 0.2);
      setStatus(`면 Extrude (${(selection.current as any).indices.length})`);
      return;
    }

    if (tool === "bevel-inset") {
      if (selMode !== "face") { setStatus("면 모드에서 Inset"); return; }
      const hit = pickHover();
      if (!hit || hit.kind !== "face") { setStatus("면을 선택하세요"); return; }
      ensureSelectionKind("face");
      addOrReplaceSelectionIndices([hit.index], ev.shiftKey, ev.ctrlKey || ev.metaKey);
      pushUndo();
      for (const f of (selection.current as any).indices) insetFace(f, 0.2, 0.0);
      setStatus(`면 Inset (${(selection.current as any).indices.length})`);
      return;
    }
  }

  function handlePointerMove(ev: PointerEvent) {
    if (!rendererRef.current) return;
    setPointerNDC(ev);

    // hover update (only when not dragging transform)
    if (!dragging.current.active) {
      const h = pickHover();
      const changed =
        h?.kind !== hoverHit.current?.kind ||
        (h && hoverHit.current && (h as any).index !== (hoverHit.current as any).index) ||
        (!h && !!hoverHit.current);
      if (changed) {
        hoverHit.current = h;
        refreshHoverHelper();
      }
      return;
    }

    // transform drag
    if (!dragging.current.startPoint || !dragging.current.startVerts) return;
    const cur = intersectGround();
    if (!cur || !dragging.current.lastPoint) return;

    const delta = cur.clone().sub(dragging.current.lastPoint);
    if (axis === "x") delta.setY(0).setZ(0);
    if (axis === "y") delta.setX(0).setZ(0);
    if (axis === "z") delta.setX(0).setY(0);

    const center = dragging.current.startCenter ?? new THREE.Vector3();

    if (tool === "move") {
      applyMove(delta, ev.shiftKey || snapOn);
    } else if (tool === "rotate") {
      const worldAxis =
        axis === "x"
          ? new THREE.Vector3(1, 0, 0)
          : axis === "y"
          ? new THREE.Vector3(0, 1, 0)
          : axis === "z"
          ? new THREE.Vector3(0, 0, 1)
          : new THREE.Vector3(0, 1, 0); // default Y
      const deg = delta.length() * 180; // heuristic
      const angle = ((ev.shiftKey || snapOn) ? THREE.MathUtils.degToRad(snapDeg(deg)) : THREE.MathUtils.degToRad(deg)) * Math.sign(delta.dot(worldAxis));
      applyRotate(center, worldAxis, angle);
    } else if (tool === "scale") {
      const sRaw = 1 + delta.length() * Math.sign(delta.x + delta.y + delta.z) * 0.5;
      const s = (ev.shiftKey || snapOn) ? Math.max(0.0001, snapS(sRaw)) : sRaw;
      applyScale(center, s);
    }

    editable.current.needsSync = true;
    dragging.current.lastPoint = cur;
  }

  function handlePointerUp() {
    if (!dragging.current.active) return;
    dragging.current.active = false;
    if (controlsRef.current) controlsRef.current.enabled = true;
    dragging.current.startVerts = undefined;
    setStatus(`${tool} 완료`);
  }

  /** ===== selection helpers ===== */
  function ensureSelectionKind(kind: "vertex" | "edge" | "face") {
    if (!selection.current || selection.current.kind !== kind) {
      selection.current = { kind, indices: [] as number[] } as any;
    }
  }
  function addOrReplaceSelectionIndices(
    indices: number[],
    shift: boolean,
    toggle: boolean
  ) {
    ensureSelectionKind(selMode);
    const cur = selection.current as any;
    if (!shift && !toggle) {
      cur.indices = [...indices];
    } else if (toggle) {
      // toggle indices
      const set = new Set<number>(cur.indices);
      for (const i of indices) {
        if (set.has(i)) set.delete(i);
        else set.add(i);
      }
      cur.indices = Array.from(set.values());
    } else {
      // add
      const set = new Set<number>(cur.indices);
      indices.forEach((i) => set.add(i));
      cur.indices = Array.from(set.values());
    }
    setStatus(
      `${cur.kind} 선택 ${cur.indices.length ? `(${cur.indices.length})` : "해제"}`
    );
  }

  function applySelectionFromHit(hit: HoverHit, multi: boolean, toggle: boolean) {
    if (!hit) {
      if (!multi) selection.current = null;
      setStatus("선택 해제");
      return;
    }
    if (hit.kind !== selMode) {
      // switch to mode of what you clicked
      setSelMode(hit.kind);
    }
    ensureSelectionKind(hit.kind);
    addOrReplaceSelectionIndices([hit.index], multi, toggle);
  }

  function captureSelectedVertices(sel: Selection) {
    const ed = editable.current;
    const map = new Map<number, THREE.Vector3>();
    if (!sel) return map;

    if (sel.kind === "vertex") {
      for (const i of sel.indices) map.set(i, ed.vertices[i].clone());
    } else if (sel.kind === "edge") {
      for (const e of sel.indices) {
        const [a, b] = ed.edges[e];
        map.set(a, ed.vertices[a].clone());
        map.set(b, ed.vertices[b].clone());
      }
    } else if (sel.kind === "face") {
      for (const f of sel.indices) {
        const [a, b, c] = ed.faces[f];
        map.set(a, ed.vertices[a].clone());
        map.set(b, ed.vertices[b].clone());
        map.set(c, ed.vertices[c].clone());
      }
    }
    return map;
  }

  /** ===== transforms ===== */
  function applyMove(delta: THREE.Vector3, doSnap: boolean) {
    const ed = editable.current;
    const st = dragging.current.startVerts!;
    for (const [i, startV] of st.entries()) {
      const np = startV.clone().add(delta);
      if (doSnap) snapVec(np);
      ed.vertices[i].copy(np);
      if (ed.liveSymmetryX && np.x > 1e-6) {
        // move mirrored partner too
        const mi = ed["findMirroredIndex"](i as any, 1e-6);
        ed.vertices[mi].set(-np.x, np.y, np.z);
      }
    }
  }
  function applyRotate(center: THREE.Vector3, axis: THREE.Vector3, angle: number) {
    const ed = editable.current;
    const st = dragging.current.startVerts!;
    const q = new THREE.Quaternion().setFromAxisAngle(axis.normalize(), angle);
    for (const [i, startV] of st.entries()) {
      const p = startV.clone().sub(center).applyQuaternion(q).add(center);
      ed.vertices[i].copy(p);
    }
    if (ed.liveSymmetryX) ed["symmetryProject"](1e-6);
  }
  function applyScale(center: THREE.Vector3, s: number) {
    const ed = editable.current;
    const st = dragging.current.startVerts!;
    for (const [i, startV] of st.entries()) {
      const p = startV.clone().sub(center).multiplyScalar(s).add(center);
      ed.vertices[i].copy(p);
    }
    if (ed.liveSymmetryX) ed["symmetryProject"](1e-6);
  }

  /** ===== actions ===== */
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

  function insetFace(faceIndex: number, inset = 0.2, height = 0) {
    const ed = editable.current;
    const [a, b, c] = ed.faces[faceIndex];
    const va = ed.vertices[a], vb = ed.vertices[b], vc = ed.vertices[c];

    // face normal & centroid
    const n = new THREE.Vector3().copy(vb).sub(va).cross(new THREE.Vector3().copy(vc).sub(va)).normalize();
    const centroid = new THREE.Vector3().add(va).add(vb).add(vc).multiplyScalar(1 / 3);

    // inner verts
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
  function toggleSymmetryX() {
    editable.current.liveSymmetryX = !editable.current.liveSymmetryX;
    setStatus(`라이브 대칭 X: ${editable.current.liveSymmetryX ? "On" : "Off"}`);
  }
  function doSmooth() {
    pushUndo();
    editable.current.smooth(2, 0.5);
    setStatus("스무스(2회, λ=0.5)");
  }
  function doWeld() {
    pushUndo();
    editable.current.weldByDistance(1e-3);
    setStatus("Weld by Distance (1e-3)");
  }
  function doRecalcNormals() {
    editable.current.needsSync = true;
    setStatus("Recalculate Normals");
  }

  function doDelete() {
    if (!selection.current) return;
    pushUndo();
    const ed = editable.current;
    if (selection.current.kind === "face") {
      // delete faces
      const idxs = new Set(selection.current.indices);
      ed.faces = ed.faces.filter((_, i) => !idxs.has(i));
      setStatus(`면 삭제 (${idxs.size})`);
    } else if (selection.current.kind === "vertex") {
      // delete only isolated ones
      let del = 0;
      const sorted = [...selection.current.indices].sort((a, b) => b - a);
      for (const i of sorted) if (ed.removeVertexIfIsolated(i)) del++;
      setStatus(del ? `정점 삭제 (${del})` : "정점 삭제 불가(면에서 사용 중)");
    } else if (selection.current.kind === "edge") {
      // detach edges: split faces that include them (delete adjacent faces)
      const delFaces = new Set<number>();
      for (const e of selection.current.indices) {
        const [a, b] = ed.edges[e];
        const key = a < b ? `${a}_${b}` : `${b}_${a}`;
        const faces = ed.edgeToFaces.get(key) ?? [];
        faces.forEach((fi) => delFaces.add(fi));
      }
      ed.faces = ed.faces.filter((_, i) => !delFaces.has(i));
      setStatus(`간선 인접 면 삭제 (${delFaces.size})`);
    }
    editable.current.needsSync = true;
    selection.current = null;
  }

  function doDuplicate() {
    if (!selection.current) return;
    pushUndo();
    const ed = editable.current;
    if (selection.current.kind === "face") {
      let count = 0;
      for (const idx of selection.current.indices) {
        const [a, b, c] = ed.faces[idx];
        const va = ed.vertices[a], vb = ed.vertices[b], vc = ed.vertices[c];
        const n = new THREE.Vector3().copy(vb).sub(va).cross(new THREE.Vector3().copy(vc).sub(va)).normalize();
        const off = 0.05;
        const ia = ed.vertices.push(va.clone().addScaledVector(n, off)) - 1;
        const ib = ed.vertices.push(vb.clone().addScaledVector(n, off)) - 1;
        const ic = ed.vertices.push(vc.clone().addScaledVector(n, off)) - 1;
        ed.addFace(ia, ib, ic);
        count++;
      }
      setStatus(`면 복제(+offset) x${count}`);
    } else if (selection.current.kind === "vertex") {
      for (const i of selection.current.indices) {
        const nv = ed.vertices[i].clone().add(new THREE.Vector3(0.05, 0, 0));
        ed.addVertex(nv);
      }
      setStatus(`정점 복제(+X) x${selection.current.indices.length}`);
    } else if (selection.current.kind === "edge") {
      for (const e of selection.current.indices) {
        const [a, b] = ed.edges[e];
        const mid = new THREE.Vector3().addVectors(ed.vertices[a], ed.vertices[b]).multiplyScalar(0.5);
        ed.addVertex(mid);
      }
      setStatus(`간선 중점 정점 추가 x${selection.current.indices.length}`);
    }
  }

  /** split an edge: add midpoint vertex and retriangulate adjacent faces */
  function doSplitEdge() {
    if (!selection.current || selection.current.kind !== "edge") { setStatus("간선 선택 후 Split"); return; }
    pushUndo();
    const ed = editable.current;
    let created = 0;
    for (const e of selection.current.indices) {
      const [a, b] = ed.edges[e];
      const key = a < b ? `${a}_${b}` : `${b}_${a}`;
      const faces = ed.edgeToFaces.get(key) ?? [];
      const mIdx = ed.vertices.push(new THREE.Vector3().addVectors(ed.vertices[a], ed.vertices[b]).multiplyScalar(0.5)) - 1;

      // for each adjacent face, replace it with two faces via midpoint
      for (const fi of faces) {
        if (!ed.faces[fi]) continue;
        const [x, y, z] = ed.faces[fi];
        if ((x === a && y === b) || (x === b && y === a)) {
          // edge is (x,y)
          ed.faces[fi] = [x, mIdx, z];
          ed.addFace(mIdx, y, z);
        } else if ((y === a && z === b) || (y === b && z === a)) {
          ed.faces[fi] = [y, mIdx, x];
          ed.addFace(mIdx, z, x);
        } else if ((z === a && x === b) || (z === b && x === a)) {
          ed.faces[fi] = [z, mIdx, y];
          ed.addFace(mIdx, x, y);
        }
      }
      created++;
    }
    editable.current.needsSync = true;
    setStatus(`Split Edge x${created}`);
  }

  /** merge selected vertices into their average */
  function doMergeVertices() {
    if (!selection.current || selection.current.kind !== "vertex" || selection.current.indices.length < 2) {
      setStatus("정점 2개 이상 선택 후 Merge");
      return;
    }
    pushUndo();
    const ed = editable.current;
    const avg = selection.current.indices
      .map((i) => ed.vertices[i])
      .reduce((a, v) => a.add(v), new THREE.Vector3())
      .multiplyScalar(1 / selection.current.indices.length);

    const base = selection.current.indices[0];
    ed.vertices[base].copy(avg);
    // remap others to base
    const remap = new Map<number, number>();
    for (let k = 1; k < selection.current.indices.length; k++) {
      remap.set(selection.current.indices[k], base);
    }
    ed.faces = ed.faces.map(([a, b, c]) => [
      remap.get(a) ?? a,
      remap.get(b) ?? b,
      remap.get(c) ?? c,
    ]);
    ed.weldByDistance(1e-9);
    setStatus(`Merge Vertices (${selection.current.indices.length} -> 1)`);
  }

  /** frame helpers */
  function frameSelection() {
    const s = selection.current;
    if (!s || !cameraRef.current || !controlsRef.current || !meshRef.current) return;
    const center = selectionCenter(s);
    if (!center) return;
    const cam = cameraRef.current, ctrl = controlsRef.current;
    ctrl.target.copy(center);
    cam.position.sub(ctrl.target).add(center);
    setStatus("프레이밍(선택)");
  }
  function frameAll() {
    if (!cameraRef.current || !controlsRef.current || !meshRef.current) return;
    const g = meshRef.current.geometry as THREE.BufferGeometry;
    g.computeBoundingSphere();
    const bs = g.boundingSphere;
    if (!bs) return;
    const r = bs.radius;
    const cam = cameraRef.current, ctrl = controlsRef.current;
    ctrl.target.copy(bs.center);
    const dist = r / Math.sin(THREE.MathUtils.degToRad(cam.fov * 0.5));
    const dir = cam.position.clone().sub(ctrl.target).normalize();
    cam.position.copy(ctrl.target).add(dir.multiplyScalar(dist * 1.2));
    cam.updateProjectionMatrix();
    setStatus("프레이밍(전체)");
  }

  /** keyboard */
  function handleKey(e: KeyboardEvent) {
    const tag = (e.target as HTMLElement)?.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA") return;

    // save/open
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") { e.preventDefault(); exportJSONToFile(); return; }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "o") { e.preventDefault(); doImportJSON(); return; }

    // Undo/Redo
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") { e.preventDefault(); doUndo(); return; }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") { e.preventDefault(); doRedo(); return; }

    // Select mode
    if (e.key === "1") { setSelMode("vertex"); setStatus("Select Mode: Vertex"); return; }
    if (e.key === "2") { setSelMode("edge"); setStatus("Select Mode: Edge"); return; }
    if (e.key === "3") { setSelMode("face"); setStatus("Select Mode: Face"); return; }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "a") {
      e.preventDefault();
      if (selMode === "vertex") selection.current = { kind: "vertex", indices: editable.current.vertices.map((_, i) => i) };
      else if (selMode === "edge") selection.current = { kind: "edge", indices: editable.current.edges.map((_, i) => i) };
      else selection.current = { kind: "face", indices: editable.current.faces.map((_, i) => i) };
      setStatus("모두 선택");
      return;
    }

    // Tools
    if (e.key.toLowerCase() === "q") { setTool("select"); setStatus("Tool: Select"); return; }
    if (e.key.toLowerCase() === "w") { setTool("move"); setStatus("Tool: Move"); return; }
    if (e.key.toLowerCase() === "e") { setTool("rotate"); setStatus("Tool: Rotate"); return; }
    if (e.key.toLowerCase() === "r") { setTool("scale"); setStatus("Tool: Scale"); return; }
    if (e.key.toLowerCase() === "a") { setTool("add-vertex"); setStatus("Tool: Add Vertex"); return; }
    if (e.key.toLowerCase() === "t") { setTool("make-triangle"); setStatus("Tool: Make Triangle"); return; }
    if (e.key.toLowerCase() === "b") { setTool("bevel-inset"); setStatus("Tool: Bevel/Inset"); return; }
    if (e.key.toLowerCase() === "p") { setPrimitiveOpen((v) => !v); setStatus("프리미티브"); return; }

    // Editing ops
    if (e.key.toLowerCase() === "x") { setAxis((a) => (a === "x" ? "none" : "x")); setStatus(`Axis: ${axis === "x" ? "none" : "X"}`); return; }
    if (e.key.toLowerCase() === "y") { setAxis((a) => (a === "y" ? "none" : "y")); setStatus(`Axis: ${axis === "y" ? "none" : "Y"}`); return; }
    if (e.key.toLowerCase() === "z") { setAxis((a) => (a === "z" ? "none" : "z")); setStatus(`Axis: ${axis === "z" ? "none" : "Z"}`); return; }
    if (e.key === "Delete") { doDelete(); return; }
    if (e.key.toLowerCase() === "d") { doDuplicate(); return; }
    if (e.key.toLowerCase() === "f") { frameSelection(); return; }
    if (e.key === ";") { toggleSymmetryX(); return; }
    if (e.key.toLowerCase() === "m") { doMirror(); return; }
    if (e.key.toLowerCase() === "h") { setHelpOpen((v) => !v); return; }
    if (e.key.toLowerCase() === "y") { doSplitEdge(); return; } // Split edge
  }

  /** Drag&Drop import (.json) */
  async function handleDrop(e: DragEvent) {
    e.preventDefault();
    if (!e.dataTransfer?.files?.length) return;
    const file = e.dataTransfer.files[0];
    if (!file.name.endsWith(".json")) { setStatus("JSON 파일만 지원"); return; }
    const text = await file.text();
    try {
      pushUndo();
      editable.current.fromJSON(JSON.parse(text));
      setStatus(`Import: ${file.name}`);
    } catch (err) {
      setStatus("Import 실패: " + err);
    }
  }

  /** ===== JSON Import/Export ===== */
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
      setStatus("JSON 파싱 실패 :" + e);
    }
  };
  function exportJSONToFile() {
    const blob = new Blob([JSON.stringify(editable.current.toJSON(), null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.download = "model.json";
    a.href = url;
    a.click();
    URL.revokeObjectURL(url);
    setStatus("JSON 다운로드");
  }

  /** ===== primitives ===== */
  function addTriangle() {
    pushUndo();
    const ed = editable.current;
    const base = ed.vertices.length;
    ed.addVertex(new THREE.Vector3(0, 0, 0));
    ed.addVertex(new THREE.Vector3(1, 0, 0));
    ed.addVertex(new THREE.Vector3(0, 0, 1));
    ed.addFace(base, base + 1, base + 2);
    setStatus("Primitive: Triangle");
  }
  function addQuad() {
    pushUndo();
    const ed = editable.current;
    const b = ed.vertices.length;
    ed.addVertex(new THREE.Vector3(-0.5, 0, -0.5));
    ed.addVertex(new THREE.Vector3(0.5, 0, -0.5));
    ed.addVertex(new THREE.Vector3(0.5, 0, 0.5));
    ed.addVertex(new THREE.Vector3(-0.5, 0, 0.5));
    ed.addFace(b, b + 1, b + 2);
    ed.addFace(b, b + 2, b + 3);
    setStatus("Primitive: Quad");
  }
  function addCube() {
    pushUndo();
    const ed = editable.current;
    const b = ed.vertices.length;
    const V = [
      new THREE.Vector3(-0.5, -0.5, -0.5),
      new THREE.Vector3(0.5, -0.5, -0.5),
      new THREE.Vector3(0.5, 0.5, -0.5),
      new THREE.Vector3(-0.5, 0.5, -0.5),
      new THREE.Vector3(-0.5, -0.5, 0.5),
      new THREE.Vector3(0.5, -0.5, 0.5),
      new THREE.Vector3(0.5, 0.5, 0.5),
      new THREE.Vector3(-0.5, 0.5, 0.5),
    ];
    V.forEach((v) => ed.addVertex(v));
    const F = [
      [0, 1, 2], [0, 2, 3], // back
      [4, 6, 5], [4, 7, 6], // front
      [0, 4, 5], [0, 5, 1], // bottom
      [2, 6, 7], [2, 7, 3], // top
      [1, 5, 6], [1, 6, 2], // right
      [0, 3, 7], [0, 7, 4], // left
    ];
    for (const [a, b, c] of F) ed.addFace(b + a, b + b, b + c);
    setStatus("Primitive: Cube");
  }

  /** ===== UI ===== */
  const vCount = editable.current.vertices.length;
  const eCount = editable.current.edges.length;
  const fCount = editable.current.faces.length;

  return (
    <div ref={hostRef} className="relative w-full h-full" style={{ minHeight: 560 }}>
      {/* ── Toolbar: Line 1 (Modes & Tools) ── */}
      <div className="absolute top-3 left-3 right-3 z-10 flex flex-wrap items-center gap-2 bg-black/40 backdrop-blur px-3 py-2 rounded-xl text-sm">
        {/* Select mode */}
        <div className="flex items-center gap-1">
          <span className="text-xs opacity-70 mr-1">모드</span>
          {(["vertex", "edge", "face"] as SelMode[]).map((m, i) => (
            <button
              key={m}
              onClick={() => setSelMode(m)}
              className={`px-2 py-1 rounded-lg ${selMode === m ? "bg-white/15" : "hover:bg-white/10"}`}
              title={`선택 모드 (${i + 1})`}
            >
              {m === "vertex" ? "● 정점(1)" : m === "edge" ? "— 간선(2)" : "▱ 면(3)"}
            </button>
          ))}
        </div>

        <div className="w-px h-5 bg-white/10 mx-1" />

        {/* Tools */}
        <div className="flex flex-wrap gap-1">
          {([
            ["select", "Q"], ["move", "W"], ["rotate", "E"], ["scale", "R"],
            ["add-vertex", "A"], ["make-triangle", "T"], ["extrude-face", "Shift+E"], ["bevel-inset", "B"],
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
          <button onClick={doMirror} className="px-2 py-1 rounded-lg hover:bg-white/10" title="M">Mirror X</button>
          <button onClick={toggleSymmetryX} className="px-2 py-1 rounded-lg hover:bg-white/10" title="; (세미콜론)">Symmetry X</button>
          <button onClick={doSmooth} className="px-2 py-1 rounded-lg hover:bg-white/10">Smooth</button>
          <button onClick={doSplitEdge} className="px-2 py-1 rounded-lg hover:bg-white/10" title="Y">Split Edge</button>
          <button onClick={doMergeVertices} className="px-2 py-1 rounded-lg hover:bg-white/10">Merge Verts</button>
          <button onClick={doWeld} className="px-2 py-1 rounded-lg hover:bg-white/10">Weld</button>
          <button onClick={doRecalcNormals} className="px-2 py-1 rounded-lg hover:bg-white/10">Recalc N</button>
          <button onClick={doDuplicate} className="px-2 py-1 rounded-lg hover:bg-white/10" title="D">Duplicate</button>
          <button onClick={doDelete} className="px-2 py-1 rounded-lg hover:bg-white/10" title="Del">Delete</button>
          <button onClick={frameSelection} className="px-2 py-1 rounded-lg hover:bg-white/10" title="F">Frame Sel</button>
          <button onClick={frameAll} className="px-2 py-1 rounded-lg hover:bg-white/10">Fit All</button>
          <button onClick={() => setPrimitiveOpen(v => !v)} className="px-2 py-1 rounded-lg hover:bg-white/10" title="P">Primitives</button>
          <button onClick={() => setHelpOpen(v => !v)} className="px-2 py-1 rounded-lg hover:bg-white/10" title="H">Help</button>
        </div>
      </div>

      {/* ── Toolbar: Line 2 (Snap & JSON) ── */}
      <div className="absolute top-[72px] left-3 right-3 z-10 flex flex-wrap items-center gap-3 bg-black/30 backdrop-blur px-3 py-2 rounded-xl text-xs">
        <div className="flex items-center gap-3">
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
          </div>

          <div className="flex items-center gap-1">
            <span className="opacity-70 mr-1">Angle</span>
            {[5, 10, 15, 30].map(s => (
              <button
                key={s}
                onClick={() => setSnapAngle(s)}
                className={`px-2 py-0.5 rounded ${snapAngle === s ? "bg-white/15" : "hover:bg-white/10"}`}
              >
                {s}°
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1">
            <span className="opacity-70 mr-1">Scale</span>
            {[0.05, 0.1, 0.25].map(s => (
              <button
                key={s}
                onClick={() => setSnapScale(s)}
                className={`px-2 py-0.5 rounded ${snapScale === s ? "bg-white/15" : "hover:bg-white/10"}`}
              >
                {s}
              </button>
            ))}
          </div>

          <span className="opacity-60">※ 드래그 중 Shift = 임시 스냅</span>
        </div>

        <div className="w-px h-5 bg-white/10" />

        <div className="flex items-center gap-2">
          <button onClick={() => { pushUndo(); setStatus("상태 저장(Undo 스냅샷)"); }} className="px-2 py-1 rounded-lg hover:bg-white/10">Snapshot</button>
          <button onClick={doUndo} className="px-2 py-1 rounded-lg hover:bg-white/10">Undo (Ctrl+Z)</button>
          <button onClick={doRedo} className="px-2 py-1 rounded-lg hover:bg-white/10">Redo (Ctrl+Y)</button>
        </div>

        <div className="w-px h-5 bg-white/10" />

        <div className="flex items-center gap-2">
          <button onClick={doExportJSON} className="px-2 py-1 rounded-lg hover:bg-white/10">Export JSON</button>
          <button onClick={exportJSONToFile} className="px-2 py-1 rounded-lg hover:bg-white/10">Download</button>
          <button onClick={doImportJSON} className="px-2 py-1 rounded-lg hover:bg-white/10">Import JSON</button>
        </div>

        <div className="ml-auto text-white/70">
          V:{vCount} | E:{eCount} | F:{fCount}
        </div>
      </div>

      {/* 상태 바 */}
      <div className="absolute bottom-3 left-3 z-10 bg-black/40 backdrop-blur px-3 py-1 rounded-lg text-xs text-white/80">
        {status || "준비됨"}
        {axis !== "none" ? ` | Axis: ${axis.toUpperCase()}` : ""}
        {snapOn ? ` | Snap ${snapStep} | ${snapAngle}° | ×${snapScale}` : ""}
      </div>

      {/* Primitives menu */}
      {primitiveOpen && (
        <div className="absolute top-[132px] left-3 z-20 bg-[#0f141a] border border-white/10 rounded-xl p-3 text-sm">
          <div className="font-semibold mb-2">Primitives</div>
          <div className="flex gap-2">
            <button onClick={addTriangle} className="px-2 py-1 rounded bg-white/10 hover:bg-white/15">Triangle</button>
            <button onClick={addQuad} className="px-2 py-1 rounded bg-white/10 hover:bg-white/15">Quad</button>
            <button onClick={addCube} className="px-2 py-1 rounded bg-white/10 hover:bg-white/15">Cube</button>
          </div>
        </div>
      )}

      {/* 도움말 */}
      {helpOpen && (
        <div className="absolute top-[132px] right-3 z-20 w-[min(520px,90vw)] bg-[#0f141a] border border-white/10 rounded-xl p-4 text-sm leading-6">
          <div className="flex items-center justify-between mb-2">
            <div className="font-semibold">단축키 & 사용법</div>
            <button className="px-2 py-1 rounded hover:bg-white/10" onClick={() => setHelpOpen(false)}>닫기</button>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-white/80">
            <div>모드: 정점/간선/면</div><div>1 / 2 / 3</div>
            <div>툴: Select / Move / Rotate / Scale</div><div>Q / W / E / R</div>
            <div>툴: AddVertex / MakeTriangle / Bevel</div><div>A / T / B</div>
            <div>Extrude(면)</div><div>툴 선택 후 클릭</div>
            <div>축 고정 토글</div><div>X / Y / Z</div>
            <div>와이어프레임</div><div>Shift + W</div>
            <div>Mirror X / Live Symmetry X</div><div>M / ;</div>
            <div>Split Edge / Merge Verts</div><div>Y / 버튼</div>
            <div>선택 프레이밍 / 전체 프레이밍</div><div>F / Fit All</div>
            <div>Undo / Redo</div><div>Ctrl/⌘+Z / Ctrl/⌘+Y</div>
            <div>모두 선택</div><div>Ctrl/⌘+A</div>
            <div>Export/Import</div><div>Ctrl/⌘+S / Ctrl/⌘+O</div>
            <div>멀티선택 / 토글선택</div><div>Shift 클릭 / Ctrl/⌘ 클릭</div>
          </div>
          <div className="mt-3 text-xs text-white/50">
            팁: 드래그 중 <b>Shift</b>로 임시 스냅, 회전은 마우스 이동량 기반 각도. JSON 파일을 뷰포트로 드롭해도 Import 됩니다.
          </div>
        </div>
      )}

      {/* JSON 모달 */}
      {jsonModal && (
        <div className="absolute inset-0 z-20 bg-black/60 flex items-center justify-center">
          <div className="w-[min(820px,90vw)] bg-[#0f141a] border border-white/10 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="font-semibold text-sm">{jsonModal.mode === "export" ? "Export JSON" : "Import JSON"}</div>
              <div className="flex gap-2">
                {jsonModal.mode === "export" && (
                  <button className="px-2 py-1 rounded bg-white/10 hover:bg-white/15" onClick={exportJSONToFile}>Download</button>
                )}
                <button className="px-2 py-1 rounded hover:bg-white/10" onClick={() => setJsonModal(null)}>닫기</button>
              </div>
            </div>
            <textarea
              value={jsonModal.text}
              onChange={e => setJsonModal(m => (m ? { ...m, text: e.target.value } : m))}
              className="w-full h-[40vh] p-2 rounded bg-black/40 border border-white/10 outline-none"
              placeholder={jsonModal.mode === "import" ? "여기에 JSON 붙여넣기 또는 .json 파일을 드롭하세요" : ""}
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
    case "rotate": return "Rotate";
    case "scale": return "Scale";
    case "add-vertex": return "Add Vertex";
    case "make-triangle": return "Make Triangle";
    case "extrude-face": return "Extrude Face";
    case "bevel-inset": return "Bevel/Inset";
  }
}
