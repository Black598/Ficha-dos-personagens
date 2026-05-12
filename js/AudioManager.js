// js/AudioManager.js
import { parseAudioUrl } from './utils.js';

const AudioContext = window.AudioContext || window.webkitAudioContext;
let audioCtx = null;
let ambientTracks = {};
let ytPlayer = null;
let ytReady = false;
let pendingYt = null;

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
                // Toca se houver algo pendente
                if (pendingYt) {
                    console.log(`[AudioManager] Tocando YouTube pendente: ${pendingYt.ytId}`);
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

// Escuta o primeiro clique para desbloquear o áudio (Autoplay Policy)
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

function playNoise(duration, volume = 0.05) {
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
        playTone(523.25, 0.5, 'sine', 0.05); // C5
        playTone(659.25, 0.5, 'sine', 0.03); // E5
        playTone(783.99, 0.5, 'sine', 0.02); // G5
    },
    'damage': () => playNoise(0.3, 0.1),
    'rest': () => playRestSound(),
    'level-up': () => {
        const notes = [261.63, 329.63, 392.00, 523.25];
        notes.forEach((f, i) => setTimeout(() => playTone(f, 0.5, 'square', 0.03), i * 150));
    }
};

function playRestSound() {
    initCtx();
    const notes = [329.63, 261.63, 196.00];
    notes.forEach((freq, i) => {
        setTimeout(() => playTone(freq, 0.8, 'sine', 0.05), i * 400);
    });
}

function playChestSound() {
    initCtx();
    playTone(200, 0.1, 'square', 0.05);
    setTimeout(() => playTone(300, 0.15, 'square', 0.03, true), 50);
    setTimeout(() => playNoise(0.2, 0.1), 30);
}

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

export const AudioManager = {
    play: (name) => {
        if (SFX[name]) {
            try { SFX[name](); } catch(e) { console.warn("Audio play failed:", e); }
        }
    },

    playAmbient: (url, id = 'global', volume = 0.5) => {
        const ytId = getYoutubeId(url);
        
        if (ytId) {
            console.log(`[AudioManager] Detectado link do YouTube: ${ytId}`);
            
            // Se já for o mesmo vídeo do YouTube, apenas atualiza volume
            if (ytReady && ytPlayer && ytPlayer.getVideoData && ytPlayer.getVideoData().video_id === ytId) {
                ytPlayer.setVolume(volume * 100);
                if (ytPlayer.getPlayerState() !== 1) ytPlayer.playVideo(); // 1 = playing
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
                console.log(`[AudioManager] Sucesso: YouTube ${ytId} está tocando.`);
            } else {
                console.warn("[AudioManager] YouTube Player não está pronto. Agendando...");
                pendingYt = { ytId, id, volume };
            }
            return;
        }

        const finalUrl = parseAudioUrl(url);
        console.log(`[AudioManager] Tentando tocar ambiente: ${finalUrl}`);
        
        if (ytReady && ytPlayer && ytPlayer.stopVideo) {
            ytPlayer.stopVideo();
        }

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
        
        audio.play().then(() => {
            console.log(`[AudioManager] Sucesso: ${finalUrl} está tocando.`);
        }).catch(e => {
            console.error(`[AudioManager] Erro ao tocar ${finalUrl}:`, e.message);
            if (e.name === 'NotAllowedError') {
                console.warn("[AudioManager] Autoplay bloqueado.");
            }
        });
        ambientTracks[id] = audio;
    },

    stopAmbient: (id = 'global') => {
        if (ambientTracks[id]) {
            ambientTracks[id].pause();
            delete ambientTracks[id];
        }
        if (ytReady && ytPlayer && ytPlayer.stopVideo) {
            ytPlayer.stopVideo();
        }
    },

    setAmbientVolume: (volume, id = 'global') => {
        if (ambientTracks[id]) {
            ambientTracks[id].volume = volume;
        }
        if (ytReady && ytPlayer && ytPlayer.setVolume) {
            ytPlayer.setVolume(volume * 100);
        }
    }
};

function getYoutubeId(url) {
    if (!url || typeof url !== 'string') return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
}
