const { useState } = React;
import { AudioManager } from '../AudioManager.js';

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
        { id: 'storm', icon: '🌩️', label: 'Tempestade' },
        { id: 'night', icon: '🌙', label: 'Noite' },
        { id: 'cave', icon: '🦇', label: 'Caverna' }
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
            el('h3', { key: 'notes-title', className: "text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 flex items-center gap-2" }, [
                el('span', { key: 'notes-icon' }, "📝"), "Notas do Mestre (Privado)"
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
