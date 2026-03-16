// js/components/MasterView.js
const { useState } = React;

export function MasterView({ 
    allCharacters, 
    rollHistory, 
    onBack, 
    onViewSheet, 
    updateCharacterXP 
}) {
    const el = React.createElement;

    return el('div', { className: "min-h-screen bg-slate-950 text-slate-100 p-4 md:p-6 animate-fade-in" },
        // --- HEADER DO MESTRE ---
        el('header', { className: "max-w-6xl mx-auto flex justify-between items-center mb-8 border-b border-slate-800 pb-6" },
            el('h1', { className: "text-2xl md:text-3xl font-black flex items-center gap-3 italic uppercase tracking-tighter" },
                el('span', { className: "text-purple-500" }, "👑"),
                " Sala do Mestre"
            ),
            el('button', { 
                onClick: onBack, 
                className: "bg-slate-800 px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest border border-slate-700 hover:bg-red-900/40 transition-all" 
            }, "Sair da Sala")
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
                                el('button', {
                                    onClick: () => onViewSheet(char),
                                    className: "p-2 bg-slate-800 rounded-xl hover:bg-amber-600 transition-colors text-lg"
                                }, "📜")
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

                            // Controle de XP
                            el('div', { className: "bg-slate-950/50 p-3 rounded-2xl border border-slate-800/50 flex items-center justify-between" },
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
                            )
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