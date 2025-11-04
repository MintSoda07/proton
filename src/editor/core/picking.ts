// src/editor/core/picking.ts
import * as THREE from "three";
import type { SelMode, Selection } from "../state/types";


export function pickVertexOrFace(
    selMode: SelMode,
    ed: { vertices: THREE.Vector3[]; faces: number[][] },
    raycaster: THREE.Raycaster,
    camera: THREE.PerspectiveCamera,
    pointerNDC: THREE.Vector2
): Selection {
    const toScreen = (v: THREE.Vector3) => {
        const p = v.clone().project(camera);
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


export function intersectGround(raycaster: THREE.Raycaster, ground: THREE.Object3D | null) {
    if (!ground) return null;
    const hit = raycaster.intersectObject(ground, false)[0];
    return hit ? hit.point.clone() : null;
}