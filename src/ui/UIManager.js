export class UIManager {
    constructor(satellites, simulationState) {
        this.satellites = satellites;
        this.simulationState = simulationState;
        this.activeSatellite = satellites[0];
        
        this.initializeElements();
        this.setupEventListeners();
        this.loadThemeSettings();
        this.updateUI();
    }
    
    initializeElements() {
        // Loading overlay
        this.loadingOverlay = document.getElementById('loading-overlay');
        
        // Satellite buttons
        this.sat1Button = document.getElementById('sat1-button');
        this.sat2Button = document.getElementById('sat2-button');
        this.satButtons = [this.sat1Button, this.sat2Button];
        
        // Control sliders
        this.semiMajorAxisSlider = document.getElementById('semi-major-axis');
        this.eccentricitySlider = document.getElementById('eccentricity');
        this.inclinationSlider = document.getElementById('inclination');
        this.lonAscendingNodeSlider = document.getElementById('lon-ascending-node');
        this.argPerigeeSlider = document.getElementById('arg-perigee');
        this.meanAnomalySlider = document.getElementById('mean-anomaly');
        
        // Value displays
        this.semiMajorAxisValue = document.getElementById('semi-major-axis-value');
        this.eccentricityValue = document.getElementById('eccentricity-value');
        this.inclinationValue = document.getElementById('inclination-value');
        this.lonAscendingNodeValue = document.getElementById('lon-ascending-node-value');
        this.argPerigeeValue = document.getElementById('arg-perigee-value');
        this.meanAnomalyValue = document.getElementById('mean-anomaly-value');
        
        // Time controls
        this.timeBackButton = document.getElementById('time-back-button');
        this.timeForwardButton = document.getElementById('time-forward-button');
        this.pausePlayButton = document.getElementById('pause-play-button');
        this.resetTimeButton = document.getElementById('reset-time-button');
        this.timeSpeedSlider = document.getElementById('time-speed');
        
        // Display elements
        this.infoDisplay = document.getElementById('info-display');
        this.timelineProgress = document.getElementById('timeline-progress');
        this.timelineMarker = document.getElementById('timeline-marker');
        this.presetSelector = document.getElementById('preset-selector');
        
        // Theme controls
        this.themeEarthButton = document.getElementById('theme-earth-button');
        this.themeGridButton = document.getElementById('theme-grid-button');
        
        // Theme settings
        this.themeSettings = {
            earthStyle: 'texture',
            gridVisible: false
        };
    }
    
    setupEventListeners() {
        // Satellite selection
        this.sat1Button.addEventListener('click', () => this.selectSatellite(0));
        this.sat2Button.addEventListener('click', () => this.selectSatellite(1));
        
        // Orbital parameter controls
        this.linkSliderAndInput(this.semiMajorAxisSlider, this.semiMajorAxisValue, 'semiMajorAxis', true, 1000, 0);
        this.linkSliderAndInput(this.eccentricitySlider, this.eccentricityValue, 'eccentricity', true, 1, 2);
        this.linkSliderAndInput(this.inclinationSlider, this.inclinationValue, 'inclination', true, 1, 2);
        this.linkSliderAndInput(this.lonAscendingNodeSlider, this.lonAscendingNodeValue, 'lonAscendingNode', true, 1, 2);
        this.linkSliderAndInput(this.argPerigeeSlider, this.argPerigeeValue, 'argPerigee', true, 1, 2);
        this.linkSliderAndInput(this.meanAnomalySlider, this.meanAnomalyValue, 'meanAnomaly', false, 1, 2);
        
        // Time controls
        this.timeBackButton.addEventListener('click', () => this.simulationState.jumpTime(-600));
        this.timeForwardButton.addEventListener('click', () => this.simulationState.jumpTime(600));
        this.pausePlayButton.addEventListener('click', () => this.togglePause());
        this.resetTimeButton.addEventListener('click', () => this.simulationState.reset());
        
        this.timeSpeedSlider.addEventListener('input', (event) => {
            const speed = parseFloat(event.target.value);
            this.simulationState.setSpeed(speed);
            document.getElementById('time-speed-value').textContent = `${speed}x`;
        });
        
        // Preset selector
        this.presetSelector.addEventListener('change', (event) => this.applyPreset(event.target.value));
        
        // Theme controls
        this.themeEarthButton.addEventListener('click', () => this.toggleEarthStyle());
        this.themeGridButton.addEventListener('click', () => this.toggleGrid());
    }
    
    selectSatellite(index) {
        this.activeSatellite = this.satellites[index];
        
        // Update button states
        this.satButtons.forEach((btn, i) => {
            if (i === index) {
                btn.classList.add('active-tab');
            } else {
                btn.classList.remove('active-tab');
            }
        });
        
        this.updateUI();
    }
    
    linkSliderAndInput(slider, input, property, isPathChanging, multiplier = 1, fixed = 2) {
        const updateOrbitState = () => {
            if (isPathChanging) {
                this.activeSatellite.updateOrbit();
                if (this.onIntersectionUpdate) {
                    this.onIntersectionUpdate();
                }
            }
        };
        
        slider.addEventListener('input', (event) => {
            const value = parseFloat(event.target.value) * multiplier;
            this.activeSatellite.orbitalElements[property] = value;
            input.value = (value / multiplier).toFixed(fixed);
            updateOrbitState();
        });
    }
    
    updateUI() {
        const elements = this.activeSatellite.orbitalElements;
        
        this.semiMajorAxisSlider.value = elements.semiMajorAxis / 1000;
        this.semiMajorAxisValue.value = (elements.semiMajorAxis / 1000).toFixed(0);
        
        this.eccentricitySlider.value = elements.eccentricity;
        this.eccentricityValue.value = elements.eccentricity.toFixed(2);
        
        this.inclinationSlider.value = elements.inclination;
        this.inclinationValue.value = elements.inclination.toFixed(2);
        
        this.lonAscendingNodeSlider.value = elements.lonAscendingNode;
        this.lonAscendingNodeValue.value = elements.lonAscendingNode.toFixed(2);
        
        this.argPerigeeSlider.value = elements.argPerigee;
        this.argPerigeeValue.value = elements.argPerigee.toFixed(2);
        
        this.meanAnomalySlider.value = elements.meanAnomaly;
        this.meanAnomalyValue.value = elements.meanAnomaly.toFixed(2);
    }
    
    updateTimeDisplay() {
        this.infoDisplay.textContent = this.simulationState.getFormattedTime();
        this.timelineProgress.style.width = `${this.simulationState.getProgressPercentage()}%`;
    }
    
    togglePause() {
        const isPaused = this.simulationState.togglePause();
        this.pausePlayButton.textContent = isPaused ? '►' : '❚❚';
    }
    
    applyPreset(presetName) {
        if (!presetName || !this.presets[presetName]) return;
        
        const preset = this.presets[presetName];
        Object.assign(this.satellites[0].orbitalElements, preset.sat1);
        Object.assign(this.satellites[1].orbitalElements, preset.sat2);
        
        this.satellites[0].updateOrbit();
        this.satellites[1].updateOrbit();
        
        this.updateUI();
        if (this.onIntersectionUpdate) {
            this.onIntersectionUpdate();
        }
    }
    
    setPresets(presets) {
        this.presets = presets;
        this.populatePresetDropdown();
    }
    
    populatePresetDropdown() {
        if (!this.presetSelector || !this.presets) return;
        
        // Clear existing options except the first one ("Select Preset")
        while (this.presetSelector.children.length > 1) {
            this.presetSelector.removeChild(this.presetSelector.lastChild);
        }
        
        // Add preset options
        Object.keys(this.presets).forEach(presetKey => {
            const preset = this.presets[presetKey];
            const option = document.createElement('option');
            option.value = presetKey;
            option.textContent = preset.name;
            option.title = preset.description;
            this.presetSelector.appendChild(option);
        });
    }
    
    setIntersectionUpdateCallback(callback) {
        this.onIntersectionUpdate = callback;
    }
    
    setSceneManager(sceneManager) {
        this.sceneManager = sceneManager;
        // Set up texture loading callback
        if (sceneManager) {
            sceneManager.setTextureLoadedCallback(() => {
                this.hideLoadingOverlay();
                this.updateEarthButtonState();
                // Auto-apply texture if user has texture mode selected
                if (this.themeSettings.earthStyle === 'texture') {
                    this.applyThemeSettings();
                }
            });
        }
    }
    
    // Theme management
    toggleEarthStyle() {
        this.themeSettings.earthStyle = this.themeSettings.earthStyle === 'wireframe' ? 'texture' : 'wireframe';
        this.applyThemeSettings();
        this.saveThemeSettings();
    }
    
    toggleGrid() {
        this.themeSettings.gridVisible = !this.themeSettings.gridVisible;
        this.applyThemeSettings();
        this.saveThemeSettings();
    }
    
    applyThemeSettings() {
        if (this.sceneManager) {
            this.sceneManager.setEarthStyle(this.themeSettings.earthStyle);
            this.sceneManager.setGridVisible(this.themeSettings.gridVisible);
        }
        
        this.updateEarthButtonState();
        
        if (this.themeSettings.gridVisible) {
            this.themeGridButton.classList.add('active');
        } else {
            this.themeGridButton.classList.remove('active');
        }
    }
    
    updateEarthButtonState() {
        const isTextureMode = this.themeSettings.earthStyle === 'texture';
        const isLoading = this.sceneManager && this.sceneManager.isTextureLoading();
        
        if (isTextureMode) {
            this.themeEarthButton.classList.add('active');
            if (isLoading) {
                this.themeEarthButton.innerHTML = '⏳'; // Loading spinner
                this.themeEarthButton.style.opacity = '0.7';
            } else {
                this.themeEarthButton.innerHTML = '🌎';
                this.themeEarthButton.style.opacity = '1';
            }
        } else {
            this.themeEarthButton.classList.remove('active');
            this.themeEarthButton.innerHTML = '🌐';
            this.themeEarthButton.style.opacity = '1';
        }
    }
    
    hideLoadingOverlay() {
        if (this.loadingOverlay) {
            this.loadingOverlay.classList.add('hidden');
            // Remove from DOM after transition completes
            setTimeout(() => {
                if (this.loadingOverlay && this.loadingOverlay.classList.contains('hidden')) {
                    this.loadingOverlay.style.display = 'none';
                }
            }, 500);
        }
    }
    
    saveThemeSettings() {
        localStorage.setItem('orbitalatorTheme', JSON.stringify(this.themeSettings));
    }
    
    loadThemeSettings() {
        const savedSettings = localStorage.getItem('orbitalatorTheme');
        if (savedSettings) {
            this.themeSettings = JSON.parse(savedSettings);
        }
        this.applyThemeSettings();
    }
}
