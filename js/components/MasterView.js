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
    turnState,
    geminiApiKey,
    setGeminiApiKey,
    askGemini,
    updateInitiative
}) {
    const el = React.createElement;
    const [showCustomCond, setShowCustomCond] = useState(null); // ID do char abrindo form
    const [showSettings, setShowSettings] = useState(false);
    const [oracleOpen, setOracleOpen] = useState(false);
    const [oracleMessages, setOracleMessages] = useState([]);
    const [oracleInput, setOracleInput] = useState('');
    const [oracleLoading, setOracleLoading] = useState(false);

    const handleOracleSearch = async () => {
        if (!oracleInput.trim() || oracleLoading) return;
        const userMsg = { role: 'user', text: oracleInput };
        setOracleMessages(prev => [...prev, userMsg]);
        const currentInput = oracleInput;
        setOracleInput('');
        setOracleLoading(true);

        try {
            const res = await askGemini(currentInput);
            setOracleMessages(prev => [...prev, { role: 'ai', text: res }]);
        } catch (e) {
            setOracleMessages(prev => [...prev, { role: 'ai', text: `❌ Erro: ${e.message}` }]);
        } finally {
            setOracleLoading(false);
        }
    };
    
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
                    key: 'btn-settings',
                    onClick: () => setShowSettings(true),
                    className: "bg-slate-800 p-2 rounded-xl text-lg hover:bg-slate-700 border border-slate-700 transition-all",
                    title: "Configurações"
                }, "⚙️"),
                el('button', {
                    key: 'btn-clear-turns',
                    onClick: () => advanceTurn(null),
                    className: "bg-slate-800 px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-slate-700 hover:bg-amber-600 transition-all text-amber-500"
                }, "Limpar Turnos"),
                el('button', { 
                    key: 'btn-exit',
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
                                el('div', { key: 'actions', className: "flex gap-2" }, [
                                    el('button', {
                                        key: 'turn',
                                        onClick: () => advanceTurn(char.name),
                                        className: `px-3 py-2 rounded-xl text-[10px] font-black uppercase transition-all border ${(turnState?.activeChar || "").toLowerCase() === char.name.toLowerCase() ? 'bg-amber-500 text-slate-950 border-amber-400 animate-pulse' : 'bg-slate-800 text-slate-400 border-slate-700 hover:border-amber-500'}`
                                    }, (turnState?.activeChar || "").toLowerCase() === char.name.toLowerCase() ? "✨ Finalizar Turno" : "Dar Vez"),
                                    el('button', {
                                        key: 'view',
                                        onClick: () => onViewSheet(char),
                                        className: "p-2 bg-slate-800 rounded-xl hover:bg-amber-600 transition-colors text-lg"
                                    }, "📜")
                                ])
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
                                            el('span', { key: cond.id || cond.name, className: "bg-slate-900 text-white border-2 border-amber-500/50 px-2 py-1 rounded-lg text-[10px] font-bold uppercase flex items-center gap-2 shadow-lg", style: { borderLeftColor: cond.color, borderLeftWidth: '4px' } },
                                                el('span', { key: 'icon' }, cond.icon),
                                                el('span', { key: 'text' }, `${cond.name} (${cond.turns}t)`),
                                                el('button', { 
                                                    key: 'remove',
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
                                            el('select', { key: 'sel', id: `icon-${char.name}`, className: "bg-slate-800 text-[10px] p-1 rounded outline-none" }, [
                                                el('option', { key: 'q', value: '❓' }, 'Simbolo'),
                                                el('option', { key: 'd', value: '💀' }, 'Caveira'),
                                                el('option', { key: 'n', value: '💨' }, 'Nevo'),
                                                el('option', { key: 'e', value: '⚔️' }, 'Espada'),
                                                el('option', { key: 'c', value: '🌀' }, 'Confuso'),
                                                el('option', { key: 'b', value: '🩸' }, 'Sangue'),
                                            ]),
                                            el('button', {
                                                key: 'add',
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

            // --- COLUNA DIREITA: INICIATIVA E DADOS ---
            el('div', { className: "space-y-6" }, [
                // --- RASTREADOR DE INICIATIVA ---
                el('h2', { key: 'ini-title', className: "text-sm font-black uppercase tracking-[0.3em] text-slate-500 flex items-center gap-2" },
                    "⚔️ Ordem de Combate"
                ),
                el('section', { key: 'ini-sec', className: "bg-slate-900 border-2 border-amber-500/30 rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col" }, [
                    // Header Iniciativa
                    el('div', { key: 'h', className: "bg-amber-900/10 p-5 border-b border-amber-500/20 flex justify-between items-center" }, [
                        el('h3', { key: 't', className: "text-xs font-black uppercase tracking-tighter text-amber-500" }, "Iniciativa"),
                        el('button', { 
                            key: 'c',
                            onClick: () => updateInitiative([]),
                            className: "text-[9px] font-black uppercase text-red-500 hover:text-red-400 trasition-colors"
                        }, "Limpar")
                    ]),

                    // Adicionar nova entrada
                    el('div', { key: 'add', className: "p-4 bg-slate-950/20 border-b border-slate-800/50 flex gap-2" }, [
                        el('input', {
                            key: 'n',
                            id: 'ini-name',
                            placeholder: 'Nome',
                            className: "flex-grow bg-slate-900 border border-slate-800 rounded-xl p-2 text-[10px] outline-none focus:border-amber-500/50"
                        }),
                        el('input', {
                            key: 'v',
                            id: 'ini-val',
                            type: 'number',
                            placeholder: 'Dado',
                            className: "w-16 bg-slate-900 border border-slate-800 rounded-xl p-2 text-[10px] outline-none focus:border-amber-500/50"
                        }),
                        el('button', {
                            key: 'b',
                            onClick: () => {
                                const name = document.getElementById('ini-name').value;
                                const val = parseInt(document.getElementById('ini-val').value) || 0;
                                if(name) {
                                    const currentIni = turnState?.initiativeOrder || [];
                                    const newOrder = [...currentIni, { id: Date.now(), name, value: val }]
                                        .sort((a, b) => b.value - a.value);
                                    updateInitiative(newOrder);
                                    document.getElementById('ini-name').value = '';
                                    document.getElementById('ini-val').value = '';
                                }
                            },
                            className: "bg-amber-600 hover:bg-amber-500 text-slate-950 px-3 rounded-xl font-bold text-xs"
                        }, "+")
                    ]),
                // Lista de Iniciativa
                el('div', { key: 'list', className: "overflow-y-auto max-h-[300px] p-2 space-y-2 custom-scrollbar" },
                    (turnState?.initiativeOrder || []).length === 0 
                        ? el('p', { key: 'e', className: "text-center text-slate-600 text-[9px] py-10 uppercase font-black italic" }, "Aguardando início do combate...")
                        : (turnState.initiativeOrder).map((item, idx) => (
                            el('div', { 
                                key: item.id, 
                                className: `flex items-center justify-between p-3 rounded-2xl border transition-all ${(turnState?.activeChar || "").toLowerCase() === item.name.toLowerCase() ? 'bg-amber-500/20 border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.2)]' : 'bg-slate-950/40 border-slate-800/50'}`
                            }, [
                                el('div', { key: 'l', className: "flex items-center gap-3" }, [
                                    el('span', { key: 'idx', className: "w-6 h-6 rounded-lg bg-slate-800 flex items-center justify-center text-[10px] font-black text-amber-500" }, idx + 1),
                                    el('span', { key: 'n', className: `text-xs font-bold uppercase ${(turnState?.activeChar || "").toLowerCase() === item.name.toLowerCase() ? 'text-amber-400' : 'text-slate-300'}` }, item.name)
                                ]),
                                el('div', { key: 'r', className: "flex items-center gap-4" }, [
                                    el('span', { key: 'v', className: "text-amber-500 font-black text-lg drop-shadow-sm" }, item.value),
                                    el('div', { key: 'a', className: "flex gap-1" }, [
                                        el('button', {
                                            key: 'f',
                                            onClick: () => advanceTurn(item.name),
                                            className: `p-2 rounded-lg transition-all ${(turnState?.activeChar || "").toLowerCase() === item.name.toLowerCase() ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-500 hover:text-amber-500'}`
                                        }, "🔥"),
                                        el('button', {
                                            key: 'd',
                                            onClick: () => {
                                                const newOrder = turnState.initiativeOrder.filter(i => i.id !== item.id);
                                                updateInitiative(newOrder);
                                            },
                                            className: "p-2 bg-slate-800 text-slate-600 hover:text-red-500 rounded-lg transition-all"
                                        }, "×")
                                    ])
                                ])
                            ])
                        ))
                )
                ]),

                // --- HISTÓRICO LIVE ---
                el('h2', { key: 'hist-title', className: "text-sm font-black uppercase tracking-[0.3em] text-slate-500 flex items-center gap-2 pt-4" },
                    "🎲 Histórico Live"
                ),
                el('section', { key: 'hist-sec', className: "bg-slate-900 border-2 border-purple-500/30 rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col max-h-[600px]" }, [
                    el('div', { key: 'hist-h', className: "bg-purple-900/20 p-5 border-b border-purple-500/30 flex justify-between items-center" }, [
                        el('h3', { key: 'hist-t', className: "text-xs font-black uppercase tracking-tighter text-white" }, "Últimas Jogadas"),
                        el('div', { key: 'hist-s', className: "flex items-center gap-2" }, [
                            el('span', { key: 'hist-p', className: "w-2 h-2 bg-red-500 rounded-full animate-ping" }),
                            el('span', { key: 'hist-o', className: "text-[8px] font-bold text-red-400" }, "ONLINE")
                        ])
                    ]),
                    el('div', { key: 'hist-l', className: "overflow-y-auto p-4 custom-scrollbar bg-slate-950/30 flex-1" }, [
                        rollHistory.length === 0 
                            ? el('p', { key: 'hist-e', className: "text-center text-slate-600 text-[10px] py-10 uppercase font-black" }, "Nenhuma rolagem ainda...")
                            : el('table', { key: 'hist-tbl', className: "w-full text-left" }, [
                                el('tbody', { key: 'hist-body', className: "divide-y divide-slate-800/50" },
                                    rollHistory.map((roll) => (
                                        el('tr', { key: roll.id, className: "hover:bg-white/5 transition-colors group" }, [
                                            el('td', { key: 'p', className: "py-3 text-xs font-bold text-slate-400 uppercase" }, roll.playerName),
                                            el('td', { key: 's', className: "py-3 text-center text-[10px] text-slate-600 font-mono italic" }, `d${roll.sides}`),
                                            el('td', { 
                                                key: 'r',
                                                className: `py-3 text-right font-black text-xl ${roll.result === roll.sides ? 'text-amber-500 drop-shadow-[0_0_8px_rgba(245,158,11,0.6)]' : 'text-white'}` 
                                            }, roll.result)
                                        ])
                                    ))
                                )
                            ])
                    ])
                ])
            ])
        ),

        // --- ORÁCULO DOS MONSTROS (GEMINI CHAT) ---
        el('div', { 
            key: 'oracle-widget',
            className: `fixed bottom-6 right-6 z-[100] transition-all duration-500 ${oracleOpen ? 'w-96' : 'w-16 h-16'}`
        }, [
            !oracleOpen && el('button', {
                key: 'open-bubble',
                onClick: () => setOracleOpen(true),
                className: "w-16 h-16 bg-gradient-to-br from-purple-600 to-indigo-700 rounded-2xl flex items-center justify-center text-3xl shadow-[0_0_20px_rgba(139,92,246,0.5)] hover:scale-110 mb-4 transition-all animate-pulse pointer-events-auto"
            }, "🔮"),

            oracleOpen && el('div', {
                key: 'chat-box',
                className: "bg-slate-900 border-2 border-purple-500/50 rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[500px] pointer-events-auto"
            }, [
                // Header Chat
                el('div', { key: 'hd', className: "bg-purple-900/40 p-4 border-b border-purple-500/30 flex justify-between items-center" }, [
                    el('h3', { key: 'tit', className: "text-purple-300 font-black uppercase text-xs tracking-widest italic" }, "🔮 Oráculo Arcano"),
                    el('button', { key: 'cls', onClick: () => setOracleOpen(false), className: "text-purple-300 hover:text-white" }, "×")
                ]),
                // Mensagens
                el('div', { key: 'msg-area', className: "flex-grow overflow-y-auto p-4 space-y-4 custom-scrollbar bg-[url('https://www.transparenttextures.com/patterns/papyros.png')] bg-fixed" }, 
                    oracleMessages.length === 0 ? 
                        el('p', { key: 'empty', className: "text-center text-slate-500 text-xs italic mt-10" }, "Consulte os livros proibidos sobre monstros e regras...") :
                        oracleMessages.map((m, i) => el('div', { 
                            key: `msg-${i}`, 
                            className: `p-3 rounded-2xl text-[11px] leading-relaxed shadow-lg ${m.role === 'user' ? 'bg-indigo-900/40 ml-8 text-indigo-100 border border-indigo-500/30' : 'bg-slate-950/80 mr-8 text-amber-100 border border-amber-900/40 italic marker-font'}`
                        }, m.text))
                ),
                // Input
                el('div', { key: 'inp-area', className: "p-4 bg-slate-950/80 border-t border-purple-500/20" }, [
                    el('div', { key: 'row', className: "flex gap-2" }, [
                        el('input', {
                            key: 'field',
                            type: 'text',
                            value: oracleInput,
                            onChange: (e) => setOracleInput(e.target.value),
                            placeholder: "Pergunte ao oráculo...",
                            className: "flex-grow bg-slate-900 border border-purple-500/30 rounded-xl p-3 text-xs outline-none focus:border-purple-500",
                            onKeyPress: (e) => e.key === 'Enter' && handleOracleSearch()
                        }),
                        el('button', {
                            key: 'send',
                            onClick: handleOracleSearch,
                            disabled: oracleLoading,
                            className: `bg-purple-600 hover:bg-purple-500 text-white p-3 rounded-xl transition-all ${oracleLoading ? 'opacity-50 grayscale' : ''}`
                        }, oracleLoading ? "⌛" : "✨")
                    ])
                ])
            ])
        ]),

        // --- MODAL CONFIGURAÇÕES (API KEY) ---
        showSettings && el('div', { className: "fixed inset-0 bg-black/80 backdrop-blur-md z-[200] flex items-center justify-center p-6 pointer-events-auto" }, 
            el('div', { className: "bg-slate-900 border-2 border-amber-500/30 p-8 rounded-[3rem] max-w-md w-full shadow-2xl animate-fade-in" }, [
                el('h3', { className: "text-amber-500 font-black uppercase tracking-widest mb-6 border-b border-amber-900/20 pb-4" }, "⚙️ Configurações"),
                el('div', { key: 'config-api', className: "space-y-6" }, [
                    el('div', { key: 'input-group' }, [
                        el('label', { key: 'lbl', className: "text-[10px] font-black text-slate-500 uppercase mb-2 block" }, "Google Gemini API Key"),
                        el('input', {
                            key: 'api-input',
                            type: 'password',
                            value: geminiApiKey,
                            onChange: (e) => setGeminiApiKey(e.target.value),
                            placeholder: "Cole sua chave aqui...",
                            className: "w-full bg-slate-950 border border-slate-700 rounded-2xl p-4 text-xs text-white outline-none focus:border-amber-500"
                        })
                    ]),
                  el('p', { key: 'desc', className: "text-[9px] text-slate-500 italic" }, "A chave é salva apenas no seu navegador local."),
                    el('button', {
                        key: 'btn-diag',
                        onClick: async () => {
                            try {
                                const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${geminiApiKey}`);
                                const d = await res.json();
                                const names = d.models ? d.models.map(m => m.name.replace('models/', '')) : [];
                                console.log("--- DIAGNÓSTICO DE MODELOS ---");
                                console.log("Nomes para usar no app.js:", names);
                                alert("Modelos listados no console (F12)!");
                            } catch(e) {
                                alert("Erro ao diagnosticar: " + e.message);
                            }
                        },
                        className: "w-full bg-slate-800 hover:bg-slate-700 text-purple-400 font-bold py-2 rounded-xl transition-all uppercase text-[9px] border border-purple-500/20"
                    }, "🔍 Diagnosticar Modelos Disponíveis"),
                    el('button', {
                        key: 'btn-save',
                        onClick: () => setShowSettings(false),
                        className: "w-full bg-amber-600 hover:bg-amber-500 text-slate-900 font-bold py-4 rounded-2xl transition-all uppercase text-xs"
                    }, "Salvar e Fechar")
                ])
            ])
        )
    );
}