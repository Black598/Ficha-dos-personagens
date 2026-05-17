const { useState } = React;

export function ConditionModal({ characterName, onSave, onClose }) {
    const el = React.createElement;

    const PRESET_ICONS = ['💧', '🔥', '⚡', '🟢', '🔴', '🟣', '🟠', '💀', '🛡️', '👻', '🕶️', '🤢', '🌀', '🧊', '🩸'];
    const PRESET_COLORS = [
        { name: 'Roxo', value: '#a855f7' },
        { name: 'Verde', value: '#22c55e' },
        { name: 'Vermelho', value: '#ef4444' },
        { name: 'Azul', value: '#3b82f6' },
        { name: 'Laranja', value: '#f97316' },
        { name: 'Amarelo', value: '#eab308' },
        { name: 'Cinza', value: '#64748b' },
        { name: 'Preto', value: '#0f172a' }
    ];

    const [form, setForm] = useState({
        name: '',
        icon: '💧',
        color: '#a855f7',
        turns: 1
    });

    const PRESETS = [
        { name: 'Cego', color: '#0f172a', icon: '🕶️', turns: 2 },
        { name: 'Envenenado', color: '#22c55e', icon: '🤢', turns: 3 },
        { name: 'Queimando', color: '#f97316', icon: '🔥', turns: 3 },
        { name: 'Invisível', color: '#3b82f6', icon: '👻', turns: 10 },
        { name: 'Paralisado', color: '#eab308', icon: '⚡', turns: 1 },
        { name: 'Caído', color: '#64748b', icon: '🛡️', turns: 1 },
        { name: 'Sangrando', color: '#ef4444', icon: '🩸', turns: 3 }
    ];

    return el('div', { className: "fixed inset-0 bg-slate-950/50 backdrop-blur-md z-[500] flex items-center justify-center p-6" }, 
        el('div', { className: "bg-slate-900/80 backdrop-blur-md border-2 border-purple-500/30 p-8 rounded-[3rem] max-w-lg w-full shadow-3xl animate-zoom-in overflow-hidden" }, [
            el('div', { key: 'header', className: "flex justify-between items-center mb-8 border-b border-slate-800 pb-6" }, [
                el('div', null, [
                    el('h3', { className: "text-purple-400 font-black uppercase text-xs tracking-widest mb-1" }, "✨ Nova Condição"),
                    el('p', { className: "text-2xl font-black text-white tracking-tighter" }, characterName)
                ]),
                el('button', { onClick: onClose, className: "text-slate-500 hover:text-white text-3xl transition-colors" }, "×")
            ]),

            el('div', { key: 'content', className: "space-y-6 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar" }, [
                // Presets
                el('div', null, [
                    el('label', { className: "text-[10px] text-slate-500 font-black uppercase mb-3 block tracking-widest" }, "Sugestões Rápidas"),
                    el('div', { className: "flex flex-wrap gap-2" }, 
                        PRESETS.map(p => el('button', {
                            key: p.name,
                            onClick: () => setForm(p),
                            className: "bg-slate-800 hover:bg-purple-600/20 border border-slate-700 hover:border-purple-500/50 px-3 py-1.5 rounded-xl text-[10px] font-bold text-slate-300 transition-all flex items-center gap-2"
                        }, [el('span', null, p.icon), p.name]))
                    )
                ]),

                // Nome
                el('div', null, [
                    el('label', { className: "text-[10px] text-slate-500 font-black uppercase mb-2 block tracking-widest" }, "Nome da Condição"),
                    el('input', {
                        value: form.name,
                        onChange: (e) => setForm({...form, name: e.target.value}),
                        placeholder: "Ex: Atordoado, Abençoado...",
                        className: "w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-sm text-white outline-none focus:border-purple-500/50"
                    })
                ]),

                // Ícone e Duração
                el('div', { className: "grid grid-cols-2 gap-4" }, [
                    el('div', null, [
                        el('label', { className: "text-[10px] text-slate-500 font-black uppercase mb-2 block tracking-widest" }, "Ícone"),
                        el('div', { className: "flex flex-wrap gap-1 bg-slate-950 p-2 rounded-2xl border border-slate-800" }, 
                            PRESET_ICONS.map(i => el('button', {
                                key: i,
                                onClick: () => setForm({...form, icon: i}),
                                className: `w-8 h-8 flex items-center justify-center rounded-lg transition-all ${form.icon === i ? 'bg-purple-600' : 'hover:bg-slate-800'}`
                            }, i))
                        )
                    ]),
                    el('div', null, [
                        el('label', { className: "text-[10px] text-slate-500 font-black uppercase mb-2 block tracking-widest" }, "Duração (Rodadas)"),
                        el('input', {
                            type: 'number',
                            min: 1,
                            value: form.turns,
                            onChange: (e) => setForm({...form, turns: parseInt(e.target.value) || 1}),
                            className: "w-full h-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-2xl font-black text-center text-amber-500 outline-none focus:border-purple-500/50"
                        })
                    ])
                ]),

                // Cor da Névoa
                el('div', null, [
                    el('div', { className: "flex justify-between items-center mb-3" }, [
                        el('label', { className: "text-[10px] text-slate-500 font-black uppercase tracking-widest" }, "Cor da Névoa Visual"),
                        el('div', { className: "flex items-center gap-2" }, [
                            el('span', { className: "text-[8px] text-slate-600 font-bold" }, "Personalizada:"),
                            el('input', {
                                type: 'color',
                                value: form.color,
                                onChange: (e) => setForm({...form, color: e.target.value}),
                                className: "w-8 h-8 rounded bg-transparent border-none cursor-pointer p-0"
                            })
                        ])
                    ]),
                    el('div', { className: "grid grid-cols-4 gap-2" }, 
                        PRESET_COLORS.map(c => el('button', {
                            key: c.value,
                            onClick: () => setForm({...form, color: c.value}),
                            style: { backgroundColor: c.value },
                            className: `h-10 rounded-xl border-2 transition-all flex items-center justify-center ${form.color === c.value ? 'border-white scale-105 shadow-lg' : 'border-black/20 hover:scale-105'}`
                        }, form.color === c.value ? '✓' : ''))
                    )
                ])
            ]),

            el('button', {
                onClick: () => {
                    if (!form.name.trim()) return alert("Dê um nome à condição!");
                    onSave(form);
                    onClose();
                },
                className: "w-full mt-10 bg-purple-600 hover:bg-purple-500 text-white font-black py-5 rounded-2xl uppercase text-[10px] tracking-widest shadow-lg shadow-purple-900/20 transition-all flex items-center justify-center gap-3"
            }, [el('span', { className: "text-lg" }, "🛡️"), "Aplicar Condição"])
        ])
    );
}
