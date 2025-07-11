/**
 * SoundManager - Audio Effects Management for Connect4
 * 
 * Handles all sound effects with graceful fallbacks, user preferences,
 * and performance optimization. Supports Web Audio API with fallbacks.
 * 
 * Features:
 * - Sound preloading for instant playback
 * - Volume control and mute functionality
 * - Graceful degradation when audio unavailable
 * - Mobile-optimized with touch-to-play support
 * - Memory-efficient audio pool management
 * - User preference persistence
 */

export class SoundManager {
    constructor(options = {}) {
        // Singleton pattern
        if (SoundManager.instance) {
            return SoundManager.instance;
        }
        SoundManager.instance = this;
        
        // Configuration
        this.config = {
            volume: options.volume || 0.3,
            enabled: options.enabled !== false,
            preload: options.preload !== false,
            audioPath: options.audioPath || './assets/audio/',
            ...options
        };
        
        // Audio context and state
        this.audioContext = null;
        this.sounds = new Map();
        this.audioBuffers = new Map();
        this.isInitialized = false;
        this.userInteracted = false;
        
        // Load user preferences
        this.loadUserPreferences();
        
        // Sound definitions
        this.soundEffects = {
            piecePlace: {
                file: 'piece-place.mp3',
                volume: 0.4,
                description: 'Piece placement sound'
            },
            victory: {
                file: 'victory-fanfare.mp3',
                volume: 0.6,
                description: 'Victory celebration'
            },
            hover: {
                file: 'ui-hover.mp3',
                volume: 0.2,
                description: 'UI hover feedback'
            },
            buttonClick: {
                file: 'button-click.mp3',
                volume: 0.3,
                description: 'Button click feedback'
            },
            confetti: {
                file: 'confetti-burst.mp3',
                volume: 0.4,
                description: 'Confetti celebration'
            },
            gameStart: {
                file: 'game-start.mp3',
                volume: 0.3,
                description: 'Game start chime'
            },
            error: {
                file: 'error-beep.mp3',
                volume: 0.4,
                description: 'Error notification'
            }
        };
        
        // Initialize if user has already interacted
        this.setupUserInteractionDetection();
        
        console.log('🔊 SoundManager initialized', this.config.enabled ? 'enabled' : 'disabled');
    }
    
    /**
     * Setup user interaction detection for mobile audio unlock
     * @private
     */
    setupUserInteractionDetection() {
        const unlockAudio = () => {
            if (!this.userInteracted) {
                this.userInteracted = true;
                this.initializeAudioContext();
                
                // Remove event listeners after first interaction
                document.removeEventListener('click', unlockAudio);
                document.removeEventListener('touchstart', unlockAudio);
                document.removeEventListener('keydown', unlockAudio);
            }
        };
        
        // Listen for first user interaction
        document.addEventListener('click', unlockAudio, { once: true });
        document.addEventListener('touchstart', unlockAudio, { once: true });
        document.addEventListener('keydown', unlockAudio, { once: true });
    }
    
    /**
     * Initialize Web Audio API context
     * @private
     */
    async initializeAudioContext() {
        if (this.isInitialized || !this.config.enabled) return;
        
        try {
            // Create audio context
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (!AudioContext) {
                throw new Error('Web Audio API not supported');
            }
            
            this.audioContext = new AudioContext();
            
            // Resume context if suspended (required on some browsers)
            if (this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
            }
            
            this.isInitialized = true;
            
            // Preload sounds if enabled
            if (this.config.preload) {
                await this.preloadSounds();
            }
            
            console.log('🔊 Audio context initialized successfully');
            
        } catch (error) {
            console.warn('🔊 Failed to initialize audio:', error.message);
            this.config.enabled = false;
        }
    }
    
    /**
     * Preload all sound effects
     * @private
     */
    async preloadSounds() {
        console.log('🔊 Preloading sound effects...');
        
        const loadPromises = Object.entries(this.soundEffects).map(async ([key, sound]) => {
            try {
                await this.loadSound(key, sound.file);
            } catch (error) {
                console.warn(`🔊 Failed to load sound ${key}:`, error.message);
            }
        });
        
        await Promise.allSettled(loadPromises);
        if (this.audioBuffers.size > 0) {
            console.log(`🔊 Preloaded ${this.audioBuffers.size}/${Object.keys(this.soundEffects).length} sounds`);
        } else {
            console.log(`🔊 Audio system initialized without sound files (silent mode)`);
        }
    }
    
    /**
     * Load individual sound file
     * @private
     */
    async loadSound(key, filename) {
        const url = this.config.audioPath + filename;
        
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const arrayBuffer = await response.arrayBuffer();
            const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
            
            this.audioBuffers.set(key, audioBuffer);
            console.log(`🔊 Loaded sound: ${key}`);
            
        } catch (error) {
            // Reduce log spam for 404 errors (expected when no audio files exist)
            if (error.message.includes('404')) {
                console.log(`🔊 Audio file not found: ${filename} (using silent fallback)`);
            } else {
                console.warn(`🔊 Failed to load ${filename}:`, error.message);
            }
            // Create silent buffer as fallback
            this.createSilentBuffer(key);
        }
    }
    
    /**
     * Create silent audio buffer as fallback
     * @private
     */
    createSilentBuffer(key) {
        const buffer = this.audioContext.createBuffer(1, 1, 22050);
        this.audioBuffers.set(key, buffer);
    }
    
    /**
     * Play sound effect
     * @param {string} soundKey - Sound effect key
     * @param {Object} options - Playback options
     */
    async play(soundKey, options = {}) {
        if (!this.config.enabled || !this.isInitialized) {
            return;
        }
        
        const soundConfig = this.soundEffects[soundKey];
        if (!soundConfig) {
            console.warn(`🔊 Unknown sound effect: ${soundKey}`);
            return;
        }
        
        try {
            // Ensure audio context is running
            if (this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
            }
            
            // Get or load audio buffer
            let audioBuffer = this.audioBuffers.get(soundKey);
            if (!audioBuffer) {
                await this.loadSound(soundKey, soundConfig.file);
                audioBuffer = this.audioBuffers.get(soundKey);
            }
            
            if (!audioBuffer) {
                console.warn(`🔊 Audio buffer not available for: ${soundKey}`);
                return;
            }
            
            // Create and configure audio source
            const source = this.audioContext.createBufferSource();
            const gainNode = this.audioContext.createGain();
            
            source.buffer = audioBuffer;
            source.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            // Set volume
            const volume = (options.volume || soundConfig.volume || 1.0) * this.config.volume;
            gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);
            
            // Configure playback options
            const startTime = this.audioContext.currentTime + (options.delay || 0);
            const duration = options.duration || audioBuffer.duration;
            
            source.start(startTime);
            if (duration < audioBuffer.duration) {
                source.stop(startTime + duration);
            }
            
            // Cleanup after playback
            source.addEventListener('ended', () => {
                source.disconnect();
                gainNode.disconnect();
            });
            
        } catch (error) {
            console.warn(`🔊 Failed to play sound ${soundKey}:`, error.message);
        }
    }
    
    /**
     * Play piece placement sound
     */
    playPiecePlace() {
        this.play('piecePlace');
    }
    
    /**
     * Play victory celebration
     */
    playVictory() {
        this.play('victory');
    }
    
    /**
     * Play hover feedback
     */
    playHover() {
        this.play('hover');
    }
    
    /**
     * Play button click
     */
    playButtonClick() {
        this.play('buttonClick');
    }
    
    /**
     * Play confetti burst
     */
    playConfetti() {
        this.play('confetti');
    }
    
    /**
     * Play game start sound
     */
    playGameStart() {
        this.play('gameStart');
    }
    
    /**
     * Play error notification
     */
    playError() {
        this.play('error');
    }
    
    /**
     * Set master volume
     * @param {number} volume - Volume level (0-1)
     */
    setVolume(volume) {
        this.config.volume = Math.max(0, Math.min(1, volume));
        this.saveUserPreferences();
        console.log(`🔊 Volume set to ${Math.round(this.config.volume * 100)}%`);
    }
    
    /**
     * Toggle sound on/off
     */
    toggle() {
        this.config.enabled = !this.config.enabled;
        this.saveUserPreferences();
        console.log(`🔊 Sound ${this.config.enabled ? 'enabled' : 'disabled'}`);
    }
    
    /**
     * Enable sounds
     */
    enable() {
        this.config.enabled = true;
        this.saveUserPreferences();
        
        if (!this.isInitialized && this.userInteracted) {
            this.initializeAudioContext();
        }
    }
    
    /**
     * Disable sounds
     */
    disable() {
        this.config.enabled = false;
        this.saveUserPreferences();
    }
    
    /**
     * Check if sounds are enabled
     */
    isEnabled() {
        return this.config.enabled;
    }
    
    /**
     * Get current volume
     */
    getVolume() {
        return this.config.volume;
    }
    
    /**
     * Load user preferences from localStorage
     * @private
     */
    loadUserPreferences() {
        try {
            const saved = localStorage.getItem('connect4-sound-preferences');
            if (saved) {
                const preferences = JSON.parse(saved);
                this.config.volume = preferences.volume || this.config.volume;
                this.config.enabled = preferences.enabled !== false;
            }
        } catch (error) {
            console.warn('🔊 Failed to load sound preferences:', error.message);
        }
    }
    
    /**
     * Save user preferences to localStorage
     * @private
     */
    saveUserPreferences() {
        try {
            const preferences = {
                volume: this.config.volume,
                enabled: this.config.enabled
            };
            localStorage.setItem('connect4-sound-preferences', JSON.stringify(preferences));
        } catch (error) {
            console.warn('🔊 Failed to save sound preferences:', error.message);
        }
    }
    
    /**
     * Get available sound effects
     */
    getAvailableSounds() {
        return Object.keys(this.soundEffects);
    }
    
    /**
     * Get sound manager status
     */
    getStatus() {
        return {
            enabled: this.config.enabled,
            initialized: this.isInitialized,
            userInteracted: this.userInteracted,
            volume: this.config.volume,
            audioContext: this.audioContext?.state,
            loadedSounds: this.audioBuffers.size,
            totalSounds: Object.keys(this.soundEffects).length
        };
    }
    
    /**
     * Cleanup audio resources
     */
    destroy() {
        // Stop all audio
        if (this.audioContext) {
            this.audioContext.close();
        }
        
        // Clear buffers
        this.audioBuffers.clear();
        this.sounds.clear();
        
        // Reset state
        this.isInitialized = false;
        this.userInteracted = false;
        
        console.log('🔊 SoundManager destroyed');
    }
}

// Export singleton instance
export const soundManager = new SoundManager();