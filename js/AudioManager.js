// js/AudioManager.js
import { parseAudioUrl } from './utils.js';

const AudioContext = window.AudioContext || window.webkitAudioContext;
let audioCtx = null;
let ambientTracks = {};
let ytPlayer = null;
let ytReady = false;
let pendingYt = null;
let currentScope = 'default';

// Carrega API do YouTube dinamicamente
if (!window.YT) {
    const tag = document.createElement('script');
    tag.src = "https://www.youtube.com/iframe_api";
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
}

window.onYouTubeIframeAPIReady = () => {
    console.log("[AudioManager] YouTube API Pronta.");
    const playerDiv = document.createElement('div');
    playerDiv.id = 'yt-player-hidden';
    playerDiv.style.display = 'none';
    document.body.appendChild(playerDiv);

    ytPlayer = new YT.Player('yt-player-hidden', {
        height: '0',
        width: '0',
        events: {
            'onReady': () => { 
                ytReady = true;
                console.log("[AudioManager] YouTube Player Inicializado.");
                if (pendingYt) {
                    AudioManager.playAmbient(pendingYt.ytId, pendingYt.id, pendingYt.volume);
                    pendingYt = null;
                }
            }
        }
    });
};

function initCtx() {
    if (!audioCtx) audioCtx = new AudioContext();
    if (audioCtx.state === 'suspended') audioCtx.resume();
}

document.addEventListener('click', () => {
    initCtx();
}, { once: true });

function playTone(freq, duration, type = 'sine', volume = 0.1, slide = false) {
    initCtx();
    const osc = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    
    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    if (slide) {
        osc.frequency.exponentialRampToValueAtTime(freq * 0.5, audioCtx.currentTime + duration);
    }
    
    g.gain.setValueAtTime(volume, audioCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + duration);
    
    osc.connect(g);
    g.connect(audioCtx.destination);
    
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
}

function playNoise(duration, volume = 0.02) {
    initCtx();
    const bufferSize = audioCtx.sampleRate * duration;
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
    }
    
    const noise = audioCtx.createBufferSource();
    const g = audioCtx.createGain();
    noise.buffer = buffer;
    g.gain.setValueAtTime(volume, audioCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + duration);
    
    noise.connect(g);
    g.connect(audioCtx.destination);
    noise.start();
}

const SFX = {
    'click': () => playTone(800, 0.05, 'sine', 0.02),
    'dice': () => {
        playTone(150, 0.1, 'triangle', 0.05, true);
        setTimeout(() => playTone(120, 0.15, 'triangle', 0.03, true), 100);
    },
    'coins': () => playCoinsSound(),
    'page': () => playNoise(0.2, 0.02),
    'heal': () => {
        playTone(523.25, 0.5, 'sine', 0.05);
        playTone(659.25, 0.5, 'sine', 0.03);
        playTone(783.99, 0.5, 'sine', 0.02);
    },
    'damage': () => playNoise(0.3, 0.1),
    'rest': () => playRestSound(),
    'level-up': () => {
        const notes = [261.63, 329.63, 392.00, 523.25];
        notes.forEach((f, i) => setTimeout(() => playTone(f, 0.5, 'square', 0.03), i * 150));
    },
    'impact': () => {
        initCtx();
        playTone(100, 0.8, 'sine', 0.2, true);
        playNoise(0.5, 0.1);
        setTimeout(() => playTone(80, 1.2, 'sine', 0.15, true), 100);
    },
    'magic': () => {
        playTone(880, 0.4, 'sine', 0.05);
        setTimeout(() => playTone(1100, 0.4, 'sine', 0.03), 100);
    }
};

function playCoinsSound() {
    initCtx();
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

function playRestSound() {
    initCtx();
    const notes = [329.63, 261.63, 196.00];
    notes.forEach((freq, i) => {
        setTimeout(() => playTone(freq, 0.8, 'sine', 0.05), i * 400);
    });
}

function getSettings(scope) {
    const activeScope = scope || currentScope || 'default';
    try {
        const stored = localStorage.getItem(`rpg_audio_settings_${activeScope}`);
        if (stored) {
            return JSON.parse(stored);
        }
    } catch(e) {
        console.error(`[AudioManager] Error parsing settings for scope ${activeScope}:`, e);
    }

    try {
        const legacy = localStorage.getItem('rpg_audio_settings');
        if (legacy) {
            return JSON.parse(legacy);
        }
    } catch(e) {}

    return {
        masterEnabled: true,
        hearOthersSoundboard: true,
        effects: {}
    };
}

export const AudioManager = {
    setScope: (scope) => {
        currentScope = scope || 'default';
        console.log(`[AudioManager] Scope set to: ${currentScope}`);
    },
    getScope: () => currentScope,
    getSettings,
    saveSettings: (settings, scope) => {
        const activeScope = scope || currentScope || 'default';
        try {
            localStorage.setItem(`rpg_audio_settings_${activeScope}`, JSON.stringify(settings));
        } catch(e) {
            console.error(`[AudioManager] Error saving settings for scope ${activeScope}:`, e);
        }
    },

    play: (name) => {
        const settings = getSettings();
        if (!settings.masterEnabled) return;
        
        const config = settings.effects?.[name] || { enabled: true, url: "" };
        if (!config.enabled) return;

        if (config.url) {
            // Tocar som customizado
            try {
                const finalUrl = parseAudioUrl(config.url);
                const audio = new Audio(finalUrl);
                audio.volume = 0.5;
                audio.play().catch(e => console.warn(`[AudioManager] Custom audio play failed for ${name}:`, e));
                return;
            } catch(e) {
                console.warn(`[AudioManager] Failed to load custom audio for ${name}:`, e);
            }
        }

        if (SFX[name]) {
            try { SFX[name](); } catch(e) { console.warn("Audio play failed:", e); }
        }
    },

    playAmbient: (url, id = 'global', volume = 0.5) => {
        const ytId = getYoutubeId(url);
        
        if (ytId) {
            if (ytReady && ytPlayer && ytPlayer.getVideoData && ytPlayer.getVideoData().video_id === ytId) {
                ytPlayer.setVolume(volume * 100);
                if (ytPlayer.getPlayerState() !== 1) ytPlayer.playVideo();
                return;
            }

            if (ambientTracks[id]) {
                ambientTracks[id].pause();
                delete ambientTracks[id];
            }
            
            if (ytReady && ytPlayer && ytPlayer.loadVideoById) {
                ytPlayer.loadVideoById(ytId);
                ytPlayer.setVolume(volume * 100);
                ytPlayer.playVideo();
            } else {
                pendingYt = { ytId, id, volume };
            }
            return;
        }

        const finalUrl = parseAudioUrl(url);
        if (ytReady && ytPlayer && ytPlayer.stopVideo) ytPlayer.stopVideo();

        if (ambientTracks[id]) {
            if (ambientTracks[id].src === finalUrl) {
                ambientTracks[id].volume = volume;
                return;
            }
            ambientTracks[id].pause();
        }

        const audio = new Audio(finalUrl);
        audio.loop = true;
        audio.volume = volume;
        audio.play().catch(e => console.error("Erro áudio:", e.message));
        ambientTracks[id] = audio;
    },

    stopAmbient: (id = 'global', fade = false) => {
        if (fade) {
            AudioManager.fadeVolume(0, 2000, id);
        } else {
            if (ambientTracks[id]) {
                ambientTracks[id].pause();
                delete ambientTracks[id];
            }
            if (ytReady && ytPlayer && ytPlayer.stopVideo) ytPlayer.stopVideo();
        }
    },

    setAmbientVolume: (volume, id = 'global') => {
        if (ambientTracks[id]) ambientTracks[id].volume = volume;
        if (ytReady && ytPlayer && ytPlayer.setVolume) ytPlayer.setVolume(volume * 100);
    },

    fadeVolume: (targetVolume, duration = 2000, id = 'global') => {
        const audio = ambientTracks[id];
        const isYT = ytReady && ytPlayer && ytPlayer.getVolume;
        let startVolume = audio ? audio.volume : (isYT ? ytPlayer.getVolume() / 100 : 0);
        
        const steps = 20;
        const interval = duration / steps;
        const delta = (targetVolume - startVolume) / steps;
        let currentStep = 0;

        const timer = setInterval(() => {
            currentStep++;
            const newVol = Math.max(0, Math.min(1, startVolume + delta * currentStep));
            if (audio) audio.volume = newVol;
            if (isYT) ytPlayer.setVolume(newVol * 100);

            if (currentStep >= steps) {
                clearInterval(timer);
                if (targetVolume <= 0) {
                    if (audio) { audio.pause(); delete ambientTracks[id]; }
                    if (isYT) ytPlayer.stopVideo();
                }
            }
        }, interval);
    }
};

function getYoutubeId(url) {
    if (!url || typeof url !== 'string') return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
}
