/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-unused-expressions */
/* eslint-disable @typescript-eslint/no-explicit-any */
// src/editor/hooks/useThreeBasics.ts
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import type { SceneRefs } from "../state/types";


export function useThreeBasics(hostRef: React.RefObject<HTMLDivElement | null>) {
    const refs = useRef<SceneRefs>({
        renderer: null,
        scene: null,
        camera: null,
        controls: null,
        ground: null,
        mesh: null,
        mat: null,
        vertPts: null,
        faceLines: null,
    });
    useEffect(() => {
        if (!hostRef.current) return;


        const renderer = new THREE.WebGLRenderer({ antialias: true });
        // @ts-ignore for old three
        if ((renderer as any).outputEncoding !== undefined) (renderer as any).outputEncoding = THREE.sRGBEncoding;
        else (renderer as any).outputColorSpace = THREE.SRGBColorSpace;
        renderer.setPixelRatio(window.devicePixelRatio);
        hostRef.current.appendChild(renderer.domElement);


        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x0b0f14);


        const camera = new THREE.PerspectiveCamera(50, 1, 0.01, 200);
        camera.position.set(4, 3, 6);
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.target.set(0, 0.5, 0);


        scene.add(new THREE.AmbientLight(0xffffff, 0.55));
        const dir = new THREE.DirectionalLight(0xffffff, 0.95);
        dir.position.set(5, 7, 3);
        scene.add(dir);


        const grid = new THREE.GridHelper(40, 40, 0x3a4455, 0x252f3b);
        grid.visible = true;
        scene.add(grid);
        const ground = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), new THREE.MeshBasicMaterial({ visible: false }));
        ground.rotateX(-Math.PI / 2);
        scene.add(ground);


        const mat = new THREE.MeshStandardMaterial({
            color: 0x90caf9,
            metalness: 0.2,
            roughness: 0.65,
            wireframe: false,
            polygonOffset: true,
            polygonOffsetFactor: 1,
            polygonOffsetUnits: 1,
        });
        refs.current = { renderer, scene, camera, controls, ground, mesh: null, mat, vertPts: null, faceLines: null };


        const fit = () => {
            if (!hostRef.current) return;
            const w = hostRef.current.clientWidth || 1;
            const h = hostRef.current.clientHeight || 1;
            renderer.setSize(w, h, false);
            camera.aspect = w / h;
            camera.updateProjectionMatrix();
        };
        fit();
        const ro = new ResizeObserver(fit);
        ro.observe(hostRef.current);
        let raf = 0;
        const loop = () => {
            controls.update();
            if (refs.current.renderer && refs.current.scene && refs.current.camera) {
                refs.current.renderer.render(refs.current.scene, refs.current.camera);
            }
            raf = requestAnimationFrame(loop);
        };
        raf = requestAnimationFrame(loop);
        return () => {
            cancelAnimationFrame(raf);
            ro.disconnect();
            const r = refs.current.renderer!;
            const s = refs.current.scene!;
            s.traverse(obj => {
                const anyObj = obj as any;
                anyObj.geometry?.dispose?.();
                if (anyObj.material) Array.isArray(anyObj.material) ? anyObj.material.forEach((m: any) => m?.dispose?.()) : anyObj.material.dispose?.();
            });
            r.dispose();
            hostRef.current?.removeChild(r.domElement);
            refs.current = { renderer: null, scene: null, camera: null, controls: null, ground: null, mesh: null, mat: null, vertPts: null, faceLines: null };
        };
    }, [hostRef]);


    return refs;
}