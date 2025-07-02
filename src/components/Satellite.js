import * as THREE from 'three';
import { calculatePosition } from '../utils/orbitalCalculations.js';

const VISUAL_SCALE = 1 / 1000; // 1 scene unit = 1000 km

export class Satellite {
    constructor(scene, color, orbitalElements) {
        this.orbitalElements = orbitalElements;

        // Satellite mesh
        const geometry = new THREE.SphereGeometry(0.2, 16, 16);
        const material = new THREE.MeshBasicMaterial({ color });
        this.mesh = new THREE.Mesh(geometry, material);
        scene.add(this.mesh);

        // Orbit path
        this.orbitPoints = [];
        const period = 2 * Math.PI * Math.sqrt(Math.pow(this.orbitalElements.semiMajorAxis, 3) / (6.67430e-11 * 5.972e24));
        for (let i = 0; i <= 360; i++) {
            const time = (i / 360) * period;
            const position = calculatePosition(this.orbitalElements, time);
            // Convert position from meters to km, then apply visual scale
            this.orbitPoints.push(new THREE.Vector3(
                (position.x / 1000) * VISUAL_SCALE, 
                (position.y / 1000) * VISUAL_SCALE, 
                (position.z / 1000) * VISUAL_SCALE
            ));
        }

        const lineGeometry = new THREE.BufferGeometry().setFromPoints(this.orbitPoints);
        const lineMaterial = new THREE.LineBasicMaterial({ color });
        this.orbitLine = new THREE.Line(lineGeometry, lineMaterial);
        scene.add(this.orbitLine);
    }

    update(time) {
        const position = calculatePosition(this.orbitalElements, time, this.orbitalElements.meanAnomaly);
        // Convert position from meters to km, then apply visual scale
        this.mesh.position.set(
            (position.x / 1000) * VISUAL_SCALE, 
            (position.y / 1000) * VISUAL_SCALE, 
            (position.z / 1000) * VISUAL_SCALE
        );
    }

    updateOrbit() {
        this.orbitPoints = [];
        const period = 2 * Math.PI * Math.sqrt(Math.pow(this.orbitalElements.semiMajorAxis, 3) / (6.67430e-11 * 5.972e24));
        for (let i = 0; i <= 360; i++) {
            const time = (i / 360) * period;
            const position = calculatePosition(this.orbitalElements, time);
            // Convert position from meters to km, then apply visual scale
            this.orbitPoints.push(new THREE.Vector3(
                (position.x / 1000) * VISUAL_SCALE, 
                (position.y / 1000) * VISUAL_SCALE, 
                (position.z / 1000) * VISUAL_SCALE
            ));
        }
        this.orbitLine.geometry.setFromPoints(this.orbitPoints);
    }
}
