/**
 * GomokuSoundManager - Audio Effects Management for Gomoku
 * 
 * Adapted from Connect4 SoundManager for Gomoku gameplay.
 * Handles all sound effects with graceful fallbacks, user preferences,
 * and performance optimization.
 * 
 * Features:
 * - Stone placement sounds
 * - Victory celebration audio
 * - UI feedback sounds
 * - Volume control and mute functionality
 * - Graceful degradation when audio unavailable
 * - Mobile-optimized with touch-to-play support
 */

export class GomokuSoundManager {
    constructor(options = {}) {
        // Singleton pattern
        if (GomokuSoundManager.instance) {
            return GomokuSoundManager.instance;
        }
        GomokuSoundManager.instance = this;
        
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
        
        // Gomoku-specific sound definitions
        this.soundEffects = {
            stonePlace: {
                file: 'stone-place.mp3',
                volume: 0.4,
                description: 'Stone placement sound',
                fallback: this.generateStoneSound.bind(this)
            },
            victory: {
                file: 'victory-fanfare.mp3',
                volume: 0.6,
                description: 'Victory celebration',
                fallback: this.generateVictorySound.bind(this)
            },
            hover: {
                file: 'ui-hover.mp3',
                volume: 0.2,
                description: 'UI hover feedback',
                fallback: this.generateHoverSound.bind(this)
            },
            buttonClick: {
                file: 'button-click.mp3',
                volume: 0.3,
                description: 'Button click sound',
                fallback: this.generateClickSound.bind(this)
            },
            aiMove: {
                file: 'ai-move.mp3',
                volume: 0.35,
                description: 'AI move notification',
                fallback: this.generateAIMoveSound.bind(this)
            },
            invalidMove: {
                file: 'invalid-move.mp3',
                volume: 0.25,
                description: 'Invalid move feedback',
                fallback: this.generateErrorSound.bind(this)
            }
        };
        
        console.log('🔊 GomokuSoundManager initialized');
    }
    
    /**
     * Initialize the sound system
     * Must be called after user interaction for mobile browsers
     */
    async init() {
        if (this.isInitialized || !this.config.enabled) {
            return;
        }
        
        try {
            // Initialize Web Audio API
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // Resume audio context if suspended (mobile requirement)
            if (this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
            }
            
            // Preload sounds if enabled
            if (this.config.preload) {
                await this.preloadSounds();
            }
            
            this.isInitialized = true;
            this.userInteracted = true;
            
            console.log('✅ GomokuSoundManager audio context initialized');
        } catch (error) {
            console.warn('⚠️ GomokuSoundManager audio initialization failed:', error.message);
            // Graceful fallback - disable audio features
            this.config.enabled = false;
        }
    }
    
    /**
     * Preload all sound effects
     * @private
     */
    async preloadSounds() {
        const loadPromises = Object.entries(this.soundEffects).map(async ([name, config]) => {
            try {
                await this.loadSound(name, config);
                console.log(`🔊 Loaded sound: ${name}`);
            } catch (error) {
                console.warn(`⚠️ Failed to load sound ${name}:`, error.message);
                // Create fallback sound
                this.createFallbackSound(name, config);
            }
        });
        
        await Promise.allSettled(loadPromises);
    }
    
    /**
     * Load a specific sound effect
     * @private
     */
    async loadSound(name, config) {
        if (!this.audioContext) {
            throw new Error('Audio context not initialized');
        }
        
        const audioPath = `${this.config.audioPath}${config.file}`;
        const response = await fetch(audioPath);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
        
        this.audioBuffers.set(name, {
            buffer: audioBuffer,
            volume: config.volume
        });
    }
    
    /**
     * Create fallback sound using Web Audio API synthesis
     * @private
     */
    createFallbackSound(name, config) {
        if (config.fallback && typeof config.fallback === 'function') {
            try {
                const fallbackBuffer = config.fallback();
                this.audioBuffers.set(name, {
                    buffer: fallbackBuffer,
                    volume: config.volume
                });
                console.log(`🎵 Created fallback sound for: ${name}`);
            } catch (error) {
                console.warn(`⚠️ Fallback sound creation failed for ${name}:`, error.message);
            }
        }
    }
    
    /**
     * Play a sound effect
     */
    play(soundName, options = {}) {
        if (!this.config.enabled || !this.isInitialized) {
            return;
        }
        
        const soundData = this.audioBuffers.get(soundName);
        if (!soundData) {
            console.warn(`⚠️ Sound not found: ${soundName}`);
            return;
        }
        
        try {
            const source = this.audioContext.createBufferSource();
            const gainNode = this.audioContext.createGain();
            
            source.buffer = soundData.buffer;
            
            // Configure volume
            const volume = (options.volume !== undefined ? options.volume : soundData.volume) * this.config.volume;
            gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);
            
            // Connect audio graph
            source.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            // Play sound
            source.start(0);
            
            // Cleanup
            source.onended = () => {
                source.disconnect();
                gainNode.disconnect();
            };
            
        } catch (error) {
            console.warn(`⚠️ Failed to play sound ${soundName}:`, error.message);
        }
    }
    
    /**
     * Play stone placement sound
     */
    playStonePlace(player = 1) {
        // Slight pitch variation based on player
        const pitchVariation = player === 1 ? 1.0 : 1.1;
        this.play('stonePlace', { pitch: pitchVariation });
    }
    
    /**
     * Play victory sound
     */
    playVictory() {
        this.play('victory');
    }
    
    /**
     * Play AI move sound
     */
    playAIMove() {
        this.play('aiMove');
    }
    
    /**
     * Play hover sound
     */
    playHover() {
        this.play('hover');
    }
    
    /**
     * Play button click sound
     */
    playButtonClick() {
        this.play('buttonClick');
    }
    
    /**
     * Play invalid move sound
     */
    playInvalidMove() {
        this.play('invalidMove');
    }
    
    /**
     * Set master volume (0.0 to 1.0)
     */
    setVolume(volume) {
        this.config.volume = Math.max(0, Math.min(1, volume));
        this.saveUserPreferences();
        console.log(`🔊 Volume set to: ${(this.config.volume * 100).toFixed(0)}%`);
    }
    
    /**
     * Toggle sound on/off
     */
    toggle() {
        this.config.enabled = !this.config.enabled;
        this.saveUserPreferences();
        console.log(`🔊 Sound ${this.config.enabled ? 'enabled' : 'disabled'}`);
        return this.config.enabled;
    }
    
    /**
     * Enable sound
     */
    enable() {
        this.config.enabled = true;
        this.saveUserPreferences();
    }
    
    /**
     * Disable sound
     */
    disable() {
        this.config.enabled = false;
        this.saveUserPreferences();
    }
    
    /**
     * Get current volume
     */
    getVolume() {
        return this.config.volume;
    }
    
    /**
     * Check if sound is enabled
     */
    isEnabled() {
        return this.config.enabled;
    }
    
    /**
     * Load user preferences from localStorage
     * @private
     */
    loadUserPreferences() {
        try {
            const saved = localStorage.getItem('gomoku-sound-preferences');
            if (saved) {
                const preferences = JSON.parse(saved);
                this.config.volume = preferences.volume || this.config.volume;
                this.config.enabled = preferences.enabled !== false;
            }
        } catch (error) {
            console.warn('⚠️ Failed to load sound preferences:', error.message);
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
            localStorage.setItem('gomoku-sound-preferences', JSON.stringify(preferences));
        } catch (error) {
            console.warn('⚠️ Failed to save sound preferences:', error.message);
        }
    }
    
    // ==================== FALLBACK SOUND GENERATORS ====================
    
    /**
     * Generate stone placement sound
     * @private
     */
    generateStoneSound() {
        if (!this.audioContext) return null;
        
        const sampleRate = this.audioContext.sampleRate;
        const duration = 0.1; // 100ms
        const buffer = this.audioContext.createBuffer(1, sampleRate * duration, sampleRate);
        const data = buffer.getChannelData(0);
        
        // Generate a soft "click" sound
        for (let i = 0; i < data.length; i++) {
            const t = i / sampleRate;
            const envelope = Math.exp(-t * 20); // Exponential decay
            const frequency = 200 + (100 * Math.exp(-t * 5)); // Descending frequency
            data[i] = Math.sin(2 * Math.PI * frequency * t) * envelope * 0.3;
        }
        
        return buffer;
    }
    
    /**
     * Generate victory celebration sound
     * @private
     */
    generateVictorySound() {
        if (!this.audioContext) return null;
        
        const sampleRate = this.audioContext.sampleRate;
        const duration = 1.0; // 1 second
        const buffer = this.audioContext.createBuffer(1, sampleRate * duration, sampleRate);
        const data = buffer.getChannelData(0);
        
        // Generate ascending chord progression
        const frequencies = [261.63, 329.63, 392.00, 523.25]; // C-E-G-C
        
        for (let i = 0; i < data.length; i++) {
            const t = i / sampleRate;
            const envelope = Math.exp(-t * 2); // Slower decay
            
            let sample = 0;
            frequencies.forEach((freq, index) => {
                const delay = index * 0.1; // Stagger notes
                if (t > delay) {
                    sample += Math.sin(2 * Math.PI * freq * (t - delay)) * envelope * 0.15;
                }
            });
            
            data[i] = sample;
        }
        
        return buffer;
    }
    
    /**
     * Generate hover sound
     * @private
     */
    generateHoverSound() {
        if (!this.audioContext) return null;
        
        const sampleRate = this.audioContext.sampleRate;
        const duration = 0.05; // 50ms
        const buffer = this.audioContext.createBuffer(1, sampleRate * duration, sampleRate);
        const data = buffer.getChannelData(0);
        
        // Generate soft sine wave
        for (let i = 0; i < data.length; i++) {
            const t = i / sampleRate;
            const envelope = Math.sin(Math.PI * t / duration); // Sine envelope
            data[i] = Math.sin(2 * Math.PI * 800 * t) * envelope * 0.1;
        }
        
        return buffer;
    }
    
    /**
     * Generate click sound
     * @private
     */
    generateClickSound() {
        if (!this.audioContext) return null;
        
        const sampleRate = this.audioContext.sampleRate;
        const duration = 0.05; // 50ms
        const buffer = this.audioContext.createBuffer(1, sampleRate * duration, sampleRate);
        const data = buffer.getChannelData(0);
        
        // Generate sharp click
        for (let i = 0; i < data.length; i++) {
            const t = i / sampleRate;
            const envelope = Math.exp(-t * 50); // Very fast decay
            data[i] = Math.sin(2 * Math.PI * 1200 * t) * envelope * 0.2;
        }
        
        return buffer;
    }
    
    /**
     * Generate AI move sound
     * @private
     */
    generateAIMoveSound() {
        if (!this.audioContext) return null;
        
        const sampleRate = this.audioContext.sampleRate;
        const duration = 0.2; // 200ms
        const buffer = this.audioContext.createBuffer(1, sampleRate * duration, sampleRate);
        const data = buffer.getChannelData(0);
        
        // Generate distinctive AI sound (descending beep)
        for (let i = 0; i < data.length; i++) {
            const t = i / sampleRate;
            const envelope = Math.exp(-t * 10); // Medium decay
            const frequency = 600 - (200 * t); // Descending frequency
            data[i] = Math.sin(2 * Math.PI * frequency * t) * envelope * 0.25;
        }
        
        return buffer;
    }
    
    /**
     * Generate error sound
     * @private
     */
    generateErrorSound() {
        if (!this.audioContext) return null;
        
        const sampleRate = this.audioContext.sampleRate;
        const duration = 0.3; // 300ms
        const buffer = this.audioContext.createBuffer(1, sampleRate * duration, sampleRate);
        const data = buffer.getChannelData(0);
        
        // Generate error buzz (low frequency)
        for (let i = 0; i < data.length; i++) {
            const t = i / sampleRate;
            const envelope = Math.exp(-t * 5); // Slow decay
            data[i] = Math.sin(2 * Math.PI * 120 * t) * envelope * 0.2;
        }
        
        return buffer;
    }
    
    /**
     * Cleanup resources
     */
    destroy() {
        if (this.audioContext) {
            this.audioContext.close();
        }
        this.audioBuffers.clear();
        this.sounds.clear();
        GomokuSoundManager.instance = null;
        console.log('🔊 GomokuSoundManager destroyed');
    }
}

export default GomokuSoundManager;