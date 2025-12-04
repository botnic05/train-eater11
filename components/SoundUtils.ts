
// SoundUtils.ts - Procedural Audio Generation
// Using Web Audio API to avoid external asset dependencies

let audioCtx: AudioContext | null = null;

const getContext = (): AudioContext => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioCtx;
};

// Simple noise buffer for explosions/gunshots
let noiseBuffer: AudioBuffer | null = null;
const getNoiseBuffer = (ctx: AudioContext) => {
  if (!noiseBuffer) {
    const bufferSize = ctx.sampleRate * 2; // 2 seconds
    noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }
  }
  return noiseBuffer;
};

export const playShootSound = () => {
  const ctx = getContext();
  if (ctx.state === 'suspended') ctx.resume();

  const t = ctx.currentTime;

  // 1. Noise Burst (The "Bang")
  const noise = ctx.createBufferSource();
  noise.buffer = getNoiseBuffer(ctx);
  const noiseFilter = ctx.createBiquadFilter();
  noiseFilter.type = 'lowpass';
  noiseFilter.frequency.setValueAtTime(1000, t);
  noiseFilter.frequency.exponentialRampToValueAtTime(100, t + 0.1);
  
  const noiseGain = ctx.createGain();
  noiseGain.gain.setValueAtTime(0.5, t);
  noiseGain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);

  noise.connect(noiseFilter);
  noiseFilter.connect(noiseGain);
  noiseGain.connect(ctx.destination);
  noise.start();
  noise.stop(t + 0.1);

  // 2. High frequency "Laser/Sci-fi" element
  const osc = ctx.createOscillator();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(600, t);
  osc.frequency.exponentialRampToValueAtTime(100, t + 0.15);

  const oscGain = ctx.createGain();
  oscGain.gain.setValueAtTime(0.1, t);
  oscGain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

  osc.connect(oscGain);
  oscGain.connect(ctx.destination);
  osc.start();
  osc.stop(t + 0.15);
};

export const playShotgunSound = () => {
  const ctx = getContext();
  if (ctx.state === 'suspended') ctx.resume();
  const t = ctx.currentTime;

  // Heavy Impact Noise
  const noise = ctx.createBufferSource();
  noise.buffer = getNoiseBuffer(ctx);
  
  const noiseFilter = ctx.createBiquadFilter();
  noiseFilter.type = 'lowpass';
  noiseFilter.frequency.setValueAtTime(800, t);
  noiseFilter.frequency.exponentialRampToValueAtTime(50, t + 0.3);
  
  const noiseGain = ctx.createGain();
  noiseGain.gain.setValueAtTime(0.8, t);
  noiseGain.gain.exponentialRampToValueAtTime(0.01, t + 0.3);

  noise.connect(noiseFilter);
  noiseFilter.connect(noiseGain);
  noiseGain.connect(ctx.destination);
  noise.start();
  noise.stop(t + 0.3);

  // Bass Kick
  const osc = ctx.createOscillator();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(100, t);
  osc.frequency.exponentialRampToValueAtTime(30, t + 0.2);

  const oscGain = ctx.createGain();
  oscGain.gain.setValueAtTime(0.8, t);
  oscGain.gain.exponentialRampToValueAtTime(0.01, t + 0.2);

  osc.connect(oscGain);
  oscGain.connect(ctx.destination);
  osc.start();
  osc.stop(t + 0.2);
};

export const playMachineGunSound = () => {
  const ctx = getContext();
  if (ctx.state === 'suspended') ctx.resume();
  const t = ctx.currentTime;

  // Snappy Noise
  const noise = ctx.createBufferSource();
  noise.buffer = getNoiseBuffer(ctx);
  
  const noiseFilter = ctx.createBiquadFilter();
  noiseFilter.type = 'highpass';
  noiseFilter.frequency.setValueAtTime(500, t);
  
  const noiseGain = ctx.createGain();
  noiseGain.gain.setValueAtTime(0.3, t);
  noiseGain.gain.exponentialRampToValueAtTime(0.01, t + 0.08);

  noise.connect(noiseFilter);
  noiseFilter.connect(noiseGain);
  noiseGain.connect(ctx.destination);
  noise.start();
  noise.stop(t + 0.1);

  // Mechanical Click
  const osc = ctx.createOscillator();
  osc.type = 'square';
  osc.frequency.setValueAtTime(200, t);
  
  const oscGain = ctx.createGain();
  oscGain.gain.setValueAtTime(0.2, t);
  oscGain.gain.exponentialRampToValueAtTime(0.01, t + 0.05);

  osc.connect(oscGain);
  oscGain.connect(ctx.destination);
  osc.start();
  osc.stop(t + 0.05);
};


export const playMonsterHitSound = () => {
  const ctx = getContext();
  if (ctx.state === 'suspended') ctx.resume();
  const t = ctx.currentTime;

  // "Squish" or "Roar" Impact
  const osc = ctx.createOscillator();
  osc.type = 'square';
  osc.frequency.setValueAtTime(150, t);
  osc.frequency.exponentialRampToValueAtTime(40, t + 0.2);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.4, t);
  gain.gain.exponentialRampToValueAtTime(0.01, t + 0.2);

  // Filter to make it sound muffled/fleshy
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(300, t);

  osc.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);

  osc.start();
  osc.stop(t + 0.2);
};

export const playPlayerDamageSound = () => {
  const ctx = getContext();
  if (ctx.state === 'suspended') ctx.resume();
  const t = ctx.currentTime;

  // Sharp crunch/bite sound
  const osc = ctx.createOscillator();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(200, t);
  osc.frequency.exponentialRampToValueAtTime(50, t + 0.1);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.5, t);
  gain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);

  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(1000, t);
  filter.frequency.linearRampToValueAtTime(100, t + 0.1);

  osc.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);

  osc.start();
  osc.stop(t + 0.1);
};

export const playImpactSound = (velocity: number) => {
  // Ignore small movements
  if (velocity < 1.5) return;

  const ctx = getContext();
  if (ctx.state === 'suspended') ctx.resume();
  const t = ctx.currentTime;

  // Cap volume
  const vol = Math.min(Math.max((velocity - 1.5) / 10, 0), 1) * 0.5;

  // Thud sound
  const osc = ctx.createOscillator();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(80, t); // Low thud
  osc.frequency.exponentialRampToValueAtTime(20, t + 0.1);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(vol, t);
  gain.gain.exponentialRampToValueAtTime(0.01, t + 0.15);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start();
  osc.stop(t + 0.15);
};

export const playBulletImpactSound = () => {
  const ctx = getContext();
  if (ctx.state === 'suspended') ctx.resume();
  const t = ctx.currentTime;

  // High pitch "tink" or "thwack"
  const osc = ctx.createOscillator();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(800, t);
  osc.frequency.exponentialRampToValueAtTime(100, t + 0.05);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.1, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc.stop(t + 0.05);
};

export const playWoodBreakSound = () => {
    const ctx = getContext();
    if (ctx.state === 'suspended') ctx.resume();
    const t = ctx.currentTime;
  
    // Crunchy noise
    const noise = ctx.createBufferSource();
    noise.buffer = getNoiseBuffer(ctx);
    
    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'lowpass';
    noiseFilter.frequency.setValueAtTime(500, t);
    
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.5, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, t + 0.2);
  
    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    noise.start();
    noise.stop(t + 0.2);
};

export const playGlassBreakSound = () => {
    const ctx = getContext();
    if (ctx.state === 'suspended') ctx.resume();
    const t = ctx.currentTime;
  
    // High pitch sharp noise
    const noise = ctx.createBufferSource();
    noise.buffer = getNoiseBuffer(ctx);
    
    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'highpass';
    noiseFilter.frequency.setValueAtTime(2000, t);
    
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.6, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, t + 0.3);
  
    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    noise.start();
    noise.stop(t + 0.3);

    // Add a few high sine pings for "tinkling"
    for(let i=0; i<3; i++) {
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(2000 + Math.random()*3000, t + Math.random()*0.1);
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.1, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
        osc.connect(g);
        g.connect(ctx.destination);
        osc.start();
        osc.stop(t+0.2);
    }
};
