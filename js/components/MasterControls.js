import { AudioManager } from '../AudioManager.js';

const { useState, useEffect } = React;

export function MasterControls({ sessionState, updateSessionState }) {
    const el = React.createElement;
    const [isSfxMenuOpen, setIsSfxMenuOpen] = useState(false);
    
    // Estado local para as Notas do Mestre (Evita que o cursor pule pro final a cada digitação)
    const [localNotes, setLocalNotes] = useState(sessionState?.masterNotes || '');

    // Atualiza notas locais quando vier atualização externa (ex: Gerar NPC)
    useEffect(() => {
        setLocalNotes(sessionState?.masterNotes || '');
    }, [sessionState?.masterNotes]);

    // Salva automaticamente após 1 segundo sem digitar (Debounce)
    useEffect(() => {
        const handler = setTimeout(() => {
            if (localNotes !== (sessionState?.masterNotes || '')) {
                updateSessionState({ masterNotes: localNotes });
            }
        }, 1000);
        return () => clearTimeout(handler);
    }, [localNotes]);

    // Sons rápidos do grid principal
    const QUICK_SOUNDS = [
        { id: 'dice', icon: '🎲', label: 'Dados' },
        { id: 'coins', icon: '💰', label: 'Moedas' },
        { id: 'heal', icon: '✨', label: 'Cura' },
        { id: 'damage', icon: '💥', label: 'Dano' }
    ];

    // Biblioteca Expandida para o Menu Hambúrguer
    const SFX_LIBRARY = [
        { category: 'Combate', sounds: [
            { id: 'sword', icon: '⚔️', label: 'Espada' },
            { id: 'arrow', icon: '🏹', label: 'Flecha' },
            { id: 'fireball', icon: '🔥', label: 'Bola Fogo' },
            { id: 'shield', icon: '🛡️', label: 'Escudo' },
            { id: 'magic', icon: '🪄', label: 'Magia' }
        ]},
        { category: 'Ambiente', sounds: [
            { id: 'door', icon: '🚪', label: 'Porta' },
            { id: 'creak', icon: '🏚️', label: 'Ranger' },
            { id: 'wind', icon: '🌬️', label: 'Vento' },
            { id: 'thunder', icon: '⚡', label: 'Trovão' },
            { id: 'page', icon: '📖', label: 'Página' }
        ]},
        { category: 'Criaturas', sounds: [
            { id: 'wolf', icon: '🐺', label: 'Lobo' },
            { id: 'dragon', icon: '🐉', label: 'Dragão' },
            { id: 'horse', icon: '🐎', label: 'Cavalo' },
            { id: 'ghost', icon: '👻', label: 'Fantasma' }
        ]},
        { category: 'Sistemas', sounds: [
            { id: 'success', icon: '✅', label: 'Sucesso' },
            { id: 'fail', icon: '❌', label: 'Falha' },
            { id: 'level-up', icon: '🔝', label: 'Level Up' },
            { id: 'rest', icon: '💤', label: 'Descanso' }
        ]}
    ];

    // Atmosferas Padrão
    const DEFAULT_ATMOSPHERES = [
        { id: 'forest', icon: '🌳', label: 'Floresta', url: 'https://incompetech.com/music/royalty-free/mp3-royaltyfree/Eternal%20Hope.mp3' }, 
        { id: 'tavern', icon: '🍺', label: 'Taverna', url: 'https://incompetech.com/music/royalty-free/mp3-royaltyfree/Merry%20Go.mp3' }, 
        { id: 'dungeon', icon: '🕯️', label: 'Dungeon', url: 'https://incompetech.com/music/royalty-free/mp3-royaltyfree/Cryptic%20Sorrow.mp3' },
        { id: 'battle', icon: '⚔️', label: 'Combate', url: 'https://incompetech.com/music/royalty-free/mp3-royaltyfree/Clash%20Defiant.mp3' },
        { id: 'rain', icon: '🌧️', label: 'Chuva', url: 'https://archive.org/download/rain-ambience-1/Rain.mp3' },
        { id: 'storm', icon: '🌩️', label: 'Tempestade', url: 'https://archive.org/download/thunderstorm-ambience/Thunder.mp3' }
    ];

    const ENVIRONMENTS = [
        { id: 'none', icon: '☀️', label: 'Normal' },
        { id: 'rain', icon: '🌧️', label: 'Chuva' },
        { id: 'fog', icon: '🌫️', label: 'Névoa' },
        { id: 'snow', icon: '❄️', label: 'Neve' },
        { id: 'storm', icon: '🌩️', label: 'Tempestade' },
        { id: 'fire', icon: '🔥', label: 'Fogo' },
        { id: 'sandstorm', icon: '🏜️', label: 'Areia' },
        { id: 'petals', icon: '🌸', label: 'Pétalas' },
        { id: 'night', icon: '🌙', label: 'Noite' },
        { id: 'blood-moon', icon: '🌑', label: 'Lua Sangue' },
        { id: 'poison', icon: '☣️', label: 'Veneno' }
    ];

    // Combina padrões com customizados salvos no banco
    const atmospheres = [...DEFAULT_ATMOSPHERES, ...(sessionState.customAmbients || [])];

    const triggerSound = (soundId) => {
        AudioManager.play(soundId);
        updateSessionState({ triggerSound: { type: soundId, timestamp: Date.now() } });
    };

    const toggleAtmosphere = (track) => {
        const current = sessionState.ambientMusic;
        if (current?.id === track.id) {
            updateSessionState({ ambientMusic: null });
        } else {
            const newState = { 
                ambientMusic: { 
                    id: track.id, 
                    url: track.url, 
                    volume: current?.volume || 0.4 
                } 
            };
            // Se o ID da música bater com um ID de ambiente (ex: rain, storm), ativa o ambiente visual também
            if (ENVIRONMENTS.some(e => e.id === track.id)) {
                newState.environment = track.id;
            }
            updateSessionState(newState);
        }
    };

    const addCustomAtmosphere = () => {
        const name = prompt("Nome da nova atmosfera (Ex: Deserto):");
        if (!name) return;
        const icon = prompt("Emoji (Ex: 🌵):", "🎵");
        const url = prompt("Link do YouTube ou MP3:");
        if (!url) return;

        const newAmbient = { id: `custom-${Date.now()}`, icon, label: name, url };
        const currentCustoms = sessionState.customAmbients || [];
        updateSessionState({ customAmbients: [...currentCustoms, newAmbient] });
    };

    const removeAtmosphere = (id) => {
        if (!confirm("Remover esta atmosfera?")) return;
        const currentCustoms = sessionState.customAmbients || [];
        updateSessionState({ customAmbients: currentCustoms.filter(a => a.id !== id) });
    };

    const updateMusicVolume = (v) => {
        const current = sessionState.ambientMusic;
        if (current) {
            updateSessionState({ 
                ambientMusic: { ...current, volume: parseFloat(v) } 
            });
        }
    };

    return el('div', { key: 'master-controls-root', className: "bg-slate-900 border-2 border-slate-800 rounded-[2.5rem] p-6 shadow-xl space-y-10" }, [
        
        // SEÇÃO SOUNDBOARD
        el('div', { key: 'soundboard-section', className: "space-y-6" }, [
            el('div', { className: "flex justify-between items-center" }, [
                el('h3', { key: 'soundboard-title', className: "text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 flex items-center gap-2" }, [
                    el('span', { key: 'soundboard-icon' }, "🎼"), "Atmosferas"
                ]),
                el('div', { className: "flex items-center gap-3" }, [
                    // Botão Adicionar Atmosfera
                    el('button', {
                        onClick: addCustomAtmosphere,
                        className: "w-8 h-8 bg-emerald-900/30 text-emerald-500 rounded-full flex items-center justify-center hover:bg-emerald-500 hover:text-white transition-all text-xl"
                    }, "+"),
                    sessionState.ambientMusic && el('span', { key: 'playing-indicator', className: "flex items-center gap-2" }, [
                        el('span', { key: 'pulse', className: "w-2 h-2 bg-emerald-500 rounded-full animate-pulse" }),
                        el('span', { key: 'label', className: "text-[8px] font-black text-emerald-500 uppercase" }, "Tocando")
                    ])
                ])
            ]),

            // GRID DE ATMOSFERAS (Dinâmico)
            el('div', { key: 'atmospheres-grid', className: "grid grid-cols-3 gap-2" }, 
                atmospheres.map(track => {
                    const isActive = sessionState.ambientMusic?.id === track.id;
                    const isCustom = track.id.startsWith('custom-');
                    return el('div', { key: track.id, className: "relative group" }, [
                        el('button', {
                            onClick: () => toggleAtmosphere(track),
                            className: `w-full p-3 rounded-2xl flex flex-col items-center justify-center gap-2 transition-all border ${
                                isActive ? 'bg-amber-600 border-amber-400 text-white shadow-lg' : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:border-slate-600'
                            }`
                        }, [
                            el('span', { key: 'icon', className: "text-lg" }, track.icon),
                            el('span', { key: 'label', className: "text-[8px] font-black uppercase tracking-widest" }, track.label)
                        ]),
                        // Editar/Remover Customizados
                        isCustom && el('button', {
                            onClick: () => removeAtmosphere(track.id),
                            className: "absolute -top-1 -right-1 w-5 h-5 bg-red-600 text-white rounded-full text-[10px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center shadow-lg"
                        }, "×")
                    ]);
                })
            ),

            // VOLUME
            sessionState.ambientMusic && el('div', { key: 'volume-control', className: "bg-slate-950/50 p-4 rounded-2xl border border-slate-800 space-y-2" }, [
                el('div', { key: 'volume-header', className: "flex justify-between items-center" }, [
                    el('span', { key: 'label', className: "text-[8px] font-black text-slate-500 uppercase tracking-widest" }, "Volume da Música"),
                    el('span', { key: 'value', className: "text-[8px] font-black text-amber-500" }, `${Math.round(sessionState.ambientMusic.volume * 100)}%`)
                ]),
                el('input', {
                    key: 'slider',
                    type: 'range',
                    min: 0, max: 1, step: 0.05,
                    value: sessionState.ambientMusic.volume,
                    onChange: (e) => updateMusicVolume(e.target.value),
                    className: "w-full accent-amber-500 cursor-pointer"
                })
            ]),

            // EFEITOS SONOROS (Hamburger Menu)
            el('div', { key: 'sfx-section', className: "relative" }, [
                el('div', { className: "flex items-center justify-between mb-4" }, [
                    el('h3', { className: "text-[10px] font-black uppercase tracking-[0.4em] text-slate-500" }, "Efeitos Sonoros"),
                    el('button', {
                        onClick: () => setIsSfxMenuOpen(!isSfxMenuOpen),
                        className: `w-10 h-10 rounded-xl flex flex-col items-center justify-center gap-1 transition-all ${isSfxMenuOpen ? 'bg-amber-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`
                    }, [
                        el('div', { className: "w-5 h-0.5 bg-current rounded-full" }),
                        el('div', { className: "w-5 h-0.5 bg-current rounded-full" }),
                        el('div', { className: "w-5 h-0.5 bg-current rounded-full" })
                    ])
                ]),

                // Menu Hambúrguer Aberto (Sobreposição ou Expansão)
                isSfxMenuOpen && el('div', { className: "bg-slate-950 border border-slate-800 rounded-3xl p-4 space-y-6 animate-in slide-in-from-top duration-300 shadow-2xl" }, 
                    SFX_LIBRARY.map(cat => el('div', { key: cat.category, className: "space-y-2" }, [
                        el('p', { key: 'cat-label', className: "text-[7px] font-black uppercase text-slate-600 tracking-widest px-1" }, cat.category),
                        el('div', { key: 'cat-grid', className: "grid grid-cols-5 gap-2" }, 
                            cat.sounds.map(s => el('button', {
                                key: s.id,
                                onClick: () => triggerSound(s.id),
                                className: "bg-slate-900 hover:bg-amber-600/20 border border-slate-800 hover:border-amber-500/50 p-2 rounded-xl flex flex-col items-center gap-1 transition-all group"
                            }, [
                                el('span', { key: 'icon', className: "text-lg group-hover:scale-120 transition-transform" }, s.icon),
                                el('span', { key: 'label', className: "text-[6px] font-black uppercase text-slate-500 group-hover:text-amber-500" }, s.label)
                            ]))
                        )
                    ]))
                ),

                // Sons Rápidos (Sempre Visíveis)
                !isSfxMenuOpen && el('div', { key: 'quick-sfx', className: "grid grid-cols-4 gap-2" }, 
                    QUICK_SOUNDS.map(s => el('button', {
                        key: s.id,
                        onClick: () => triggerSound(s.id),
                        className: "bg-slate-900 border border-slate-800 hover:border-amber-500/50 p-3 rounded-2xl flex flex-col items-center gap-1 transition-all group"
                    }, [
                        el('span', { key: 'icon', className: "text-lg" }, s.icon),
                        el('span', { key: 'label', className: "text-[7px] font-black uppercase text-slate-500" }, s.label)
                    ]))
                )
            ])
        ]),

        // RELÓGIO DE SESSÃO / CALENDÁRIO
        el('div', { key: 'day-section', className: "space-y-4" }, [
            el('h3', { key: 'day-title', className: "text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 flex items-center gap-2" }, [
                el('span', { key: 'day-icon' }, "🕒"), "Relógio de Sessão"
            ]),
            el('div', { key: 'day-counter-box', className: "bg-slate-950 border border-slate-800 rounded-3xl p-4 shadow-inner space-y-4" }, [
                el('div', { className: "flex items-center justify-between" }, [
                    el('div', { className: "flex flex-col" }, [
                        el('span', { className: "text-[8px] font-black text-slate-600 uppercase tracking-widest" }, "Tempo Passado"),
                        el('span', { className: "text-3xl font-black text-amber-500 tracking-tighter" }, `Dia ${sessionState?.day || 1}`)
                    ]),
                    el('div', { className: "flex flex-col text-right" }, [
                        el('span', { className: "text-[8px] font-black text-slate-600 uppercase tracking-widest" }, "Hora Atual"),
                        (() => {
                            const time = sessionState?.timeMinutes !== undefined ? sessionState.timeMinutes : 480; // Default 08:00
                            const h = Math.floor(time / 60).toString().padStart(2, '0');
                            const m = (time % 60).toString().padStart(2, '0');
                            return el('span', { className: "text-2xl font-black text-purple-400 font-mono bg-slate-900 px-3 py-1 rounded-xl border border-slate-800" }, `${h}:${m}`);
                        })()
                    ])
                ]),
                el('div', { className: "grid grid-cols-4 gap-2 border-t border-slate-800 pt-4" }, [
                    el('button', {
                        onClick: () => {
                            let currentDay = sessionState?.day || 1;
                            let oldTime = sessionState?.timeMinutes !== undefined ? sessionState.timeMinutes : 480;
                            let time = oldTime + 10;
                            if (time >= 1440) { time -= 1440; currentDay++; }
                            
                            const updates = { day: currentDay, timeMinutes: time };
                            if (oldTime < 360 && time >= 360) updates.environment = 'none'; // Amanheceu
                            else if (oldTime < 1080 && time >= 1080) updates.environment = 'night'; // Anoiteceu
                            
                            updateSessionState(updates);
                            AudioManager.play('click');
                        },
                        className: "bg-slate-900 border border-slate-700 hover:border-amber-500 hover:text-white text-slate-400 font-black text-[10px] py-2 rounded-xl transition-all shadow-md"
                    }, "+ 10m"),
                    el('button', {
                        onClick: () => {
                            let currentDay = sessionState?.day || 1;
                            let oldTime = sessionState?.timeMinutes !== undefined ? sessionState.timeMinutes : 480;
                            let time = oldTime + 60;
                            if (time >= 1440) { time -= 1440; currentDay++; }
                            
                            const updates = { day: currentDay, timeMinutes: time };
                            if (oldTime < 360 && time >= 360) updates.environment = 'none'; // Amanheceu
                            else if (oldTime < 1080 && time >= 1080) updates.environment = 'night'; // Anoiteceu
                            
                            updateSessionState(updates);
                            AudioManager.play('click');
                        },
                        className: "bg-slate-900 border border-slate-700 hover:border-amber-500 hover:text-white text-slate-400 font-black text-[10px] py-2 rounded-xl transition-all shadow-md"
                    }, "+ 1h"),
                    el('button', {
                        onClick: () => {
                            let currentDay = sessionState?.day || 1;
                            let oldTime = sessionState?.timeMinutes !== undefined ? sessionState.timeMinutes : 480;
                            let time = oldTime + 480; // 8 hours
                            if (time >= 1440) { time -= 1440; currentDay++; }
                            
                            const updates = { day: currentDay, timeMinutes: time };
                            // Check if crossed 6am or 6pm
                            if (oldTime < 360 && time >= 360) updates.environment = 'none';
                            else if (oldTime < 1080 && time >= 1080) updates.environment = 'night';
                            else if (time < oldTime) { // Crossed midnight
                                if (time >= 360) updates.environment = 'none';
                            }
                            
                            updateSessionState(updates);
                            AudioManager.play('rest');
                        },
                        className: "col-span-2 bg-indigo-900/30 border border-indigo-700/50 hover:bg-indigo-600 hover:text-white text-indigo-400 font-black text-[10px] py-2 rounded-xl transition-all shadow-md uppercase tracking-wider flex items-center justify-center gap-2"
                    }, [el('span', { key: 'icon' }, "🏕️"), "+ 8h (Descanso)"])
                ])
            ])
        ]),

        // AMBIENTE
        el('div', { key: 'env-section', className: "space-y-4" }, [
            el('h3', { key: 'env-title', className: "text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 flex items-center gap-2" }, [
                el('span', { key: 'env-icon' }, "⛅"), "Rastreador de Ambiente"
            ]),
            el('div', { key: 'env-grid', className: "grid grid-cols-2 gap-3" }, 
                ENVIRONMENTS.map(env => el('button', {
                    key: env.id,
                    onClick: () => {
                        const newState = { environment: env.id };
                        // Se existir uma trilha sonora com o mesmo ID, ativa ela também
                        const matchingAtmos = atmospheres.find(a => a.id === env.id);
                        if (matchingAtmos) {
                            newState.ambientMusic = {
                                id: matchingAtmos.id,
                                url: matchingAtmos.url,
                                volume: sessionState.ambientMusic?.volume || 0.4
                            };
                        }
                        updateSessionState(newState);
                    },
                    className: `p-4 rounded-2xl flex items-center gap-3 transition-all border ${sessionState?.environment === env.id ? 'bg-blue-600 border-blue-400 text-white shadow-[0_0_20px_rgba(37,99,235,0.3)]' : 'bg-slate-900 border-slate-800 text-slate-500 hover:border-blue-500/30'}`
                }, [
                    el('span', { key: `env-icon-${env.id}`, className: "text-lg" }, env.icon),
                    el('span', { key: `env-label-${env.id}`, className: "text-[10px] font-black uppercase" }, env.label)
                ]))
            )
        ]),

        // NOTAS DO MESTRE
        el('div', { key: 'notes-section', className: "space-y-4" }, [
            el('div', { key: 'notes-header', className: "flex justify-between items-center px-2" }, [
                el('h3', { key: 'notes-title', className: "text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 flex items-center gap-2" }, [
                    el('span', { key: 'notes-icon' }, "📝"), "Notas do Mestre (Privado)"
                ]),
                sessionState?.masterNotes && el('button', {
                    key: 'notes-clear-btn',
                    onClick: () => updateSessionState({ masterNotes: '' }),
                    className: "text-[8px] text-red-500 font-bold uppercase hover:text-red-400"
                }, "Limpar")
            ]),
            el('textarea', {
                key: 'notes-textarea',
                className: "w-full bg-slate-950 border border-slate-800 rounded-2xl p-6 text-xs text-slate-300 outline-none focus:border-amber-500/50 resize-none h-64 shadow-inner custom-scrollbar",
                placeholder: "Segredos, nomes de NPCs, planos malignos...",
                value: localNotes,
                onChange: (e) => setLocalNotes(e.target.value)
            })
        ])
    ]);
}
