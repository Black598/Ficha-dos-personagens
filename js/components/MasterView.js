import { safeParseJSON, parseImageUrl } from '../utils.js';
import { SoulGrimoire } from './SoulGrimoire.js';
import { OracleMural } from './OracleMural.js';
import { MasterControls } from './MasterControls.js';
import { MonsterManager } from './MonsterManager.js';
import { ConditionModal } from './ConditionModal.js';
import { MasterTutorialPopup } from './MasterTutorialPopup.js';
import { MasterVault } from './MasterVault.js';
import { LootManager } from './LootManager.js';

const { useState, useEffect } = React;
const el = React.createElement;

export function MasterView({ 
    allCharacters, 
    rollHistory, 
    onBack, 
    onViewSheet, 
    updateCharacterXP, 
    updateCharacterConditions,
    updateCharacterHP,
    advanceTurn,
    turnState,
    geminiApiKey,
    setGeminiApiKey,
    askGemini,
    saveCharacter,
    sessionState,
    updateSessionState,
    updateSouls,
    updateEditPermission,
    deleteCharacter,
    updateInitiative,
    souls,
    rollDice,
    triggerExternalRoll,
    setIsLibraryOpen,
    setIsBargainOpen,
    allPlayers,
    chatMessages,
    sendChatMessage,
    hasNewMessage,
    setHasNewMessage,
    clearRollHistory,
    generateLoot,
    approveLoot,
    clearLoot,
    generateNPC,
    currentAppId,
    deleteCampaign
}) {
    const [showSettings, setShowSettings] = useState(false);
    const [showTutorial, setShowTutorial] = useState(() => localStorage.getItem('has_seen_master_tutorial') !== 'true');
    const [showVault, setShowVault] = useState(false);
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
    const [selectedChars, setSelectedChars] = useState([]);
    const [draggedIndex, setDraggedIndex] = useState(null);

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
                    key: 'btn-vault',
                    onClick: () => setShowVault(true),
                    className: "bg-slate-800 p-3 rounded-2xl text-xl hover:bg-amber-600 border border-slate-700 transition-all",
                    title: "O Cofre do Mestre"
                }, "🔒"),
                el('button', {
                    key: 'btn-tutorial',
                    onClick: () => setShowTutorial(true),
                    className: "bg-slate-800 p-3 rounded-2xl text-xl hover:bg-purple-600 border border-slate-700 transition-all",
                    title: "Tutorial do Mestre"
                }, "❔"),
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
                    key: 'btn-chat',
                    onClick: () => { setHasNewMessage(false); setShowChat(true); },
                    className: `relative bg-slate-800 px-6 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-slate-700 hover:bg-purple-600 transition-all text-white ${hasNewMessage ? 'animate-pulse border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.4)]' : ''}`
                }, [
                    "💬 Mensagens",
                    hasNewMessage && el('span', { key: 'notif', className: "absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full" })
                ]),
                el('button', {
                    key: 'btn-npc',
                    onClick: async () => {
                        const theme = prompt("Tema do NPC (ex: Taverneiro suspeito, Guarda corrupto):", "Cidadão comum");
                        if (!theme) return;
                        try {
                            const npc = await generateNPC(theme);
                            const text = `👤 **NPC GERADO**\n**Nome:** ${npc.name} (${npc.race} ${npc.class})\n**Aparência:** ${npc.personality}\n**Segredo:** ${npc.secret}\n**Stats:** HP:${npc.stats?.HP} CA:${npc.stats?.CA}`;
                            sendChatMessage(text, 'Mestre');
                            alert(`NPC Gerado: ${npc.name}\nDados enviados para o Chat!`);
                        } catch (e) { alert("Erro ao gerar NPC: " + e.message); }
                    },
                    className: "bg-slate-800 px-6 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-slate-700 hover:bg-purple-600 transition-all text-white"
                }, "👤 Gerar NPC"),
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
                el(MonsterManager, { key: 'monster-manager', sessionState, updateSessionState, geminiApiKey }),
                el(LootManager, { 
                    key: 'loot-manager', 
                    sessionState, 
                    generateLoot, 
                    approveLoot, 
                    clearLoot, 
                    askGemini,
                    allPlayers,
                    updateSessionState
                }),
                (() => {
                    const pendingDeletions = allCharacters.filter(c => c.pendingDeletion === true);
                    if (pendingDeletions.length === 0) return null;
                    return el('div', { key: 'pending-deletions-section', className: "space-y-6" }, [
                        el('div', { className: "flex justify-between items-end border-b border-red-900/50 pb-4" }, [
                            el('h2', { className: "text-xs font-black uppercase tracking-[0.4em] text-red-500" }, "🗑️ Solicitações de Exclusão"),
                        ]),
                        el('div', { className: "grid grid-cols-1 md:grid-cols-2 gap-6" }, 
                            pendingDeletions.map(char => el('div', { key: char.name, className: "bg-red-950/20 border border-red-900/50 p-6 rounded-[2.5rem] shadow-xl flex items-center justify-between" }, [
                                el('div', { className: "flex items-center gap-4" }, [
                                    el('div', { className: "w-12 h-12 rounded-xl bg-slate-950 border border-red-900 flex items-center justify-center overflow-hidden shrink-0 shadow-lg opacity-50" }, [
                                        char.imageUrl ? el('img', { src: char.imageUrl, className: "w-full h-full object-cover grayscale" }) : el('span', { className: "text-xl grayscale" }, "👤")
                                    ]),
                                    el('div', null, [
                                        el('h3', { className: "text-lg font-black uppercase text-red-400 tracking-tighter" }, char.name),
                                        el('p', { className: "text-[10px] text-red-500/70 font-bold uppercase tracking-widest" }, "Solicitou Exclusão")
                                    ])
                                ]),
                                el('div', { className: "flex gap-2" }, [
                                    el('button', {
                                        onClick: () => saveCharacter(char.name, { ...char, pendingDeletion: false }),
                                        className: "p-2 bg-emerald-900/20 hover:bg-emerald-600 text-emerald-500 hover:text-white rounded-xl border border-emerald-900/50 transition-all text-sm",
                                        title: "Restaurar Ficha"
                                    }, "↩️"),
                                    el('button', {
                                        onClick: () => deleteCharacter(char.name),
                                        className: "p-2 bg-red-900/20 hover:bg-red-600 text-red-500 hover:text-white rounded-xl border border-red-900/50 transition-all text-sm",
                                        title: "Confirmar Exclusão"
                                    }, "☠️")
                                ])
                            ]))
                        )
                    ]);
                })(),
                el('div', { key: 'players-section', className: "space-y-6" }, [
                    el('div', { key: 'players-header', className: "flex justify-between items-end border-b border-slate-800 pb-4" }, [
                        el('h2', { key: 'players-title', className: "text-xs font-black uppercase tracking-[0.4em] text-slate-500" }, "🏰 Heróis no Reino"),
                        el('div', { key: 'players-actions', className: "flex gap-2" }, [
                            el('button', {
                                key: 'btn-short-rest',
                                onClick: () => {
                                    const amount = parseInt(prompt("Quantos PV cada jogador vai recuperar no Descanso Curto?"));
                                    if (!isNaN(amount) && amount > 0) {
                                        allCharacters.filter(c => c.name.toLowerCase() !== 'mestre').forEach(c => {
                                            updateCharacterHP(c.name, amount);
                                        });
                                    }
                                },
                                className: "bg-slate-900 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border border-emerald-900 hover:bg-emerald-600 transition-all text-emerald-500 hover:text-white"
                            }, "Descanso Curto"),
                            el('button', {
                                key: 'btn-long-rest',
                                onClick: () => {
                                    if(confirm("Curar todos os PVs e remover todas as condições de todos os jogadores?")) {
                                        allCharacters.filter(c => c.name.toLowerCase() !== 'mestre').forEach(c => {
                                            updateCharacterHP(c.name, 9999);
                                            updateCharacterConditions(c.name, []);
                                        });
                                    }
                                },
                                className: "bg-slate-900 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border border-emerald-900 hover:bg-emerald-600 transition-all text-emerald-500 hover:text-white"
                            }, "Descanso Longo"),
                            el('button', {
                                key: 'btn-clear-turns',
                                onClick: () => advanceTurn(null),
                                className: "bg-slate-900 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border border-amber-900 hover:bg-amber-600 transition-all text-amber-500 hover:text-slate-900 ml-4"
                            }, "Limpar Turnos")
                        ])
                    ]),
                    el('div', { key: 'players-grid', className: "grid grid-cols-1 md:grid-cols-2 gap-6" }, 
                        allCharacters.filter(c => c.name.toLowerCase() !== 'mestre' && !c.pendingDeletion).map(char => {
                            const maxPV = parseInt(char.sheetData?.recursos?.['PV Máximo']) || 10;
                            const perdido = parseInt(char.sheetData?.recursos?.['PV Perdido']) || 0;
                            const temp = parseInt(char.sheetData?.recursos?.['PV Temporário']) || 0;
                            const atualPV = (maxPV - perdido) + temp;
                            const percentPV = Math.min(((maxPV - perdido) / maxPV) * 100, 100);
                            return el('div', { key: char.name, className: "bg-slate-900 border border-slate-800 p-6 rounded-[2.5rem] shadow-xl hover:border-purple-500/30 transition-all group relative" }, [
                                el('div', { key: 'char-header-container', className: "space-y-4 mb-6" }, [
                                    el('div', { key: 'char-info-row', className: "flex items-center gap-4" }, [
                                        el('div', {
                                            key: 'avatar-container',
                                            onClick: () => {
                                                const url = prompt(`URL da Imagem/Avatar para ${char.name}:`, char.imageUrl || '');
                                                if (url !== null) {
                                                    const finalUrl = parseImageUrl(url);
                                                    saveCharacter(char.name, { ...char, imageUrl: finalUrl });
                                                }
                                            },
                                            className: "w-16 h-16 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center overflow-hidden cursor-pointer hover:border-purple-500 transition-all shrink-0 group/avatar relative shadow-lg"
                                        }, [
                                            char.imageUrl ? 
                                                el('img', { src: char.imageUrl, className: "w-full h-full object-cover" }) : 
                                                el('span', { className: "text-2xl" }, "👤"),
                                            el('div', { className: "absolute inset-0 bg-purple-600/20 opacity-0 group-hover/avatar:opacity-100 flex items-center justify-center transition-opacity" }, 
                                                el('span', { className: "text-[8px] font-black text-white uppercase" }, "Mudar")
                                            )
                                        ]),
                                        // CHECKBOX PARA SELEÇÃO EM MASSA
                                        el('button', {
                                            key: 'bulk-select',
                                            onClick: (e) => {
                                                e.stopPropagation();
                                                setSelectedChars(prev => 
                                                    prev.includes(char.name) ? prev.filter(n => n !== char.name) : [...prev, char.name]
                                                );
                                            },
                                            className: `absolute -top-2 -left-2 w-7 h-7 rounded-xl border-2 z-10 flex items-center justify-center transition-all ${selectedChars.includes(char.name) ? 'bg-amber-500 border-amber-400 scale-110 shadow-[0_0_15px_rgba(245,158,11,0.5)]' : 'bg-slate-950 border-slate-700 hover:border-slate-500'}`
                                        }, selectedChars.includes(char.name) ? el('span', { className: "text-slate-900 font-bold" }, "✓") : null),
                                        el('div', { key: 'name-stack', className: "min-w-0 flex-1" }, [
                                            el('h3', { key: 'char-name', className: "text-xl font-black uppercase text-white tracking-tighter leading-tight" }, char.name),
                                            el('div', { className: "flex items-center gap-2 mt-1 flex-wrap" }, [
                                                el('p', { key: 'char-class', className: "text-[11px] text-purple-400 font-bold uppercase tracking-widest" }, char.sheetData?.info?.['Classe'] || char.Player || 'Aventureiro'),
                                                el('span', { key: 'passive-perc', className: "text-[10px] font-bold text-slate-400 bg-slate-950 px-2 py-1 rounded-lg flex items-center gap-1.5 border border-slate-800 whitespace-nowrap shadow-inner", title: "Percepção Passiva" }, [
                                                    "👁️", 
                                                    10 + parseInt(char.sheetData?.pericias?.['Percepção']?.val || char.sheetData?.modificadores?.['SAB'] || 0)
                                                ])
                                            ])
                                        ])
                                    ]),
                                    el('div', { key: 'char-actions-row', className: "flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/50" }, [
                                        el('button', {
                                            key: 'btn-turn',
                                            onClick: () => advanceTurn(char.name),
                                            className: `px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all border shadow-md ${(turnState?.activeChar || "").toLowerCase() === char.name.toLowerCase() ? 'bg-amber-500 text-slate-950 border-amber-400 scale-105' : 'bg-slate-800/50 text-slate-400 border-slate-700 hover:bg-slate-700'}`
                                        }, "Dar Vez"),
                                        el('button', { key: 'btn-sheet', onClick: () => onViewSheet(char), className: "p-2 bg-slate-800/50 rounded-xl hover:bg-purple-600 text-base border border-slate-700 transition-all shadow-md", title: "Abrir Ficha" }, "📜"),
                                        el('button', { 
                                            key: 'btn-lock',
                                            onClick: () => updateEditPermission(char.name, !(char.sheetData?.allowEditing)), 
                                            className: `p-2 rounded-xl text-base border transition-all shadow-md ${char.sheetData?.allowEditing ? 'bg-emerald-900/40 border-emerald-500 text-emerald-400' : 'bg-amber-900/40 border-amber-500 text-amber-500'}`
                                        }, "🔒"),
                                        el('button', {
                                            key: 'btn-secret-roll',
                                            onClick: () => {
                                                const stat = prompt(`Qual perícia ou atributo testar ocultamente para ${char.name}? (Ex: Percepção)`);
                                                if (stat) {
                                                    let bonus = 0;
                                                    if (char.sheetData?.pericias?.[stat]) bonus = parseInt(char.sheetData.pericias[stat].val) || 0;
                                                    else if (char.sheetData?.modificadores?.[stat]) bonus = parseInt(char.sheetData.modificadores[stat]) || 0;
                                                    const roll = Math.floor(Math.random() * 20) + 1;
                                                    const total = roll + bonus;
                                                    firebase.firestore().collection('artifacts').doc(localStorage.getItem('current_rpg_app_id') || 'rpg-mega-trees-v7')
                                                        .collection('public').doc('data').collection('rolls')
                                                        .add({
                                                            charName: char.name, type: `Teste Oculto (${stat})`, formula: `1d20 + ${bonus}`,
                                                            result: total, details: `[${roll}] + ${bonus}`, secret: true,
                                                            timestamp: firebase.firestore.FieldValue.serverTimestamp()
                                                        });
                                                }
                                            },
                                            className: "p-2 bg-slate-800/50 rounded-xl hover:bg-amber-600 text-base border border-slate-700 transition-all text-slate-400 hover:text-white shadow-md",
                                            title: "Mestre rola ocultamente por este jogador"
                                        }, "🎲"),
                                        el('button', {
                                            key: 'btn-ask-roll',
                                            onClick: () => {
                                                const stat = prompt(`Qual teste você quer obrigar ${char.name} a rolar ocultamente?`);
                                                if (stat) {
                                                    updateSessionState({
                                                        rollRequests: {
                                                            ...(sessionState.rollRequests || {}),
                                                            [char.name.toLowerCase()]: { skill: stat, id: Date.now() }
                                                        }
                                                    });
                                                }
                                            },
                                            className: "p-2 bg-slate-800/50 rounded-xl hover:bg-red-600 text-base border border-slate-700 transition-all text-slate-400 hover:text-white shadow-md",
                                            title: "Solicitar Rolagem Oculta"
                                        }, "🔔"),
                                        el('button', {
                                            key: 'btn-delete',
                                            onClick: () => {
                                                if(confirm(`Tem certeza que deseja excluir ${char.name} permanentemente?`)) {
                                                    deleteCharacter(char.name);
                                                }
                                            },
                                            className: "p-2 bg-slate-800/50 rounded-xl hover:bg-red-900 text-base border border-slate-700 transition-all text-slate-500 hover:text-white shadow-md opacity-0 group-hover:opacity-100",
                                            title: "Excluir Personagem"
                                        }, "🗑️")
                                    ])
                                ]),
                                el('div', { key: 'hp-section', className: "space-y-2 mb-6" }, [
                                    el('div', { key: 'hp-label-row', className: "flex justify-between items-center text-[9px] font-black uppercase tracking-widest" }, [
                                        el('span', { key: 'hp-label', className: "text-slate-500" }, "Vitalidade"),
                                        el('div', { key: 'hp-controls', className: "flex items-center gap-2" }, [
                                            el('input', {
                                                key: `hp-input-${char.name}`,
                                                className: "bg-slate-950 border border-slate-700 rounded px-1 py-0.5 w-12 text-center text-white focus:border-red-500 outline-none text-[8px]",
                                                placeholder: "- Dano / + Cura",
                                                onKeyDown: (e) => {
                                                    if (e.key === 'Enter') {
                                                        const val = parseInt(e.target.value);
                                                        if (!isNaN(val)) updateCharacterHP(char.name, val);
                                                        e.target.value = '';
                                                    }
                                                }
                                            }),
                                            el('span', { key: 'hp-value', className: percentPV < 30 ? 'text-red-500 text-xs' : 'text-slate-300 text-xs' }, `${atualPV} / ${maxPV}`)
                                        ])
                                    ]),
                                    el('div', { key: 'hp-bar-outer', className: "h-2 w-full bg-slate-950 rounded-full overflow-hidden flex border border-slate-800" }, [
                                        el('div', { key: 'hp-bar-fill', className: `h-full transition-all duration-700 ${percentPV < 30 ? 'bg-red-600' : 'bg-emerald-500'}`, style: { width: `${Math.max(0, percentPV)}%` } }),
                                        temp > 0 && el('div', { key: 'hp-bar-temp', className: "h-full bg-blue-500", style: { width: `${(temp/maxPV)*100}%` } })
                                    ])
                                ]),
                                el('div', { key: 'stats-grid', className: "grid grid-cols-2 gap-4 mb-4" }, [
                                    el('div', { key: 'attrs', className: "grid grid-cols-3 gap-1" }, 
                                        ['FOR', 'DES', 'CON', 'INT', 'SAB', 'CAR'].map(attr => {
                                            const mod = char.sheetData?.modificadores?.[attr] || '0';
                                            const modNum = parseInt(mod);
                                            const modText = modNum >= 0 ? `+${modNum}` : `${modNum}`;
                                            return el('div', { key: attr, className: "bg-slate-950 p-1 rounded-lg border border-slate-800 text-center flex flex-col items-center justify-center" }, [
                                                el('p', { key: `label-${attr}`, className: "text-[6px] text-slate-500 font-bold" }, attr),
                                                el('p', { key: `value-${attr}`, className: "text-[10px] font-black text-white leading-none mt-0.5" }, char.sheetData?.atributos?.[attr] || '10'),
                                                el('p', { key: `mod-${attr}`, className: `text-[7px] font-black mt-0.5 ${modNum >= 0 ? 'text-emerald-400' : 'text-red-400'}` }, modText)
                                            ]);
                                        })
                                    ),
                                    el('div', { key: 'gold', className: "bg-amber-900/5 border border-amber-500/10 p-2 rounded-2xl flex flex-col justify-center" }, [
                                        el('div', { key: 'gold-header', className: "flex justify-between text-[7px] font-black text-amber-600 uppercase mb-1 px-1" }, [
                                            el('span', { key: 'gold-label' }, "Tesouro"), el('span', { key: 'gold-icon' }, "💰")
                                        ]),
                                        el('div', { key: 'gold-values', className: "flex justify-between gap-1" }, 
                                            ['PO', 'PP', 'PC'].map(coin => (
                                                el('div', { key: coin, className: "text-center flex-grow" }, [
                                                    el('p', { key: 'val', className: "text-[9px] font-black text-white" }, char.sheetData?.outros?.[coin] || '0'),
                                                    el('p', { key: 'lbl', className: "text-[6px] text-slate-500 font-bold" }, coin)
                                                ])
                                            ))
                                        )
                                    ])
                                ]),
                                (() => {
                                    const profs = Object.keys(char.sheetData?.pericias || {}).filter(k => char.sheetData.pericias[k].prof);
                                    if (profs.length === 0) return null;
                                    return el('div', { key: 'profs', className: "mb-6" }, [
                                        el('p', { className: "text-[7px] font-black text-slate-500 uppercase tracking-widest mb-2" }, "Proficiências"),
                                        el('div', { className: "flex flex-wrap gap-1" }, 
                                            profs.map(p => el('span', { 
                                                key: p, 
                                                className: "px-1.5 py-0.5 bg-purple-900/20 border border-purple-500/30 text-purple-300 text-[7px] rounded uppercase font-bold" 
                                            }, `${p} (${char.sheetData.pericias[p].val})`))
                                        )
                                    ]);
                                })(),
                                el('div', { key: 'footer-row', className: "flex items-center justify-between gap-4" }, [
                                    el('div', { key: 'conditions-container', className: "flex items-center gap-2" }, [
                                        el('div', { key: 'conditions', className: "flex flex-wrap gap-1.5" }, 
                                            safeParseJSON(char.sheetData?.info?.['Condicoes']).map((cond, idx) => 
                                                el('button', { 
                                                    key: `cond-${idx}`, 
                                                    onClick: () => {
                                                        const currentConds = safeParseJSON(char.sheetData?.info?.['Condicoes']);
                                                        const updated = currentConds.filter((_, i) => i !== idx);
                                                        updateCharacterConditions(char.name, updated);
                                                    },
                                                    className: "px-2 py-0.5 bg-slate-950 border border-slate-800 hover:border-red-500/50 hover:text-red-400 rounded-lg text-[9px] font-bold text-amber-500 flex items-center gap-1 transition-all group/cond",
                                                    title: "Clique para remover"
                                                }, [
                                                    el('span', { key: `icon-${idx}` }, cond.icon), 
                                                    el('span', { key: `name-${idx}` }, cond.name),
                                                    el('span', { className: "opacity-0 group-hover/cond:opacity-100 text-red-500 ml-1" }, "×")
                                                ])
                                            )
                                        ),
                                        el('button', {
                                            key: 'btn-add-cond',
                                            onClick: () => setShowCondModalFor(char.name),
                                            className: "w-6 h-6 bg-slate-800 hover:bg-purple-600 rounded-lg flex items-center justify-center text-[10px] border border-slate-700 transition-all shadow-lg",
                                            title: "Adicionar Condição"
                                        }, "✨")
                                    ]),
                                    el('div', { 
                                        key: 'xp-box', 
                                        title: "Clique para editar o XP. Digite +100 para somar ou -50 para subtrair.", 
                                        className: "flex items-center gap-1 bg-slate-950 px-2 py-1.5 rounded-xl border border-slate-800 focus-within:border-amber-500/50 transition-colors cursor-text hover:border-amber-500/30" 
                                    }, [
                                        el('div', { key: 'xp-info', className: "flex flex-col" }, [
                                            el('span', { key: 'label', className: "text-[6px] font-black text-slate-600 uppercase" }, "XP (Editar)"),
                                            el('input', {
                                                key: `xp-${char.name}-${char.sheetData?.info?.['XP'] || 0}`,
                                                className: "block bg-transparent text-[10px] font-black text-amber-500 w-12 outline-none p-0 focus:ring-0",
                                                defaultValue: char.sheetData?.info?.['XP'] || 0,
                                                onBlur: (e) => {
                                                    const currentXP = parseInt(char.sheetData?.info?.['XP']) || 0;
                                                    let inputVal = e.target.value.trim();
                                                    let finalXP = currentXP;
                                                    if (inputVal.startsWith('+')) {
                                                        finalXP = currentXP + (parseInt(inputVal.substring(1)) || 0);
                                                    } else if (inputVal.startsWith('-')) {
                                                        finalXP = Math.max(0, currentXP - (parseInt(inputVal.substring(1)) || 0));
                                                    } else {
                                                        finalXP = parseInt(inputVal) || 0;
                                                    }
                                                    if (finalXP !== currentXP) {
                                                        updateCharacterXP(char.name, finalXP);
                                                    } else {
                                                        e.target.value = currentXP;
                                                    }
                                                },
                                                onKeyDown: (e) => e.key === 'Enter' && e.target.blur()
                                            }),
                                        ]),
                                        el('span', { className: "text-slate-700 text-[10px] ml-auto pb-1" }, "⭐")
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
                            el('input', { 
                                id: 'ini-name', 
                                placeholder: 'Nome ou NPC', 
                                className: "flex-grow bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white outline-none focus:border-amber-500/50" 
                            }),
                            el('input', { 
                                id: 'ini-val', 
                                type: 'number', 
                                placeholder: '0', 
                                className: "w-16 bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-center text-amber-500 font-bold outline-none focus:border-amber-500/50" 
                            }),
                            el('button', {
                                onClick: () => {
                                    const n = document.getElementById('ini-name').value.trim();
                                    const v = parseInt(document.getElementById('ini-val').value) || 0;
                                    if(n) { 
                                        updateInitiative([...(turnState?.initiativeOrder || []), { id: Date.now(), name: n, value: v }].sort((a,b)=>b.value-a.value)); 
                                        document.getElementById('ini-name').value = '';
                                        document.getElementById('ini-val').value = '';
                                    }
                                }, 
                                className: "bg-amber-600 hover:bg-amber-500 px-4 rounded-xl font-black text-white transition-all shadow-lg"
                            }, "+")
                        ]),
                        el('button', {
                            onClick: () => {
                                const players = allCharacters
                                    .filter(c => c.name.toLowerCase() !== 'mestre' && !c.pendingDeletion)
                                    .map(c => ({ id: Date.now() + Math.random(), name: c.name, value: 0 }));
                                
                                const current = turnState?.initiativeOrder || [];
                                // Evita duplicatas
                                const filteredPlayers = players.filter(p => !current.some(c => c.name === p.name));
                                updateInitiative([...current, ...filteredPlayers]);
                            },
                            className: "w-full bg-slate-800 hover:bg-slate-700 text-[9px] font-black uppercase tracking-widest py-2 rounded-xl border border-slate-700 transition-all mb-2"
                        }, "🧙 Adicionar Todos os Jogadores"),

                        el('div', { 
                            className: "space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar pr-1",
                            onDragOver: (e) => e.preventDefault()
                        }, 
                            (turnState?.initiativeOrder || []).map((item, idx) => 
                                el('div', { 
                                    key: item.id,
                                    draggable: true,
                                    onDragStart: () => setDraggedIndex(idx),
                                    onDragOver: (e) => e.preventDefault(),
                                    onDrop: () => {
                                        if (draggedIndex === null || draggedIndex === idx) return;
                                        const newOrder = [...turnState.initiativeOrder];
                                        const draggedItem = newOrder.splice(draggedIndex, 1)[0];
                                        newOrder.splice(idx, 0, draggedItem);
                                        updateInitiative(newOrder);
                                        setDraggedIndex(null);
                                    },
                                    className: `flex items-center justify-between p-3 rounded-2xl border transition-all cursor-move group ${turnState?.activeChar === item.name ? 'border-amber-500 bg-amber-500/10 shadow-[0_0_15px_rgba(245,158,11,0.2)]' : 'border-slate-800 bg-slate-950/50 hover:border-slate-600'}` 
                                }, [
                                    el('div', { className: "flex items-center gap-3" }, [
                                        el('span', { className: "text-slate-700 group-hover:text-amber-500 transition-colors" }, "☰"),
                                        el('span', { className: `text-xs font-bold uppercase ${turnState?.activeChar === item.name ? 'text-amber-500' : 'text-slate-300'}` }, item.name),
                                    ]),
                                    el('div', { className: "flex items-center gap-2" }, [
                                        el('input', {
                                            type: 'number',
                                            defaultValue: item.value,
                                            onBlur: (e) => {
                                                const newVal = parseInt(e.target.value) || 0;
                                                if (newVal !== item.value) {
                                                    const newOrder = [...turnState.initiativeOrder];
                                                    newOrder[idx].value = newVal;
                                                    // Re-ordena se o valor mudar? Talvez melhor não, para permitir drag manual livre.
                                                    updateInitiative(newOrder);
                                                }
                                            },
                                            className: "w-10 bg-slate-900 border border-slate-800 rounded-lg text-[10px] font-black text-center text-amber-500 focus:border-amber-500 outline-none"
                                        }),
                                        el('button', {
                                            onClick: () => {
                                                const newOrder = (turnState?.initiativeOrder || []).filter((_, i) => i !== idx);
                                                updateInitiative(newOrder);
                                            },
                                            className: "text-slate-700 hover:text-red-500 transition-colors text-xs px-1"
                                        }, "×")
                                    ])
                                ])
                            )
                        )
                    ])
                ]),
                el('section', { key: 'history-section', className: "bg-slate-900 border border-slate-800 rounded-[2.5rem] overflow-hidden" }, [
                    el('div', { className: "p-5 border-b border-slate-800 flex justify-between items-center" }, [
                        el('span', { className: "text-[10px] text-slate-500 uppercase font-black" }, "🎲 Rolagens"),
                        el('button', { 
                            onClick: clearRollHistory,
                            className: "text-[9px] text-red-500 uppercase font-bold hover:text-red-400 transition-colors"
                        }, "Limpar Tudo")
                    ]),
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
        ]),

        // --- MODAL DE CONDIÇÕES ---
        showCondModalFor && el(ConditionModal, {
            characterName: showCondModalFor,
            onClose: () => setShowCondModalFor(null),
            onSave: (newCond) => {
                const char = allCharacters.find(c => c.name === showCondModalFor);
                if (char) {
                    const currentConds = safeParseJSON(char.sheetData?.info?.['Condicoes']);
                    updateCharacterConditions(showCondModalFor, [...currentConds, newCond]);
                }
                setShowCondModalFor(null);
            }
        }),

        // --- 5. TUTORIAL POPUP ---
        showTutorial && el(MasterTutorialPopup, {
            key: 'master-tutorial',
            onClose: () => {
                localStorage.setItem('has_seen_master_tutorial', 'true');
                setShowTutorial(false);
            }
        }),

        // --- 6. THE VAULT ---
        showVault && el(MasterVault, {
            key: 'master-vault',
            onClose: () => setShowVault(false),
            geminiApiKey: geminiApiKey,
            setGeminiApiKey: setGeminiApiKey
        }),

        // --- 7. CONFIGURAÇÕES DA CAMPANHA ---
        showSettings && el('div', {
            key: 'settings-modal',
            className: "fixed inset-0 z-[300] bg-slate-950/95 backdrop-blur-xl flex items-center justify-center p-6 animate-fade-in"
        }, [
            el('div', { className: "bg-slate-900 border-2 border-slate-800 rounded-[3rem] p-10 max-w-lg w-full shadow-3xl" }, [
                el('div', { className: "flex justify-between items-center mb-10" }, [
                    el('h2', { className: "text-2xl font-black uppercase italic tracking-tighter text-white" }, "⚙️ Configurações"),
                    el('button', { onClick: () => setShowSettings(false), className: "text-slate-500 hover:text-white text-3xl" }, "×")
                ]),

                el('div', { className: "space-y-8" }, [
                    el('div', { className: "bg-slate-950/50 p-6 rounded-2xl border border-slate-800" }, [
                        el('p', { className: "text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2" }, "ID da Campanha Atual"),
                        el('p', { className: "text-xs font-mono text-amber-500" }, currentAppId)
                    ]),

                    el('div', { className: "border-t border-slate-800 pt-8" }, [
                        el('h3', { className: "text-red-500 font-black uppercase text-[10px] tracking-widest mb-4" }, "☢️ Zona de Perigo"),
                        el('button', {
                            onClick: () => deleteCampaign(currentAppId),
                            className: "w-full bg-red-900/20 hover:bg-red-600 text-red-500 hover:text-white font-black py-4 rounded-2xl uppercase text-[10px] tracking-widest transition-all border border-red-500/30"
                        }, "🗑️ Apagar Campanha Permanentemente")
                    ]),

                    el('button', {
                        onClick: () => setShowSettings(false),
                        className: "w-full bg-slate-800 hover:bg-slate-700 text-slate-400 font-black py-4 rounded-2xl uppercase text-[10px] tracking-widest transition-all"
                    }, "Voltar")
                ])
            ]),
        ]),

        // --- BARRA DE AÇÕES EM MASSA ---
        selectedChars.length > 0 && el('div', {
            key: 'bulk-actions-bar',
            className: "fixed bottom-10 left-1/2 -translate-x-1/2 z-[400] bg-slate-900/95 backdrop-blur-xl border border-amber-500/50 p-4 rounded-[2rem] shadow-3xl animate-slide-up flex flex-wrap items-center justify-center gap-6"
        }, [
            el('div', { className: "px-4 border-r border-slate-800 flex flex-col items-center" }, [
                el('span', { className: "text-[8px] font-black text-slate-500 uppercase tracking-widest" }, "Selecionados"),
                el('span', { className: "text-lg font-black text-amber-500" }, `${selectedChars.length} Heróis`)
            ]),
            el('div', { className: "flex gap-2" }, [
                el('button', {
                    onClick: () => {
                        const val = prompt("Valor de DANO para aplicar a todos selecionados:");
                        if (val) {
                            const damage = parseInt(val);
                            selectedChars.forEach(name => updateCharacterHP(name, -damage));
                            AudioManager.play('damage');
                            setSelectedChars([]);
                        }
                    },
                    className: "bg-red-950 border border-red-500/30 px-4 py-2 rounded-xl text-[10px] font-black uppercase text-red-400 hover:bg-red-600 hover:text-white transition-all"
                }, "💥 Dano em Massa"),
                el('button', {
                    onClick: () => {
                        const val = prompt("Valor de CURA para aplicar a todos selecionados:");
                        if (val) {
                            const heal = parseInt(val);
                            selectedChars.forEach(name => updateCharacterHP(name, heal));
                            AudioManager.play('heal');
                            setSelectedChars([]);
                        }
                    },
                    className: "bg-emerald-950 border border-emerald-500/30 px-4 py-2 rounded-xl text-[10px] font-black uppercase text-emerald-400 hover:bg-emerald-600 hover:text-white transition-all"
                }, "✨ Cura em Massa"),
                el('button', {
                    onClick: () => {
                        const val = prompt("Quanto de XP para todos?");
                        if (val) {
                            selectedChars.forEach(name => updateCharacterXP(name, val));
                            setSelectedChars([]);
                        }
                    },
                    className: "bg-purple-950 border border-purple-500/30 px-4 py-2 rounded-xl text-[10px] font-black uppercase text-purple-400 hover:bg-purple-600 hover:text-white transition-all"
                }, "💎 Dar XP"),
                el('button', {
                    onClick: () => setSelectedChars([]),
                    className: "bg-slate-800 px-4 py-2 rounded-xl text-[10px] font-black uppercase text-slate-400 hover:bg-slate-700 transition-all"
                }, "Cancelar")
            ])
        ])
    ]);
}