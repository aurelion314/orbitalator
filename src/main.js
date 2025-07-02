import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Satellite } from './components/Satellite.js';
import { findIntersectionPoints, checkCollision } from './utils/orbitalCalculations.js';

// --- Scene setup ---
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, (window.innerWidth - 300) / (window.innerHeight - 50), 0.1, 2000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth - 300, window.innerHeight - 50);
document.getElementById('simulation-container').appendChild(renderer.domElement);

// --- Controls ---
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// --- Lighting ---
const ambientLight = new THREE.AmbientLight(0x404040, 2);
scene.add(ambientLight);
const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
directionalLight.position.set(10, 10, 5);
scene.add(directionalLight);

// --- Scene objects ---
const EARTH_RADIUS_KM = 6371;
const VISUAL_SCALE = 1 / 1000; // 1 unit = 1000 km

const earthGeometry = new THREE.SphereGeometry(EARTH_RADIUS_KM * VISUAL_SCALE, 32, 32);
const earthMaterial = new THREE.MeshPhongMaterial({ color: 0x2288ff, wireframe: true });
const earth = new THREE.Mesh(earthGeometry, earthMaterial);
scene.add(earth);

const intersectionMarkers = new THREE.Group();
scene.add(intersectionMarkers);

const gridHelper = new THREE.GridHelper(30, 30);
scene.add(gridHelper);

camera.position.set(15, 15, 15);
controls.update();

// --- Satellites ---
const sat1_params = {
    semiMajorAxis: 7000e3, // meters
    eccentricity: 0.1,
    inclination: 0.5, // radians
    lonAscendingNode: 0, // radians
    argPerigee: 0, // radians
    meanAnomaly: 0 // radians
};

const sat2_params = {
    semiMajorAxis: 7000e3, // meters
    eccentricity: 0.1,
    inclination: 0.8, // radians
    lonAscendingNode: 0.2, // radians
    argPerigee: 0.5, // radians
    meanAnomaly: 1.0 // radians
};

const satellite1 = new Satellite(scene, 0xff0000, sat1_params);
const satellite2 = new Satellite(scene, 0x00ff00, sat2_params);
let activeSatellite = satellite1;

// --- UI ---
const sat1Button = document.getElementById('sat1-button');
const sat2Button = document.getElementById('sat2-button');
const semiMajorAxisSlider = document.getElementById('semi-major-axis');
const eccentricitySlider = document.getElementById('eccentricity');
const inclinationSlider = document.getElementById('inclination');
const lonAscendingNodeSlider = document.getElementById('lon-ascending-node');
const argPerigeeSlider = document.getElementById('arg-perigee');
const meanAnomalySlider = document.getElementById('mean-anomaly');
const timeSpeedSlider = document.getElementById('time-speed');
const infoDisplay = document.getElementById('info-display');
const collisionAlert = document.getElementById('collision-alert');
const timeBackButton = document.getElementById('time-back-button');
const timeForwardButton = document.getElementById('time-forward-button');
const pausePlayButton = document.getElementById('pause-play-button');
const nextCollisionButton = document.getElementById('next-collision-button');
const timelineProgress = document.getElementById('timeline-progress');
const timelineMarker = document.getElementById('timeline-marker');

const satellites = [satellite1, satellite2];
const satButtons = [sat1Button, sat2Button];

const semiMajorAxisValue = document.getElementById('semi-major-axis-value');
const eccentricityValue = document.getElementById('eccentricity-value');
const inclinationValue = document.getElementById('inclination-value');
const lonAscendingNodeValue = document.getElementById('lon-ascending-node-value');
const argPerigeeValue = document.getElementById('arg-perigee-value');
const meanAnomalyValue = document.getElementById('mean-anomaly-value');

function updateUI() {
    // Update active button
    const activeIndex = satellites.indexOf(activeSatellite);
    satButtons.forEach((button, index) => {
        button.classList.toggle('active', index === activeIndex);
    });

    // Update sliders & readouts
    const elements = activeSatellite.orbitalElements;
    semiMajorAxisSlider.value = elements.semiMajorAxis / 1000;
    eccentricitySlider.value = elements.eccentricity;
    inclinationSlider.value = elements.inclination;
    lonAscendingNodeSlider.value = elements.lonAscendingNode;
    argPerigeeSlider.value = elements.argPerigee;
    meanAnomalySlider.value = elements.meanAnomaly;

    semiMajorAxisValue.value = (elements.semiMajorAxis / 1000).toFixed(0);
    eccentricityValue.value = elements.eccentricity.toFixed(2);
    inclinationValue.value = elements.inclination.toFixed(2);
    lonAscendingNodeValue.value = elements.lonAscendingNode.toFixed(2);
    argPerigeeValue.value = elements.argPerigee.toFixed(2);
    meanAnomalyValue.value = elements.meanAnomaly.toFixed(2);
}

sat1Button.addEventListener('click', () => {
    activeSatellite = satellite1;
    updateUI();
});

sat2Button.addEventListener('click', () => {
    activeSatellite = satellite2;
    updateUI();
});

function linkSliderAndInput(slider, input, property, isPathChanging, multiplier = 1, fixed = 2) {
    input.step = slider.step || 0.01;
    input.min = slider.min;
    input.max = slider.max;

    const updateOrbitState = () => {
        if (isPathChanging) {
            activeSatellite.updateOrbit();
            updateIntersections();
            collisionCheckCounter = 1.1; // Force collision re-check
        }
    };

    slider.addEventListener('input', e => {
        const value = parseFloat(e.target.value);
        input.value = value.toFixed(fixed);
        activeSatellite.orbitalElements[property] = value * multiplier;
        updateOrbitState();
    });

    input.addEventListener('change', e => {
        let value = parseFloat(e.target.value);
        const min = parseFloat(slider.min);
        const max = parseFloat(slider.max);

        if (isNaN(value)) {
            value = activeSatellite.orbitalElements[property] / multiplier;
        }
        if (value < min) value = min;
        if (value > max) value = max;

        input.value = value.toFixed(fixed);
        slider.value = value;
        activeSatellite.orbitalElements[property] = value * multiplier;
        updateOrbitState();
    });
}

linkSliderAndInput(semiMajorAxisSlider, semiMajorAxisValue, 'semiMajorAxis', true, 1000, 0);
linkSliderAndInput(eccentricitySlider, eccentricityValue, 'eccentricity', true, 1, 2);
linkSliderAndInput(inclinationSlider, inclinationValue, 'inclination', true, 1, 2);
linkSliderAndInput(lonAscendingNodeSlider, lonAscendingNodeValue, 'lonAscendingNode', true, 1, 2);
linkSliderAndInput(argPerigeeSlider, argPerigeeValue, 'argPerigee', true, 1, 2);
linkSliderAndInput(meanAnomalySlider, meanAnomalyValue, 'meanAnomaly', false, 1, 2);

// --- Intersection Logic ---
function updateIntersections() {
    // Clear previous markers
    while (intersectionMarkers.children.length) {
        intersectionMarkers.remove(intersectionMarkers.children[0]);
    }

    const points = findIntersectionPoints(satellite1.orbitalElements, satellite2.orbitalElements);

    points.forEach(point => {
        const geometry = new THREE.TorusGeometry(0.3, 0.05, 16, 100);
        const material = new THREE.MeshBasicMaterial({ color: 0xffff00 });
        const marker = new THREE.Mesh(geometry, material);

        marker.position.set(
            (point.x / 1000) * VISUAL_SCALE,
            (point.y / 1000) * VISUAL_SCALE,
            (point.z / 1000) * VISUAL_SCALE
        );
        marker.lookAt(earth.position); // Orient the torus
        intersectionMarkers.add(marker);
    });
}

updateUI(); // Set initial values
updateIntersections(); // Initial check

// --- Animation Loop ---
let simulationTime = 0;
let simulationSpeed = 100;
const clock = new THREE.Clock();

timeSpeedSlider.addEventListener('input', (e) => {
    simulationSpeed = parseFloat(e.target.value);
    document.getElementById('time-speed-value').textContent = `${simulationSpeed}x`;
});

let collisionCheckCounter = 0;
let nextCollisionInfo = null;
const SIMULATION_DURATION = 86400; // 24 hours in seconds
let isPaused = false;

function animate() {
    requestAnimationFrame(animate);

    const deltaTime = clock.getDelta();
    if (!isPaused) {
        simulationTime += deltaTime * simulationSpeed;
    }

    // Loop simulation time
    if (simulationTime > SIMULATION_DURATION) {
        simulationTime = 0;
    }
    if (simulationTime < 0) {
        simulationTime = SIMULATION_DURATION;
    }

    satellite1.update(simulationTime);
    satellite2.update(simulationTime);

    const hours = Math.floor(simulationTime / 3600);
    const minutes = Math.floor((simulationTime % 3600) / 60);
    const seconds = Math.floor(simulationTime % 60);
    infoDisplay.textContent = `T+ ${hours}h ${minutes}m ${seconds}s`;

    // Update timeline progress
    timelineProgress.style.width = `${(simulationTime / SIMULATION_DURATION) * 100}%`;

    // --- Collision Check (run periodically) ---
    collisionCheckCounter += deltaTime;
    if (collisionCheckCounter > 1) { // Check every 1 second
        nextCollisionInfo = checkCollision(satellite1.orbitalElements, satellite2.orbitalElements, 60, simulationTime);
        if (nextCollisionInfo && nextCollisionInfo.willCollide) {
            timelineMarker.style.display = 'block';
            timelineMarker.style.left = `${(nextCollisionInfo.timeToCollision / SIMULATION_DURATION) * 100}%`;
        } else {
            timelineMarker.style.display = 'none';
        }
        collisionCheckCounter = 0;
    }

    // Display collision alert if close
    if (nextCollisionInfo && nextCollisionInfo.willCollide && Math.abs(nextCollisionInfo.timeToCollision - simulationTime) < nextCollisionInfo.timeDifference) {
        collisionAlert.style.display = 'block';
        collisionAlert.classList.add('flashing');
        const timeToImpact = nextCollisionInfo.timeToCollision - simulationTime;
        collisionAlert.textContent = `COLLISION ALERT! T-${Math.floor(timeToImpact)}s`;
    } else {
        collisionAlert.style.display = 'none';
        collisionAlert.classList.remove('flashing');
    }

    earth.rotation.y += 0.0005;
    controls.update();
    renderer.render(scene, camera);
}

timeBackButton.addEventListener('click', () => {
    simulationTime -= 600; // Jump back 10 minutes
});

timeForwardButton.addEventListener('click', () => {
    simulationTime += 600; // Jump forward 10 minutes
});

pausePlayButton.addEventListener('click', () => {
    isPaused = !isPaused;
    pausePlayButton.textContent = isPaused ? '►' : '❚❚';
});

nextCollisionButton.addEventListener('click', () => {
    if (nextCollisionInfo && nextCollisionInfo.willCollide) {
        // Jump to 10 seconds before the collision
        simulationTime = nextCollisionInfo.timeToCollision - 10;
        if (simulationTime < 0) {
            simulationTime = 0;
        }
        isPaused = false; // Ensure simulation is running
        pausePlayButton.textContent = '❚❚';
    }
});

animate();

// Handle window resizing
window.addEventListener('resize', () => {
    camera.aspect = (window.innerWidth - 300) / (window.innerHeight - 50);
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth - 300, window.innerHeight - 50);
});
