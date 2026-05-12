// js/AudioManager.js

const AudioContext = window.AudioContext || window.webkitAudioContext;
let audioCtx = null;

const SFX = {
    // Sons procedurais usando Web Audio API para evitar arquivos externos pesados
    click: () => playTone(800, 0.05, 'sine', 0.1),
    paper: () => playNoise(0.1, 0.2), // Simula papel
    damage: () => playTone(150, 0.3, 'sawtooth', 0.3),
    heal: () => playTone(880, 0.5, 'sine', 0.2, true),
    shield: () => playTone(440, 0.6, 'sine', 0.15, true),
    rest: () => playRestSound(),
    bag: () => playChestSound(),
    coins: () => playCoinsSound(),
    page: () => playNoise(0.05, 0.4), // Som de papel virando
    levelUp: () => playFanfare(),
    chest_open: () => playChestSound()
};

function initCtx() {
    if (!audioCtx) audioCtx = new AudioContext();
    if (audioCtx.state === 'suspended') audioCtx.resume();
}

function playTone(freq, duration, type = 'sine', volume = 0.1, slide = false) {
    initCtx();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    if (slide) {
        osc.frequency.exponentialRampToValueAtTime(freq * 1.5, audioCtx.currentTime + duration);
    }
    
    gain.gain.setValueAtTime(volume, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
    
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
}

function playNoise(duration, volume = 0.05) {
    initCtx();
    const bufferSize = audioCtx.sampleRate * duration;
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
    }
    
    const noise = audioCtx.createBufferSource();
    noise.buffer = buffer;
    
    const gain = audioCtx.createGain();
    gain.gain.setValueAtTime(volume, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
    
    const filter = audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1000, audioCtx.currentTime);
    
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(audioCtx.destination);
    
    noise.start();
}

function playFanfare() {
    initCtx();
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((freq, i) => {
        setTimeout(() => playTone(freq, 0.4, 'sine', 0.1), i * 150);
    });
}

function playRestSound() {
    initCtx();
    const notes = [329.63, 261.63, 196.00]; // E4, C4, G3 (Descendo)
    notes.forEach((freq, i) => {
        setTimeout(() => playTone(freq, 0.8, 'sine', 0.05), i * 400);
    });
}

function playChestSound() {
    initCtx();
    // Clique de madeira abrindo (sequência rápida de tons baixos e ruído)
    playTone(200, 0.1, 'square', 0.05);
    setTimeout(() => playTone(300, 0.15, 'square', 0.03, true), 50);
    setTimeout(() => playNoise(0.2, 0.1), 30); // Ranger sutil
}

function playCoinsSound() {
    initCtx();
    // Simula tintilar de moedas com tons altos e curtos
    const now = audioCtx.currentTime;
    [1200, 1500, 1000].forEach((f, i) => {
        const osc = audioCtx.createOscillator();
        const g = audioCtx.createGain();
        osc.frequency.setValueAtTime(f, now + i * 0.05);
        g.gain.setValueAtTime(0.05, now + i * 0.05);
        g.gain.exponentialRampToValueAtTime(0.01, now + i * 0.05 + 0.1);
        osc.connect(g);
        g.connect(audioCtx.destination);
        osc.start(now + i * 0.05);
        osc.stop(now + i * 0.05 + 0.1);
    });
}

export const AudioManager = {
    play: (name) => {
        if (SFX[name]) {
            try { SFX[name](); } catch(e) { console.warn("Audio play failed:", e); }
        }
    }
};
