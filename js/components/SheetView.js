
const { useState } = React;


import { DiceRoller } from './DiceRoller.js';
import { AudioManager } from '../AudioManager.js';

export function SheetView({
    characterName,
    characterSheetData,
    onBack,
    onToggleTree,
    rollDice,
    handleDescansoLongo,
    setEditableSheetData,
    onUpdateSheet,
    updateSheetField,
    recentRolls,
    isRollingModalOpen,
    setRollingModalOpen,
    turnState
}) {

    const [isEditingInventory, setIsEditingInventory] = useState(false);
    const [effectClass, setEffectClass] = useState(''); // Classe temporária (shake, sparkle)

    const triggerEffect = (type) => {
        setEffectClass(`animate-${type}`);
        AudioManager.play(type === 'shake' ? 'damage' : 'heal');
        setTimeout(() => setEffectClass(''), 1000);
    };
    
    // Nível Up
    const [showLevelUpModal, setShowLevelUpModal] = useState(false);
    const [levelUpData, setLevelUpData] = useState({
        pointsToSpend: 2,
        attributes: { FOR: 0, DES: 0, CON: 0, INT: 0, SAB: 0, CAR: 0 },
        hitDie: '8', // Padrão
        hpChoice: 'roll', // 'roll' ou 'fixed'
        hpRolledValue: 0
    });

    // Monitor de HP para feedback (Reativo ao estado)
    const currentHP = parseInt(characterSheetData?.recursos?.['PV Atual']) || 0;
    const [lastHP, setLastHP] = React.useState(currentHP);
    
    // Monitor de PV Temporário
    const currentTempHP = parseInt(characterSheetData?.recursos?.['PV Temporário']) || 0;
    const [lastTempHP, setLastTempHP] = React.useState(currentTempHP);

    React.useEffect(() => {
        if (currentHP === lastHP) return;
        if (currentHP < lastHP) {
            triggerEffect('shake');
        } else if (currentHP > lastHP) {
            triggerEffect('sparkle');
        }
        setLastHP(currentHP);
    }, [currentHP]);

    React.useEffect(() => {
        if (currentTempHP === lastTempHP) return;
        if (currentTempHP !== lastTempHP) {
            triggerEffect('shield');
        }
        setLastTempHP(currentTempHP);
    }, [currentTempHP]);
    
    // Rastreador de círculos de magia ativos
    const [activeCircles, setActiveCircles] = React.useState(() => {
        const circles = [];
        Object.keys(characterSheetData?.magias || {}).forEach(k => {
            if (k !== 'temMagia' && Array.isArray(characterSheetData.magias[k])) {
                if (characterSheetData.magias[k].some(m => m && m.trim() !== "")) {
                    circles.push(k);
                }
            }
        });
        return circles;
    });

    React.useEffect(() => {
        AudioManager.play('paper');
    }, []);

    React.useEffect(() => {
        const circlesToAdd = [];
        Object.keys(characterSheetData?.magias || {}).forEach(k => {
            if (k !== 'temMagia' && Array.isArray(characterSheetData.magias[k])) {
                if (characterSheetData.magias[k].some(m => m && m.trim() !== "")) {
                    circlesToAdd.push(k);
                }
            }
        });
        
        let needsUpdate = false;
        circlesToAdd.forEach(c => {
            if (!activeCircles.includes(c)) needsUpdate = true;
        });
        
        if (needsUpdate) {
            setActiveCircles(prev => Array.from(new Set([...prev, ...circlesToAdd])));
        }
    }, [characterSheetData?.magias]);

    const el = React.createElement;
    // Helper para formatar bônus
    const fmtNum = (n) => {
        const num = parseInt(n);
        if (isNaN(num)) return n;
        return num >= 0 ? `+${num}` : num;
    };

    // Lógica de Level Up
    const xpAtual = parseInt(characterSheetData.info?.['XP']) || 0;
    const nivelAtual = parseInt(characterSheetData.info?.['Nivel']) || 1;
    const xpNecessario = nivelAtual * 1000;
    const podeSubirNivel = xpAtual >= xpNecessario;

    const handleAttributeChange = (attr, delta) => {
        setLevelUpData(prev => {
            const currentPointsSpent = Object.values(prev.attributes).reduce((a, b) => a + b, 0);
            const newValue = prev.attributes[attr] + delta;
            
            if (newValue < 0) return prev;
            if (delta > 0 && currentPointsSpent >= 2) return prev; // Acabou os pontos

            return {
                ...prev,
                pointsToSpend: 2 - (currentPointsSpent + delta),
                attributes: { ...prev.attributes, [attr]: newValue }
            };
        });
    };

    const handleLevelUpConfirm = () => {
        const newNivel = nivelAtual + 1;
        let hpIncrease = 0;
        const constMod = Math.floor((parseInt(characterSheetData.atributos?.['CON']) || 10) - 10) / 2;
        
        if (levelUpData.hpChoice === 'fixed') {
            hpIncrease = Math.floor(parseInt(levelUpData.hitDie) / 2) + 1 + Math.floor(constMod);
        } else {
            const rolled = levelUpData.hpRolledValue || Math.floor(Math.random() * parseInt(levelUpData.hitDie)) + 1;
            hpIncrease = rolled + Math.floor(constMod);
        }
        if (hpIncrease < 1) hpIncrease = 1;

        const currentMaxHp = parseInt(characterSheetData.recursos?.['PV Máximo'] || '0');
        const newMaxHp = currentMaxHp + hpIncrease;

        const newAtributos = { ...characterSheetData.atributos };
        Object.keys(levelUpData.attributes).forEach(attr => {
            if (levelUpData.attributes[attr] > 0) {
                newAtributos[attr] = (parseInt(newAtributos[attr]) || 10) + levelUpData.attributes[attr];
            }
        });

        const newData = {
            ...characterSheetData,
            info: { ...characterSheetData.info, 'Nivel': newNivel.toString(), 'XP': '0' },
            recursos: { ...characterSheetData.recursos, 'PV Máximo': newMaxHp.toString() },
            atributos: newAtributos
        };

        onUpdateSheet(newData);
        
        setShowLevelUpModal(false);
        setLevelUpData({
            pointsToSpend: 2,
            attributes: { FOR: 0, DES: 0, CON: 0, INT: 0, SAB: 0, CAR: 0 },
            hitDie: '8',
            hpChoice: 'roll',
            hpRolledValue: 0
        });
    };

    //Renderiza a ficha
    // Parse das Condições
    const rawConds = characterSheetData.info?.['Condicoes'] || '[]';
    let activeConditions = [];
    try { activeConditions = JSON.parse(rawConds); } catch(e) { activeConditions = []; }

    const isMyTurn = turnState?.activeChar === characterName;

    return el('div', { 
        className: `min-h-screen bg-slate-950 text-slate-100 pb-32 animate-fade-in relative transition-all duration-500 ${isMyTurn ? 'ring-8 ring-amber-500/30' : ''} ${effectClass}` 
    }, [
        // --- NÉVOA DE FUNDO ---
        activeConditions.length > 0 && el('div', { 
            key: 'mist',
            className: "fixed inset-0 pointer-events-none z-0 opacity-40 transition-all duration-1000",
            style: {
                background: `radial-gradient(circle at center, transparent 30%, ${activeConditions[0].color}77 100%)`,
                boxShadow: `inset 0 0 150px 50px ${activeConditions[0].color}55`
            }
        }),

        // --- BANNER DE TURNO ---
        isMyTurn && el('div', {
            key: 'turn-banner',
            className: "fixed top-24 left-1/2 -translate-x-1/2 z-[60] bg-gradient-to-r from-amber-600 via-yellow-400 to-amber-600 text-slate-900 px-8 py-2 rounded-full font-black uppercase tracking-[0.3em] shadow-[0_0_30px_rgba(251,191,36,0.6)] animate-bounce text-xs border-2 border-amber-200"
        }, "🔥 É a sua vez!"),

        // --- ÍCONES DE STATUS (Minecraft Style) ---
        el('div', { 
            key: 'status-icons',
            className: "fixed top-24 right-6 z-50 flex flex-col gap-3"
        }, activeConditions.map((cond, idx) => 
            el('div', {
                key: idx,
                className: "group relative w-12 h-12 bg-slate-900/90 border-2 border-yellow-500 rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(234,179,8,0.3)] backdrop-blur-md cursor-help transition-transform hover:scale-110",
                title: `${cond.name}: ${cond.turns} turnos restantes`
            }, [
                el('span', { key: 'icon', className: "text-2xl drop-shadow-md" }, cond.icon),
                el('span', { key: 'turns', className: "absolute -bottom-1 -right-1 bg-yellow-500 text-slate-950 text-[9px] font-black px-1 rounded border border-slate-900 shadow-md" }, cond.turns),
                // Tooltip Custom
                el('div', { className: "absolute right-14 top-0 bg-slate-900 border border-amber-500 p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none" }, 
                    el('p', { className: "text-[10px] font-black uppercase text-amber-500" }, cond.name),
                    el('p', { className: "text-[9px] text-slate-300" }, `Duração: ${cond.turns} rodada(s)`)
                )
            ])
        )),

        // --- HEADER FICHADO ---
        el('header', { className: "bg-slate-900/90 backdrop-blur-xl border-b border-slate-800 p-4 md:p-6 sticky top-0 z-40" },
            el('div', { className: "max-w-7xl mx-auto flex justify-between items-center" },
                el('div', { className: "flex items-center gap-4" },
                    el('div', { className: "bg-slate-800 p-2 rounded-xl border border-slate-700 shadow-inner" }, "📄"),
                    el('div', null,
                        el('h2', { className: "text-xl md:text-2xl font-black uppercase tracking-tighter text-white" }, characterName),
                        el('p', { className: "text-slate-500 text-[10px] font-bold uppercase tracking-widest italic" }, characterSheetData.info?.['Classe'] || 'Aventureiro')
                    )
                ),
                el('div', { className: "flex gap-3" },
                    el('button', {
                        onClick: onToggleTree,
                        className: "bg-purple-600/10 hover:bg-purple-600 text-purple-500 hover:text-white text-[10px] font-black uppercase tracking-widest border border-purple-600/30 px-4 py-2 rounded-xl transition-all"
                    }, "⭐ Talentos"),

                    // BOTÃO SAIR ADICIONADO NO HEADER
                    el('button', {
                        onClick: onBack,
                        className: "bg-slate-800 hover:bg-red-900/40 text-slate-400 hover:text-red-400 border border-slate-700 hover:border-red-900/50 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                    }, "Sair")
                )
            )
        ),
        // --- CONTEÚDO PRINCIPAL ---
        el('main', { className: "max-w-7xl mx-auto p-4 md:p-6 space-y-10" },
            // --- BLOCO 1: INFORMAÇÕES INICIAIS ---
            el('div', { className: "bg-slate-900 border-2 border-slate-800 p-6 rounded-[2.5rem] shadow-xl" },
                el('div', { className: "grid grid-cols-1 md:grid-cols-4 gap-6" },
                    // Coluna 1: Nome do Personagem (Destaque)
                    el('div', { className: "flex flex-col justify-center border-r border-slate-800 pr-4" },
                        el('p', { className: "text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1" }, "Nome do Personagem"),
                        el('p', { className: "text-2xl font-black text-amber-400 tracking-tighter" }, characterSheetData.info?.['Nome do Personagem'] || '---')
                    ),
                    // Coluna 2: Classe e Raça
                    el('div', { className: "space-y-4" },
                        el('div', null,
                            el('p', { className: "text-[8px] font-black text-slate-500 uppercase mb-1" }, "Classe"),
                            el('p', { className: "text-sm font-bold text-white" }, characterSheetData.info?.['Classe'] || '---')
                        ),
                        el('div', null,
                            el('p', { className: "text-[8px] font-black text-slate-500 uppercase mb-1" }, "Raça"),
                            el('p', { className: "text-sm font-bold text-white" }, characterSheetData.info?.['Raça'] || '---')
                        )
                    ),
                    // Coluna 3: Antecedente e Alinhamento
                    el('div', { className: "space-y-4" },
                        el('div', null,
                            el('p', { className: "text-[8px] font-black text-slate-500 uppercase mb-1" }, "Antecedente"),
                            el('p', { className: "text-sm font-bold text-white" }, characterSheetData.info?.['Antecedente'] || '---')
                        ),
                        el('div', null,
                            el('p', { className: "text-[8px] font-black text-slate-500 uppercase mb-1" }, "Alinhamento"),
                            el('p', { className: "text-sm font-bold text-white" }, characterSheetData.info?.['Alinhamento'] || '---')
                        )
                    ),
                    // Coluna 4: Jogador, XP e Nível
                    el('div', { className: "space-y-3 bg-slate-950/50 p-3 rounded-2xl border border-slate-800" },
                        el('div', { className: "flex justify-between" },
                            el('p', { className: "text-[8px] font-black text-slate-500 uppercase" }, "Jogador"),
                            el('p', { className: "text-[10px] font-bold text-white" }, characterSheetData.info?.['Jogador'] || '---')
                        ),
                        el('div', { className: "flex justify-between border-t border-slate-800 pt-2" },
                            el('p', { className: "text-[8px] font-black text-slate-500 uppercase" }, "XP"),
                            el('p', { className: "text-[10px] font-bold text-amber-500" }, characterSheetData.info?.['XP'] || '0')
                        ),
                        el('div', { className: "flex justify-between border-t border-slate-800 pt-2" },
                            el('p', { className: "text-[8px] font-black text-slate-500 uppercase" }, "Nível"),
                            el('p', { className: "text-[10px] font-black text-white" }, characterSheetData.info?.['Nivel'] || '1')
                        )
                    )
                )
            ),
            // --- BLOCO 2: VITALIDADE E RECURSOS ---
            el('div', { className: "grid grid-cols-1 lg:grid-cols-12 gap-8" },

                // CALCULADORA (Esquerda - 4 Colunas)
                el('div', { className: "lg:col-span-4 bg-slate-900 border-2 border-amber-500/20 p-6 rounded-[2.5rem] shadow-xl flex flex-col justify-center" },
                    el('h4', { className: "text-amber-500 font-black mb-4 uppercase text-[10px] tracking-widest italic" }, "⚔️ Modificador de Vitalidade"),
                    el('div', { className: "space-y-4" },
                        el('input', {
                            type: "number",
                            id: "hpModifierInput",
                            placeholder: "Valor",
                            className: "w-full bg-slate-950 border-2 border-slate-800 rounded-2xl p-4 text-white font-black text-2xl outline-none focus:border-amber-500 transition-all"
                        }),
                        el('div', { className: "grid grid-cols-3 gap-2" },
                            // BOTÃO DANO
                            el('button', {
                                className: "bg-red-900/20 hover:bg-red-600 text-red-500 hover:text-white font-black py-3 rounded-xl border border-red-500/30 transition-all uppercase text-[10px]",
                                onClick: async () => {
                                    const val = parseInt(document.getElementById('hpModifierInput').value) || 0;
                                    if (val <= 0) return;

                                    const newData = JSON.parse(JSON.stringify(characterSheetData));
                                    let temp = parseInt(newData.recursos['PV Temporário']) || 0;
                                    let danoRestante = val;

                                    if (temp > 0) {
                                        if (temp >= val) { temp -= val; danoRestante = 0; }
                                        else { danoRestante = val - temp; temp = 0; }
                                    }

                                    const perdido = parseInt(newData.recursos['PV Perdido']) || 0;
                                    const max = parseInt(newData.recursos['PV Máximo']) || 0;

                                    newData.recursos['PV Perdido'] = perdido + danoRestante;
                                    newData.recursos['PV Temporário'] = temp;
                                    newData.recursos['PV Atual'] = max - (perdido + danoRestante);

                                    await onUpdateSheet(newData); // Envia para a planilha correta
                                    document.getElementById('hpModifierInput').value = '';
                                }
                            }, "Dano"),

                            // BOTÃO CURA
                            el('button', {
                                className: "bg-green-900/20 hover:bg-green-600 text-green-500 hover:text-white font-black py-3 rounded-xl border border-green-500/30 transition-all uppercase text-[10px]",
                                onClick: async () => {
                                    const val = parseInt(document.getElementById('hpModifierInput').value) || 0;
                                    if (val <= 0) return;

                                    const newData = JSON.parse(JSON.stringify(characterSheetData));
                                    const perdido = parseInt(newData.recursos['PV Perdido']) || 0;
                                    const max = parseInt(newData.recursos['PV Máximo']) || 0;

                                    const novoPerdido = Math.max(0, perdido - val);
                                    newData.recursos['PV Perdido'] = novoPerdido;
                                    newData.recursos['PV Atual'] = max - novoPerdido;

                                    await onUpdateSheet(newData);
                                    document.getElementById('hpModifierInput').value = '';
                                }
                            }, "Cura"),

                            // BOTÃO ESCUDO (TEMPORÁRIO)
                            el('button', {
                                className: "bg-blue-900/20 hover:bg-blue-600 text-blue-500 hover:text-white font-black py-3 rounded-xl border border-blue-500/30 transition-all uppercase text-[10px]",
                                onClick: async () => {
                                    const val = parseInt(document.getElementById('hpModifierInput').value) || 0;
                                    if (val <= 0) return;

                                    const newData = JSON.parse(JSON.stringify(characterSheetData));
                                    const tempAtual = parseInt(newData.recursos['PV Temporário']) || 0;
                                    newData.recursos['PV Temporário'] = tempAtual + val;

                                    await onUpdateSheet(newData);
                                    document.getElementById('hpModifierInput').value = '';
                                }
                            }, "Escudo")
                        )
                    )
                ),

                // STATUS (Direita - 8 Colunas)
                el('div', { className: "lg:col-span-8 grid grid-cols-2 md:grid-cols-4 gap-4" },
                    // CA, Iniciativa, Deslocamento, PV Máximo
                    [['CA', characterSheetData.recursos?.['CA'], 'text-blue-400', "🛡️"],
                    ['Iniciativa', fmtNum(characterSheetData.recursos?.['Iniciativa']), 'text-amber-500', "⚡"],
                    ['Deslocamento', characterSheetData.recursos?.['Deslocamento'], 'text-emerald-400', "👣"],
                    ['PV Máximo', characterSheetData.recursos?.['PV Máximo'], 'text-green-500', "❤️"]
                    ].map(([label, val, color, icon]) =>
                        el('div', { key: label, className: "bg-slate-900 border-2 border-slate-800 p-5 rounded-[2rem] text-center shadow-xl transition-all" },
                            el('span', { className: `${color} text-xl` }, icon),
                            el('p', { className: "text-[9px] font-black text-slate-500 uppercase mt-1" }, label),
                            el('p', { className: `text-2xl font-black ${color}` }, val)
                        )
                    ),
                    // PV ATUAL (Grande)
                    el('div', { className: "col-span-2 bg-slate-900 border-2 border-slate-800 p-5 rounded-[2rem] text-center shadow-xl relative overflow-hidden" },
                        el('div', { className: "absolute inset-0 opacity-10 bg-green-600" }),
                        el('p', { className: "text-[9px] font-black text-slate-500 uppercase relative z-10" }, "PV Atual"),
                        el('p', { className: "text-5xl font-black text-green-500 relative z-10" }, characterSheetData.recursos?.['PV Atual']),
                        el('div', { className: "w-full h-1.5 bg-slate-800 rounded-full mt-3 relative z-10 overflow-hidden" },
                            el('div', {
                                className: "h-full bg-green-500",
                                style: { width: `${(parseInt(characterSheetData.recursos?.['PV Atual']) / parseInt(characterSheetData.recursos?.['PV Máximo'])) * 100}%` }
                            })
                        )
                    ),
                    // PV TEMPORÁRIO (Grande)
                    el('div', { className: "col-span-2 bg-slate-900 border-2 border-slate-800 p-5 rounded-[2rem] text-center shadow-xl flex flex-col justify-center relative overflow-hidden" },
                        el('div', { className: "absolute inset-0 opacity-5 bg-cyan-500" }),
                        el('p', { className: "text-[9px] font-black text-slate-500 uppercase relative z-10" }, "PV Temporário"),
                        el('p', { className: "text-5xl font-black text-cyan-400 relative z-10" }, characterSheetData.recursos?.['PV Temporário'] || '0')
                    )
                )
            ),
            // --- BLOCO 3: ATRIBUTOS (6) ---
            el('div', { className: "grid grid-cols-3 md:grid-cols-6 gap-4" },
                ['FOR', 'DES', 'CON', 'INT', 'SAB', 'CAR'].map(key => {
                    const value = characterSheetData.atributos?.[key] || '10';
                    const mod = characterSheetData.modificadores?.[key] || '0';

                    return el('div', { key: key, className: "bg-slate-900 border-2 border-slate-800 rounded-3xl text-center shadow-xl hover:border-amber-500/40 transition-all overflow-hidden flex flex-col" },
                        el('div', { className: "p-3 pb-2" },
                            el('p', { className: "text-[9px] font-black text-slate-500 uppercase mb-1" }, key),
                            el('p', { className: "text-xs font-bold text-slate-400 italic" }, value)
                        ),
                        el('div', { className: "border-t border-slate-800 w-full" }),
                        el('div', { className: "p-4 bg-slate-950/40 flex-grow flex items-center justify-center" },
                            el('p', { className: `text-4xl font-black ${parseInt(mod) >= 0 ? 'text-amber-500' : 'text-red-500'}` }, fmtNum(mod))
                        )
                    );
                })
            ),
            // --- BLOCO 4: ATAQUES E COMBATE ---
            el('div', { className: "bg-slate-900 border-2 border-slate-800 rounded-[2.5rem] overflow-hidden shadow-xl" },
                el('div', { className: "bg-slate-800/50 px-8 py-4 border-b border-slate-700 flex items-center justify-between" },
                    el('h3', { className: "text-sm font-black text-slate-200 uppercase tracking-widest italic flex items-center gap-2" }, "⚔️ Ataques e Conjuração"),
                    el('span', { className: "text-[10px] text-slate-500 font-bold uppercase tracking-widest" }, "Tabela de Combate")
                ),
                el('div', { className: "p-6 space-y-3" },
                    // Cabeçalho
                    el('div', { className: "grid grid-cols-12 px-4 text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]" },
                        el('div', { className: "col-span-4" }, "Arma/Ataque"),
                        el('div', { className: "col-span-2 text-center" }, "Bônus"),
                        el('div', { className: "col-span-3 text-center" }, "Dano"),
                        el('div', { className: "col-span-3 text-right" }, "Tipo")
                    ),
                    // Linhas de Ataque
                    characterSheetData.ataques?.map((atk, idx) =>
                        el('div', { key: idx, className: "grid grid-cols-12 items-center bg-slate-950/40 border border-slate-800 p-4 rounded-2xl group hover:border-amber-500/40 transition-all" },
                            el('div', { className: "col-span-4 text-slate-200 font-bold text-sm truncate uppercase tracking-tight" }, atk.nome),
                            el('div', { className: "col-span-2 text-center" }, el('span', { className: "bg-slate-900 px-3 py-1 rounded-lg text-amber-500 font-black text-xs border border-slate-800 shadow-inner" }, fmtNum(atk.bonus))),
                            el('div', { className: "col-span-3 text-center" }, el('p', { className: "text-blue-400 font-black text-sm drop-shadow-[0_0_8px_rgba(59,130,246,0.3)]" }, atk.dano)),
                            el('div', { className: "col-span-3 text-right" }, el('span', { className: "text-[10px] text-slate-500 font-black uppercase italic tracking-tighter bg-slate-900/50 px-2 py-1 rounded-md border border-slate-800" }, atk.tipo))
                        )
                    )
                )
            ),
            // --- BLOCO 5: PERÍCIAS E TALENTOS (GRID 2) ---
            el('div', { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8" },
                // Perícias (4 colunas)
                el('div', { className: "lg:col-span-4 bg-slate-900 border border-slate-800 p-6 rounded-[2.5rem] shadow-xl flex flex-col h-[500px]" },
                    el('h4', { className: "text-amber-500 font-black mb-6 flex items-center gap-2 uppercase text-xs italic border-b border-amber-900/20 pb-3" }, "🎯 Perícias"),
                    el('div', { className: "flex-grow overflow-y-auto pr-2 custom-scrollbar space-y-1" },
                        Object.entries(characterSheetData.pericias || {}).map(([key, data]) => {
                            // Suporte a compatibilidade: se for string, converte pra novo formato assumindo sem proficiência
                            const isNewFormat = typeof data === 'object' && data !== null;
                            const value = isNewFormat ? data.val : data;
                            const isProficient = isNewFormat ? data.prof : false;

                            return el('div', { key: key, className: "flex justify-between items-center text-[11px] border-b border-slate-800/30 py-2.5 hover:bg-white/5 px-2 rounded-lg group transition-colors" },
                                el('span', { className: "text-slate-400 font-bold uppercase group-hover:text-slate-200 flex items-center gap-2" }, 
                                    isProficient ? el('span', { className: "w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" }) : el('span', { className: "w-2 h-2 rounded-full border border-slate-700 bg-slate-900/50" }),
                                    key
                                ),
                                el('span', { className: "text-amber-400 font-black" }, value || '+0')
                            );
                        })
                    )
                ),
                // --- Características e Talentos Editáveis ---
                el('div', { className: "lg:col-span-8 bg-slate-900 border border-slate-800 p-6 rounded-[2.5rem] shadow-xl flex flex-col" },
                    el('div', { className: "flex justify-between items-center mb-6 border-b border-purple-900/20 pb-3" }, [
                        el('h4', { className: "text-purple-400 font-black uppercase text-xs italic flex items-center gap-2 tracking-widest" }, "✨ Características e Talentos"),
                        el('button', {
                            className: "bg-purple-900/30 hover:bg-purple-600 text-purple-400 hover:text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border border-purple-500/30 transition-all",
                            onClick: () => {
                                let talentosAtuais = characterSheetData.outros?.['Talentos'] || [];
                                if (!Array.isArray(talentosAtuais)) {
                                    talentosAtuais = typeof talentosAtuais === 'string' ? talentosAtuais.split('/').map(s=>s.trim()) : [];
                                }
                                const newTalents = [...talentosAtuais];
                                newTalents.push(""); // Adiciona espaço vazio
                                updateSheetField('outros', 'Talentos', newTalents.join(' / '));
                            }
                        }, "+ ADICIONAR")
                    ]),
                    
                    el('div', { className: "space-y-4 overflow-y-auto pr-2 custom-scrollbar flex-grow h-[400px]" },
                        // Pega a lista atual ou um array de 4 itens como base mínima (por compatibilidade)
                        (() => {
                            let talentosAtuais = characterSheetData.outros?.['Talentos'] || [];
                            if (!Array.isArray(talentosAtuais)) {
                                talentosAtuais = typeof talentosAtuais === 'string' ? talentosAtuais.split('/').map(s=>s.trim()) : [];
                            }
                            
                            // Remove espaços vazios acidentais no começo/meio se não for intencional? Melhor não.
                            
                            // Garante que tenha pelo menos 1 item na tela
                            if (talentosAtuais.length === 0) talentosAtuais = [""];

                            return talentosAtuais.map((talentTitle, idx) => {
                                const talentDesc = characterSheetData.outros?.[`desc_talento_${idx}`] || "";

                                return el('div', {
                                    key: idx,
                                    className: "bg-slate-950/50 p-4 rounded-3xl border border-slate-800 group focus-within:border-purple-500/50 transition-all relative"
                                }, [
                                    // BOTAO DE EXCLUIR
                                    el('button', {
                                        className: "absolute top-3 right-4 text-[10px] text-slate-600 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 uppercase tracking-widest font-black",
                                        onClick: () => {
                                            if (confirm(`Excluir a característica "${talentTitle || 'vazia'}"?`)) {
                                                const newTalents = [...talentosAtuais];
                                                newTalents.splice(idx, 1); // Remove
                                                
                                                // Prepara as descrições em cascata para não bagunçar
                                                // Ex: se apagou o 2, o desc 3 vira 2, o 4 vira 3...
                                                const fullData = JSON.parse(JSON.stringify(characterSheetData));
                                                if (!fullData.outros) fullData.outros = {};
                                                
                                                // Envia pra planilha como uma string separada por " / "
                                                fullData.outros['Talentos'] = newTalents.join(' / ');
                                                
                                                for(let i = idx; i < 20; i++){
                                                    const pxDesc = fullData.outros[`desc_talento_${i+1}`] || "";
                                                    fullData.outros[`desc_talento_${i}`] = pxDesc;
                                                }

                                                // Atualiza na memória e na planilha
                                                onUpdateSheet(fullData);
                                            }
                                        }
                                    }, "⨯ EXCLUIR"),

                                    // CAMPO: TÍTULO DO TALENTO
                                    el('input', {
                                        type: 'text',
                                        className: "w-[90%] bg-transparent text-xs text-purple-300 font-black uppercase mb-1 outline-none placeholder:text-purple-900/30",
                                        placeholder: "Nome da Característica...",
                                        key: `title-input-${idx}-${talentTitle}`,
                                        defaultValue: talentTitle,
                                        onBlur: (e) => {
                                            const newValue = e.target.value;
                                            if (newValue === talentTitle) return;

                                            const newTalents = [...talentosAtuais];
                                            newTalents[idx] = newValue;
                                            updateSheetField('outros', 'Talentos', newTalents.join(' / '));
                                        }
                                    }),

                                    // CAMPO: DESCRIÇÃO DO TALENTO
                                    el('textarea', {
                                        className: "w-full bg-transparent text-[11px] text-slate-400 italic leading-tight outline-none resize-none placeholder:text-slate-800 mt-2",
                                        placeholder: "Clique para descrever o efeito...",
                                        key: `desc-input-${idx}-${talentDesc}`,
                                        rows: 2,
                                        defaultValue: talentDesc,
                                        onBlur: (e) => {
                                            const newValue = e.target.value;
                                            if (newValue === talentDesc) return;
                                            updateSheetField('outros', `desc_talento_${idx}`, newValue);
                                        }
                                    })
                                ]);
                            });
                        })()
                    )
                )
            ),
            // --- BLOCO 6: TRAÇOS DE PERSONALIDADE (GRID 4) ---
            el('div', { className: "grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6" },
                Object.entries(characterSheetData.personalidade || {}).map(([key, value]) => (
                    el('div', { key: key, className: "bg-slate-900/50 border border-slate-800 p-5 rounded-3xl shadow-sm hover:bg-slate-900 transition-colors group" },
                        el('h4', { className: "text-amber-600 font-black mb-2 uppercase text-[9px] tracking-[0.2em] italic flex items-center gap-1.5" }, key),
                        el('p', { className: "text-slate-400 text-[11px] leading-snug italic group-hover:text-slate-200 transition-colors" }, value || '---')
                    )
                ))
            ),

            // --- BLOCO 7: BOLSA DE TESOUROS E INVENTÁRIO ---
            el('div', { key: 'block-7', className: "mt-12 space-y-8 border-t border-slate-800 pt-12" }, [
                el('h3', { className: "text-3xl font-black text-amber-500 uppercase tracking-tighter italic flex items-center gap-4" }, "🔨 Bolsa de Tesouros e Itens"),

                el('div', { className: "grid grid-cols-1 lg:grid-cols-12 gap-8" }, [

                    // 1. MOEDAS (Editáveis)
                    el('div', { className: "lg:col-span-4 grid grid-cols-1 gap-4" },
                        [['PO', 'Ouro', 'bg-amber-500/20 text-amber-500'],
                        ['PP', 'Prata', 'bg-slate-400/20 text-slate-400'],
                        ['PC', 'Cobre', 'bg-orange-700/20 text-orange-700']
                        ].map(([sigla, nome, colorClass]) =>
                            el('div', {
                                key: sigla,
                                className: "bg-slate-900 border-2 border-slate-800 p-6 rounded-[2rem] flex items-center justify-between shadow-xl group hover:border-amber-500/30 transition-all"
                            }, [
                                el('div', { className: "flex items-center gap-4" }, [
                                    el('div', { className: `${colorClass} w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xl shadow-inner` }, sigla),
                                    el('p', { className: "text-sm font-black text-slate-500 uppercase tracking-widest" }, nome)
                                ]),
                                el('input', {
                                    type: 'text',
                                    className: "bg-transparent text-3xl font-black text-white text-right w-24 outline-none focus:text-amber-500 transition-colors",
                                    defaultValue: characterSheetData.outros?.[sigla] || '0',
                                    onBlur: (e) => updateSheetField('outros', sigla, e.target.value)
                                })
                            ])
                        )
                    ),

                    // --- BLOCO DA MOCHILA (MODO VISUALIZAÇÃO COM BOLHAS + MODO EDIÇÃO) ---
                    el('div', { className: "lg:col-span-8 bg-slate-900 border-2 border-slate-800 p-8 rounded-[3rem] shadow-xl flex flex-col" }, [
                        el('div', { className: "flex justify-between items-center mb-6" }, [
                            el('h4', { className: "text-slate-400 font-black uppercase text-xs tracking-widest flex items-center gap-2 italic" }, "🎒 Mochila de Itens"),
                            el('span', { className: "text-[10px] text-slate-600 font-bold uppercase" },
                                isEditingInventory ? "Editando..." : "Clique para editar"
                            )
                        ]),

                        el('div', {
                            className: `bg-slate-950/40 border-2 border-slate-800 rounded-3xl p-6 flex-grow min-h-[160px] transition-all cursor-text ${isEditingInventory ? 'border-amber-500/50 ring-2 ring-amber-500/10' : 'hover:border-slate-700 hover:bg-slate-950/60'}`,
                            onClick: () => {
                                if (!isEditingInventory) {
                                    AudioManager.play('bag');
                                    triggerEffect('bag');
                                    setIsEditingInventory(true);
                                }
                            }
                        },
                            isEditingInventory ?
                                // --- MODO EDIÇÃO (TEXTAREA) ---
                                el('textarea', {
                                    autoFocus: true,
                                    className: "w-full h-full bg-transparent text-slate-300 font-medium text-sm outline-none resize-none leading-relaxed",
                                    placeholder: "Item 1, Item 2, Item 3...",
                                    defaultValue: characterSheetData.outros?.['Equipamento'] || "",
                                    onBlur: (e) => {
                                        setIsEditingInventory(false);
                                        updateSheetField('outros', 'Equipamento', e.target.value);
                                    }
                                }) :
                                // --- MODO VISUALIZAÇÃO (BOLHAS) ---
                                // ADICIONEI flex E flex-wrap PARA ORGANIZAR AS BOLHAS
                                el('div', { className: "flex flex-wrap gap-2.5 content-start" }, [
                                    (characterSheetData.outros?.['Equipamento'] || "").split(',').map((item, idx) => {
                                        const cleanItem = item.trim();
                                        // Ignora itens vazios ou apenas traços
                                        if (!cleanItem || cleanItem === '-') return null;

                                        // ESTILIZAÇÃO DAS BOLHAS PARA ALTO CONTRASTE (ESTILO DADOS/MOEDAS)
                                        return el('span', {
                                            key: idx,
                                            className: "bg-amber-600/10 text-amber-400 px-4 py-1.5 rounded-full text-[10px] font-black border border-amber-600/20 shadow-sm transition-all hover:scale-105 hover:bg-amber-600/20 uppercase tracking-tight"
                                        }, cleanItem);
                                    }).filter(Boolean), // Remove os itens nulos do array para renderização limpa

                                    // Texto de feedback se estiver vazia (aparece mesmo sem altura colapsada)
                                    (characterSheetData.outros?.['Equipamento'] || "").split(',').filter(item => item.trim() !== "" && item.trim() !== "-").length === 0 &&
                                    el('p', { className: "text-slate-700 italic text-sm" }, "Mochila vazia... Clique para adicionar itens.")
                                ])
                        )
                    ])
                ])
            ]),
            // --- BLOCO 8: GRIMÓRIO ARCANO ---
            el('div', { key: 'grimoire-section', className: "mt-12 space-y-8 border-t border-slate-800 pt-12" }, [

                // CABEÇALHO: Stats de Magia (Sempre Renderiza)
                el('div', { className: "flex flex-col md:flex-row items-center justify-between gap-6" }, [
                    el('h3', { className: "text-3xl font-black text-blue-500 uppercase tracking-tighter italic flex items-center gap-4" }, "🧙🏾‍♂️ Grimório Arcano"),

                    el('div', { className: "flex gap-4" },
                        Object.entries(characterSheetData.statsMagia || {}).map(([key, value]) => (
                            el('div', { key, className: "bg-blue-950/20 border border-blue-500/30 px-6 py-3 rounded-2xl text-center shadow-lg" }, [
                                el('p', { className: "text-[8px] font-black text-blue-400 uppercase tracking-widest mb-1" }, key),
                                el('p', { className: "text-xl font-black text-blue-50" }, key === 'Salvaguarda' ? value : fmtNum(value))
                            ])
                        ))
                    ),

                    el('select', {
                        className: "bg-slate-800 text-blue-400 text-[10px] font-black uppercase p-2 rounded-xl border border-blue-500/30 outline-none cursor-pointer",
                        onChange: (e) => {
                            const nivel = e.target.value;
                            if (!nivel) return;
                            
                            // Mostra no UI
                            setActiveCircles(prev => Array.from(new Set([...prev, nivel])));
                            
                            const novaMagia = { ...characterSheetData.magias, temMagia: true };
                            if (!novaMagia[nivel]) novaMagia[nivel] = ["", "", "", ""];
                            updateSheetField('magias', nivel, novaMagia[nivel]);
                            e.target.value = ""; // Reseta o select
                        }
                    }, [
                        el('option', { value: "" }, "+ ADICIONAR CÍRCULO"),
                        ["Infusões", "Círculo 0 (Truques)", "Círculo 1", "Círculo 2", "Círculo 3", "Círculo 4", "Círculo 5", "Círculo 6", "Círculo 7", "Círculo 8", "Círculo 9"].map((n, i) => el('option', { key: 'opt-' + n + '-' + i, value: n }, n))
                    ])
                ]),

                // LISTA DE CÍRCULOS (Renderiza apenas se houver círculos com nomes ou se "temMagia" for true)
                el('div', { className: "grid grid-cols-1 xl:grid-cols-2 gap-10" },
                    Object.keys(characterSheetData.magias || {})
                        .filter(k => k !== 'temMagia' && Array.isArray(characterSheetData.magias[k]))
                        .filter(k => activeCircles.includes(k)) // Oculta ciclos apagados
                        .sort()
                        .map((nivel) => {
                            const lista = characterSheetData.magias[nivel];
                            // Lógica para esconder círculo se estiver totalmente vazio (opcional)
                            // Se quiser que ele suma ao apagar tudo, descomente a linha abaixo:
                            // if (lista.every(m => !m || m === "")) return null;

                            return el('div', { key: nivel, className: "bg-slate-900 border-2 border-slate-800 p-8 rounded-[3.5rem] shadow-2xl relative group" }, [

                                // Botão para Apagar Círculo Inteiro
                                el('button', {
                                    className: "absolute top-6 right-6 text-slate-600 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100",
                                    onClick: () => {
                                        if (confirm(`Deseja apagar todo o ${nivel}?`)) {
                                            // 1. Oculta no UI local
                                            setActiveCircles(prev => prev.filter(c => c !== nivel));
                                            
                                            // 2. Prepara dados vazios para sobescrever células na planilha
                                            const newData = JSON.parse(JSON.stringify(characterSheetData));
                                            if (!newData.magias) newData.magias = {};
                                            newData.magias[nivel] = ["", "", "", ""];
                                            
                                            if (!newData.outros) newData.outros = {};
                                            [0, 1, 2, 3].forEach(idx => {
                                                newData.outros[`spell_desc_${nivel}_${idx}`] = "";
                                            });

                                            newData.magias.temMagia = Object.keys(newData.magias).some(k => 
                                                k !== 'temMagia' && Array.isArray(newData.magias[k]) && newData.magias[k].some(m => m && m.trim() !== "")
                                            );
                                            
                                            // 3. Salva e envia à planilha (as strings vazias limparão as células lá)
                                            onUpdateSheet(newData);
                                        }
                                    }
                                }, "🗑️"),

                                el('h4', { key: 'title-' + nivel, className: "text-blue-400 font-black uppercase text-xl italic mb-8 border-b border-blue-900/30 pb-5" }, nivel),

                                el('div', { className: "space-y-5 overflow-y-auto pr-2 custom-scrollbar max-h-[500px]" },
                                    // Adicionamos dinamicamente novos campos, garantindo que "lista" cresça
                                    // Mapeamos pelos índices até o tamanho atual da lista, mais 1 se quisermos o botão "Adicionar Magia"
                                    lista.map((nomeMagiaOriginal, idx) => {
                                        const nomeMagia = nomeMagiaOriginal || "";
                                        const descMagia = characterSheetData.outros?.[`spell_desc_${nivel}_${idx}`] || "";
                                        
                                        // Esconde as magias vazias da tela para não poluir
                                        // Apenas deixamos o 1º slot vazio amostra pra poder adicionar uma magia nele
                                        const isSlotEmpty = !nomeMagia.trim();
                                        const firstEmptyIndex = lista.findIndex(m => !(m && m.trim() !== ""));

                                        if (isSlotEmpty && idx !== firstEmptyIndex) return null;

                                        return el('div', { key: idx, className: "bg-slate-950/60 border border-slate-800 rounded-[2rem] p-6 focus-within:border-blue-500/50 relative group/spell" }, [

                                            // Botão para Limpar apenas uma Magia
                                            nomeMagia && el('button', {
                                                className: "absolute top-2 right-4 text-[10px] text-slate-700 hover:text-red-400 opacity-0 group-hover/spell:opacity-100 transition-opacity",
                                                onClick: () => {
                                                    const novaLista = [...lista];
                                                    novaLista[idx] = "";
                                                    updateSheetField('magias', nivel, novaLista);
                                                    updateSheetField('outros', `spell_desc_${nivel}_${idx}`, "");
                                                }
                                            }, "limpar"),

                                            el('input', {
                                                type: 'text',
                                                className: "w-full bg-transparent text-blue-50 text-base font-black uppercase outline-none",
                                                placeholder: "Vazio...",
                                                defaultValue: nomeMagia,
                                                onBlur: (e) => {
                                                    const novaLista = [...lista];
                                                    novaLista[idx] = e.target.value;
                                                    updateSheetField('magias', nivel, novaLista);
                                                }
                                            }),
                                            el('textarea', {
                                                className: "w-full bg-transparent text-[11px] text-slate-500 italic mt-2 outline-none resize-none",
                                                placeholder: "Descrição...",
                                                defaultValue: descMagia,
                                                onBlur: (e) => updateSheetField('outros', `spell_desc_${nivel}_${idx}`, e.target.value)
                                            })
                                        ]);
                                    })
                                ),
                                // Botão Adicionar Magia
                                el('button', {
                                    className: "w-full mt-4 bg-blue-900/20 hover:bg-blue-600 text-blue-500 hover:text-white text-[10px] font-black uppercase tracking-widest px-4 py-3 rounded-2xl border border-blue-500/30 transition-all shadow-md group",
                                    onClick: () => {
                                        const novaLista = [...lista];
                                        novaLista.push(""); // Adiciona espaço vazio extra
                                        updateSheetField('magias', nivel, novaLista);
                                    }
                                }, "+ ADICIONAR MAGIA")
                            ]);
                        })
                )
            ])
        ),
        // --- MENU FIXO INFERIOR (CONTROLES) ---
        el('div', { className: "fixed bottom-0 left-0 w-full p-6 z-[60] pointer-events-none" },
            el('div', { className: "max-w-7xl mx-auto flex items-end justify-center gap-4 pointer-events-auto" }, [
                // Barra de Botões Fixos
                el('div', { className: "bg-slate-900/80 backdrop-blur-xl border border-slate-700 p-4 rounded-full shadow-2xl flex items-center gap-3" }, [
                    // Botão Dado (Abre o Canvas 3D global)
                    el('button', {
                        onClick: () => setRollingModalOpen(true),
                        className: `w-16 h-16 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 border-4 ${isRollingModalOpen ? 'bg-red-600 border-red-400 rotate-45' : 'bg-amber-600 border-amber-400 hover:scale-110'}`
                    }, isRollingModalOpen ? el('span', { className: "text-3xl font-bold text-white" }, "+") : "🎲"),

                    // Botão Descanso
                    el('button', {
                        onClick: () => {
                            triggerEffect('rest');
                            handleDescansoLongo();
                        },
                        className: "w-14 h-14 bg-slate-800 hover:bg-purple-900 text-purple-400 hover:text-white rounded-full flex items-center justify-center transition-all border border-slate-700 shadow-xl"
                    }, "🌙"),

                    // Botão Editar
                    el('button', {
                        onClick: () => setEditableSheetData(characterSheetData),
                        className: "w-14 h-14 bg-slate-800 hover:bg-amber-600 text-amber-500 hover:text-white rounded-full flex items-center justify-center transition-all border border-slate-700 shadow-xl"
                    }, "✏️"),

                    // Botão Level Up (Condicional)
                    podeSubirNivel && el('button', {
                        onClick: () => setShowLevelUpModal(true),
                        className: "h-14 bg-amber-500 hover:bg-amber-400 text-black px-6 rounded-full font-black text-xs uppercase transition-all shadow-xl animate-bounce"
                    }, "🚀 Level Up!")
                ]),
                // --- GERENCIADOR DE BALÕES (Fica invisível, apenas cuidando dos dados) ---
                el(DiceRoller, {
                    recentRolls,
                    characterName
                })
            ])
        ),
        
        // --- MODAL DE LEVEL UP ---
        showLevelUpModal && el('div', { className: "fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in" },
            el('div', { className: "bg-slate-900 border-2 border-amber-500 rounded-3xl max-w-lg w-full overflow-hidden shadow-[0_0_50px_rgba(245,158,11,0.2)]" },
                // Header
                el('div', { className: "bg-amber-500 p-6 text-center" },
                    el('h2', { className: "text-3xl font-black text-slate-900 uppercase tracking-tighter" }, "🚀 Subiu de Nível!")
                ),
                // Body
                el('div', { className: "p-8 space-y-8" },
                    
                    // 1. Atributos
                    el('div', { className: "space-y-4" },
                        el('div', { className: "flex justify-between items-end border-b border-slate-700 pb-2" },
                            el('h3', { className: "text-amber-500 font-black uppercase tracking-widest text-sm" }, "💪 Atributos (+2)"),
                            el('span', { className: "text-[10px] font-bold text-slate-400 uppercase tracking-widest" }, `Pontos restantes: ${levelUpData.pointsToSpend}`)
                        ),
                        el('div', { className: "grid grid-cols-3 gap-3" },
                            Object.keys(levelUpData.attributes).map(attr => 
                                el('div', { key: attr, className: "bg-slate-800 p-3 rounded-xl border border-slate-700 flex flex-col items-center gap-2" },
                                    el('span', { className: "text-[11px] font-black tracking-widest text-slate-400 uppercase" }, attr),
                                    el('div', { className: "flex items-center gap-3" },
                                        el('button', {
                                            onClick: () => handleAttributeChange(attr, -1),
                                            disabled: levelUpData.attributes[attr] === 0,
                                            className: "w-6 h-6 rounded-full bg-slate-700 hover:bg-slate-600 flex items-center justify-center font-bold text-slate-300 disabled:opacity-30 transition-all font-sans"
                                        }, "-"),
                                        el('span', { className: `font-black text-lg ${levelUpData.attributes[attr] > 0 ? 'text-amber-400' : 'text-white'}` }, levelUpData.attributes[attr] > 0 ? `+${levelUpData.attributes[attr]}` : "0"),
                                        el('button', {
                                            onClick: () => handleAttributeChange(attr, 1),
                                            disabled: levelUpData.pointsToSpend === 0,
                                            className: "w-6 h-6 rounded-full bg-amber-500/20 hover:bg-amber-500 text-amber-500 hover:text-white flex items-center justify-center font-bold border border-amber-500/50 disabled:opacity-30 transition-all font-sans"
                                        }, "+")
                                    )
                                )
                            )
                        )
                    ),
                    
                    // 2. Dado de Vida
                    el('div', { className: "space-y-4" },
                        el('h3', { className: "text-amber-500 font-black uppercase text-sm tracking-widest border-b border-slate-700 pb-2" }, "❤️ Nova Vida Máxima"),
                        el('div', { className: "flex items-start gap-4" },
                            el('div', { className: "flex-1" },
                                el('label', { className: "text-[9px] text-slate-500 font-black uppercase tracking-widest mb-2 block" }, "Dado da Classe"),
                                el('select', {
                                    value: levelUpData.hitDie,
                                    onChange: e => setLevelUpData(prev => ({...prev, hitDie: e.target.value, hpChoice: 'roll', hpRolledValue: 0})),
                                    className: "w-full bg-slate-950 border-2 border-slate-700 text-white p-3 rounded-xl font-black outline-none focus:border-amber-500 transition-all cursor-pointer"
                                },
                                    ['6', '8', '10', '12'].map(d => el('option', { key: d, value: d }, `1d${d}`))
                                )
                            ),
                            el('div', { className: "flex-1 flex flex-col gap-2" },
                                el('button', {
                                    onClick: () => {
                                        const roll = Math.floor(Math.random() * parseInt(levelUpData.hitDie)) + 1;
                                        setLevelUpData(prev => ({...prev, hpChoice: 'roll', hpRolledValue: roll}));
                                    },
                                    className: `w-full p-2 rounded-xl border-2 font-black transition-all text-xs uppercase tracking-widest ${levelUpData.hpChoice === 'roll' && levelUpData.hpRolledValue > 0 ? 'bg-amber-500/20 border-amber-500 text-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.2)] scale-105' : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'} `
                                }, levelUpData.hpChoice === 'roll' && levelUpData.hpRolledValue > 0 ? `🎲 Caiu: ${levelUpData.hpRolledValue}` : "🎲 Rolar Média"),
                                
                                el('button', {
                                    onClick: () => setLevelUpData(prev => ({...prev, hpChoice: 'fixed', hpRolledValue: 0})),
                                    className: `w-full p-2 rounded-xl border-2 font-black transition-all text-xs uppercase tracking-widest ${levelUpData.hpChoice === 'fixed' ? 'bg-amber-500/20 border-amber-500 text-amber-400 scale-105 shadow-[0_0_10px_rgba(245,158,11,0.2)]' : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'}`
                                }, `📌 Fixo: ${(Math.floor(parseInt(levelUpData.hitDie)/2) + 1)}`)
                            )
                        ),
                        // Aviso Modificador de Constituição
                        el('p', { className: "text-[10px] text-slate-500 italic text-center mt-2 leading-relaxed" }, 
                            `Ao confirmar, o aplicativo automaticamente somará ao valor acima seu modificador de Constituição (+${Math.floor((parseInt(characterSheetData.atributos?.['CON']) || 10) - 10) / 2}).`
                        )
                    )
                ),
                
                // Footer
                el('div', { className: "bg-slate-950 p-6 flex gap-4" },
                    el('button', {
                        onClick: () => setShowLevelUpModal(false),
                        className: "flex-1 border border-slate-700 hover:bg-slate-800 text-slate-400 p-4 justify-center font-black uppercase text-xs tracking-widest rounded-xl transition-colors"
                    }, "Cancelar"),
                    el('button', {
                        onClick: handleLevelUpConfirm,
                        disabled: levelUpData.pointsToSpend > 0,
                        className: "flex-1 bg-amber-500 hover:bg-amber-400 text-slate-900 p-4 justify-center font-black uppercase text-xs tracking-widest rounded-xl shadow-[0_0_15px_rgba(245,158,11,0.3)] transition-all disabled:opacity-30 disabled:grayscale"
                    }, "🌟 Confirmar")
                )
            )
        )
    ]);
}