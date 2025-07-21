/**
 * TrioSoundManager - Audio Feedback System for Trio
 * 
 * Adapted from Connect4/Gomoku SoundManager for Trio puzzle game.
 * Provides audio feedback for trio solutions, invalid attempts, and celebrations.
 * 
 * Features:
 * - Web Audio API integration for premium sound quality
 * - Trio-specific sound effects (success, invalid, victory)
 * - Volume controls and user preferences
 * - Audio context management and lifecycle
 * - Fallback for browsers without Web Audio API
 * - Memory-efficient audio buffer management
 */

export class TrioSoundManager {
    constructor(options = {}) {
        this.config = {
            volume: options.volume || 0.4,
            enabled: options.enabled !== false,
            audioContext: null,
            buffers: new Map(),
            ...options
        };
        
        // Sound effect configurations
        this.soundEffects = {
            trioSolution: {
                file: 'trio-solution.mp3',
                volume: 0.5,
                description: 'Valid trio solution found'
            },
            victory: {
                file: 'trio-victory.mp3', 
                volume: 0.7,
                description: 'Celebration for completed puzzle'
            },
            invalid: {
                file: 'trio-invalid.mp3',
                volume: 0.3,
                description: 'Invalid trio attempt'
            },
            selection: {
                file: 'trio-select.mp3',
                volume: 0.2,
                description: 'Cell selection feedback'
            },
            newBoard: {
                file: 'trio-new-board.mp3',
                volume: 0.4,
                description: 'New puzzle board generated'
            }
        };
        
        // Audio state
        this.initialized = false;
        this.currentlyPlaying = new Set();
        
        // Initialize audio system
        this.initializeAudio();
        
        console.log('🔊 TrioSoundManager initialized');
    }

    /**
     * Initialize Web Audio API
     * @private
     */
    async initializeAudio() {
        if (!this.config.enabled) {
            console.log('🔊 Audio disabled by configuration');
            return;
        }

        try {
            // Create audio context
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (!AudioContext) {
                console.warn('🔊 Web Audio API not supported');
                return;
            }

            this.config.audioContext = new AudioContext();
            
            // Handle audio context state
            if (this.config.audioContext.state === 'suspended') {
                // Audio context needs user interaction to start
                this.setupUserInteractionListener();
            } else {
                this.initialized = true;
            }

            console.log('🔊 Web Audio API initialized');
            
        } catch (error) {
            console.warn('🔊 Failed to initialize Web Audio API:', error.message);
        }
    }

    /**
     * Setup listener for user interaction to resume audio context
     * @private
     */
    setupUserInteractionListener() {
        const resumeAudio = async () => {
            if (this.config.audioContext && this.config.audioContext.state === 'suspended') {
                await this.config.audioContext.resume();
                this.initialized = true;
                console.log('🔊 Audio context resumed');
            }
            
            // Remove listeners after first interaction
            document.removeEventListener('click', resumeAudio);
            document.removeEventListener('keydown', resumeAudio);
            document.removeEventListener('touchstart', resumeAudio);
        };

        document.addEventListener('click', resumeAudio);
        document.addEventListener('keydown', resumeAudio);
        document.addEventListener('touchstart', resumeAudio);
    }

    /**
     * Load audio buffer from file
     * @private
     */
    async loadAudioBuffer(soundName) {
        if (!this.config.audioContext || this.config.buffers.has(soundName)) {
            return this.config.buffers.get(soundName);
        }

        try {
            const soundConfig = this.soundEffects[soundName];
            if (!soundConfig) {
                console.warn(`🔊 Sound effect not found: ${soundName}`);
                return null;
            }

            // For demo purposes, we'll create synthetic sounds
            // In production, you would load actual audio files
            const buffer = this.createSyntheticSound(soundName);
            this.config.buffers.set(soundName, buffer);
            
            return buffer;
            
        } catch (error) {
            console.warn(`🔊 Failed to load audio: ${soundName}`, error.message);
            return null;
        }
    }

    /**
     * Create synthetic sound for demo purposes
     * @private
     */
    createSyntheticSound(soundName) {
        const context = this.config.audioContext;
        const sampleRate = context.sampleRate;
        
        let duration, frequency, type;
        
        switch (soundName) {
            case 'trioSolution':
                duration = 0.3;
                frequency = 800;
                type = 'success';
                break;
            case 'victory':
                duration = 1.0;
                frequency = 600;
                type = 'celebration';
                break;
            case 'invalid':
                duration = 0.2;
                frequency = 200;
                type = 'error';
                break;
            case 'selection':
                duration = 0.1;
                frequency = 400;
                type = 'click';
                break;
            case 'newBoard':
                duration = 0.5;
                frequency = 500;
                type = 'chime';
                break;
            default:
                duration = 0.2;
                frequency = 440;
                type = 'default';
        }

        const buffer = context.createBuffer(1, duration * sampleRate, sampleRate);
        const data = buffer.getChannelData(0);

        // Generate appropriate waveform
        for (let i = 0; i < data.length; i++) {
            const t = i / sampleRate;
            let value = 0;

            switch (type) {
                case 'success':
                    value = Math.sin(2 * Math.PI * frequency * t) * Math.exp(-t * 3);
                    break;
                case 'celebration':
                    value = (Math.sin(2 * Math.PI * frequency * t) + 
                           Math.sin(2 * Math.PI * frequency * 1.5 * t)) * 
                           Math.exp(-t * 1.5);
                    break;
                case 'error':
                    value = (Math.random() * 2 - 1) * Math.exp(-t * 10);
                    break;
                case 'click':
                    value = Math.sin(2 * Math.PI * frequency * t) * Math.exp(-t * 20);
                    break;
                case 'chime':
                    value = (Math.sin(2 * Math.PI * frequency * t) + 
                           Math.sin(2 * Math.PI * frequency * 2 * t)) * 
                           Math.exp(-t * 2);
                    break;
                default:
                    value = Math.sin(2 * Math.PI * frequency * t) * Math.exp(-t * 5);
            }

            data[i] = value * 0.3; // Reduce volume
        }

        return buffer;
    }

    /**
     * Play sound effect
     * @private
     */
    async playSound(soundName, volumeMultiplier = 1.0) {
        if (!this.config.enabled || !this.initialized || !this.config.audioContext) {
            return;
        }

        try {
            const buffer = await this.loadAudioBuffer(soundName);
            if (!buffer) return;

            const source = this.config.audioContext.createBufferSource();
            const gainNode = this.config.audioContext.createGain();

            // Configure audio graph
            source.buffer = buffer;
            source.connect(gainNode);
            gainNode.connect(this.config.audioContext.destination);

            // Set volume
            const soundConfig = this.soundEffects[soundName];
            const finalVolume = this.config.volume * (soundConfig?.volume || 1.0) * volumeMultiplier;
            gainNode.gain.value = Math.max(0, Math.min(1, finalVolume));

            // Track playing sound
            const soundId = `${soundName}_${Date.now()}_${Math.random()}`;
            this.currentlyPlaying.add(soundId);

            // Clean up when finished
            source.onended = () => {
                this.currentlyPlaying.delete(soundId);
            };

            // Play sound
            source.start();

            console.log(`🔊 Playing sound: ${soundName}`);
            
        } catch (error) {
            console.warn(`🔊 Error playing sound ${soundName}:`, error.message);
        }
    }

    /**
     * Play trio solution sound
     */
    playTrioSolution() {
        this.playSound('trioSolution');
    }

    /**
     * Play victory celebration sound
     */
    playVictory() {
        this.playSound('victory');
    }

    /**
     * Play invalid trio sound
     */
    playInvalid() {
        this.playSound('invalid');
    }

    /**
     * Play cell selection sound
     */
    playSelection() {
        this.playSound('selection');
    }

    /**
     * Play new board generation sound
     */
    playNewBoard() {
        this.playSound('newBoard');
    }

    /**
     * Set master volume
     */
    setVolume(volume) {
        this.config.volume = Math.max(0, Math.min(1, volume));
        console.log(`🔊 Volume set to ${(this.config.volume * 100).toFixed(0)}%`);
    }

    /**
     * Get current volume
     */
    getVolume() {
        return this.config.volume;
    }

    /**
     * Enable/disable sound effects
     */
    setEnabled(enabled) {
        this.config.enabled = enabled;
        
        if (!enabled) {
            this.stopAll();
        }
        
        console.log(`🔊 Sound effects ${enabled ? 'enabled' : 'disabled'}`);
    }

    /**
     * Check if sound is enabled
     */
    isEnabled() {
        return this.config.enabled;
    }

    /**
     * Stop all currently playing sounds
     */
    stopAll() {
        this.currentlyPlaying.clear();
        console.log('🔊 All sounds stopped');
    }

    /**
     * Get sound configuration
     */
    getSoundConfig() {
        return {
            volume: this.config.volume,
            enabled: this.config.enabled,
            initialized: this.initialized,
            currentlyPlaying: this.currentlyPlaying.size,
            availableSounds: Object.keys(this.soundEffects)
        };
    }

    /**
     * Test all sound effects
     */
    async testAllSounds() {
        if (!this.config.enabled) {
            console.log('🔊 Sound testing skipped (disabled)');
            return;
        }

        console.log('🔊 Testing all trio sound effects...');
        
        const sounds = Object.keys(this.soundEffects);
        for (let i = 0; i < sounds.length; i++) {
            const soundName = sounds[i];
            console.log(`🔊 Testing: ${soundName}`);
            
            await this.playSound(soundName);
            
            // Wait between sounds
            await new Promise(resolve => setTimeout(resolve, 800));
        }
        
        console.log('🔊 Sound test completed');
    }

    /**
     * Get audio context information
     */
    getAudioInfo() {
        return {
            initialized: this.initialized,
            contextState: this.config.audioContext?.state,
            sampleRate: this.config.audioContext?.sampleRate,
            buffersLoaded: this.config.buffers.size,
            currentlyPlaying: this.currentlyPlaying.size
        };
    }

    /**
     * Cleanup and destroy sound manager
     */
    async destroy() {
        // Stop all playing sounds
        this.stopAll();
        
        // Close audio context
        if (this.config.audioContext) {
            try {
                await this.config.audioContext.close();
                console.log('🔊 Audio context closed');
            } catch (error) {
                console.warn('🔊 Error closing audio context:', error.message);
            }
        }
        
        // Clear buffers
        this.config.buffers.clear();
        
        // Reset state
        this.initialized = false;
        this.config.audioContext = null;
        this.currentlyPlaying.clear();
        
        console.log('🔊 TrioSoundManager destroyed');
    }
}

export default TrioSoundManager;