import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export class SceneManager {
    constructor() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, 1, 0.1, 2000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.textureLoader = new THREE.TextureLoader();
        this.clock = new THREE.Clock();
        
        this.setupRenderer();
        this.setupControls();
        this.setupLighting();
        this.setupEnvironment();
        
        // Handle window resizing
        window.addEventListener('resize', () => this.updateRendererSize());
    }
    
    setupRenderer() {
        this.renderer.setSize(1, 1); // Initial size, will be updated
        document.getElementById('simulation-container').appendChild(this.renderer.domElement);
        this.updateRendererSize();
    }
    
    setupControls() {
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.camera.position.set(15, 15, 15);
        this.controls.update();
    }
    
    setupLighting() {
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(5, 10, 7.5);
        this.scene.add(directionalLight);
    }
    
    setupEnvironment() {
        // Earth
        const EARTH_RADIUS_KM = 6371;
        const VISUAL_SCALE = 1 / 1000; // 1 unit = 1000 km
        
        const earthGeometry = new THREE.SphereGeometry(EARTH_RADIUS_KM * VISUAL_SCALE, 32, 32);
        this.earthWireframeMaterial = new THREE.MeshPhongMaterial({ color: 0x2288ff, wireframe: true });
        
        // Start with wireframe while texture loads
        this.earth = new THREE.Mesh(earthGeometry, this.earthWireframeMaterial);
        this.scene.add(this.earth);
        
        // Load textures asynchronously - both Earth and skybox together
        this.textureLoading = true;
        this.earthStandardMaterial = null;
        this.skyboxMaterial = null;
        
        // Track loading progress
        let texturesLoaded = 0;
        const totalTextures = 2;
        
        const checkAllTexturesLoaded = () => {
            texturesLoaded++;
            if (texturesLoaded >= totalTextures) {
                this.textureLoading = false;
                if (this.onTextureLoaded) {
                    this.onTextureLoaded();
                }
            }
        };
        
        // Load Earth texture
        const earthTexture = this.textureLoader.load(
            '/textures/earth_highres.jpg',
            // onLoad callback
            (texture) => {
                this.earthStandardMaterial = new THREE.MeshPhongMaterial({ map: texture });
                checkAllTexturesLoaded();
            },
            // onProgress callback
            undefined,
            // onError callback
            (error) => {
                console.warn('Failed to load Earth texture:', error);
                this.earthStandardMaterial = new THREE.MeshPhongMaterial({ color: 0x4488cc });
                checkAllTexturesLoaded();
            }
        );
        
        // Skybox setup
        const skyboxGeometry = new THREE.SphereGeometry(1000, 60, 40);
        
        // Load skybox texture
        const galaxySpaceTexture = this.textureLoader.load(
            '/textures/space_galaxy.png',
            // onLoad callback
            (texture) => {
                this.skyboxMaterial = new THREE.MeshBasicMaterial({ 
                    map: texture, 
                    side: THREE.BackSide 
                });
                this.skybox.material = this.skyboxMaterial;
                checkAllTexturesLoaded();
            },
            // onProgress callback
            undefined,
            // onError callback
            (error) => {
                console.warn('Failed to load skybox texture:', error);
                this.skyboxMaterial = new THREE.MeshBasicMaterial({ 
                    color: 0x000011, 
                    side: THREE.BackSide 
                });
                this.skybox.material = this.skyboxMaterial;
                checkAllTexturesLoaded();
            }
        );
        
        // Create skybox with temporary material
        const tempSkyboxMaterial = new THREE.MeshBasicMaterial({ 
            color: 0x000011, 
            side: THREE.BackSide 
        });
        this.skybox = new THREE.Mesh(skyboxGeometry, tempSkyboxMaterial);
        this.skybox.visible = false; // Hide until textures load
        this.scene.add(this.skybox);
        
        // Grid (start hidden by default)
        this.gridHelper = new THREE.GridHelper(30, 30);
        this.gridHelper.visible = false; // Start hidden, will be controlled by theme settings
        this.scene.add(this.gridHelper);
        
        // Intersection markers
        this.intersectionMarkers = new THREE.Group();
        this.scene.add(this.intersectionMarkers);
    }
    
    updateRendererSize() {
        const container = document.getElementById('simulation-container');
        const width = container.clientWidth;
        const height = container.clientHeight;
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    }
    
    render() {
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }
    
    getDeltaTime() {
        return this.clock.getDelta();
    }
    
    // Theme management
    setEarthStyle(style) {
        if (style === 'texture' && this.earthStandardMaterial && this.skyboxMaterial) {
            this.earth.material = this.earthStandardMaterial;
            this.skybox.visible = true;
        } else {
            this.earth.material = this.earthWireframeMaterial;
            this.skybox.visible = false;
        }
    }
    
    setTextureLoadedCallback(callback) {
        this.onTextureLoaded = callback;
    }
    
    isTextureLoading() {
        return this.textureLoading;
    }
    
    setGridVisible(visible) {
        this.gridHelper.visible = visible;
    }
    
    rotateEarth(deltaTime, simulationSpeed) {
        // Earth rotates once every 24 hours (86400 seconds)
        // Convert to radians per second: 2π / 86400 = ~0.0000727 radians per second
        this.earth.rotation.y += 0.0000727 * deltaTime * simulationSpeed;
    }
}
