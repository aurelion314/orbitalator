export class SimulationState {
    constructor() {
        this.time = 0;
        this.speed = 100;
        this.isPaused = false;
        this.duration = 172800; // 48 hours in seconds
        this.collisionCheckCounter = 0;
        this.nextCollisionInfo = null;
    }
    
    update(deltaTime) {
        if (!this.isPaused) {
            this.time += deltaTime * this.speed;
        }
        
        // Loop simulation time
        if (this.time > this.duration) {
            this.time = 0;
        }
        if (this.time < 0) {
            this.time = this.duration;
        }
        
        this.collisionCheckCounter += deltaTime;
    }
    
    setSpeed(speed) {
        this.speed = speed;
    }
    
    pause() {
        this.isPaused = true;
    }
    
    play() {
        this.isPaused = false;
    }
    
    togglePause() {
        this.isPaused = !this.isPaused;
        return this.isPaused;
    }
    
    jumpTime(seconds) {
        this.time += seconds;
    }
    
    reset() {
        this.time = 0;
    }
    
    getFormattedTime() {
        const hours = Math.floor(this.time / 3600);
        const minutes = Math.floor((this.time % 3600) / 60);
        const seconds = Math.floor(this.time % 60);
        return `T+ ${hours}h ${minutes}m ${seconds}s`;
    }
    
    getProgressPercentage() {
        return (this.time / this.duration) * 100;
    }
    
    shouldCheckCollisions() {
        if (this.collisionCheckCounter > 1) { // Check every 1 second
            this.collisionCheckCounter = 0;
            return true;
        }
        return false;
    }
    
    setCollisionInfo(info) {
        this.nextCollisionInfo = info;
    }
    
    getCollisionInfo() {
        return this.nextCollisionInfo;
    }
}
