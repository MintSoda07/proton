// src/editor/core/EditableMesh.ts
import * as THREE from "three";

export default class EditableMesh {
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

    removeVertexIfIsolated(index: number) {
        const used = this.faces.some(f => f[0] === index || f[1] === index || f[2] === index);
        if (used) return false;
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
                this.faces.push([ic, ib, ia]);
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
        const keyOf = (v: THREE.Vector3) => `${Math.round(v.x / eps)}_${Math.round(v.y / eps)}_${Math.round(v.z / eps)}`;
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