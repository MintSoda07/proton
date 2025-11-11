/* eslint-disable @typescript-eslint/no-explicit-any */
// src/editor/state/types.ts
import * as THREE from "three";


export type SelMode = "vertex" | "face";
export type Tool = "select" | "move" | "add-vertex" | "make-triangle" | "extrude-face" | "bevel-inset";
export type Axis = "none" | "x" | "y" | "z";


export type Selection =
| { kind: "vertex"; index: number }
| { kind: "face"; index: number }
| null;


export interface SceneRefs {
renderer: THREE.WebGLRenderer | null;
scene: THREE.Scene | null;
camera: THREE.PerspectiveCamera | null;
controls: any | null; // OrbitControls 타입
ground: THREE.Mesh | null;
mesh: THREE.Mesh | null;
mat: THREE.MeshStandardMaterial | null;
vertPts: THREE.Points | null;
faceLines: THREE.LineSegments | null;
}