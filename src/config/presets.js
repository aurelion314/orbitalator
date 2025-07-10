export const ORBITAL_PRESETS = {
    'collision-course': {
        name: 'Collision Course',
        description: 'Two satellites on intersecting orbits',
        sat1: { 
            semiMajorAxis: 7000e3, 
            eccentricity: 0, 
            inclination: 0.5, 
            lonAscendingNode: 0, 
            argPerigee: 0, 
            meanAnomaly: 0 
        },
        sat2: { 
            semiMajorAxis: 7000e3, 
            eccentricity: 0, 
            inclination: 0.8, 
            lonAscendingNode: 0, 
            argPerigee: 0, 
            meanAnomaly: 0 
        }
    },
    'same-orbit': {
        name: 'Same Orbit',
        description: 'Two satellites in identical orbits with different phases',
        sat1: { 
            semiMajorAxis: 8000e3, 
            eccentricity: 0.05, 
            inclination: 0.5, 
            lonAscendingNode: 0, 
            argPerigee: 0, 
            meanAnomaly: 0 
        },
        sat2: { 
            semiMajorAxis: 8000e3, 
            eccentricity: 0.05, 
            inclination: 0.5, 
            lonAscendingNode: 0, 
            argPerigee: 0, 
            meanAnomaly: 1.5 
        }
    },
    'geo-sync': {
        name: 'Geostationary',
        description: 'Geostationary orbit vs low Earth orbit',
        sat1: { 
            semiMajorAxis: 42164e3, // Geostationary altitude
            eccentricity: 0.0, 
            inclination: 0.0, // Equatorial
            lonAscendingNode: 0.0, 
            argPerigee: 0.0, 
            meanAnomaly: 0 
        },
        sat2: { 
            semiMajorAxis: 7500e3, 
            eccentricity: 0.01, 
            inclination: 0.8, 
            lonAscendingNode: 0.2, 
            argPerigee: 0.5, 
            meanAnomaly: 1.0 
        }
    },
    'polar-retrograde': {
        name: 'Polar vs Retrograde',
        description: 'Polar orbit vs retrograde equatorial orbit',
        sat1: { 
            semiMajorAxis: 7200e3, 
            eccentricity: 0.0, 
            inclination: Math.PI / 2, // 90° - Polar orbit
            lonAscendingNode: 0, 
            argPerigee: 0, 
            meanAnomaly: 0 
        },
        sat2: { 
            semiMajorAxis: 7200e3, 
            eccentricity: 0.0, 
            inclination: Math.PI * 0.75, // 135° - Retrograde orbit
            lonAscendingNode: 0, 
            argPerigee: 0, 
            meanAnomaly: 0 
        }
    },
    'prograde-retrograde': {
        name: 'Prograde vs Retrograde',
        description: 'Same orbit, opposite directions - clearly shows retrograde motion',
        sat1: { 
            semiMajorAxis: 8000e3, 
            eccentricity: 0.1, 
            inclination: 0.3, // 17° - Prograde
            lonAscendingNode: 0, 
            argPerigee: 0, 
            meanAnomaly: 0 
        },
        sat2: { 
            semiMajorAxis: 8000e3, 
            eccentricity: 0.1, 
            inclination: Math.PI - 0.3, // 163° - Retrograde (180° - 17°)
            lonAscendingNode: Math.PI, // 180° offset in ascending node
            argPerigee: Math.PI, // 180° offset in argument of perigee
            meanAnomaly: 0 
        }
    },
    'sun-synchronous': {
        name: 'Sun-Synchronous',
        description: 'Sun-synchronous orbit vs standard LEO',
        sat1: { 
            semiMajorAxis: 7178e3, // ~800km altitude
            eccentricity: 0.001, 
            inclination: 1.7279, // ~99° - Sun-synchronous
            lonAscendingNode: 0, 
            argPerigee: 0, 
            meanAnomaly: 0 
        },
        sat2: { 
            semiMajorAxis: 6771e3, // ~400km altitude - ISS-like
            eccentricity: 0.0003, 
            inclination: 0.9, // ~51.6° - ISS inclination
            lonAscendingNode: 0.5, 
            argPerigee: 0, 
            meanAnomaly: 2.0 
        }
    },
    'molniya': {
        name: 'Molniya Orbit',
        description: 'Highly elliptical Molniya orbit vs circular LEO',
        sat1: { 
            semiMajorAxis: 26600e3, // Molniya semi-major axis
            eccentricity: 0.74, // Highly elliptical
            inclination: 1.1, // ~63.4° - Critical inclination
            lonAscendingNode: 0, 
            argPerigee: Math.PI / 2, // Apogee over northern hemisphere
            meanAnomaly: 0 
        },
        sat2: { 
            semiMajorAxis: 6971e3, // ~600km circular
            eccentricity: 0.0, 
            inclination: 0.5, 
            lonAscendingNode: 1.0, 
            argPerigee: 0, 
            meanAnomaly: 0 
        }
    }
};
