// Audio utilities for game sounds

// Map of loaded audio buffers
const audioBuffers = new Map();

// Create a single audio context that will be reused
let audioContext = null;
let isMuted = false;
let isMusicMuted = false;
let globalGainNode = null;
let musicGainNode = null;
let sfxGainNode = null;

// Initialize the audio context on first user interaction
export const initAudioContext = () => {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    globalGainNode = audioContext.createGain();
    musicGainNode = audioContext.createGain();
    sfxGainNode = audioContext.createGain();
    
    // Connect gain nodes
    musicGainNode.connect(globalGainNode);
    sfxGainNode.connect(globalGainNode);
    globalGainNode.connect(audioContext.destination);
  }
  return audioContext;
};

// Toggle global mute state
export const toggleMute = () => {
  isMuted = !isMuted;
  if (globalGainNode) {
    globalGainNode.gain.value = isMuted ? 0 : 1;
  }
  return isMuted;
};

// Toggle music mute state
export const toggleMusicMute = () => {
  isMusicMuted = !isMusicMuted;
  if (musicGainNode) {
    musicGainNode.gain.value = isMusicMuted ? 0 : 1;
  }
  return isMusicMuted;
};

// Get current mute states
export const getMuteState = () => isMuted;
export const getMusicMuteState = () => isMusicMuted;

// Preload audio files
export const preloadAudio = async (audioFiles) => {
  // Create context if it doesn't exist
  const context = initAudioContext();
  
  try {
    for (const [name, url] of Object.entries(audioFiles)) {
      // Skip if already loaded
      if (audioBuffers.has(name)) continue;
      
      // Fetch the audio file
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      
      // Decode the audio data
      const audioBuffer = await context.decodeAudioData(arrayBuffer);
      
      // Store for later use
      audioBuffers.set(name, audioBuffer);
    }
    console.log('Audio preloaded successfully');
    return true;
  } catch (error) {
    console.error('Error preloading audio:', error);
    return false;
  }
};

// Play a sound with variable parameters
export const playSound = (name, options = {}) => {
  if (!audioContext) {
    initAudioContext();
  }
  
  // Get the buffer
  const buffer = audioBuffers.get(name);
  if (!buffer) {
    console.warn(`Sound "${name}" not found`);
    return null;
  }
  
  // Create source
  const source = audioContext.createBufferSource();
  source.buffer = buffer;
  
  // Create gain node for volume control
  const gainNode = audioContext.createGain();
  
  // Apply options
  const { volume = 1, playbackRate = 1, detune = 0, loop = false, isMusic = false } = options;
  
  gainNode.gain.value = volume;
  source.playbackRate.value = playbackRate;
  source.detune.value = detune;
  source.loop = loop;
  
  // Connect nodes through appropriate gain node
  source.connect(gainNode);
  gainNode.connect(isMusic ? musicGainNode : sfxGainNode);
  
  // Play the sound
  source.start(0);
  
  return { source, gainNode };
};

// Play a bounce sound with parameters based on collision strength
export const playBounceSound = (strength = 0.5, options = {}) => {
  // Ensure strength is normalized to 0-1 range
  const normalizedStrength = Math.max(0, Math.min(1, strength));
  
  // Scale from input range (0.06-0.5) to output range (0-80) exponentially (reduced by 20%)
  const scaledVolume = normalizedStrength <= 0.06 ? 0 : 
    Math.min(40, Math.pow((normalizedStrength - 0.06) / (0.5 - 0.06), 2) * 80);
  
  // Convert 0-80 scale to 0-0.8 range for audio API
  const volume = scaledVolume / 100;
  
  // Playback rate varies based on impact strength - harder hits sound slightly higher pitched
  // But keep within reasonable range to maintain realism
  const playbackRate = 0.85 + (normalizedStrength * 0.3); // Range: 0.85-1.15
  
  // Play with consistent pitch (no variation or detune)
  return playSound('bounce', {
    volume,
    playbackRate: playbackRate,
    ...options
  });
};

// First, let's make sure the audio files are registered in the audio library
const audioFiles = {
    'score1': '/audio/score-1.mp3',
    'score2': '/audio/score-2.mp3',
    'score3': '/audio/score-3.mp3',
    'bounce': '/audio/ball-bounce.mp3',
    'ambientMusic': '/audio/ambient-music.mp3'
};

// Make sure the audioFiles are exported
export { audioFiles }; 