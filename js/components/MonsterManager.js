const { useState } = React;

export function MonsterManager({ sessionState, updateSessionState }) {
    const el = React.createElement;

    const monsters = sessionState.monsters || [];

    const addMonster = () => {
        const newMonsters = [...monsters, { id: Date.now(), name: 'Novo Monstro', ca: 10, hpMax: 20, hpAtual: 20 }];
        updateSessionState({ monsters: newMonsters });
    };

    const removeMonster = (id) => {
        const newMonsters = monsters.filter(m => m.id !== id);
        updateSessionState({ monsters: newMonsters });
    };

    const updateMonster = (id, field, value) => {
        const newMonsters = monsters.map(m => {
            if (m.id === id) {
                const updated = { ...m, [field]: value };
                if (field === 'hpMax') updated.hpAtual = value; // Sincroniza se mudar o max
                return updated;
            }
            return m;
        });
        updateSessionState({ monsters: newMonsters });
    };

    return el('div', { key: 'monster-manager-root', className: "space-y-6" }, [
        el('div', { key: 'header', className: "flex items-center justify-between" }, [
            el('h2', { key: 'title', className: "text-sm font-black uppercase tracking-[0.3em] text-red-500 flex items-center gap-2" }, "⚔️ Ameaças e NPCs"),
            el('button', {
                key: 'add-btn',
                onClick: addMonster,
                className: "bg-red-900/40 hover:bg-red-600 text-red-400 hover:text-white px-4 py-2 rounded-xl border border-red-500/30 text-[10px] font-black uppercase tracking-widest transition-all"
            }, "+ Adicionar")
        ]),

        el('div', { key: 'monsters-grid', className: "grid grid-cols-1 md:grid-cols-2 gap-4" }, 
            monsters.map(m => el('div', { key: m.id, className: "bg-slate-900 border border-slate-800 p-5 rounded-[2rem] shadow-xl relative group hover:border-red-500/30 transition-all" }, [
                // Deletar
                el('button', {
                    key: 'remove-btn',
                    onClick: () => removeMonster(m.id),
                    className: "absolute top-4 right-4 text-slate-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                }, "×"),

                el('div', { key: 'main-info', className: "flex items-center gap-4 mb-4" }, [
                    el('div', { key: 'icon-box', className: "w-12 h-12 bg-red-900/40 rounded-2xl flex items-center justify-center border border-red-500/20" }, 
                        el('span', { className: "text-lg" }, "👹")
                    ),
                    el('div', { key: 'name-ca-box', className: "flex-grow" }, [
                        el('input', {
                            key: 'name-input',
                            className: "bg-transparent text-white font-black uppercase text-sm outline-none w-full focus:text-red-400",
                            value: m.name,
                            onChange: (e) => updateMonster(m.id, 'name', e.target.value)
                        }),
                        el('div', { key: 'ca-row', className: "flex items-center gap-3 text-[10px] font-bold text-slate-500" }, [
                            el('span', { key: 'ca-label' }, "CA"),
                            el('input', {
                                key: 'ca-input',
                                type: 'number',
                                className: "bg-slate-950 border border-slate-800 rounded px-1.5 w-10 text-center text-red-400",
                                value: m.ca,
                                onChange: (e) => updateMonster(m.id, 'ca', parseInt(e.target.value))
                            })
                        ])
                    ])
                ]),

                // HP Bar
                el('div', { key: 'hp-section', className: "space-y-2" }, [
                    el('div', { key: 'hp-header', className: "flex justify-between text-[10px] font-black uppercase" }, [
                        el('span', { key: 'hp-label', className: "text-slate-500" }, "Vitalidade"),
                        el('div', { key: 'hp-values', className: "flex items-center gap-1" }, [
                            el('input', {
                                key: 'hp-atual-input',
                                type: 'number',
                                className: "bg-transparent text-red-500 w-8 text-right outline-none",
                                value: m.hpAtual,
                                onChange: (e) => updateMonster(m.id, 'hpAtual', parseInt(e.target.value))
                            }),
                            el('span', { key: 'sep', className: "text-slate-700" }, "/"),
                            el('input', {
                                key: 'hp-max-input',
                                type: 'number',
                                className: "bg-transparent text-slate-500 w-8 outline-none",
                                value: m.hpMax,
                                onChange: (e) => updateMonster(m.id, 'hpMax', parseInt(e.target.value))
                            })
                        ])
                    ]),
                    el('div', { key: 'hp-bar-container', className: "h-2 bg-slate-800 rounded-full overflow-hidden flex gap-0.5" }, [
                        el('div', {
                            key: 'hp-fill',
                            className: "h-full bg-red-600 transition-all duration-300",
                            style: { width: `${(m.hpAtual / m.hpMax) * 100}%` }
                        }),
                        // Botões de ajuste rápido
                        el('button', { 
                            key: 'hp-minus',
                            onClick: () => updateMonster(m.id, 'hpAtual', Math.max(0, m.hpAtual - 1)),
                            className: "absolute left-5 bottom-4 w-6 h-6 bg-slate-950 hover:bg-red-900 border border-slate-800 rounded-lg flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-all"
                        }, "-"),
                        el('button', { 
                            key: 'hp-plus',
                            onClick: () => updateMonster(m.id, 'hpAtual', Math.min(m.hpMax, m.hpAtual + 1)),
                            className: "absolute left-12 bottom-4 w-6 h-6 bg-slate-950 hover:bg-green-900 border border-slate-800 rounded-lg flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-all"
                        }, "+")
                    ])
                ])
            ]))
        )
    ]);
}
