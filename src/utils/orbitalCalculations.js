// A simplified orbital mechanics calculation utility.
// This does not account for perturbations and is based on a simple Keplerian model.

const G = 6.67430e-11; // Gravitational constant
const M = 5.972e24;   // Mass of Earth
const SIMULATION_DURATION = 172800; // 48 hours in seconds
const MU = G * M;     // Standard gravitational parameter

/**
 * Calculates the position of a satellite at a given time.
 * @param {object} orbitalElements - The orbital elements of the satellite.
 * @param {number} orbitalElements.semiMajorAxis - Semi-major axis in meters.
 * @param {number} orbitalElements.eccentricity - Eccentricity of the orbit (0 ≤ e < 1).
 * @param {number} orbitalElements.inclination - Inclination in radians (0 ≤ i ≤ π).
 * @param {number} orbitalElements.lonAscendingNode - Longitude of the ascending node in radians (0 ≤ Ω < 2π).
 * @param {number} orbitalElements.argPerigee - Argument of perigee in radians (0 ≤ ω < 2π).
 * @param {number} time - The time in seconds since the epoch.
 * @param {number} meanAnomalyAtEpoch - Mean anomaly at epoch in radians.
 * @returns {object} {x, y, z} position in meters.
 */
export function calculatePosition(orbitalElements, time, meanAnomalyAtEpoch = 0) {
    const {
        semiMajorAxis,
        eccentricity,
        inclination,
        lonAscendingNode,
        argPerigee
    } = orbitalElements;

    if (semiMajorAxis <= 0) {
        return { x: 0, y: 0, z: 0 };
    }

    // 1. Calculate Mean Anomaly
    const n = Math.sqrt(MU / Math.pow(semiMajorAxis, 3)); // Mean motion (rad/s)
    const M_t = meanAnomalyAtEpoch + n * time; // Mean anomaly

    // 2. Solve Kepler's Equation for Eccentric Anomaly (E)
    // M = E - e * sin(E)
    // Using Newton-Raphson method with optimized convergence
    let E = M_t; // Initial guess
    const maxIterations = eccentricity > 0.8 ? 15 : 8; // Fewer iterations for low eccentricity
    const tolerance = eccentricity > 0.8 ? 1e-12 : 1e-10; // Relaxed tolerance for low eccentricity
    
    for (let i = 0; i < maxIterations; i++) {
        const sinE = Math.sin(E);
        const cosE = Math.cos(E);
        const f = E - eccentricity * sinE - M_t;
        const df = 1 - eccentricity * cosE;
        const deltaE = f / df;
        E -= deltaE;
        
        // Early convergence check
        if (Math.abs(deltaE) < tolerance) break;
    }

    // 3. Calculate True Anomaly (nu)
    const nu = 2 * Math.atan2(
        Math.sqrt(1 + eccentricity) * Math.sin(E / 2),
        Math.sqrt(1 - eccentricity) * Math.cos(E / 2)
    );

    // 4. Calculate distance to central body (r)
    const r = semiMajorAxis * (1 - eccentricity * Math.cos(E));

    // 5. Position in the orbital plane (perifocal frame)
    const x_p = r * Math.cos(nu);
    const y_p = r * Math.sin(nu);
    const z_p = 0; // In orbital plane

    // 6. Transform to 3D ECI coordinates using rotation matrices
    // Pre-calculate trigonometric values for efficiency
    const cos_w = Math.cos(argPerigee);
    const sin_w = Math.sin(argPerigee);
    const cos_i = Math.cos(inclination);
    const sin_i = Math.sin(inclination);
    const cos_Omega = Math.cos(lonAscendingNode);
    const sin_Omega = Math.sin(lonAscendingNode);
    
    // First rotate by argument of perigee (ω)
    const x1 = x_p * cos_w - y_p * sin_w;
    const y1 = x_p * sin_w + y_p * cos_w;
    const z1 = z_p;
    
    // Then rotate by inclination (i)
    const x2 = x1;
    const y2 = y1 * cos_i - z1 * sin_i;
    const z2 = y1 * sin_i + z1 * cos_i;
    
    // Finally rotate by longitude of ascending node (Ω)
    const x = x2 * cos_Omega - y2 * sin_Omega;
    const y = x2 * sin_Omega + y2 * cos_Omega;
    const z = z2;

    return { x, y, z };
}

/**
 * Generates a series of points along an orbit.
 * @param {object} orbitalElements - The orbital elements of the satellite.
 * @param {number} numPoints - The number of points to generate.
 * @returns {Array<object>} An array of {x, y, z} position objects in meters.
 */
export function getOrbitPoints(orbitalElements, numPoints = 720) {
    const points = [];
    if (orbitalElements.semiMajorAxis <= 0) {
        return points;
    }
    const period = 2 * Math.PI * Math.sqrt(Math.pow(orbitalElements.semiMajorAxis, 3) / MU);
    for (let i = 0; i <= numPoints; i++) {
        const time = (i / numPoints) * period;
        // For orbit geometry, we calculate from a common epoch (meanAnomaly = 0)
        const position = calculatePosition(orbitalElements, time, 0);
        points.push(position);
    }
    return points;
}


/**
 * Finds the intersection points of two orbits.
 * This is a simplified approach that finds the points of closest approach.
 * @param {object} elements1 - Orbital elements for satellite 1.
 * @param {object} elements2 - Orbital elements for satellite 2.
 * @param {number} threshold - The maximum distance to be considered an intersection (in meters).
 * @returns {Array<object>} An array of {x, y, z} intersection points in meters.
 */
export function findIntersectionPoints(elements1, elements2, threshold = 100000) { // 100 km threshold
    const orbit1Points = getOrbitPoints(elements1);
    const orbit2Points = getOrbitPoints(elements2);
    const intersections = [];

    if (orbit1Points.length === 0 || orbit2Points.length === 0) {
        return intersections;
    }

    for (let i = 0; i < orbit1Points.length; i++) {
        const p1 = orbit1Points[i];
        for (let j = 0; j < orbit2Points.length; j++) {
            const p2 = orbit2Points[j];
            const dx = p1.x - p2.x;
            const dy = p1.y - p2.y;
            const dz = p1.z - p2.z;
            const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

            if (distance < threshold) {
                 // Avoid adding very close points multiple times
                let isDuplicate = false;
                for(const intersection of intersections) {
                    const ix = p1.x - intersection.x;
                    const iy = p1.y - intersection.y;
                    const iz = p1.z - intersection.z;
                    if (Math.sqrt(ix*ix + iy*iy + iz*iz) < threshold * 2) {
                        isDuplicate = true;
                        break;
                    }
                }
                if (!isDuplicate) {
                    intersections.push({ x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2, z: (p1.z + p2.z) / 2 });
                }
            }
        }
    }

    return intersections;
}

/**
 * Finds the time at which a satellite is closest to a given point in space.
 * @param {object} orbitalElements - The orbital elements of the satellite.
 * @param {object} point - The point in space {x, y, z}.
 * @returns {number} The time in seconds.
 */
function findTimeAtPoint(orbitalElements, point) {
    const period = 2 * Math.PI * Math.sqrt(Math.pow(orbitalElements.semiMajorAxis, 3) / MU);
    let minDistance = Infinity;
    let timeAtClosest = 0;

    // Search over one period
    for (let i = 0; i <= 360; i++) {
        const time = (i / 360) * period;
        const pos = calculatePosition(orbitalElements, time, 0); // Check against the static orbit path
        const distance = Math.sqrt(Math.pow(pos.x - point.x, 2) + Math.pow(pos.y - point.y, 2) + Math.pow(pos.z - point.z, 2));

        if (distance < minDistance) {
            minDistance = distance;
            timeAtClosest = time;
        }
    }
    return timeAtClosest;
}

/**
 * Checks for potential collisions by analyzing the time to reach intersection points.
 * @param {object} elements1 - Orbital elements for satellite 1.
 * @param {object} elements2 - Orbital elements for satellite 2.
 * @param {number} timeWindow - The time difference (in seconds) to consider a collision risk.
 * @returns {object|null} Collision information or null if no collision is predicted.
 */
export function checkCollision(elements1, elements2, timeWindow = 120, currentTime = 0) {
    // Increased threshold to 200km to find more potential close approaches.
    const intersections = findIntersectionPoints(elements1, elements2, 200000);
    if (intersections.length === 0) {
        return null;
    }

    let overallEarliestCollision = null;

    const period1 = 2 * Math.PI * Math.sqrt(Math.pow(elements1.semiMajorAxis, 3) / MU);
    const period2 = 2 * Math.PI * Math.sqrt(Math.pow(elements2.semiMajorAxis, 3) / MU);

    for (const intersection of intersections) {
        const time1AtIntersection = findTimeAtPoint(elements1, intersection);
        const time2AtIntersection = findTimeAtPoint(elements2, intersection);

        // Time for the first pass after epoch
        const t1_first = (time1AtIntersection - (elements1.meanAnomaly / (2 * Math.PI)) * period1 + period1) % period1;
        const t2_first = (time2AtIntersection - (elements2.meanAnomaly / (2 * Math.PI)) * period2 + period2) % period2;

        // Search for collisions in the future
        for (let i = 0; i < (SIMULATION_DURATION / period1) + 2; i++) {
            const time1 = t1_first + i * period1;

            if (time1 < currentTime) continue; // Only look for future collisions
            if (time1 > SIMULATION_DURATION) break;

            // Find the closest pass for satellite 2
            const j_closest = Math.round((time1 - t2_first) / period2);

            // Check this j and its neighbours for robustness
            for (let j = j_closest - 1; j <= j_closest + 1; j++) {
                if (j < 0) continue;
                const time2 = t2_first + j * period2;
                if (time2 > SIMULATION_DURATION) continue;

                const timeDiff = Math.abs(time1 - time2);

                if (timeDiff < timeWindow) {
                    const collisionTime = (time1 + time2) / 2;
                    if (collisionTime < currentTime) continue; // Double check it's in the future

                    if (!overallEarliestCollision || collisionTime < overallEarliestCollision.timeToCollision) {
                        overallEarliestCollision = {
                            willCollide: true,
                            timeToCollision: collisionTime,
                            location: intersection
                        };
                    }
                }
            }
        }
    }

    return overallEarliestCollision;
}
