import { AudioManager } from '../AudioManager.js';

const { useState } = React;

export function MasterControls({ sessionState, updateSessionState }) {
    const el = React.createElement;

    const SOUNDS = [
        { id: 'click', icon: '🔘', label: 'Click' },
        { id: 'dice', icon: '🎲', label: 'Dados' },
        { id: 'coins', icon: '💰', label: 'Moedas' },
        { id: 'page', icon: '📖', label: 'Página' },
        { id: 'heal', icon: '✨', label: 'Cura' },
        { id: 'damage', icon: '💥', label: 'Dano' },
        { id: 'rest', icon: '💤', label: 'Descanso' },
        { id: 'level-up', icon: '🔝', label: 'Level Up' }
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

    // Helper function for triggering sound, as implied by the new structure
    const triggerSound = (soundId) => {
        AudioManager.play(soundId);
        updateSessionState({ triggerSound: { type: soundId, timestamp: Date.now() } });
    };

    return el('div', { key: 'master-controls-root', className: "bg-slate-900 border-2 border-slate-800 rounded-[2.5rem] p-6 shadow-xl space-y-10" }, [
        // SOUNDBOARD
        el('div', { key: 'soundboard-section', className: "space-y-4" }, [
            el('h3', { key: 'soundboard-title', className: "text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 flex items-center gap-2" }, [
                el('span', { key: 'soundboard-icon' }, "🎼"), "Soundboard Compartilhado"
            ]),
            el('div', { key: 'soundboard-buttons-grid', className: "grid grid-cols-2 gap-3" }, 
                SOUNDS.map(s => el('button', {
                    key: s.id,
                    onClick: () => triggerSound(s.id),
                    className: "bg-slate-900 border border-slate-800 hover:border-amber-500/50 p-4 rounded-2xl flex items-center gap-3 transition-all group"
                }, [
                    el('span', { key: `sound-icon-${s.id}`, className: "text-lg group-hover:scale-120 transition-transform" }, s.icon),
                    el('span', { key: `sound-label-${s.id}`, className: "text-[10px] font-black uppercase text-slate-400 group-hover:text-amber-500" }, s.label)
                ]))
            )
        ]),

        // CALENDÁRIO / DIA
        el('div', { key: 'day-section', className: "space-y-4" }, [
            el('h3', { key: 'day-title', className: "text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 flex items-center gap-2" }, [
                el('span', { key: 'day-icon' }, "📅"), "Calendário da Campanha"
            ]),
            el('div', { key: 'day-counter-box', className: "bg-slate-950 border border-slate-800 rounded-3xl p-4 flex items-center justify-between shadow-inner" }, [
                el('div', { key: 'day-text-box', className: "flex flex-col" }, [
                    el('span', { key: 'day-label', className: "text-[8px] font-black text-slate-600 uppercase tracking-widest" }, "Tempo Passado"),
                    el('span', { key: 'day-value', className: "text-3xl font-black text-amber-500 tracking-tighter" }, `Dia ${sessionState?.day || 1}`)
                ]),
                el('div', { key: 'day-btns', className: "flex gap-2" }, [
                    el('button', {
                        key: 'btn-dec-day',
                        onClick: () => {
                            const currentDay = sessionState?.day || 1;
                            updateSessionState({ day: Math.max(1, currentDay - 1) });
                            AudioManager.play('click');
                        },
                        className: "w-10 h-10 bg-slate-900 border border-slate-700 rounded-xl flex items-center justify-center text-xl text-slate-400 hover:text-white hover:border-amber-500/50 transition-all shadow-lg"
                    }, "−"),
                    el('button', {
                        key: 'btn-inc-day',
                        onClick: () => {
                            const currentDay = sessionState?.day || 1;
                            updateSessionState({ day: currentDay + 1 });
                            AudioManager.play('click');
                        },
                        className: "w-10 h-10 bg-slate-900 border border-slate-700 rounded-xl flex items-center justify-center text-xl text-slate-400 hover:text-white hover:border-amber-500/50 transition-all shadow-lg"
                    }, "+")
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
                    onClick: () => updateSessionState({ environment: env.id }),
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
                    onClick: () => updateSessionState({ masterNotes: '' }),
                    className: "text-[8px] text-red-500 font-bold uppercase hover:text-red-400"
                }, "Limpar")
            ]),
            el('textarea', {
                key: 'notes-textarea',
                className: "w-full bg-slate-950 border border-slate-800 rounded-2xl p-6 text-xs text-slate-300 outline-none focus:border-amber-500/50 resize-none h-64 shadow-inner",
                placeholder: "Segredos, nomes de NPCs, planos malignos...",
                value: sessionState?.masterNotes || '',
                onChange: (e) => updateSessionState({ masterNotes: e.target.value })
            })
        ])
    ]);
}
