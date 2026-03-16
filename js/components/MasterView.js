// js/components/MasterView.js
const { useState } = React;

export function MasterView({ 
    allCharacters, 
    rollHistory, 
    onBack, 
    onViewSheet, 
    updateCharacterXP,
    updateCharacterConditions,
    advanceTurn,
    turnState
}) {
    const el = React.createElement;
    const [showCustomCond, setShowCustomCond] = useState(null); // ID do char abrindo form
    
    const COMMON_EFFECTS = [
        { name: 'Cego', color: '#000000', icon: '🕶️', turns: 2 },
        { name: 'Envenenado', color: '#22c55e', icon: '🤢', turns: 3 },
        { name: 'Queimando', color: '#f97316', icon: '🔥', turns: 3 },
        { name: 'Invisível', color: '#38bdf8', icon: '👻', turns: 5 },
        { name: 'Paralisado', color: '#fbbf24', icon: '⚡', turns: 1 },
        { name: 'Caído', color: '#64748b', icon: '🛡️', turns: 1 }
    ];

    return el('div', { className: "min-h-screen bg-slate-950 text-slate-100 p-4 md:p-6 animate-fade-in" },
        // --- HEADER DO MESTRE ---
        el('header', { className: "max-w-6xl mx-auto flex justify-between items-center mb-8 border-b border-slate-800 pb-6" },
            el('h1', { className: "text-2xl md:text-3xl font-black flex items-center gap-3 italic uppercase tracking-tighter" },
                el('span', { className: "text-purple-500" }, "👑"),
                " Sala do Mestre"
            ),
            el('div', { className: "flex gap-3" }, [
                el('button', {
                    onClick: () => advanceTurn(null),
                    className: "bg-slate-800 px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-slate-700 hover:bg-amber-600 transition-all text-amber-500"
                }, "Limpar Turnos"),
                el('button', { 
                    onClick: onBack, 
                    className: "bg-slate-800 px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-slate-700 hover:bg-red-900/40 transition-all" 
                }, "Sair da Sala")
            ])
        ),

        el('div', { className: "max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8" },
            
            // --- COLUNA ESQUERDA: MONITORAMENTO DE JOGADORES ---
            el('div', { className: "lg:col-span-2 space-y-6" },
                el('h2', { className: "text-sm font-black uppercase tracking-[0.3em] text-slate-500 flex items-center gap-2" },
                    "👥 Heróis no Reino"
                ),

                el('div', { className: "grid grid-cols-1 md:grid-cols-2 gap-4" },
                    allCharacters.filter(c => c.name.toLowerCase() !== 'mestre').map(char => {
                        const maxPV = parseInt(char.sheetData?.recursos?.['PV Máximo']) || 10;
                        const perdido = parseInt(char.sheetData?.recursos?.['PV Perdido']) || 0;
                        const temp = parseInt(char.sheetData?.recursos?.['PV Temporário']) || 0;
                        const atualPV = (maxPV - perdido) + temp;
                        const percentPV = Math.min(((maxPV - perdido) / maxPV) * 100, 100);

                        return el('div', { key: char.name, className: "bg-slate-900 border border-slate-800 p-5 rounded-[2rem] shadow-xl hover:border-purple-500/30 transition-all group" },
                            el('div', { className: "flex justify-between items-start mb-4" },
                                el('div', null,
                                    el('h3', { className: "text-lg font-black uppercase text-white tracking-tighter" }, char.name),
                                    el('p', { className: "text-[10px] text-amber-500 font-bold uppercase italic" }, 
                                        char.sheetData?.info?.['Classe'] || 'Sem Classe'
                                    )
                                ),
                                el('div', { className: "flex gap-2" },
                                    el('button', {
                                        onClick: () => advanceTurn(char.name),
                                        className: `px-3 py-2 rounded-xl text-[10px] font-black uppercase transition-all border ${turnState?.activeChar === char.name ? 'bg-amber-500 text-slate-950 border-amber-400 animate-pulse' : 'bg-slate-800 text-slate-400 border-slate-700 hover:border-amber-500'}`
                                    }, turnState?.activeChar === char.name ? "✨ Finalizar Turno" : "Dar Vez"),
                                    el('button', {
                                        onClick: () => onViewSheet(char),
                                        className: "p-2 bg-slate-800 rounded-xl hover:bg-amber-600 transition-colors text-lg"
                                    }, "📜")
                                )
                            ),

                            // Barra de Vitalidade
                            el('div', { className: "mb-4" },
                                el('div', { className: "flex justify-between text-[10px] font-black uppercase mb-1" },
                                    el('span', { className: "text-slate-500" }, `HP ${temp > 0 ? `(+${temp} Temp)` : ''}`),
                                    el('span', { className: percentPV < 30 ? 'text-red-500 animate-pulse' : 'text-slate-300' },
                                        `${atualPV} / ${maxPV}`
                                    )
                                ),
                                el('div', { className: "h-2 w-full bg-slate-800 rounded-full overflow-hidden flex border border-slate-700" },
                                    el('div', { 
                                        className: `h-full transition-all duration-700 ${percentPV < 30 ? 'bg-red-600' : 'bg-green-500'}`,
                                        style: { width: `${Math.max(0, percentPV)}%` }
                                    }),
                                    temp > 0 && el('div', { 
                                        className: "h-full bg-blue-400", 
                                        style: { width: `${(temp/maxPV)*100}%` } 
                                    })
                                )
                            ),

                            // Visão de Bolsos (PO, PP, PC)
                            el('div', { className: "grid grid-cols-3 gap-2 mb-4" },
                                el('div', { className: "bg-slate-950/40 py-2 rounded-xl border border-slate-800/50 flex gap-2 justify-center items-center shadow-inner" },
                                    el('span', { className: "text-[10px] font-black text-amber-500 uppercase tracking-widest" }, "PO"),
                                    el('span', { className: "text-xs font-bold text-amber-400" }, char.sheetData?.outros?.['PO'] || '0')
                                ),
                                el('div', { className: "bg-slate-950/40 py-2 rounded-xl border border-slate-800/50 flex gap-2 justify-center items-center shadow-inner" },
                                    el('span', { className: "text-[10px] font-black text-slate-400 uppercase tracking-widest" }, "PP"),
                                    el('span', { className: "text-xs font-bold text-slate-300" }, char.sheetData?.outros?.['PP'] || '0')
                                ),
                                el('div', { className: "bg-slate-950/40 py-2 rounded-xl border border-slate-800/50 flex gap-2 justify-center items-center shadow-inner" },
                                    el('span', { className: "text-[10px] font-black text-orange-700 uppercase tracking-widest" }, "PC"),
                                    el('span', { className: "text-xs font-bold text-orange-600" }, char.sheetData?.outros?.['PC'] || '0')
                                )
                            ),

                            // Controle de XP
                            el('div', { className: "bg-slate-950/50 p-3 rounded-2xl border border-slate-800/50 flex items-center justify-between mb-3" },
                                el('div', { className: "flex flex-col" },
                                    el('span', { className: "text-[8px] font-black text-slate-500 uppercase" }, "Experiência (XP)"),
                                    el('input', {
                                        type: "number",
                                        className: "bg-transparent border-none p-0 text-amber-400 font-black text-sm focus:ring-0 w-24",
                                        defaultValue: char.sheetData?.info?.['XP'] || 0,
                                        onBlur: (e) => updateCharacterXP(char.name, e.target.value)
                                    })
                                ),
                                el('span', { className: "text-2xl opacity-30 group-hover:opacity-100 transition-opacity" }, "⭐")
                            ),

                            // Injetor de Condições
                            (() => {
                                const rawConds = char.sheetData?.info?.['Condicoes'] || '[]';
                                let conds = [];
                                try { conds = JSON.parse(rawConds); } catch(e) { 
                                    // Fallback para o formato antigo de string separada por vírgula se necessário
                                    conds = rawConds.split(',').filter(Boolean).map(c => ({ name: c.trim(), turns: 1, color: '#ef4444', icon: '🔴' }));
                                }

                                return el('div', { className: "bg-slate-950/50 p-3 rounded-2xl border border-red-900/30 flex flex-col gap-3 relative" },
                                    el('span', { className: "text-[8px] font-black text-red-500 uppercase flex items-center gap-1" }, "🩸 Condições Ativas"),
                                    
                                    // Lista de Condições Atuais
                                    el('div', { className: "flex flex-wrap gap-2" },
                                        conds.map((cond, idx) => 
                                            el('span', { key: idx, className: "bg-slate-900 text-white border-2 border-amber-500/50 px-2 py-1 rounded-lg text-[10px] font-bold uppercase flex items-center gap-2 shadow-lg", style: { borderLeftColor: cond.color, borderLeftWidth: '4px' } },
                                                el('span', null, cond.icon),
                                                el('span', null, `${cond.name} (${cond.turns}t)`),
                                                el('button', { 
                                                    className: "text-red-500 hover:text-white transition-colors ml-1", 
                                                    onClick: () => {
                                                        const newConds = conds.filter((_, i) => i !== idx);
                                                        updateCharacterConditions(char.name, newConds);
                                                    } 
                                                }, "×")
                                            )
                                        )
                                    ),
                                    
                                    // Efeitos Comuns
                                    el('div', { className: "flex flex-wrap gap-1 border-t border-slate-800 pt-2" },
                                        COMMON_EFFECTS.map(eff => 
                                            el('button', {
                                                key: eff.name,
                                                onClick: () => {
                                                    const newConds = [...conds, { ...eff, id: Date.now() }];
                                                    updateCharacterConditions(char.name, newConds);
                                                },
                                                className: "px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded-md text-[9px] font-bold text-slate-400 hover:text-white transition-all flex items-center gap-1"
                                            }, [el('span', { key: 'ic' }, eff.icon), eff.name])
                                        ),
                                        // Botão + Custom
                                        el('button', {
                                            onClick: () => setShowCustomCond(showCustomCond === char.name ? null : char.name),
                                            className: "px-2 py-1 bg-purple-900/30 border border-purple-500/30 hover:bg-purple-500/40 rounded-md text-[9px] font-bold text-purple-400 hover:text-white transition-all"
                                        }, "+ Custom")
                                    ),

                                    // Form Customizado
                                    showCustomCond === char.name && el('div', { className: "p-3 bg-slate-900 rounded-xl border border-purple-500/50 animate-slide-up flex flex-col gap-3" }, [
                                        el('div', { className: "grid grid-cols-2 gap-2" }, [
                                            el('input', { type: 'text', id: `name-${char.name}`, placeholder: 'Nome', className: "bg-slate-800 p-2 rounded text-[10px] outline-none" }),
                                            el('input', { type: 'number', id: `turns-${char.name}`, placeholder: 'Turnos', className: "bg-slate-800 p-2 rounded text-[10px] outline-none", defaultValue: 1 }),
                                        ]),
                                        el('div', { className: "flex justify-between items-center" }, [
                                            el('input', { type: 'color', id: `color-${char.name}`, className: "h-6 w-10 bg-transparent cursor-pointer", defaultValue: '#ef4444' }),
                                            el('select', { id: `icon-${char.name}`, className: "bg-slate-800 text-[10px] p-1 rounded outline-none" }, [
                                                el('option', { value: '❓' }, 'Simbolo'),
                                                el('option', { value: '💀' }, 'Caveira'),
                                                el('option', { value: '💨' }, 'Nevo'),
                                                el('option', { value: '⚔️' }, 'Espada'),
                                                el('option', { value: '🌀' }, 'Confuso'),
                                                el('option', { value: '🩸' }, 'Sangue'),
                                            ]),
                                            el('button', {
                                                className: "bg-purple-600 px-3 py-1 rounded text-[10px] font-bold",
                                                onClick: () => {
                                                    const name = document.getElementById(`name-${char.name}`).value;
                                                    const turns = document.getElementById(`turns-${char.name}`).value;
                                                    const color = document.getElementById(`color-${char.name}`).value;
                                                    const icon = document.getElementById(`icon-${char.name}`).value;
                                                    if(name) {
                                                        const newConds = [...conds, { id: Date.now(), name, turns, color, icon }];
                                                        updateCharacterConditions(char.name, newConds);
                                                        setShowCustomCond(null);
                                                    }
                                                }
                                            }, "Add")
                                        ])
                                    ])
                                );
                            })()
                        );
                    })
                )
            ),

            // --- COLUNA DIREITA: REGISTRO DE DADOS ---
            el('div', { className: "space-y-6" },
                el('h2', { className: "text-sm font-black uppercase tracking-[0.3em] text-slate-500 flex items-center gap-2" },
                    "🎲 Histórico Live"
                ),
                el('section', { className: "bg-slate-900 border-2 border-purple-500/30 rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col max-h-[600px]" },
                    el('div', { className: "bg-purple-900/20 p-5 border-b border-purple-500/30 flex justify-between items-center" },
                        el('h3', { className: "text-xs font-black uppercase tracking-tighter" }, "Últimas Jogadas"),
                        el('div', { className: "flex items-center gap-2" },
                            el('span', { className: "w-2 h-2 bg-red-500 rounded-full animate-ping" }),
                            el('span', { className: "text-[8px] font-bold text-red-400" }, "ONLINE")
                        )
                    ),

                    el('div', { className: "overflow-y-auto p-4 custom-scrollbar bg-slate-950/30 flex-1" },
                        rollHistory.length === 0 
                            ? el('p', { className: "text-center text-slate-600 text-[10px] py-10 uppercase font-black" }, "Nenhuma rolagem ainda...")
                            : el('table', { className: "w-full text-left" },
                                el('tbody', { className: "divide-y divide-slate-800/50" },
                                    rollHistory.map((roll) => (
                                        el('tr', { key: roll.id, className: "hover:bg-white/5 transition-colors group" },
                                            el('td', { className: "py-3 text-xs font-bold text-slate-400 uppercase" }, roll.playerName),
                                            el('td', { className: "py-3 text-center text-[10px] text-slate-600 font-mono italic" }, `d${roll.sides}`),
                                            el('td', { 
                                                className: `py-3 text-right font-black text-xl ${roll.result === roll.sides ? 'text-amber-500 drop-shadow-[0_0_8px_rgba(245,158,11,0.6)]' : 'text-white'}` 
                                            }, roll.result)
                                        )
                                    ))
                                )
                            )
                    )
                )
            )
        )
    );
}