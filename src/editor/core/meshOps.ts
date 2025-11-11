// src/editor/core/meshOps.ts
import * as THREE from "three";
import EditableMesh from "../core/EditableMesh";


export function faceCentroid(ed: EditableMesh, faceIndex: number) {
    const [a, b, c] = ed.faces[faceIndex];
    const va = ed.vertices[a], vb = ed.vertices[b], vc = ed.vertices[c];
    return new THREE.Vector3().add(va).add(vb).add(vc).multiplyScalar(1 / 3);
}

export function extrudeFace(ed: EditableMesh, faceIndex: number, height = 0.2) {
    const [a, b, c] = ed.faces[faceIndex];
    const va = ed.vertices[a], vb = ed.vertices[b], vc = ed.vertices[c];
    const n = new THREE.Vector3().copy(vb).sub(va).cross(new THREE.Vector3().copy(vc).sub(va)).normalize();
    const ia = ed.vertices.push(va.clone().addScaledVector(n, height)) - 1;
    const ib = ed.vertices.push(vb.clone().addScaledVector(n, height)) - 1;
    const ic = ed.vertices.push(vc.clone().addScaledVector(n, height)) - 1;
    ed.addFace(ia, ib, ic);
    ed.addFace(a, b, ib); ed.addFace(a, ib, ia);
    ed.addFace(b, c, ic); ed.addFace(b, ic, ib);
    ed.addFace(c, a, ia); ed.addFace(c, ia, ic);
}

export function insetFace(ed: EditableMesh, faceIndex: number, inset = 0.2, height = 0) {
    const [a, b, c] = ed.faces[faceIndex];
    const va = ed.vertices[a], vb = ed.vertices[b], vc = ed.vertices[c];
    const n = new THREE.Vector3().copy(vb).sub(va).cross(new THREE.Vector3().copy(vc).sub(va)).normalize();
    const centroid = new THREE.Vector3().add(va).add(vb).add(vc).multiplyScalar(1 / 3);
    const moveToward = (v: THREE.Vector3) => {
        const dir = new THREE.Vector3().subVectors(centroid, v).setLength(inset);
        return v.clone().add(dir).addScaledVector(n, height);
    };
    const ia = ed.vertices.push(moveToward(va)) - 1;
    const ib = ed.vertices.push(moveToward(vb)) - 1;
    const ic = ed.vertices.push(moveToward(vc)) - 1;
    ed.removeFaceAt(faceIndex);
    ed.addFace(ia, ib, ic);
    ed.addFace(a, b, ib); ed.addFace(a, ib, ia);
    ed.addFace(b, c, ic); ed.addFace(b, ic, ib);
    ed.addFace(c, a, ia); ed.addFace(c, ia, ic);
}