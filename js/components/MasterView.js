const { useState, useEffect } = React;
const el = React.createElement;
import { safeParseJSON } from '../utils.js';

import { SoulGrimoire } from './SoulGrimoire.js';
import { OracleMural } from './OracleMural.js';
import { MasterControls } from './MasterControls.js';
import { MonsterManager } from './MonsterManager.js';
import { ConditionModal } from './ConditionModal.js';

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
    deleteCharacter,
    sessionState,
    updateSessionState
}) {
    const [showSettings, setShowSettings] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(null); 
    const [oracleOpen, setOracleOpen] = useState(false);
    const [oracleMessages, setOracleMessages] = useState([]);
    const [oracleInput, setOracleInput] = useState('');
    const [oracleLoading, setOracleLoading] = useState(false);
    const [secretMode, setSecretMode] = useState(false);
    const [localModifier, setLocalModifier] = useState(0);
    const [localRollMode, setLocalRollMode] = useState('normal');
    const [showCondModalFor, setShowCondModalFor] = useState(null); // Nome do char

    const handleQuickRoll = (sides) => {
        if (triggerExternalRoll) {
            triggerExternalRoll(sides, secretMode, localModifier, localRollMode);
        } else {
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

    return el('div', { className: "min-h-screen bg-slate-950 text-slate-100 p-4 md:p-6 animate-fade-in" }, [
        // --- HEADER ---
        el('header', { key: 'master-header', className: "max-w-6xl mx-auto flex justify-between items-center mb-12 border-b border-slate-800 pb-8" }, [
            el('h1', { key: 'main-title', className: "text-2xl md:text-4xl font-black flex items-center gap-4 italic uppercase tracking-tighter" }, [
                el('span', { key: 'crown-icon', className: "text-purple-500" }, "👑"),
                el('span', { key: 'title-text' }, " Sala do Mestre")
            ]),
            el('div', { key: 'header-actions-container', className: "flex gap-3" }, [
                el('button', {
                    key: 'btn-settings',
                    onClick: () => setShowSettings(true),
                    className: "bg-slate-800 p-3 rounded-2xl text-xl hover:bg-slate-700 border border-slate-700 transition-all",
                    title: "Configurações"
                }, "⚙️"),
                el('button', {
                    key: 'btn-clear-turns',
                    onClick: () => advanceTurn(null),
                    className: "bg-slate-800 px-6 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-slate-700 hover:bg-amber-600 transition-all text-amber-500"
                }, "Limpar Turnos"),
                el('button', { 
                    key: 'btn-exit',
                    onClick: onBack, 
                    className: "bg-slate-800 px-6 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-slate-700 hover:bg-red-900/40 transition-all" 
                }, "Sair da Sala")
            ])
        ]),

        // --- GRID PRINCIPAL ---
        el('div', { key: 'master-main-grid', className: "max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 mb-24" }, [
            
            // COLUNA ESQUERDA (8 colunas)
            el('div', { key: 'master-left-col', className: "lg:col-span-8 space-y-12" }, [
                
                // MURAL E HANDOUTS
                el(OracleMural, { key: 'oracle-mural', sessionState, updateSessionState }),

                // GERENCIADOR DE MONSTROS
                el(MonsterManager, { key: 'monster-manager', sessionState, updateSessionState }),

                // JOGADORES
                el('div', { key: 'players-section', className: "space-y-6" }, [
                    el('h2', { key: 'players-title', className: "text-xs font-black uppercase tracking-[0.4em] text-slate-500" }, "🏰 Heróis no Reino"),
                    el('div', { key: 'players-grid', className: "grid grid-cols-1 md:grid-cols-2 gap-6" }, 
                        allCharacters.filter(c => c.name.toLowerCase() !== 'mestre').map(char => {
                            const maxPV = parseInt(char.sheetData?.recursos?.['PV Máximo']) || 10;
                            const perdido = parseInt(char.sheetData?.recursos?.['PV Perdido']) || 0;
                            const temp = parseInt(char.sheetData?.recursos?.['PV Temporário']) || 0;
                            const atualPV = (maxPV - perdido) + temp;
                            const percentPV = Math.min(((maxPV - perdido) / maxPV) * 100, 100);
                            return el('div', { key: char.name, className: "bg-slate-900 border border-slate-800 p-6 rounded-[2.5rem] shadow-xl hover:border-purple-500/30 transition-all group relative" }, [
                                el('div', { key: 'char-header', className: "flex justify-between items-start mb-6" }, [
                                    el('div', { key: 'char-info' }, [
                                        el('h3', { key: 'char-name', className: "text-lg font-black uppercase text-white tracking-tighter" }, char.name),
                                        el('p', { key: 'char-class', className: "text-[10px] text-purple-400 font-bold uppercase tracking-widest" }, char.sheetData?.info?.['Classe'] || char.Player || 'Aventureiro')
                                    ]),
                                    el('div', { key: 'char-actions', className: "flex gap-2" }, [
                                        el('button', {
                                            key: 'btn-turn',
                                            onClick: () => advanceTurn(char.name),
                                            className: `px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all border ${(turnState?.activeChar || "").toLowerCase() === char.name.toLowerCase() ? 'bg-amber-500 text-slate-950 border-amber-400' : 'bg-slate-800/50 text-slate-400 border-slate-700 hover:bg-slate-700'}`
                                        }, "Dar Vez"),
                                        el('button', { 
                                            key: 'btn-sheet',
                                            onClick: () => onViewSheet(char), 
                                            className: "p-2 bg-slate-800/50 rounded-xl hover:bg-purple-600 text-lg border border-slate-700 transition-all",
                                            title: "Ver Ficha"
                                        }, "📜"),
                                        el('button', { 
                                            key: 'btn-lock',
                                            onClick: () => updateEditPermission(char.name, !(char.sheetData?.allowEditing)), 
                                            className: `p-2 rounded-xl text-lg border transition-all ${char.sheetData?.allowEditing ? 'bg-emerald-900/40 border-emerald-500 text-emerald-400' : 'bg-amber-900/40 border-amber-500 text-amber-500'}`,
                                            title: char.sheetData?.allowEditing ? "Bloquear Edição" : "Permitir Edição"
                                        }, "🔒"),
                                        el('button', {
                                            key: 'btn-delete',
                                            onClick: () => {
                                                if (confirmDelete === char.name) {
                                                    deleteCharacter(char.name);
                                                    setConfirmDelete(null);
                                                } else {
                                                    setConfirmDelete(char.name);
                                                    setTimeout(() => setConfirmDelete(null), 3000);
                                                }
                                            },
                                            className: `p-2 rounded-xl transition-all border ${confirmDelete === char.name ? 'bg-red-600 border-red-400 text-white animate-pulse' : 'bg-red-900/20 border-red-900/40 text-red-600 opacity-0 group-hover:opacity-100 hover:bg-red-600 hover:text-white hover:border-red-400'}`
                                        }, confirmDelete === char.name ? "!" : "🗑️")
                                    ])
                                ]),

                                // HP Bar
                                el('div', { key: 'hp-section', className: "space-y-2 mb-6" }, [
                                    el('div', { key: 'hp-label-row', className: "flex justify-between text-[9px] font-black uppercase tracking-widest" }, [
                                        el('span', { key: 'hp-label', className: "text-slate-500" }, "Vitalidade"),
                                        el('span', { key: 'hp-value', className: percentPV < 30 ? 'text-red-500' : 'text-slate-300' }, `${atualPV} / ${maxPV}`)
                                    ]),
                                    el('div', { key: 'hp-bar-outer', className: "h-2 w-full bg-slate-950 rounded-full overflow-hidden flex border border-slate-800" }, [
                                        el('div', { key: 'hp-bar-fill', className: `h-full transition-all duration-700 ${percentPV < 30 ? 'bg-red-600' : 'bg-emerald-500'}`, style: { width: `${Math.max(0, percentPV)}%` } }),
                                        temp > 0 && el('div', { key: 'hp-bar-temp', className: "h-full bg-blue-500", style: { width: `${(temp/maxPV)*100}%` } })
                                    ])
                                ]),

                                // Atributos e Ouro (Restaurados)
                                el('div', { key: 'stats-grid', className: "grid grid-cols-2 gap-4 mb-6" }, [
                                    // Atributos
                                    el('div', { key: 'attrs', className: "grid grid-cols-3 gap-1" }, 
                                        ['FOR', 'DEX', 'CON', 'INT', 'SAB', 'CAR'].map(attr => (
                                            el('div', { key: attr, className: "bg-slate-950 p-1.5 rounded-lg border border-slate-800 text-center" }, [
                                                el('p', { key: `label-${attr}`, className: "text-[7px] text-slate-500 font-bold" }, attr),
                                                el('p', { key: `value-${attr}`, className: "text-[10px] font-black text-white" }, char.sheetData?.atributos?.[attr] || '10')
                                            ])
                                        ))
                                    ),
                                    // Ouro
                                    el('div', { key: 'gold', className: "bg-amber-900/5 border border-amber-500/10 p-2 rounded-2xl flex flex-col justify-center" }, [
                                        el('div', { key: 'gold-header', className: "flex justify-between text-[7px] font-black text-amber-600 uppercase mb-1 px-1" }, [
                                            el('span', { key: 'gold-label' }, "Tesouro"),
                                            el('span', { key: 'gold-icon' }, "💰")
                                        ]),
                                        el('div', { key: 'gold-values', className: "flex justify-between gap-1" }, [
                                            ['PO', 'PP', 'PC'].map(coin => (
                                                el('div', { key: coin, className: "text-center flex-grow" }, [
                                                    el('p', { key: 'val', className: "text-[9px] font-black text-white" }, char.sheetData?.recursos?.[coin] || '0'),
                                                    el('p', { key: 'lbl', className: "text-[6px] text-slate-500 font-bold" }, coin)
                                                ])
                                            ))
                                        ])
                                    ])
                                ]),

                                // Controle de Condições (Restaurado)
                                el('div', { key: 'condition-controls', className: "bg-slate-950/40 border border-slate-800 p-4 rounded-[2rem] mb-6" }, [
                                    el('h4', { key: 'cond-title', className: "text-[8px] font-black text-red-500 uppercase tracking-widest mb-3 flex items-center gap-2" }, [
                                        el('span', { key: 'icon' }, "💧"), 
                                        el('span', { key: 'text' }, "Condições Ativas")
                                    ]),
                                    el('div', { key: 'cond-header-row', className: "flex justify-between items-center mb-2" }, [
                                        el('button', {
                                            key: 'btn-add-custom',
                                            onClick: () => setShowCondModalFor(char.name),
                                            className: "bg-purple-900/40 hover:bg-purple-600 text-purple-400 hover:text-white px-3 py-1 rounded-lg border border-purple-500/30 text-[7px] font-black uppercase tracking-widest transition-all"
                                        }, "+ Personalizada")
                                    ]),
                                    el('div', { key: 'cond-buttons', className: "grid grid-cols-3 gap-1.5" }, 
                                        COMMON_EFFECTS.map(effect => {
                                            const activeConds = safeParseJSON(char.sheetData?.info?.['Condicoes']);
                                            const isActive = activeConds.some(c => c.name === effect.name);
                                            
                                            return el('button', {
                                                key: effect.name,
                                                onClick: () => {
                                                    let next;
                                                    if (isActive) {
                                                        next = activeConds.filter(c => c.name !== effect.name);
                                                    } else {
                                                        next = [...activeConds, { name: effect.name, icon: effect.icon, turns: effect.turns }];
                                                    }
                                                    // IMPORTANTE: Passamos o array bruto, o app.js cuidará do stringify para o Firebase
                                                    updateCharacterConditions(char.name, next);
                                                },
                                                className: `flex items-center gap-1.5 px-2 py-1.5 rounded-lg border text-[8px] font-bold transition-all ${isActive ? 'bg-red-900/40 border-red-500 text-red-400' : 'bg-slate-900 border-slate-800 text-slate-500 hover:border-slate-600'}`
                                            }, [
                                                el('span', { key: 'icon' }, effect.icon),
                                                el('span', { key: 'name' }, effect.name)
                                            ]);
                                        })
                                    )
                                ]),

                                // XP e Condições Atuais Badge
                                el('div', { key: 'footer-row', className: "flex items-center justify-between gap-4" }, [
                                    el('div', { key: 'conditions', className: "flex flex-wrap gap-1.5" }, 
                                        safeParseJSON(char.sheetData?.info?.['Condicoes']).map((cond, idx) => 
                                            el('span', { 
                                                key: `cond-${idx}`, 
                                                style: { borderColor: cond.color ? `${cond.color}55` : 'transparent' },
                                                className: "px-2 py-0.5 bg-slate-950 border rounded-lg text-[9px] font-bold text-amber-500 flex items-center gap-1 group/badge" 
                                            }, [
                                                el('span', { key: `icon-${idx}` }, cond.icon),
                                                el('span', { key: `name-${idx}` }, cond.name),
                                                el('button', {
                                                    key: `del-${idx}`,
                                                    onClick: () => {
                                                        const current = safeParseJSON(char.sheetData?.info?.['Condicoes']);
                                                        const next = current.filter((_, i) => i !== idx);
                                                        updateCharacterConditions(char.name, next);
                                                    },
                                                    className: "ml-1 text-slate-600 hover:text-red-500 transition-colors"
                                                }, "×")
                                            ])
                                        )
                                    ),
                                    el('div', { key: 'xp-box', className: "flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800" }, [
                                        el('div', { key: 'xp-info', className: "flex flex-col" }, [
                                            el('span', { key: 'label', className: "text-[6px] font-black text-slate-600 uppercase" }, "Experiência (XP)"),
                                            el('span', { key: 'value', className: "text-[10px] font-black text-amber-500" }, char.sheetData?.info?.['XP'] || 0),
                                        ]),
                                        el('span', { key: 'star', className: "text-slate-700 text-xs ml-auto" }, "⭐")
                                    ])
                                ])
                            ]);
                        })
                    )
                ])
            ]),

            // COLUNA DIREITA (4 colunas)
            el('div', { key: 'master-right-col', className: "lg:col-span-4 space-y-12" }, [
                
                // CONTROLES DE SESSÃO
                el(MasterControls, { key: 'master-controls', sessionState, updateSessionState }),

                // INICIATIVA
                el('section', { key: 'initiative-section', className: "bg-slate-900 border-2 border-amber-500/20 rounded-[3rem] overflow-hidden shadow-2xl" }, [
                    el('div', { key: 'ini-header', className: "bg-amber-900/10 p-6 border-b border-amber-500/20 flex justify-between items-center" }, [
                        el('h3', { key: 'ini-title', className: "text-xs font-black uppercase text-amber-500 tracking-widest" }, "⚔️ Ordem de Combate"),
                        el('button', { key: 'ini-clear', onClick: () => updateInitiative([]), className: "text-[9px] text-red-500 uppercase font-black" }, "Limpar")
                    ]),
                    el('div', { key: 'ini-form', className: "p-4 space-y-4" }, [
                        el('div', { key: 'ini-inputs', className: "flex gap-2" }, [
                            el('input', { key: 'ini-name-input', id: 'ini-name', placeholder: 'Nome', className: "flex-grow bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs outline-none" }),
                            el('input', { key: 'ini-val-input', id: 'ini-val', type: 'number', placeholder: 'Inic.', className: "w-16 bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-center outline-none" }),
                            el('button', {
                                key: 'ini-add',
                                onClick: () => {
                                    const n = document.getElementById('ini-name').value;
                                    const v = parseInt(document.getElementById('ini-val').value) || 0;
                                    if(n) {
                                        const newOrder = [...(turnState?.initiativeOrder || []), { id: Date.now(), name: n, value: v }].sort((a,b)=>b.value-a.value);
                                        updateInitiative(newOrder);
                                        document.getElementById('ini-name').value = '';
                                        document.getElementById('ini-val').value = '';
                                    }
                                },
                                className: "bg-amber-600 px-4 rounded-xl font-black text-slate-950"
                            }, "+")
                        ]),
                        el('div', { key: 'ini-list', className: "space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar" }, 
                            (turnState?.initiativeOrder || []).map((item, idx) => 
                                el('div', { key: item.id, className: `flex items-center justify-between p-4 rounded-2xl border transition-all ${turnState?.activeChar === item.name ? 'bg-amber-500/20 border-amber-500 shadow-lg' : 'bg-slate-950 border-slate-800'}` }, [
                                    el('div', { key: 'ini-item-info', className: "flex items-center gap-3" }, [
                                        el('span', { key: 'ini-item-idx', className: "text-[10px] font-black text-slate-600" }, idx + 1),
                                        el('span', { key: 'ini-item-name', className: "text-xs font-bold uppercase text-slate-200" }, item.name)
                                    ]),
                                    el('div', { key: 'ini-item-actions', className: "flex items-center gap-4" }, [
                                        el('span', { key: 'ini-item-value', className: "text-amber-500 font-black" }, item.value),
                                        el('button', { key: 'ini-item-delete', onClick: () => updateInitiative(turnState.initiativeOrder.filter(i=>i.id!==item.id)), className: "text-slate-700 hover:text-red-500" }, "×")
                                    ])
                                ])
                            )
                        )
                    ])
                ]),

                // HISTÓRICO
                el('section', { key: 'history-section', className: "bg-slate-900 border border-slate-800 rounded-[2.5rem] overflow-hidden" }, [
                    el('div', { key: 'history-title', className: "p-5 border-b border-slate-800 font-black uppercase text-[10px] text-slate-500 tracking-widest" }, "🎲 Últimas Rolagens"),
                    el('div', { key: 'history-content', className: "max-h-[300px] overflow-y-auto" }, 
                        rollHistory.length === 0 ? el('p', { key: 'no-history', className: "p-10 text-center text-slate-700 italic text-xs" }, "Aguardando ação...") :
                        el('table', { key: 'history-table', className: "w-full text-[11px]" }, [
                            el('tbody', { key: 'history-body' }, rollHistory.map(roll => 
                                el('tr', { key: roll.id, className: "border-b border-slate-800/30 hover:bg-white/5" }, [
                                    el('td', { key: 'player', className: "p-3 font-bold text-slate-400 pl-6" }, roll.playerName),
                                    el('td', { key: 'sides', className: "p-3 text-center text-slate-600" }, `d${roll.sides}`),
                                    el('td', { key: 'result', className: `p-3 text-right font-black pr-6 text-sm ${roll.result === roll.sides ? 'text-amber-500' : 'text-white'}` }, roll.result)
                                ])
                            ))
                        ])
                    )
                ])
            ])
        ]),

        // GRIMÓRIO
        el('div', { key: 'master-grimoire', className: "max-w-6xl mx-auto mb-32" }, 
            el(SoulGrimoire, { souls, updateSouls })
        ),

        // ORÁCULO WIDGET
        el('div', { 
            key: 'oracle-widget',
            className: `fixed bottom-8 right-8 z-[100] transition-all duration-500 ${oracleOpen ? 'w-[400px]' : 'w-16 h-16'}`
        }, [
            !oracleOpen ? el('button', {
                onClick: () => { AudioManager.play('page'); setOracleOpen(true); },
                className: "w-16 h-16 bg-gradient-to-br from-purple-600 to-indigo-700 rounded-3xl flex items-center justify-center text-3xl shadow-2xl hover:scale-110 active:scale-95 transition-all"
            }, "🔮") :
            el('div', { className: "bg-slate-900 border-2 border-purple-500/40 rounded-[2.5rem] shadow-[0_30px_60px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col h-[550px] animate-slide-up" }, [
                el('div', { className: "bg-purple-900/40 p-5 border-b border-purple-500/20 flex justify-between items-center" }, [
                    el('h3', { className: "text-purple-300 font-black uppercase text-xs tracking-widest" }, "🔮 Oráculo Arcano"),
                    el('button', { onClick: () => setOracleOpen(false), className: "text-purple-400 hover:text-white text-2xl" }, "×")
                ]),
                el('div', { className: "flex-grow overflow-y-auto p-5 space-y-4 custom-scrollbar" }, 
                    oracleMessages.map((m, i) => el('div', { 
                        key: i, 
                        className: `p-4 rounded-2xl text-xs leading-relaxed ${m.role === 'user' ? 'bg-purple-900/20 ml-8 border border-purple-500/20 text-purple-100' : 'bg-slate-950 mr-8 italic text-amber-100 border border-amber-900/30'}`
                    }, m.text))
                ),
                el('div', { className: "p-5 bg-slate-950 border-t border-purple-500/10" }, [
                    el('div', { className: "flex gap-3" }, [
                        el('input', {
                            value: oracleInput,
                            onChange: (e) => setOracleInput(e.target.value),
                            placeholder: "Sua dúvida, mestre...",
                            className: "flex-grow bg-slate-900 border border-purple-500/20 rounded-2xl px-5 py-4 text-xs text-white outline-none focus:border-purple-500/50",
                            onKeyPress: (e) => e.key === 'Enter' && handleOracleSearch()
                        }),
                        el('button', { 
                            onClick: handleOracleSearch, 
                            className: "bg-purple-600 w-14 h-14 rounded-2xl flex items-center justify-center hover:bg-purple-500 shadow-lg" 
                        }, oracleLoading ? el('span', { className: "animate-spin" }, "⌛") : "✨")
                    ])
                ])
            ])
        ]),

        // QUICK DICE BAR
        el('div', { key: 'quick-dice-bar', className: "fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] flex flex-col items-center gap-4" }, [
            el('div', { key: 'roll-modes', className: "flex gap-6 bg-slate-900/90 backdrop-blur-2xl border-2 border-purple-500/30 p-2.5 px-8 rounded-full shadow-2xl" }, [
                ['normal', 'normal', 'slate-600'],
                ['vantagem', 'vant', 'amber-500'],
                ['desvantagem', 'desv', 'red-500']
            ].map(([mode, label, color]) => el('button', {
                key: mode,
                onClick: () => setLocalRollMode(mode),
                className: `text-[9px] font-black uppercase tracking-[0.2em] transition-all ${localRollMode === mode ? `text-${color} scale-110` : 'text-slate-700 hover:text-slate-400'}`
            }, label))),
            el('div', { key: 'quick-roll-container', className: "bg-slate-900/90 backdrop-blur-2xl border-2 border-amber-500/40 p-5 rounded-[2.5rem] shadow-2xl flex items-center gap-4" }, [
                el('button', {
                    key: 'btn-secret',
                    onClick: () => setSecretMode(!secretMode),
                    className: `w-12 h-12 rounded-2xl flex items-center justify-center text-xl transition-all ${secretMode ? 'bg-red-600 shadow-lg shadow-red-900/50' : 'bg-slate-800 text-slate-500'}`
                }, secretMode ? "🕵️" : "👁️"),
                [4, 6, 8, 10, 12, 20, 100].map(s => el('button', {
                    key: s,
                    onClick: () => handleQuickRoll(s),
                    className: "w-12 h-12 bg-slate-800 hover:bg-amber-600 rounded-2xl font-black text-xs border border-slate-700 hover:border-amber-400 transition-all flex flex-col items-center justify-center group"
                }, [el('span', { key: 'd-label', className: "text-[8px] text-slate-600 group-hover:text-amber-200" }, "D"), s]))
            ])
        ]),

        // SETTINGS MODAL
        showSettings && el('div', { className: "fixed inset-0 bg-black/90 backdrop-blur-xl z-[300] flex items-center justify-center p-6" }, 
            el('div', { className: "bg-slate-900 border-2 border-amber-500/30 p-10 rounded-[3rem] max-w-md w-full shadow-3xl animate-zoom-in" }, [
                el('h3', { className: "text-amber-500 font-black uppercase mb-8 tracking-widest" }, "⚙️ Configurações"),
                el('div', { className: "space-y-8" }, [
                    el('div', null, [
                        el('label', { className: "text-[10px] text-slate-500 font-black uppercase mb-3 block" }, "Gemini API Key"),
                        el('input', {
                            type: 'password',
                            value: geminiApiKey,
                            onChange: (e) => setGeminiApiKey(e.target.value),
                            className: "w-full bg-slate-950 border border-slate-800 rounded-2xl p-5 text-sm text-white outline-none focus:border-amber-500/50"
                        })
                    ]),
                    el('button', {
                        onClick: () => setShowSettings(false),
                        className: "w-full bg-amber-600 text-slate-950 font-black py-5 rounded-2xl uppercase text-[10px] tracking-widest hover:bg-amber-500 transition-colors"
                    }, "Salvar e Fechar")
                ])
            ])
        ),

        // MODAL DE CONDIÇÕES
        showCondModalFor && el(ConditionModal, {
            key: 'custom-cond-modal',
            characterName: showCondModalFor,
            onClose: () => setShowCondModalFor(null),
            onSave: (newCond) => {
                const char = allCharacters.find(c => c.name === showCondModalFor);
                if (char) {
                    const current = safeParseJSON(char.sheetData?.info?.['Condicoes']);
                    updateCharacterConditions(showCondModalFor, [...current, newCond]);
                }
            }
        })
    ]);
}