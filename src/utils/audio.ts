// Zero-latency Web Audio API synthesiser for tactile hardware sounds

export type AudioTone = 'synth' | 'relay' | 'chiptune' | 'hum' | 'pneumatic';

let audioMuted = false;
let currentTone: AudioTone = 'synth';

// Initialize state from localStorage on client side
if (typeof window !== 'undefined') {
  try {
    const savedMute = localStorage.getItem('synth_audio_muted');
    if (savedMute !== null) {
      audioMuted = savedMute === 'true';
    }
    const savedTone = localStorage.getItem('synth_audio_tone');
    if (savedTone !== null && ['synth', 'relay', 'chiptune', 'hum', 'pneumatic'].includes(savedTone)) {
      currentTone = savedTone as AudioTone;
    }
  } catch {
    // Fail silently
  }
}

export function isAudioMuted(): boolean {
  return audioMuted;
}

export function setAudioMuted(muted: boolean): void {
  audioMuted = muted;
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('synth_audio_muted', String(muted));
    } catch {
      // Fail silently
    }
  }
}

export function toggleAudioMute(): boolean {
  const newState = !audioMuted;
  setAudioMuted(newState);
  return newState;
}

export function getCurrentAudioTone(): AudioTone {
  return currentTone;
}

export function setCurrentAudioTone(tone: AudioTone): void {
  currentTone = tone;
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('synth_audio_tone', tone);
    } catch {
      // Fail silently
    }
  }
}

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AudioContextClass = window.AudioContext || 
    (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextClass) return null;
  return new AudioContextClass();
}

/**
 * Generate a short burst of noise for mechanical sounds
 */
function playNoiseBurst(ctx: AudioContext, gainVal: number, duration: number, bandPassFreq: number) {
  try {
    const bufferSize = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noiseNode = ctx.createBufferSource();
    noiseNode.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(bandPassFreq, ctx.currentTime);
    filter.Q.setValueAtTime(1.5, ctx.currentTime);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(gainVal, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    noiseNode.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    noiseNode.start();
    noiseNode.stop(ctx.currentTime + duration + 0.01);
  } catch {
    // Fail silently
  }
}

/**
 * Play a physical toggle or button click sound
 */
export function playClickSound(isActive: boolean = true): void {
  if (audioMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;

    switch (currentTone) {
      case 'relay': {
        // Relay: Sharp click-clack contacts (2 extremely short high-pass clicks spaced 5ms apart)
        const bounceTime = 0.006;
        for (let i = 0; i < 2; i++) {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(2500 - (i * 500), now + (i * bounceTime));
          
          gain.gain.setValueAtTime(0.06, now + (i * bounceTime));
          gain.gain.exponentialRampToValueAtTime(0.001, now + (i * bounceTime) + 0.01);
          
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + (i * bounceTime));
          osc.stop(now + (i * bounceTime) + 0.015);
        }
        break;
      }
      
      case 'chiptune': {
        // Chiptune: Quick retro arpeggiator/jump
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'square';
        
        const f1 = isActive ? 523.25 : 392.00; // C5 / G4
        const f2 = isActive ? 783.99 : 261.63; // G5 / C4
        
        osc.frequency.setValueAtTime(f1, now);
        osc.frequency.setValueAtTime(f2, now + 0.02);
        
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(now + 0.08);
        break;
      }

      case 'hum': {
        // Hum: Heavy industrial electric contact buzz
        const osc = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(isActive ? 120 : 90, now);
        
        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(isActive ? 240 : 180, now);
        
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
        
        osc.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);
        
        osc.start();
        osc2.start();
        osc.stop(now + 0.1);
        osc2.stop(now + 0.1);
        break;
      }

      case 'pneumatic': {
        // Pneumatic: Metal contact strike + short high frequency air release hiss
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(2000, now);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.015);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(now + 0.02);

        // Hiss noise
        playNoiseBurst(ctx, 0.07, 0.04, 3500);
        break;
      }

      case 'synth':
      default: {
        // Synth: Classic analog oscillator sweep
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        
        const startFreq = isActive ? 700 : 350;
        const endFreq = isActive ? 1100 : 150;
        const duration = 0.06;

        osc.frequency.setValueAtTime(startFreq, now);
        osc.frequency.exponentialRampToValueAtTime(endFreq, now + duration);

        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start();
        osc.stop(now + duration + 0.01);
        break;
      }
    }
  } catch {
    // Fail silently
  }
}

/**
 * Play a mechanical keypress sound for typing
 */
export function playKeyPressSound(): void {
  if (audioMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    switch (currentTone) {
      case 'relay':
        // Micro click
        osc.type = 'sine';
        osc.frequency.setValueAtTime(3200 + Math.random() * 400, now);
        gain.gain.setValueAtTime(0.025, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.01);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(now + 0.012);
        break;
        
      case 'chiptune':
        // Short arcade blip
        osc.type = 'square';
        osc.frequency.setValueAtTime(1000 + Math.random() * 200, now);
        gain.gain.setValueAtTime(0.015, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.025);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(now + 0.03);
        break;

      case 'hum':
        // Micro hum/buzz
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(120 + Math.random() * 20, now);
        gain.gain.setValueAtTime(0.03, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(now + 0.035);
        break;

      case 'pneumatic':
        // Tiny air puff
        playNoiseBurst(ctx, 0.02, 0.015, 4000);
        break;

      case 'synth':
      default:
        // Tiny sweep ping
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1200 + Math.random() * 200, now);
        gain.gain.setValueAtTime(0.04, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.02);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(now + 0.025);
        break;
    }
  } catch {
    // Fail silently
  }
}

/**
 * Play a synthesizer connection chime for patch bays
 */
export function playConnectSound(): void {
  if (audioMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    
    // Scale connection chime based on current profile
    switch (currentTone) {
      case 'relay': {
        // Fast relay rack activation sequence
        const relayTimes = [0, 0.04, 0.08, 0.12];
        relayTimes.forEach((delay) => {
          setTimeout(() => playClickSound(true), delay * 1000);
        });
        break;
      }
      
      case 'chiptune': {
        // Retro coin cascade arpeggio
        const coinNotes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6 square blips
        coinNotes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'square';
          osc.frequency.setValueAtTime(freq, now + idx * 0.05);
          gain.gain.setValueAtTime(0.03, now + idx * 0.05);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.06);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + idx * 0.05);
          osc.stop(now + idx * 0.05 + 0.07);
        });
        break;
      }

      case 'hum': {
        // Substation startup charge buzz
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(80, now);
        osc.frequency.linearRampToValueAtTime(160, now + 0.25);
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.15, now + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(now + 0.26);
        break;
      }

      case 'pneumatic': {
        // Double solenoid piston exhaust hiss
        playNoiseBurst(ctx, 0.09, 0.15, 3000);
        setTimeout(() => playNoiseBurst(ctx, 0.07, 0.12, 2500), 100);
        break;
      }

      case 'synth':
      default: {
        // Vintage C major arpeggio chime
        const notes = [261.63, 329.63, 392.00, 523.25];
        const noteDuration = 0.08;
        const overlap = 0.02;

        notes.forEach((freq, index) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + index * noteDuration);

          gain.gain.setValueAtTime(0, now + index * noteDuration);
          gain.gain.linearRampToValueAtTime(0.08, now + index * noteDuration + 0.01);
          gain.gain.exponentialRampToValueAtTime(0.001, now + (index + 1) * noteDuration + overlap);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(now + index * noteDuration);
          osc.stop(now + (index + 1) * noteDuration + overlap + 0.02);
        });
        break;
      }
    }
  } catch {
    // Fail silently
  }
}
