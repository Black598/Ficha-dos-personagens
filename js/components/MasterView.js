const { useState } = React;
import { SoulGrimoire } from './SoulGrimoire.js';

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
    updateInitiative,
    souls,
    updateSouls,
    updateEditPermission,
    rollDice,
    triggerExternalRoll,
    deleteCharacter
}) {
    const el = React.createElement;
    const [showCustomCond, setShowCustomCond] = useState(null);
    const [showSettings, setShowSettings] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(null); // nome do char aguardando confirmação
    const [oracleOpen, setOracleOpen] = useState(false);
    const [oracleMessages, setOracleMessages] = useState([]);
    const [oracleInput, setOracleInput] = useState('');
    const [oracleLoading, setOracleLoading] = useState(false);
    const [secretMode, setSecretMode] = useState(false);
    const [localModifier, setLocalModifier] = useState(0);
    const [localRollMode, setLocalRollMode] = useState('normal');

    const handleQuickRoll = (sides) => {
        if (triggerExternalRoll) {
            triggerExternalRoll(sides, secretMode, localModifier, localRollMode);
        } else {
            // Fallback total se algo der muito errado
            rollDice(sides, null, '', secretMode);
        }
    };

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
        el('header', { key: 'master-header', className: "max-w-6xl mx-auto flex justify-between items-center mb-8 border-b border-slate-800 pb-6" },
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

        el('div', { key: 'master-content', className: "max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8 mb-24" },
            
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
                                    el('h3', { key: 'name', className: "text-lg font-black uppercase text-white tracking-tighter" }, char.name),
                                    el('p', { key: 'class', className: "text-[10px] text-amber-500 font-bold uppercase italic" }, 
                                        char.sheetData?.info?.['Classe'] || 'Sem Classe'
                                    )
                                ),
                                el('div', { key: 'actions', className: "flex gap-2 items-center" }, [
                                    el('button', {
                                        key: 'turn',
                                        onClick: () => advanceTurn(char.name),
                                        className: `px-3 py-2 rounded-xl text-[10px] font-black uppercase transition-all border ${(turnState?.activeChar || "").toLowerCase() === char.name.toLowerCase() ? 'bg-amber-500 text-slate-950 border-amber-400 animate-pulse' : 'bg-slate-800 text-slate-400 border-slate-700 hover:border-amber-500'}`
                                    }, (turnState?.activeChar || "").toLowerCase() === char.name.toLowerCase() ? "✨ Finalizar Turno" : "Dar Vez"),
                                    el('button', {
                                        key: 'view',
                                        onClick: () => onViewSheet(char),
                                        className: "p-2 bg-slate-800 rounded-xl hover:bg-amber-600 transition-colors text-lg"
                                    }, "📜"),
                                    el('button', {
                                        key: 'lock',
                                        onClick: () => updateEditPermission(char.name, !(char.sheetData?.allowEditing)),
                                        className: `p-2 rounded-xl transition-all text-lg ${char.sheetData?.allowEditing ? 'bg-green-900/40 text-green-400 border border-green-500/30' : 'bg-slate-800 text-slate-500 border border-slate-700'}`,
                                        title: char.sheetData?.allowEditing ? "Edição Habilitada" : "Edição Bloqueada"
                                    }, char.sheetData?.allowEditing ? "🔓" : "🔒"),
                                    el('button', {
                                        key: 'delete',
                                        onClick: () => {
                                            if (confirmDelete === char.name) {
                                                deleteCharacter(char.name);
                                                setConfirmDelete(null);
                                            } else {
                                                setConfirmDelete(char.name);
                                                setTimeout(() => setConfirmDelete(null), 3000);
                                            }
                                        },
                                        className: confirmDelete === char.name
                                            ? "px-2 py-1 bg-red-600 text-white rounded-xl border border-red-400 transition-all text-[9px] font-black uppercase animate-pulse"
                                            : "p-2 bg-red-900/20 hover:bg-red-700 text-red-500 hover:text-white rounded-xl border border-red-900/30 hover:border-red-500 transition-all text-lg opacity-0 group-hover:opacity-100",
                                        title: "Excluir Personagem"
                                    }, confirmDelete === char.name ? "Confirmar?" : "🗑️")
                                ])
                            ),

                            // Barra de Vitalidade
                            el('div', { className: "mb-4" },
                                el('div', { className: "flex justify-between text-[10px] font-black uppercase mb-1" },
                                    el('span', { key: 'label', className: "text-slate-500" }, `HP ${temp > 0 ? `(+${temp} Temp)` : ''}`),
                                    el('span', { key: 'value', className: percentPV < 30 ? 'text-red-500 animate-pulse' : 'text-slate-300' },
                                        `${atualPV} / ${maxPV}`
                                    )
                                ),
                                el('div', { className: "h-2 w-full bg-slate-800 rounded-full overflow-hidden flex border border-slate-700" },
                                    el('div', { 
                                        key: 'hp-bar',
                                        className: `h-full transition-all duration-700 ${percentPV < 30 ? 'bg-red-600' : 'bg-green-500'}`,
                                        style: { width: `${Math.max(0, percentPV)}%` }
                                    }),
                                    temp > 0 && el('div', { 
                                        key: 'temp-bar',
                                        className: "h-full bg-blue-400", 
                                        style: { width: `${(temp/maxPV)*100}%` } 
                                    })
                                )
                            ),

                            // Visão de Bolsos
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

                            // XP
                            el('div', { className: "bg-slate-950/50 p-3 rounded-2xl border border-slate-800/50 flex items-center justify-between mb-3" },
                                el('div', { className: "flex flex-col" },
                                    el('span', { className: "text-[8px] font-black text-slate-500 uppercase" }, "Experiência (XP)"),
                                    el('input', {
                                        type: "number",
                                        className: "bg-transparent border-none p-0 text-amber-400 font-black text-sm w-24",
                                        defaultValue: char.sheetData?.info?.['XP'] || 0,
                                        onBlur: (e) => updateCharacterXP(char.name, e.target.value)
                                    })
                                ),
                                el('span', { className: "text-2xl opacity-30 group-hover:opacity-100 transition-opacity" }, "⭐")
                            ),

                            // Condições
                            (() => {
                                const rawConds = char.sheetData?.info?.['Condicoes'] || '[]';
                                let conds = [];
                                try { conds = JSON.parse(rawConds); } catch(e) { 
                                    conds = rawConds.split(',').filter(Boolean).map(c => ({ name: c.trim(), turns: 1, color: '#ef4444', icon: '🔴' }));
                                }

                                return el('div', { className: "bg-slate-950/50 p-3 rounded-2xl border border-red-900/30 flex flex-col gap-3 relative" },
                                    el('span', { className: "text-[8px] font-black text-red-500 uppercase flex items-center gap-1" }, "🩸 Condições Ativas"),
                                    el('div', { className: "flex flex-wrap gap-2" },
                                        conds.map((cond, idx) => 
                                            el('span', { key: idx, className: "bg-slate-900 text-white border-2 border-amber-500/50 px-2 py-1 rounded-lg text-[10px] font-bold uppercase flex items-center gap-2", style: { borderLeftColor: cond.color, borderLeftWidth: '4px' } },
                                                el('span', null, cond.icon),
                                                el('span', null, `${cond.name} (${cond.turns}t)`),
                                                el('button', { onClick: () => { const newConds = conds.filter((_, i) => i !== idx); updateCharacterConditions(char.name, newConds); } }, "×")
                                            )
                                        )
                                    ),
                                    el('div', { className: "flex flex-wrap gap-1 border-t border-slate-800 pt-2" },
                                        COMMON_EFFECTS.map(eff => 
                                            el('button', {
                                                key: eff.name,
                                                onClick: () => { const newConds = [...conds, { ...eff, id: Date.now() }]; updateCharacterConditions(char.name, newConds); },
                                                className: "px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded-md text-[9px] font-bold text-slate-400 flex items-center gap-1"
                                            }, [el('span', { key: 'icon' }, eff.icon), el('span', { key: 'name' }, eff.name)])
                                        )
                                    )
                                );
                            })()
                        );
                    })
                )
            ),

            // --- COLUNA DIREITA ---
            el('div', { className: "space-y-6" },
                el('h2', { key: 'h-comb', className: "text-sm font-black uppercase tracking-[0.3em] text-slate-500 flex items-center gap-2" }, "⚔️ Ordem de Combate"),
                el('section', { key: 'sec-comb', className: "bg-slate-900 border-2 border-amber-500/30 rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col" },
                    el('div', { key: 'h-ini', className: "bg-amber-900/10 p-5 border-b border-amber-500/20 flex justify-between items-center" },
                        el('h3', { key: 'lbl', className: "text-xs font-black uppercase text-amber-500" }, "Iniciativa"),
                        el('button', { key: 'btn-clear', onClick: () => updateInitiative([]), className: "text-[9px] text-red-500 uppercase font-black" }, "Limpar")
                    ),
                    el('div', { key: 'inp-box', className: "p-4 flex gap-2 bg-slate-950/20" },
                        el('input', { key: 'i-name', id: 'ini-name', placeholder: 'Nome', className: "flex-grow bg-slate-900 border border-slate-800 rounded-xl p-2 text-[10px] outline-none" }),
                        el('input', { key: 'i-val', id: 'ini-val', type: 'number', placeholder: 'Inic.', className: "w-16 bg-slate-900 border border-slate-800 rounded-xl p-2 text-[10px] outline-none" }),
                        el('button', {
                            key: 'btn-add',
                            onClick: () => {
                                const name = document.getElementById('ini-name').value;
                                const val = parseInt(document.getElementById('ini-val').value) || 0;
                                if(name) {
                                    const currentIni = turnState?.initiativeOrder || [];
                                    const newOrder = [...currentIni, { id: Date.now(), name, value: val }].sort((a,b)=>b.value-a.value);
                                    updateInitiative(newOrder);
                                    document.getElementById('ini-name').value = '';
                                    document.getElementById('ini-val').value = '';
                                }
                            },
                            className: "bg-amber-600 px-3 rounded-xl font-bold text-xs text-slate-900"
                        }, "+")
                    ),
                    el('div', { key: 'ini-list', className: "p-2 space-y-2 max-h-[300px] overflow-y-auto" },
                        (turnState?.initiativeOrder || []).map((item, idx) => (
                            el('div', { key: item.id, className: `flex items-center justify-between p-3 rounded-2xl border ${turnState?.activeChar === item.name ? 'bg-amber-500/20 border-amber-500 shadow-lg' : 'bg-slate-950/40 border-slate-800/50'}` },
                                el('div', { className: "flex items-center gap-3" },
                                    el('span', { className: "w-6 h-6 rounded-lg bg-slate-800 flex items-center justify-center text-[10px] font-black text-amber-500" }, idx + 1),
                                    el('span', { className: "text-xs font-bold uppercase" }, item.name)
                                ),
                                el('div', { className: "flex items-center gap-4" },
                                    el('span', { className: "text-amber-500 font-black text-lg" }, item.value),
                                    el('button', { onClick: () => updateInitiative(turnState.initiativeOrder.filter(i=>i.id!==item.id)), className: "text-slate-600 hover:text-red-500" }, "×")
                                )
                            )
                        ))
                    )
                ),

                el('h2', { className: "text-sm font-black uppercase tracking-[0.3em] text-slate-500 flex items-center gap-2 pt-4" }, "🎲 Histórico Live"),
                el('section', { key: 'sec-hist', className: "bg-slate-900 border-2 border-purple-500/30 rounded-[2.5rem] overflow-hidden flex flex-col max-h-[400px]" },
                    rollHistory.length === 0 
                        ? el('p', { className: "text-center text-slate-600 text-[10px] py-10" }, "Sem rolagens...")
                        : el('table', { className: "w-full text-left" },
                            el('tbody', null,
                                rollHistory.map((roll) => (
                                    el('tr', { key: roll.id, className: "border-b border-slate-800/50 hover:bg-white/5 transition-colors" },
                                        el('td', { className: "py-3 pl-4 text-xs font-bold text-slate-400" }, roll.playerName),
                                        el('td', { className: "py-3 text-center text-[10px] text-slate-600 font-mono" }, `d${roll.sides}`),
                                        el('td', { className: `py-3 pr-4 text-right font-black text-lg ${roll.result === roll.sides ? 'text-amber-500' : 'text-white'}` }, roll.result)
                                    )
                                ))
                            )
                        )
                )
            ),
        ),

        // --- GRIMÓRIO ---
        el('div', { key: 'grimoire-sec', className: "max-w-6xl mx-auto mt-12 mb-20" },
            el(SoulGrimoire, { souls, updateSouls })
        ),


        // --- ORÁCULO ---
        el('div', { 
            key: 'oracle-widget',
            className: `fixed bottom-6 right-6 z-[100] transition-all ${oracleOpen ? 'w-96' : 'w-16 h-16'}`
        }, [
            !oracleOpen && el('button', {
                onClick: () => setOracleOpen(true),
                className: "w-16 h-16 bg-gradient-to-br from-purple-600 to-indigo-700 rounded-2xl flex items-center justify-center text-3xl shadow-lg shadow-purple-900/40 pointer-events-auto"
            }, "🔮"),

            oracleOpen && el('div', { className: "bg-slate-900 border-2 border-purple-500/50 rounded-3xl shadow-2xl flex flex-col h-[500px] pointer-events-auto" }, [
                el('div', { className: "bg-purple-900/40 p-4 border-b border-purple-500/30 flex justify-between items-center" }, [
                    el('h3', { className: "text-purple-300 font-black uppercase text-xs" }, "🔮 Oráculo Arcano"),
                    el('button', { onClick: () => setOracleOpen(false), className: "text-purple-300 hover:text-white" }, "×")
                ]),
                el('div', { className: "flex-grow overflow-y-auto p-4 space-y-3" }, 
                    oracleMessages.map((m, i) => el('div', { 
                        key: i, 
                        className: `p-3 rounded-2xl text-[11px] ${m.role === 'user' ? 'bg-indigo-900/40 ml-4 border border-indigo-500/20' : 'bg-slate-950/80 mr-4 italic text-amber-100 border border-amber-900/30'}`
                    }, m.text))
                ),
                el('div', { className: "p-4 bg-slate-950/80 border-t border-purple-500/10" }, [
                    el('div', { className: "flex gap-2" }, [
                        el('input', {
                            type: 'text',
                            value: oracleInput,
                            onChange: (e) => setOracleInput(e.target.value),
                            placeholder: "Consulte o oráculo...",
                            className: "flex-grow bg-slate-900 border border-purple-500/30 rounded-xl p-3 text-xs text-white outline-none",
                            onKeyPress: (e) => e.key === 'Enter' && handleOracleSearch()
                        }),
                        el('button', { onClick: handleOracleSearch, className: "bg-purple-600 p-3 rounded-xl hover:bg-purple-500" }, oracleLoading ? "⌛" : "✨")
                    ])
                ])
            ])
        ]),

        // --- CONFIGURAÇÕES ---
        showSettings && el('div', { className: "fixed inset-0 bg-black/80 backdrop-blur-md z-[200] flex items-center justify-center p-6 pointer-events-auto" }, 
            el('div', { className: "bg-slate-900 border-2 border-amber-500/30 p-8 rounded-[3rem] max-w-md w-full shadow-2xl animate-fade-in" }, [
                el('h3', { key: 'title', className: "text-amber-500 font-black uppercase mb-6" }, "⚙️ Configurações"),
                el('div', { key: 'content', className: "space-y-6" }, [
                    el('div', { key: 'api-key-group' }, [
                        el('label', { key: 'label', className: "text-[10px] text-slate-500 block mb-2" }, "GEMINI API KEY"),
                        el('input', {
                            key: 'input',
                            type: 'password',
                            value: geminiApiKey,
                            onChange: (e) => setGeminiApiKey(e.target.value),
                            placeholder: "Insira sua chave...",
                            className: "w-full bg-slate-950 border border-slate-700 rounded-2xl p-4 text-xs text-white outline-none"
                        })
                    ]),
                    el('button', {
                        key: 'save-btn',
                        onClick: () => setShowSettings(false),
                        className: "w-full bg-amber-600 text-slate-900 font-black py-4 rounded-2xl uppercase text-xs"
                    }, "Salvar e Fechar")
                ])
            ])
        ),

        // --- BARRA DE DADOS RÁPIDOS (FLUTUANTE) ---
        el('div', { key: 'quick-dice-bar', className: "fixed bottom-6 left-1/2 -translate-x-1/2 z-[150] flex flex-col items-center gap-3" }, [
            // CONTROLES DE MODO E MODIFICADOR
            el('div', { key: 'controls', className: "flex items-center gap-4 bg-slate-900/90 backdrop-blur-xl border-2 border-purple-500/30 p-2 px-6 rounded-full shadow-2xl animate-fade-in mb-1" }, [
                el('div', { key: 'modes', className: "flex gap-4 border-r border-slate-800 pr-4" }, [
                    el('button', {
                        key: 'norm',
                        onClick: () => setLocalRollMode('normal'),
                        className: `text-[10px] font-black uppercase tracking-widest transition-all ${localRollMode === 'normal' ? 'text-purple-400 scale-110' : 'text-slate-600 hover:text-slate-400'}`
                    }, "Normal"),
                    el('button', {
                        key: 'vant',
                        onClick: () => setLocalRollMode('vantagem'),
                        className: `text-[10px] font-black uppercase tracking-widest transition-all ${localRollMode === 'vantagem' ? 'text-amber-500 scale-110' : 'text-slate-600 hover:text-slate-400'}`
                    }, "Vantagem"),
                    el('button', {
                        key: 'desv',
                        onClick: () => setLocalRollMode('desvantagem'),
                        className: `text-[10px] font-black uppercase tracking-widest transition-all ${localRollMode === 'desvantagem' ? 'text-red-500 scale-110' : 'text-slate-600 hover:text-slate-400'}`
                    }, "Desv."),
                ]),
                el('div', { key: 'mod', className: "flex items-center gap-3" }, [
                    el('span', { className: "text-[10px] font-black text-slate-500 uppercase" }, "Bônus:"),
                    el('div', { className: "flex items-center bg-slate-950 rounded-lg border border-slate-800" }, [
                        el('button', { onClick: () => setLocalModifier(m => m - 1), className: "px-2 text-white font-bold" }, "-"),
                        el('span', { className: "w-6 text-center text-xs font-black text-amber-500" }, localModifier >= 0 ? `+${localModifier}` : localModifier),
                        el('button', { onClick: () => setLocalModifier(m => m + 1), className: "px-2 text-white font-bold" }, "+")
                    ])
                ])
            ]),
            // BARRA DE DADOS
            el('div', { key: 'dice-bar', className: "flex items-center gap-3 bg-slate-900/80 backdrop-blur-2xl border-2 border-amber-500/30 p-4 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] animate-slide-up pointer-events-auto" }, [
                el('div', { key: 'privacy-toggle', className: "flex items-center gap-2 pr-4 border-r border-slate-700 mr-2" }, [
                    el('button', {
                        key: 'tgl-btn',
                        onClick: () => setSecretMode(!secretMode),
                        className: `w-12 h-12 rounded-full flex items-center justify-center text-xl transition-all ${secretMode ? 'bg-red-600 text-white shadow-[0_0_15px_rgba(220,38,38,0.5)]' : 'bg-slate-800 text-slate-500 hover:text-white'}`
                    }, secretMode ? '🕵️' : '👁️'),
                    el('span', { key: 'tgl-txt', className: `text-[9px] font-black uppercase tracking-tighter w-14 leading-tight ${secretMode ? 'text-red-500' : 'text-slate-500'}` }, 
                        secretMode ? 'Rolagem Oculta' : 'Rolagem Pública'
                    )
                ]),
                [4, 6, 8, 10, 12, 20, 100].map(sides => 
                    el('button', {
                        key: sides,
                        onClick: () => handleQuickRoll(sides),
                        className: "w-12 h-12 bg-slate-800 hover:bg-amber-600 text-white font-black text-xs rounded-2xl border border-slate-700 hover:border-amber-400 transition-all shadow-lg active:scale-95 flex flex-col items-center justify-center group"
                    }, [
                        el('span', { key: 'd-label', className: "text-[8px] text-slate-500 group-hover:text-amber-200" }, "D"),
                        sides
                    ])
                )
            ])
        ])
    );
}