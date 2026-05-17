import { AudioManager } from '../AudioManager.js';

export function AudioSettingsModal({ onClose }) {
    const el = React.createElement;
    const { useState } = React;
    
    const activeScope = AudioManager.getScope() || 'default';
    const [settings, setSettings] = useState(() => AudioManager.getSettings(activeScope));
    const [playingPreview, setPlayingPreview] = useState(null);

    const updateField = (field, value) => {
        const next = { ...settings, [field]: value };
        setSettings(next);
        AudioManager.saveSettings(next, activeScope);
    };

    const updateEffect = (effectKey, field, value) => {
        const nextEffects = { ...settings.effects };
        if (!nextEffects[effectKey]) {
            nextEffects[effectKey] = { enabled: true, url: "" };
        }
        nextEffects[effectKey] = { ...nextEffects[effectKey], [field]: value };
        
        const next = { ...settings, effects: nextEffects };
        setSettings(next);
        AudioManager.saveSettings(next, activeScope);
    };

    const handlePreview = (key) => {
        setPlayingPreview(key);
        AudioManager.play(key);
        setTimeout(() => setPlayingPreview(null), 1500);
    };

    const sfxList = [
        { key: 'click', label: 'Clique / Botões', desc: 'Sons de interação e navegação nos botões.' },
        { key: 'dice', label: 'Rolagem de Dados', desc: 'Sons reproduzidos ao clicar para rolar D20, D6, etc.' },
        { key: 'coins', label: 'Moedas / Transações', desc: 'Sons de ouro adicionado, compras na loja, etc.' },
        { key: 'page', label: 'Virar Páginas / Abas', desc: 'Efeito ao trocar de abas ou abrir o Mentor.' },
        { key: 'heal', label: 'Cura / Recuperação', desc: 'Efeito de poções, curas recebidas ou regeneração.' },
        { key: 'damage', label: 'Dano / Impactos', desc: 'Sons ao perder HP ou sofrer penalidades de status.' },
        { key: 'rest', label: 'Descanso Longo', desc: 'Efeito sonoro ao realizar o descanso longo do grupo.' },
        { key: 'level-up', label: 'Subir de Nível', desc: 'Fanfarra comemorativa ao subir de nível.' },
        { key: 'impact', label: 'Impacto Crítico', desc: 'Efeito dramático ao tirar um 20 natural.' },
        { key: 'magic', label: 'Efeito Arcano', desc: 'Conjuração de feitiços ou acionamento de itens mágicos.' }
    ];

    return el('div', {
        className: "fixed inset-0 z-[2100] bg-black/90 backdrop-blur-md p-6 flex items-center justify-center animate-fade-in",
        onClick: (e) => e.target === e.currentTarget && onClose()
    }, [
        el('div', {
            className: "bg-slate-900 border-2 border-amber-500/50 p-6 md:p-8 rounded-[3rem] w-full max-w-2xl max-h-[85vh] shadow-[0_0_50px_rgba(245,158,11,0.25)] flex flex-col gap-6 overflow-hidden"
        }, [
            // Header
            el('div', { className: "flex justify-between items-center border-b border-slate-800 pb-4 shrink-0" }, [
                el('div', null, [
                    el('h3', { className: "text-amber-500 text-xl md:text-2xl font-black uppercase tracking-tighter italic flex items-center gap-3" }, ["🔊", "Configurações de Áudio"]),
                    el('p', { className: "text-slate-500 text-[9px] font-bold uppercase tracking-widest" }, `Customize ou silencia os sons de: ${activeScope === 'Mestre' ? '👑 MESTRE' : activeScope === 'default' ? '⚙️ PADRÃO' : '👤 ' + activeScope.toUpperCase()}`)
                ]),
                el('button', { onClick: onClose, className: "text-slate-500 hover:text-white text-2xl font-black" }, "✕")
            ]),

            // Body
            el('div', { className: "flex-1 overflow-y-auto pr-2 space-y-6 custom-scrollbar py-2" }, [
                
                // Configurações Gerais
                el('div', { className: "bg-slate-950/60 p-5 rounded-2xl border border-slate-800 space-y-4" }, [
                    el('h4', { className: "text-[10px] font-black uppercase text-amber-500 tracking-wider mb-2" }, "Opções Gerais de Áudio"),
                    
                    // Toggle Principal Habilitar Sons
                    el('label', { className: "flex items-center justify-between p-3 bg-slate-900/60 rounded-xl border border-slate-800 hover:border-slate-700 cursor-pointer transition-colors" }, [
                        el('div', null, [
                            el('span', { className: "text-xs font-bold text-slate-200 block" }, "Habilitar Efeitos Sonoros"),
                            el('span', { className: "text-[9px] text-slate-500" }, "Ativa ou silencia completamente as interações sonoras no cliente local.")
                        ]),
                        el('input', {
                            type: 'checkbox',
                            checked: settings.masterEnabled,
                            onChange: (e) => updateField('masterEnabled', e.target.checked),
                            className: "w-5 h-5 rounded border-slate-800 bg-slate-950 text-amber-500 focus:ring-0 cursor-pointer accent-amber-500"
                        })
                    ]),

                    // Toggle Ouvir Soundboard Alheia
                    el('label', { className: "flex items-center justify-between p-3 bg-slate-900/60 rounded-xl border border-slate-800 hover:border-slate-700 cursor-pointer transition-colors" }, [
                        el('div', null, [
                            el('span', { className: "text-xs font-bold text-slate-200 block" }, "Ouvir Soundpad dos outros Jogadores"),
                            el('span', { className: "text-[9px] text-slate-500" }, "Desmarque se não quiser que gritos e sons tocados por outros perturbem seu jogo.")
                        ]),
                        el('input', {
                            type: 'checkbox',
                            checked: settings.hearOthersSoundboard,
                            onChange: (e) => updateField('hearOthersSoundboard', e.target.checked),
                            className: "w-5 h-5 rounded border-slate-800 bg-slate-950 text-amber-500 focus:ring-0 cursor-pointer accent-amber-500"
                        })
                    ])
                ]),

                // Configurações Efeitos Individuais
                el('div', { className: "space-y-4" }, [
                    el('h4', { className: "text-[10px] font-black uppercase text-amber-500 tracking-wider" }, "Efeitos Sonoros Específicos"),
                    
                    sfxList.map(item => {
                        const config = settings.effects?.[item.key] || { enabled: true, url: "" };
                        return el('div', {
                            key: item.key,
                            className: `p-4 bg-slate-950/40 rounded-2xl border transition-all ${config.enabled ? 'border-slate-800' : 'border-red-950/20 opacity-50'}`
                        }, [
                            el('div', { className: "flex justify-between items-start gap-4 mb-3" }, [
                                el('div', null, [
                                    el('span', { className: "text-xs font-black uppercase text-slate-200" }, item.label),
                                    el('p', { className: "text-[9px] text-slate-500 mt-0.5" }, item.desc)
                                ]),
                                el('div', { className: "flex items-center gap-3" }, [
                                    el('button', {
                                        onClick: () => handlePreview(item.key),
                                        disabled: !settings.masterEnabled || !config.enabled,
                                        className: `w-7 h-7 rounded-lg flex items-center justify-center text-xs transition-all ${playingPreview === item.key ? 'bg-amber-500 text-slate-950 scale-105' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`
                                    }, playingPreview === item.key ? "⏳" : "▶️"),
                                    el('input', {
                                        type: 'checkbox',
                                        disabled: !settings.masterEnabled,
                                        checked: config.enabled,
                                        onChange: (e) => updateEffect(item.key, 'enabled', e.target.checked),
                                        className: "w-4.5 h-4.5 rounded border-slate-800 bg-slate-950 text-amber-500 accent-amber-500 cursor-pointer"
                                    })
                                ])
                            ]),
                            config.enabled && el('div', { className: "space-y-1.5" }, [
                                el('p', { className: "text-[8px] font-black text-slate-500 uppercase px-1" }, "Link ou URL do som customizado (YouTube ou MP3)"),
                                el('input', {
                                    type: 'text',
                                    placeholder: "Cole link de som alternativo... (deixe vazio para usar o padrão)",
                                    value: config.url,
                                    onChange: (e) => updateEffect(item.key, 'url', e.target.value),
                                    className: "w-full bg-slate-900 border border-slate-800/80 hover:border-slate-700/80 rounded-xl px-3 py-2 text-[10px] text-white outline-none focus:border-amber-500/50"
                                })
                            ])
                        ]);
                    })
                ])
            ])
        ])
    ]);
}
