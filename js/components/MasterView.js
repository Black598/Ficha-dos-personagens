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
    updateSessionState,
    setIsLibraryOpen,
    setIsBargainOpen,
    allPlayers,
    chatMessages,
    sendChatMessage,
    hasNewMessage,
    setHasNewMessage
}) {
    const [showSettings, setShowSettings] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(null); 
    const [oracleOpen, setOracleOpen] = useState(false);
    const [showChat, setShowChat] = useState(false);
    const [selectedChatPlayer, setSelectedChatPlayer] = useState(allPlayers[0] || 'all');
    const [chatInput, setChatInput] = useState('');
    const [oracleInput, setOracleInput] = useState('');
    const [oracleMessages, setOracleMessages] = useState([]);
    const [oracleLoading, setOracleLoading] = useState(false);
    const [secretMode, setSecretMode] = useState(false);
    const [localModifier, setLocalModifier] = useState(0);
    const [localRollMode, setLocalRollMode] = useState('normal');
    const [showCondModalFor, setShowCondModalFor] = useState(null);

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
                    key: 'btn-library',
                    onClick: () => setIsLibraryOpen(true),
                    className: "bg-slate-800 px-6 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-slate-700 hover:bg-amber-600 transition-all text-white"
                }, "📚 Biblioteca"),
                el('button', {
                    key: 'btn-bargain',
                    onClick: () => setIsBargainOpen(true),
                    className: "bg-slate-800 px-6 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-slate-700 hover:bg-red-600 transition-all text-white"
                }, "👺 Barganha"),
                el('button', {
                    key: 'btn-clear-turns',
                    onClick: () => advanceTurn(null),
                    className: "bg-slate-800 px-6 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-slate-700 hover:bg-amber-600 transition-all text-amber-500"
                }, "Limpar Turnos"),
                el('button', {
                    key: 'btn-chat',
                    onClick: () => { setHasNewMessage(false); setShowChat(true); },
                    className: `relative bg-slate-800 px-6 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-slate-700 hover:bg-purple-600 transition-all text-white ${hasNewMessage ? 'animate-pulse border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.4)]' : ''}`
                }, [
                    "💬 Mensagens",
                    hasNewMessage && el('span', { key: 'notif', className: "absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full" })
                ]),
                el('button', { 
                    key: 'btn-exit',
                    onClick: onBack, 
                    className: "bg-slate-800 px-6 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-slate-700 hover:bg-red-900/40 transition-all" 
                }, "Sair da Sala")
            ])
        ]),

        el('div', { key: 'master-main-grid', className: "max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 mb-24" }, [
            el('div', { key: 'master-left-col', className: "lg:col-span-8 space-y-12" }, [
                el(OracleMural, { key: 'oracle-mural', sessionState, updateSessionState, allPlayers }),
                el(MonsterManager, { key: 'monster-manager', sessionState, updateSessionState }),
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
                                        el('button', { key: 'btn-sheet', onClick: () => onViewSheet(char), className: "p-2 bg-slate-800/50 rounded-xl hover:bg-purple-600 text-lg border border-slate-700 transition-all" }, "📜"),
                                        el('button', { 
                                            key: 'btn-lock',
                                            onClick: () => updateEditPermission(char.name, !(char.sheetData?.allowEditing)), 
                                            className: `p-2 rounded-xl text-lg border transition-all ${char.sheetData?.allowEditing ? 'bg-emerald-900/40 border-emerald-500 text-emerald-400' : 'bg-amber-900/40 border-amber-500 text-amber-500'}`
                                        }, "🔒"),
                                        el('button', {
                                            key: 'btn-delete',
                                            onClick: () => {
                                                if (confirmDelete === char.name) { deleteCharacter(char.name); setConfirmDelete(null); }
                                                else { setConfirmDelete(char.name); setTimeout(() => setConfirmDelete(null), 3000); }
                                            },
                                            className: `p-2 rounded-xl transition-all border ${confirmDelete === char.name ? 'bg-red-600 border-red-400 text-white animate-pulse' : 'bg-red-900/20 border-red-900/40 text-red-600 opacity-0 group-hover:opacity-100 hover:bg-red-600 hover:text-white'}`
                                        }, confirmDelete === char.name ? "!" : "🗑️")
                                    ])
                                ]),
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
                                el('div', { key: 'stats-grid', className: "grid grid-cols-2 gap-4 mb-6" }, [
                                    el('div', { key: 'attrs', className: "grid grid-cols-3 gap-1" }, 
                                        ['FOR', 'DEX', 'CON', 'INT', 'SAB', 'CAR'].map(attr => (
                                            el('div', { key: attr, className: "bg-slate-950 p-1.5 rounded-lg border border-slate-800 text-center" }, [
                                                el('p', { key: `label-${attr}`, className: "text-[7px] text-slate-500 font-bold" }, attr),
                                                el('p', { key: `value-${attr}`, className: "text-[10px] font-black text-white" }, char.sheetData?.atributos?.[attr] || '10')
                                            ])
                                        ))
                                    ),
                                    el('div', { key: 'gold', className: "bg-amber-900/5 border border-amber-500/10 p-2 rounded-2xl flex flex-col justify-center" }, [
                                        el('div', { key: 'gold-header', className: "flex justify-between text-[7px] font-black text-amber-600 uppercase mb-1 px-1" }, [
                                            el('span', { key: 'gold-label' }, "Tesouro"), el('span', { key: 'gold-icon' }, "💰")
                                        ]),
                                        el('div', { key: 'gold-values', className: "flex justify-between gap-1" }, 
                                            ['PO', 'PP', 'PC'].map(coin => (
                                                el('div', { key: coin, className: "text-center flex-grow" }, [
                                                    el('p', { key: 'val', className: "text-[9px] font-black text-white" }, char.sheetData?.recursos?.[coin] || '0'),
                                                    el('p', { key: 'lbl', className: "text-[6px] text-slate-500 font-bold" }, coin)
                                                ])
                                            ))
                                        )
                                    ])
                                ]),
                                el('div', { key: 'footer-row', className: "flex items-center justify-between gap-4" }, [
                                    el('div', { key: 'conditions', className: "flex flex-wrap gap-1.5" }, 
                                        safeParseJSON(char.sheetData?.info?.['Condicoes']).map((cond, idx) => 
                                            el('span', { key: `cond-${idx}`, className: "px-2 py-0.5 bg-slate-950 border rounded-lg text-[9px] font-bold text-amber-500 flex items-center gap-1" }, [
                                                el('span', { key: `icon-${idx}` }, cond.icon), el('span', { key: `name-${idx}` }, cond.name)
                                            ])
                                        )
                                    ),
                                    el('div', { key: 'xp-box', className: "flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800" }, [
                                        el('div', { key: 'xp-info', className: "flex flex-col" }, [
                                            el('span', { key: 'label', className: "text-[6px] font-black text-slate-600 uppercase" }, "XP"),
                                            el('span', { key: 'value', className: "text-[10px] font-black text-amber-500" }, char.sheetData?.info?.['XP'] || 0),
                                        ]),
                                        el('span', { className: "text-slate-700 text-xs ml-auto" }, "⭐")
                                    ])
                                ])
                            ]);
                        })
                    )
                ])
            ]),
            el('div', { key: 'master-right-col', className: "lg:col-span-4 space-y-12" }, [
                el(MasterControls, { key: 'master-controls', sessionState, updateSessionState }),
                el('section', { key: 'initiative-section', className: "bg-slate-900 border-2 border-amber-500/20 rounded-[3rem] overflow-hidden shadow-2xl" }, [
                    el('div', { className: "bg-amber-900/10 p-6 border-b border-amber-500/20 flex justify-between items-center" }, [
                        el('h3', { className: "text-xs font-black uppercase text-amber-500 tracking-widest" }, "⚔️ Inic."),
                        el('button', { onClick: () => updateInitiative([]), className: "text-[9px] text-red-500 uppercase" }, "Limpar")
                    ]),
                    el('div', { className: "p-4 space-y-4" }, [
                        el('div', { className: "flex gap-2" }, [
                            el('input', { id: 'ini-name', placeholder: 'Nome', className: "flex-grow bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs" }),
                            el('input', { id: 'ini-val', type: 'number', placeholder: 'V', className: "w-12 bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-center" }),
                            el('button', {
                                onClick: () => {
                                    const n = document.getElementById('ini-name').value;
                                    const v = parseInt(document.getElementById('ini-val').value) || 0;
                                    if(n) { updateInitiative([...(turnState?.initiativeOrder || []), { id: Date.now(), name: n, value: v }].sort((a,b)=>b.value-a.value)); }
                                }, className: "bg-amber-600 px-4 rounded-xl font-black"
                            }, "+")
                        ]),
                        el('div', { className: "space-y-2 max-h-[250px] overflow-y-auto" }, 
                            (turnState?.initiativeOrder || []).map((item, idx) => 
                                el('div', { key: item.id, className: `flex items-center justify-between p-4 rounded-2xl border ${turnState?.activeChar === item.name ? 'border-amber-500 bg-amber-500/10' : 'border-slate-800 bg-slate-950'}` }, [
                                    el('span', { className: "text-xs font-bold uppercase" }, item.name),
                                    el('span', { className: "text-amber-500 font-black" }, item.value)
                                ])
                            )
                        )
                    ])
                ]),
                el('section', { key: 'history-section', className: "bg-slate-900 border border-slate-800 rounded-[2.5rem] overflow-hidden" }, [
                    el('div', { className: "p-5 border-b border-slate-800 text-[10px] text-slate-500 uppercase font-black" }, "🎲 Rolagens"),
                    el('div', { className: "max-h-[250px] overflow-y-auto" }, 
                        rollHistory.map(roll => el('div', { key: roll.id, className: "p-3 border-b border-slate-800/30 flex justify-between text-[11px]" }, [
                            el('span', { className: "font-bold text-slate-400" }, roll.playerName),
                            el('span', { className: "font-black text-white" }, roll.result)
                        ]))
                    )
                ])
            ])
        ]),

        el('div', { key: 'master-grimoire', className: "max-w-6xl mx-auto mb-32" }, el(SoulGrimoire, { souls, updateSouls })),

        el('div', { key: 'oracle-widget', className: `fixed bottom-8 right-8 z-[100] transition-all ${oracleOpen ? 'w-[350px]' : 'w-16 h-16'}` }, [
            !oracleOpen ? el('button', { onClick: () => setOracleOpen(true), className: "w-16 h-16 bg-gradient-to-br from-purple-600 to-indigo-700 rounded-3xl flex items-center justify-center text-3xl shadow-2xl" }, "🔮") :
            el('div', { className: "bg-slate-900 border-2 border-purple-500/40 rounded-[2.5rem] shadow-3xl overflow-hidden flex flex-col h-[500px]" }, [
                el('div', { className: "bg-purple-900/40 p-5 flex justify-between items-center" }, [
                    el('h3', { className: "text-purple-300 font-black uppercase text-[10px]" }, "🔮 Oráculo"),
                    el('button', { onClick: () => setOracleOpen(false), className: "text-purple-400 text-2xl" }, "×")
                ]),
                el('div', { className: "flex-grow overflow-y-auto p-5 space-y-4" }, oracleMessages.map((m, i) => el('div', { key: i, className: `p-3 rounded-xl text-[11px] ${m.role === 'user' ? 'bg-purple-900/20 ml-6' : 'bg-slate-950 mr-6 italic text-amber-100'}` }, m.text))),
                el('div', { className: "p-4 bg-slate-950" }, el('input', { value: oracleInput, onChange: (e) => setOracleInput(e.target.value), onKeyPress: (e) => e.key === 'Enter' && handleOracleSearch(), className: "w-full bg-slate-900 border border-purple-500/20 rounded-xl px-4 py-3 text-xs text-white outline-none" }))
            ])
        ]),

        el('div', { key: 'quick-dice-bar', className: "fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] flex flex-col items-center gap-4" }, [
            el('div', { className: "bg-slate-900 border-2 border-amber-500/40 p-4 rounded-[2rem] shadow-2xl flex items-center gap-3" }, [
                el('button', { onClick: () => setSecretMode(!secretMode), className: `w-10 h-10 rounded-xl flex items-center justify-center ${secretMode ? 'bg-red-600' : 'bg-slate-800'}` }, secretMode ? "🕵️" : "👁️"),
                [4, 6, 8, 10, 12, 20, 100].map(s => el('button', { key: s, onClick: () => handleQuickRoll(s), className: "w-10 h-10 bg-slate-800 rounded-xl font-black text-[10px] border border-slate-700" }, s))
            ])
        ]),

        showSettings && el('div', { className: "fixed inset-0 bg-black/90 z-[300] flex items-center justify-center p-6" }, 
            el('div', { className: "bg-slate-900 border-2 border-amber-500/30 p-8 rounded-[2.5rem] max-w-sm w-full" }, [
                el('h3', { className: "text-amber-500 font-black uppercase mb-6" }, "⚙️ Configs"),
                el('input', { type: 'password', value: geminiApiKey, onChange: (e) => setGeminiApiKey(e.target.value), className: "w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs text-white mb-6" }),
                el('button', { onClick: () => setShowSettings(false), className: "w-full bg-amber-600 text-slate-950 font-black py-4 rounded-xl uppercase text-[10px]" }, "Fechar")
            ])
        ),

        showChat && el('div', { key: 'chat-modal', className: "fixed inset-0 z-[500] bg-black/80 flex items-center justify-center p-4 animate-fade-in" }, [
            el('div', { className: "w-full max-w-4xl h-[38rem] bg-slate-900 border-2 border-purple-500/30 rounded-[3rem] shadow-3xl flex overflow-hidden" }, [
                // Sidebar de Jogadores
                el('div', { className: "w-64 bg-slate-950/50 border-r border-slate-800 flex flex-col" }, [
                    el('div', { className: "p-6 border-b border-slate-800" }, [
                        el('h3', { className: "text-[10px] font-black uppercase tracking-widest text-slate-500" }, "Conversas")
                    ]),
                    el('div', { className: "flex-1 overflow-y-auto p-2 space-y-1" }, [
                        // Opção de TODOS (se quiser global futuramente)
                        el('button', {
                            onClick: () => setSelectedChatPlayer('all'),
                            className: `w-full p-4 rounded-2xl text-left transition-all flex items-center gap-3 ${selectedChatPlayer === 'all' ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800'}`
                        }, [
                            el('span', { className: "text-lg" }, "🌍"),
                            el('div', {}, [
                                el('p', { className: "text-xs font-black uppercase" }, "Todos"),
                                el('p', { className: "text-[8px] opacity-70" }, "Mensagem Geral")
                            ])
                        ]),
                        // Lista de Jogadores
                        ...allPlayers.map(player => {
                            const lastMsg = chatMessages.filter(m => m.sender === player).pop();
                            return el('button', {
                                key: player,
                                onClick: () => { setSelectedChatPlayer(player); setHasNewMessage(false); },
                                className: `w-full p-4 rounded-2xl text-left transition-all flex items-center gap-3 ${selectedChatPlayer === player ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800'}`
                            }, [
                                el('span', { className: "text-lg" }, "👤"),
                                el('div', { className: "flex-1 min-w-0" }, [
                                    el('p', { className: "text-xs font-black uppercase truncate" }, player),
                                    lastMsg && el('p', { className: "text-[8px] opacity-70 truncate" }, lastMsg.text)
                                ])
                            ]);
                        })
                    ])
                ]),

                // Janela de Mensagens
                el('div', { className: "flex-1 flex flex-col bg-slate-900" }, [
                    el('div', { className: "p-6 bg-gradient-to-r from-purple-700 to-indigo-800 flex justify-between items-center text-white" }, [
                        el('div', {}, [
                            el('h3', { className: "font-black uppercase tracking-widest text-sm" }, `Chat: ${selectedChatPlayer === 'all' ? 'TODOS' : selectedChatPlayer}`),
                            el('p', { className: "text-[8px] font-bold text-purple-200 uppercase" }, "🔒 Canal de Comunicação Seguro")
                        ]),
                        el('button', { onClick: () => setShowChat(false), className: "w-10 h-10 rounded-full bg-black/20 hover:bg-red-500 transition-colors flex items-center justify-center" }, "×")
                    ]),
                    el('div', { className: "flex-1 overflow-y-auto p-6 space-y-4 bg-slate-950/20 flex flex-col custom-scrollbar" }, 
                        chatMessages
                            .filter(m => (selectedChatPlayer === 'all') || (m.sender === selectedChatPlayer || m.recipient === selectedChatPlayer))
                            .map(m => el('div', { 
                                key: m.id, 
                                className: `flex flex-col ${m.sender === 'Mestre' ? 'items-end' : 'items-start'}` 
                            }, [
                                el('div', { 
                                    className: `max-w-[85%] p-4 rounded-3xl text-xs ${m.sender === 'Mestre' ? 'bg-purple-600 text-white rounded-tr-none shadow-lg shadow-purple-900/20' : 'bg-slate-800 text-slate-200 border-l-4 border-purple-500 rounded-tl-none'}` 
                                }, m.text),
                                el('span', { className: "text-[8px] text-slate-600 uppercase mt-2 font-black px-2" }, m.sender)
                            ]))
                    ),
                    el('div', { className: "p-6 bg-slate-950 border-t border-slate-800 flex gap-3" }, [
                        el('input', { 
                            value: chatInput, 
                            onChange: e => setChatInput(e.target.value), 
                            onKeyDown: e => e.key === 'Enter' && chatInput.trim() && (sendChatMessage(chatInput, 'Mestre', selectedChatPlayer === 'all' ? null : selectedChatPlayer), setChatInput('')), 
                            placeholder: selectedChatPlayer === 'all' ? "Enviar para todos..." : `Responder para ${selectedChatPlayer}...`, 
                            className: "flex-1 bg-slate-900 border border-slate-800 rounded-2xl px-6 py-4 text-xs text-white outline-none focus:border-purple-500/50 transition-all shadow-inner" 
                        }),
                        el('button', { 
                            onClick: () => { if (chatInput.trim()) { sendChatMessage(chatInput, 'Mestre', selectedChatPlayer === 'all' ? null : selectedChatPlayer); setChatInput(''); } }, 
                            className: "w-16 h-16 bg-purple-600 hover:bg-purple-500 text-white rounded-2xl flex items-center justify-center transition-all shadow-xl text-xl active:scale-90" 
                        }, "➔")
                    ])
                ])
            ])
        ])
    ]);
}