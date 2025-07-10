import * as THREE from 'three';
import { SceneManager } from './core/Scene.js';
import { SimulationState } from './core/SimulationState.js';
import { UIManager } from './ui/UIManager.js';
import { Satellite } from './components/Satellite.js';
import { findIntersectionPoints, checkCollision } from './utils/orbitalCalculations.js';
import { ORBITAL_PRESETS } from './config/presets.js';

// Initialize core systems
const sceneManager = new SceneManager();
const simulationState = new SimulationState();

// Initialize satellites with default parameters
const defaultSat1Params = {
    semiMajorAxis: 7000e3, // meters
    eccentricity: 0,
    inclination: 0.5, // radians
    lonAscendingNode: 0, // radians
    argPerigee: 0, // radians
    meanAnomaly: 0 // radians
};

const defaultSat2Params = {
    semiMajorAxis: 7000e3, // meters
    eccentricity: 0,
    inclination: 0.8, // radians
    lonAscendingNode: 0, // radians
    argPerigee: 0, // radians
    meanAnomaly: 0 // radians
};

const satellite1 = new Satellite(sceneManager.scene, 0xff0000, defaultSat1Params);
const satellite2 = new Satellite(sceneManager.scene, 0x00ff00, defaultSat2Params);
const satellites = [satellite1, satellite2];

// Initialize UI Manager
const uiManager = new UIManager(satellites, simulationState);
uiManager.setPresets(ORBITAL_PRESETS);
uiManager.setSceneManager(sceneManager);



// Set up intersection update callback
uiManager.setIntersectionUpdateCallback(updateIntersections);

// --- Intersection Logic ---
function updateIntersections() {
    // Clear existing markers
    sceneManager.intersectionMarkers.clear();
    
    const intersections = findIntersectionPoints(satellite1.orbitalElements, satellite2.orbitalElements, 100000);
    
    intersections.forEach(intersection => {
        const markerGeometry = new THREE.SphereGeometry(0.1, 8, 8);
        const markerMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });
        const marker = new THREE.Mesh(markerGeometry, markerMaterial);
        
        // Convert position from meters to km, then apply visual scale
        const VISUAL_SCALE = 1 / 1000;
        marker.position.set(
            (intersection.x / 1000) * VISUAL_SCALE,
            (intersection.y / 1000) * VISUAL_SCALE,
            (intersection.z / 1000) * VISUAL_SCALE
        );
        
        sceneManager.intersectionMarkers.add(marker);
    });
}

// Initialize the simulation
updateIntersections(); // Initial intersection check

// Main animation loop
function animate() {
    requestAnimationFrame(animate);

    const deltaTime = sceneManager.getDeltaTime();
    simulationState.update(deltaTime);

    // Update satellites
    satellite1.update(simulationState.time);
    satellite2.update(simulationState.time);

    // Update UI displays
    uiManager.updateTimeDisplay();

    // Periodic collision checking
    if (simulationState.shouldCheckCollisions()) {
        const collisionInfo = checkCollision(
            satellite1.orbitalElements, 
            satellite2.orbitalElements, 
            60, 
            simulationState.time
        );
        simulationState.setCollisionInfo(collisionInfo);
    }

    // Rotate Earth
    sceneManager.rotateEarth(deltaTime, simulationState.speed);
    
    // Render the scene
    sceneManager.render();
}

// Start the animation loop
animate();
