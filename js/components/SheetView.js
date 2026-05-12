import { DiceRoller } from './DiceRoller.js';
import { AudioManager } from '../AudioManager.js';
import { CharacterSetupModal } from './CharacterSetupModal.js';
import { TalentTooltip } from './TalentTooltip.js';
import { PlayerTutorialPopup } from './PlayerTutorialPopup.js';
import { safeParseJSON, parseImageUrl } from '../utils.js';
import { VisualInventory } from './VisualInventory.js';

const { useState, useEffect } = React;
const el = React.createElement;

export function SheetView({
    characterName,
    characterSheetData,
    characterImageUrl,
    onUpdateImage,
    onBack,
    onToggleTree,
    onUpdateSheet: updateSheetData,
    rollDice,
    iconMap,
    updateSheetField,
    turnState,
    isNewCharacter,
    sessionState,
    handleDescansoLongo,
    setEditableSheetData,
    triggerExternalRoll,
    recentRolls,
    setIsBargainOpen,
    sendChatMessage,
    chatMessages,
    onRequestDelete,
    groupNotes,
    shareNote,
    deleteNote,
    setIsLibraryOpen,
    setIsBattlemapOpen
}) {
    const charData = characterSheetData; // Alias para compatibilidade com código legado

    const [isEditingInventory, setIsEditingInventory] = useState(false);
    const [effectClass, setEffectClass] = useState(''); // Classe global (shake, sparkle, rest)
    const [bagEffect, setBagEffect] = useState(''); // Efeito local da mochila
    const [showSetupModal, setShowSetupModal] = useState(!!isNewCharacter); // Abre auto para novos
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [journalTab, setJournalTab] = useState('private'); // 'private' ou 'group'
    const [showJournal, setShowJournal] = useState(false);
    const [journalPage, setJournalPage] = useState(1);
    const [pageAnimation, setPageAnimation] = useState('');
    const [chatInput, setChatInput] = useState('');
    const [hiddenRollRequests, setHiddenRollRequests] = useState({});
    const [showTutorial, setShowTutorial] = useState(() => localStorage.getItem('has_seen_player_tutorial') !== 'true');
    const [useVisualInventory, setUseVisualInventory] = useState(true);

    // --- CÁLCULO DE BÔNUS DE INVENTÁRIO ---
    const getInventoryBonuses = () => {
        const items = (characterSheetData.outros?.['Equipamento'] || "").split(',').map(s => s.trim());
        const bonuses = {
            CA: 0, Iniciativa: 0, Deslocamento: 0,
            FOR: 0, DES: 0, CON: 0, INT: 0, SAB: 0, CAR: 0,
            skills: {}
        };

        items.forEach(item => {
            if (!item.includes('{E}')) return;
            const matches = [...item.matchAll(/\((.*?):(.*?)\)/g)];
            matches.forEach(m => {
                const key = m[1].trim().toUpperCase();
                const val = parseInt(m[2]) || 0;
                if (bonuses[key] !== undefined) bonuses[key] += val;
                else bonuses.skills[key] = (bonuses.skills[key] || 0) + val;
            });
        });
        return bonuses;
    };
    const invBonuses = getInventoryBonuses();


    const triggerEffect = (type) => {
        if (type === 'bag') {
            setBagEffect('animate-bag');
            AudioManager.play('bag');
            setTimeout(() => setBagEffect(''), 500);
            return;
        }

        setEffectClass(`animate-${type}`);
        if (type === 'shake') AudioManager.play('damage');
        else if (type === 'sparkle') AudioManager.play('heal');
        else if (type === 'shield') AudioManager.play('shield');
        else if (type === 'rest') AudioManager.play('rest');

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
    const currentHP = parseInt(charData?.recursos?.['PV Atual']) || 0;
    const [lastHP, setLastHP] = React.useState(currentHP);

    // Monitor de PV Temporário
    const currentTempHP = parseInt(charData?.recursos?.['PV Temporário']) || 0;
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

    const [quickRollOpen, setQuickRollOpen] = useState(false);
    const [localModifier, setLocalModifier] = useState(0);
    const [localRollMode, setLocalRollMode] = useState('normal');

    const openJournal = () => {
        AudioManager.play('page');
        setShowJournal(true);
    };

    const changePage = (next) => {
        if (next === journalPage) return;
        const anim = next > journalPage ? 'animate-flip-forward' : 'animate-flip-backward';
        setPageAnimation(anim);
        AudioManager.play('page');
        setTimeout(() => {
            setJournalPage(next);
            setPageAnimation('');
        }, 500);
    };

    // Rastreador de círculos de magia ativos
    const [activeCircles, setActiveCircles] = React.useState(() => {
        const circles = [];
        Object.keys(charData?.magias || {}).forEach(k => {
            if (k !== 'temMagia' && Array.isArray(charData.magias[k])) {
                if (charData.magias[k].some(m => m && m.trim() !== "")) {
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
        Object.keys(charData?.magias || {}).forEach(k => {
            if (k !== 'temMagia' && Array.isArray(charData.magias[k])) {
                if (charData.magias[k].some(m => m && m.trim() !== "")) {
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
    }, [charData?.magias]);

    // Efeito para tocar sons disparados pelo mestre
    useEffect(() => {
        if (sessionState?.triggerSound && sessionState.triggerSound.timestamp > (Date.now() - 5000)) {
            const soundType = sessionState.triggerSound.type;
            
            // Toca o som
            AudioManager.play(soundType);

            // Aciona efeito visual correspondente na tela do jogador
            const soundToEffect = {
                'damage': 'shake',
                'heal': 'sparkle',
                'shield': 'shield',
                'rest': 'rest'
            };

            if (soundToEffect[soundType]) {
                const effectName = soundToEffect[soundType];
                setEffectClass(`animate-${effectName}`);
                setTimeout(() => setEffectClass(''), effectName === 'rest' ? 3000 : 1000);
            }
        }
    }, [sessionState?.triggerSound?.timestamp]);

    if (!charData) return el('div', { className: "p-10 text-center text-slate-500" }, "Carregando ficha...");

    const el = React.createElement;
    // Helper para formatar bônus
    const fmtNum = (n) => {
        const num = parseInt(n);
        if (isNaN(num)) return n;
        return num >= 0 ? `+${num}` : num;
    };

    // Lógica de Level Up
    const xpAtual = parseInt(charData.info?.['XP']) || 0;
    const nivelAtual = parseInt(charData.info?.['Nivel']) || 1;
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

    const handleProficiencyChange = (newValStr) => {
        const newVal = parseInt(newValStr);
        if (isNaN(newVal)) return;

        const currentNivel = parseInt(charData.info?.['Nivel']) || 1;
        const fallbackProf = Math.floor((currentNivel - 1) / 4) + 2;
        const oldVal = parseInt(charData.info?.['Proficiência']) || fallbackProf;

        const profDiff = newVal - oldVal;
        if (profDiff === 0) return;

        const newPericias = JSON.parse(JSON.stringify(charData.pericias || {}));
        Object.keys(newPericias).forEach(nomePericia => {
            const isNewFormat = typeof newPericias[nomePericia] === 'object' && newPericias[nomePericia] !== null;
            const prof = isNewFormat ? newPericias[nomePericia].prof : false;
            if (prof) {
                let val = parseInt(isNewFormat ? newPericias[nomePericia].val : newPericias[nomePericia]) || 0;
                val += profDiff;
                const finalStr = val >= 0 ? `+${val}` : `${val}`;
                if (isNewFormat) {
                    newPericias[nomePericia].val = finalStr;
                } else {
                    newPericias[nomePericia] = finalStr;
                }
            }
        });

        const newAtaques = JSON.parse(JSON.stringify(charData.ataques || []));
        newAtaques.forEach(atk => {
            let b = parseInt(atk.bonus?.replace('+', '')) || 0;
            b += profDiff;
            atk.bonus = b >= 0 ? `+${b}` : `${b}`;
        });

        const newStatsMagia = JSON.parse(JSON.stringify(charData.statsMagia || {}));
        let bAtk = parseInt(newStatsMagia['Bônus de Ataque']?.replace('+', '')) || 0;
        bAtk += profDiff;
        newStatsMagia['Bônus de Ataque'] = bAtk >= 0 ? `+${bAtk}` : `${bAtk}`;

        let salv = parseInt(newStatsMagia['Salvaguarda']) || 8;
        salv += profDiff;
        newStatsMagia['Salvaguarda'] = salv.toString();

        const newData = {
            ...charData,
            info: { ...charData.info, 'Proficiência': newVal.toString() },
            pericias: newPericias,
            ataques: newAtaques,
            statsMagia: newStatsMagia
        };

        updateSheetData(newData);
    };

    const handleLevelUpConfirm = () => {
        const newNivel = nivelAtual + 1;
        // Aplica os novos atributos primeiro
        const newAtributos = { ...charData.atributos };
        Object.keys(levelUpData.attributes).forEach(attr => {
            if (levelUpData.attributes[attr] > 0) {
                newAtributos[attr] = (parseInt(newAtributos[attr]) || 10) + levelUpData.attributes[attr];
            }
        });

        // Calcula os modificadores de Constituição antigo e novo
        const oldConMod = Math.floor((parseInt(charData.atributos?.['CON']) || 10) - 10) / 2;
        const newConMod = Math.floor((parseInt(newAtributos['CON']) || 10) - 10) / 2;
        
        // HP Retroativo (aplica a diferença do modificador aos níveis anteriores)
        const retroactiveHp = Math.max(0, newConMod - oldConMod) * nivelAtual;

        // Calcula o HP recebido pelo nível atual
        let levelUpHp = 0;
        if (levelUpData.hpChoice === 'fixed') {
            levelUpHp = Math.floor(parseInt(levelUpData.hitDie) / 2) + 1 + Math.floor(newConMod);
        } else {
            const rolled = levelUpData.hpRolledValue || Math.floor(Math.random() * parseInt(levelUpData.hitDie)) + 1;
            levelUpHp = rolled + Math.floor(newConMod);
        }
        if (levelUpHp < 1) levelUpHp = 1;

        const currentMaxHp = parseInt(charData.recursos?.['PV Máximo'] || '0');
        const newMaxHp = currentMaxHp + retroactiveHp + levelUpHp;

        // --- CÁLCULO DE PROFICIÊNCIA E ATRIBUTOS (PERÍCIAS, ATAQUES, MAGIAS) ---
        const baseOldProf = Math.floor((nivelAtual - 1) / 4) + 2;
        const baseNewProf = Math.floor((newNivel - 1) / 4) + 2;
        const profDiff = baseNewProf - baseOldProf;
        
        const currentProf = parseInt(charData.info?.['Proficiência']) || baseOldProf;
        const finalProf = currentProf + profDiff;

        // Mapeamento de Perícias para Atributos
        const periciaToAttr = {
            'Acrobacia': 'DES', 'Arcanismo': 'INT', 'Atletismo': 'FOR',
            'Atuação': 'CAR', 'Enganação': 'CAR', 'Furtividade': 'DES',
            'História': 'INT', 'Intimidação': 'CAR', 'Intuição': 'SAB',
            'Investigação': 'INT', 'Lidar com Animais': 'SAB', 'Medicina': 'SAB',
            'Natureza': 'INT', 'Percepção': 'SAB', 'Persuasão': 'CAR',
            'Prestidigitação': 'DES', 'Religião': 'INT', 'Sobrevivência': 'SAB'
        };

        const newPericias = JSON.parse(JSON.stringify(charData.pericias || {}));
        Object.keys(newPericias).forEach(nomePericia => {
            const isNewFormat = typeof newPericias[nomePericia] === 'object' && newPericias[nomePericia] !== null;
            const prof = isNewFormat ? newPericias[nomePericia].prof : false;
            let val = parseInt(isNewFormat ? newPericias[nomePericia].val : newPericias[nomePericia]) || 0;

            let change = 0;
            // 1. Aumento por Proficiência (se tiver proficiência)
            if (prof && profDiff > 0) {
                change += profDiff;
            }

            // 2. Aumento por Atributo
            const attrKey = periciaToAttr[nomePericia];
            if (attrKey) {
                const oldAttrMod = Math.floor((parseInt(charData.atributos?.[attrKey]) || 10) - 10) / 2;
                const newAttrMod = Math.floor((parseInt(newAtributos[attrKey]) || 10) - 10) / 2;
                if (newAttrMod > oldAttrMod) {
                    change += (newAttrMod - oldAttrMod);
                }
            }

            if (change > 0) {
                val += change;
                const finalStr = val >= 0 ? `+${val}` : `${val}`;
                if (isNewFormat) {
                    newPericias[nomePericia].val = finalStr;
                } else {
                    newPericias[nomePericia] = finalStr;
                }
            }
        });

        // Ataques (Assume que os ataques listados se beneficiam da proficiência base do personagem)
        const newAtaques = JSON.parse(JSON.stringify(charData.ataques || []));
        if (profDiff > 0) {
            newAtaques.forEach(atk => {
                let b = parseInt(atk.bonus?.replace('+', '')) || 0;
                b += profDiff;
                atk.bonus = b >= 0 ? `+${b}` : `${b}`;
            });
        }

        // Magia
        const newStatsMagia = JSON.parse(JSON.stringify(charData.statsMagia || {}));
        if (profDiff > 0) {
            let bAtk = parseInt(newStatsMagia['Bônus de Ataque']?.replace('+', '')) || 0;
            bAtk += profDiff;
            newStatsMagia['Bônus de Ataque'] = bAtk >= 0 ? `+${bAtk}` : `${bAtk}`;

            let salv = parseInt(newStatsMagia['Salvaguarda']) || 8;
            salv += profDiff;
            newStatsMagia['Salvaguarda'] = salv.toString();
        }

        const newData = {
            ...charData,
            info: { ...charData.info, 'Nivel': newNivel.toString(), 'XP': '0', 'Proficiência': finalProf.toString() },
            recursos: { ...charData.recursos, 'PV Máximo': newMaxHp.toString() },
            atributos: newAtributos,
            pericias: newPericias,
            ataques: newAtaques,
            statsMagia: newStatsMagia
        };

        updateSheetData(newData);

        setShowLevelUpModal(false);
        setLevelUpData({
            pointsToSpend: 2,
            attributes: { FOR: 0, DES: 0, CON: 0, INT: 0, SAB: 0, CAR: 0 },
            hitDie: '8',
            hpChoice: 'roll',
            hpRolledValue: 0
        });
    };

    // Renderiza a ficha
    // Parse das Condições
    const rawConds = characterSheetData.info?.['Condicoes'] || '[]';
    const activeConditions = safeParseJSON(rawConds);

    const isMyTurn = turnState?.activeChar === characterName;

    // Handler do modal de setup
    const handleSetupSave = async (formData) => {
        const newData = JSON.parse(JSON.stringify(charData));
        if (!newData.info) newData.info = {};
        if (!newData.recursos) newData.recursos = {};

        newData.info['Nome do Personagem'] = formData['Nome do Personagem'];
        newData.info['Classe'] = formData['Classe'];
        newData.info['Raça'] = formData['Raça'];
        newData.info['Antecedente'] = formData['Antecedente'];
        newData.info['Alinhamento'] = formData['Alinhamento'];
        newData.info['Jogador'] = formData['Jogador'];
        newData.info['Nivel'] = formData['Nivel'] || '1';

        const maxHp = parseInt(formData['PV Máximo']) || 1;
        newData.recursos['PV Máximo'] = String(maxHp);
        newData.recursos['PV Atual'] = String(maxHp);
        newData.recursos['PV Perdido'] = '0';
        newData.recursos['CA'] = formData['CA'] || '10';

        await updateSheetData(newData);
        setShowSetupModal(false);
    };

    return el('div', {
        className: `min-h-screen bg-slate-950 text-slate-100 pb-32 animate-fade-in relative transition-all duration-500 ${isMyTurn ? 'ring-8 ring-amber-500/30' : ''} ${effectClass.replace('animate-bag', '')}`
    }, [
        showSetupModal && el(CharacterSetupModal, {
            key: 'setup-modal',
            initialName: characterName,
            onSave: handleSetupSave,
            onClose: () => setShowSetupModal(false)
        }),

        // --- NÉVOA DE FUNDO ---
        activeConditions.length > 0 && el('div', {
            key: 'mist',
            className: "fixed inset-0 pointer-events-none z-0 opacity-60 transition-all duration-1000 animate-pulse-soft",
            style: {
                background: activeConditions
                    .filter(c => c.color)
                    .map((c, i) => {
                        const pos = [
                            'at center',
                            'at 20% 20%',
                            'at 80% 80%',
                            'at 80% 20%',
                            'at 20% 80%'
                        ][i % 5];
                        return `radial-gradient(circle ${pos}, transparent 20%, ${c.color}66 100%)`;
                    }).join(', ') || `radial-gradient(circle at center, transparent 30%, #a855f777 100%)`,
                boxShadow: activeConditions
                    .filter(c => c.color)
                    .map(c => `inset 0 0 200px 80px ${c.color}55`)
                    .join(', ')
            }
        }),
 
        // --- CAMADA DE AMBIENTE (CLIMA) ---
        sessionState?.environment && sessionState.environment !== 'none' && el('div', {
            key: 'env-overlay',
            className: "fixed inset-0 pointer-events-none z-[1]"
        }, [
            // Overlay de Cor Básica
            el('div', {
                key: 'env-tint',
                className: `absolute inset-0 transition-all duration-[2000ms] ${
                    sessionState.environment === 'rain' ? 'bg-blue-500/10' :
                    sessionState.environment === 'fog' ? 'bg-slate-300/10' :
                    sessionState.environment === 'storm' ? 'bg-indigo-900/20' :
                    sessionState.environment === 'night' ? 'bg-slate-950/40' :
                    sessionState.environment === 'cave' ? 'bg-black/40' : ''
                }`
            }),

            // Efeito de Raios (Storm)
            sessionState.environment === 'storm' && el('div', {
                key: 'lightning-effect',
                className: "absolute inset-0 animate-lightning"
            }),

            // Efeito de Estrelas (Night)
            sessionState.environment === 'night' && el('div', {
                key: 'stars-container',
                className: "absolute inset-0"
            }, Array.from({ length: 40 }).map((_, i) => el('div', {
                key: `star-${i}`,
                className: "absolute bg-white rounded-full animate-twinkle",
                style: {
                    top: `${Math.random() * 100}%`,
                    left: `${Math.random() * 100}%`,
                    width: `${Math.random() * 3}px`,
                    height: (Math.random() * 3) + 'px',
                    '--twinkle-duration': `${2 + Math.random() * 4}s`,
                    opacity: 0.1 + Math.random() * 0.5
                }
            }))),

            // Efeito de Névoa Extra (Fog)
            sessionState.environment === 'fog' && el('div', {
                key: 'fog-extra',
                className: "absolute inset-0 bg-gradient-to-b from-white/5 via-transparent to-white/5 animate-pulse-soft"
            })
        ]),

        // --- BANNER DE TURNO ---
        isMyTurn && el('div', {
            key: 'turn-banner',
            className: "fixed top-24 left-1/2 -translate-x-1/2 z-[60] bg-gradient-to-r from-amber-600 via-yellow-400 to-amber-600 text-slate-900 px-8 py-2 rounded-full font-black uppercase tracking-[0.3em] shadow-[0_0_30px_rgba(251,191,36,0.6)] animate-bounce text-xs border-2 border-amber-200"
        }, "🔥 É a sua vez!"),

        // --- ÍCONES DE STATUS (Minecraft Style) ---
        el('div', {
            key: 'status-icons',
            className: "fixed top-24 right-8 z-50 flex flex-col gap-4"
        }, (activeConditions || []).map((cond) =>
            el('div', {
                key: cond.name,
                className: "group relative w-14 h-14 bg-slate-900/95 border-[3px] border-amber-600 rounded-lg flex items-center justify-center shadow-[0_0_20px_rgba(251,191,36,0.2),inset_0_0_10px_rgba(0,0,0,0.5)] backdrop-blur-md cursor-help transition-all hover:scale-110 active:scale-95",
                style: { borderColor: '#d97706', boxShadow: `0 0 0 2px #451a03, 0 0 20px ${cond.color || '#f59e0b'}44` },
                title: `${cond.name}: ${cond.turns} turnos restantes`
            }, [
                el('span', { key: 'icon', className: "text-3xl drop-shadow-[0_2px_5px_rgba(0,0,0,0.8)]" }, cond.icon),
                el('span', { key: 'turns', className: "absolute -bottom-2 -right-2 bg-amber-500 text-slate-950 text-[10px] font-black px-1.5 py-0.5 rounded border-2 border-slate-950 shadow-lg" }, cond.turns),
                
                // Tooltip Custom "Minecraft UI" style
                el('div', { 
                    key: 'tooltip', 
                    className: "absolute right-16 top-0 bg-slate-900/95 border-2 border-amber-600 p-3 rounded-xl opacity-0 group-hover:opacity-100 transition-all scale-90 group-hover:scale-100 whitespace-nowrap pointer-events-none shadow-2xl z-[100]" 
                }, [
                    el('p', { key: 'name', className: "text-xs font-black uppercase text-amber-500 mb-1" }, cond.name),
                    el('p', { key: 'duration', className: "text-[9px] text-slate-400 font-bold" }, [
                        el('span', { className: "text-amber-600 mr-1" }, "⏳"),
                        `${cond.turns} rodada(s) restantes`
                    ])
                ])
            ])
        )),

        // --- HEADER FICHADO ---
        el('header', { key: 'sheet-header', className: "bg-slate-900/90 backdrop-blur-xl border-b border-slate-800 p-4 md:p-6 sticky top-0 z-40" },
            el('div', { className: "max-w-7xl mx-auto flex justify-between items-center" },
                el('div', { className: "flex items-center gap-4" }, [
                    el('div', { 
                        onClick: () => {
                            const url = prompt("Cole o link da imagem (Google, Pinterest) ou ID do Google Drive:", characterImageUrl || '');
                            if (url !== null) {
                                onUpdateImage(parseImageUrl(url));
                            }
                        },
                        className: "w-12 h-12 bg-slate-800 rounded-xl border border-slate-700 shadow-inner flex items-center justify-center overflow-hidden cursor-pointer hover:border-amber-500 transition-all group/avatar relative"
                    }, [
                        characterImageUrl ? 
                            el('img', { src: characterImageUrl, className: "w-full h-full object-cover" }) : 
                            el('span', { className: "text-lg" }, "👤"),
                        el('div', { className: "absolute inset-0 bg-amber-500/20 opacity-0 group-hover/avatar:opacity-100 flex items-center justify-center transition-opacity" }, 
                            el('span', { className: "text-[7px] font-black text-white uppercase" }, "Mudar")
                        )
                    ]),
                    el('div', null,
                        el('h2', { className: "text-xl md:text-2xl font-black uppercase tracking-tighter text-white" }, characterName),
                        el('p', { className: "text-slate-500 text-[10px] font-bold uppercase tracking-widest italic" }, characterSheetData.info?.['Classe'] || 'Aventureiro')
                    )
                ]),
                el('div', { className: "flex gap-3" },
                    el('button', {
                        onClick: () => setIsBattlemapOpen(true),
                        className: "bg-green-600/10 hover:bg-green-600 text-green-500 hover:text-white text-[10px] font-black uppercase tracking-widest border border-green-600/30 px-4 py-2 rounded-xl transition-all"
                    }, "🗺️ Mapa"),
                    el('button', {
                        onClick: onToggleTree,
                        className: "bg-purple-600/10 hover:bg-purple-600 text-purple-500 hover:text-white text-[10px] font-black uppercase tracking-widest border border-purple-600/30 px-4 py-2 rounded-xl transition-all"
                    }, "⭐ Talentos"),

                    el('button', {
                        key: 'btn-library',
                        onClick: () => setIsLibraryOpen(true),
                        className: "bg-amber-600/10 hover:bg-amber-600 text-amber-500 hover:text-white text-[10px] font-black uppercase tracking-widest border border-amber-600/30 px-4 py-2 rounded-xl transition-all"
                    }, "📚 Biblioteca"),
                    el('button', {
                        key: 'btn-bargain',
                        onClick: () => setIsBargainOpen(true),
                        className: "bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white text-[10px] font-black uppercase tracking-widest border border-red-600/30 px-4 py-2 rounded-xl transition-all"
                    }, "👺 Barganhas"),
                    el('button', {
                        key: 'btn-help',
                        onClick: () => setShowTutorial(true),
                        className: "w-10 h-10 bg-slate-800 hover:bg-amber-600 text-slate-400 hover:text-white rounded-xl border border-slate-700 flex items-center justify-center transition-all shadow-lg",
                        title: "Ajuda/Tutorial"
                    }, "❓"),
                    el('button', {
                        key: 'btn-request-delete',
                        onClick: onRequestDelete,
                        className: "w-10 h-10 bg-slate-800 hover:bg-red-900 text-slate-400 hover:text-white rounded-xl border border-slate-700 flex items-center justify-center transition-all shadow-lg",
                        title: "Solicitar Exclusão de Ficha"
                    }, "🗑️"),
                    el('button', {
                        key: 'btn-exit',
                        onClick: onBack,
                        className: "w-10 h-10 bg-slate-800 hover:bg-red-600 text-slate-400 hover:text-white rounded-xl border border-slate-700 flex items-center justify-center transition-all shadow-lg",
                        title: "Sair da Ficha"
                    }, "✕")
                )
            )
        ),
        // --- CONTEÚDO PRINCIPAL ---
        el('main', { key: 'sheet-main', className: "max-w-7xl mx-auto p-4 md:p-6 space-y-10" },
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
                        ),
                        characterSheetData.allowEditing && el('div', { className: "flex justify-between items-center border-t border-slate-800 pt-2 group relative" },
                            el('p', { className: "text-[8px] font-black text-amber-500 uppercase cursor-help", title: "Bônus de Proficiência (Editável pelo Mestre)" }, "Proficiência"),
                            el('input', {
                                className: "bg-transparent text-right text-[10px] font-black text-amber-400 outline-none w-8 hover:bg-slate-800 rounded px-1 transition-colors",
                                defaultValue: characterSheetData.info?.['Proficiência'] || (Math.floor((parseInt(characterSheetData.info?.['Nivel'] || 1) - 1) / 4) + 2).toString(),
                                onBlur: (e) => handleProficiencyChange(e.target.value)
                            })
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

                                    await updateSheetData(newData); // Envia para a planilha correta
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

                                    await updateSheetData(newData);
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

                                    await updateSheetData(newData);
                                    document.getElementById('hpModifierInput').value = '';
                                }
                            }, "Escudo")
                        )
                    )
                ),

                // STATUS (Direita - 8 Colunas)
                el('div', { className: "lg:col-span-8 grid grid-cols-2 md:grid-cols-4 gap-4" },
                    // CA, Iniciativa, Deslocamento, PV Máximo
                    [['CA', (parseInt(characterSheetData.recursos?.['CA']) || 10) + invBonuses.CA, 'text-blue-400', "🛡️", invBonuses.CA],
                    ['Iniciativa', fmtNum((parseInt(characterSheetData.recursos?.['Iniciativa']) || 0) + invBonuses.Iniciativa), 'text-amber-500', "⚡", invBonuses.Iniciativa],
                    ['Deslocamento', characterSheetData.recursos?.['Deslocamento'], 'text-emerald-400', "👣", invBonuses.Deslocamento],
                    ['PV Máximo', characterSheetData.recursos?.['PV Máximo'], 'text-green-500', "❤️", 0]
                    ].map(([label, val, color, icon, bonus]) =>
                        el('div', { key: label, className: "bg-slate-900 border-2 border-slate-800 p-5 rounded-[2rem] text-center shadow-xl transition-all relative group" }, [
                            el('span', { className: `${color} text-xl` }, icon),
                            el('p', { className: "text-[9px] font-black text-slate-500 uppercase mt-1" }, label),
                            el('p', { className: `text-2xl font-black ${color}` }, val),
                            bonus !== 0 && el('span', { className: "absolute top-2 right-4 text-[8px] font-black text-amber-500 animate-pulse" }, `+${bonus}`)
                        ])
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
                    const valueStr = characterSheetData.atributos?.[key] || '10';
                    const bonus = invBonuses[key] || 0;
                    const value = (parseInt(valueStr) || 10) + bonus;
                    
                    // Cálculo dinâmico do modificador: (Atributo - 10) / 2 arredondado para baixo.
                    const modNum = Math.floor((value - 10) / 2);
                    const mod = fmtNum(modNum);

                    return el('div', { key: key, className: "bg-slate-900 border-2 border-slate-800 rounded-3xl text-center shadow-xl hover:border-amber-500/40 transition-all overflow-hidden flex flex-col" },
                        el('div', { className: "p-3 pb-2" },
                            el('p', { className: "text-[9px] font-black text-slate-500 uppercase mb-1" }, key),
                            el('p', { className: "text-xs font-bold text-slate-400 italic" }, valueStr)
                        ),
                        el('div', { className: "border-t border-slate-800 w-full" }),
                        el('div', { className: "p-4 bg-slate-950/40 flex-grow flex items-center justify-center" },
                            el('p', { className: `text-4xl font-black ${modNum >= 0 ? 'text-amber-500' : 'text-red-500'}` }, mod)
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
                    (characterSheetData.ataques || []).map((atk, idx) =>
                        el('div', { key: `atk-${idx}`, className: "grid grid-cols-12 items-center bg-slate-950/40 border border-slate-800 p-4 rounded-2xl group hover:border-amber-500/40 transition-all relative" },
                            // Botão Deletar Ataque
                            el('button', {
                                key: "btn-del",
                                className: "absolute -top-2 -right-2 w-5 h-5 bg-red-900 border border-red-500 text-white rounded-full flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100 transition-opacity z-10",
                                onClick: () => {
                                    const novosAtaques = [...characterSheetData.ataques];
                                    novosAtaques.splice(idx, 1);
                                    updateSheetField('ataques', null, novosAtaques);
                                }
                            }, "×"),
                            
                            // Nome
                            el('div', { className: "col-span-4 pr-2" }, 
                                el('input', {
                                    className: "bg-transparent text-slate-200 font-bold text-sm truncate uppercase tracking-tight outline-none w-full focus:text-amber-500",
                                    defaultValue: atk.nome,
                                    onBlur: (e) => {
                                        const novosAtaques = [...characterSheetData.ataques];
                                        novosAtaques[idx].nome = e.target.value;
                                        updateSheetField('ataques', null, novosAtaques);
                                    }
                                })
                            ),
                            // Bônus
                            el('div', { className: "col-span-2 text-center" }, 
                                el('input', {
                                    className: "bg-slate-900 px-3 py-1 rounded-lg text-amber-500 font-black text-xs border border-slate-800 shadow-inner w-12 text-center outline-none focus:border-amber-500",
                                    defaultValue: atk.bonus,
                                    onBlur: (e) => {
                                        const novosAtaques = [...characterSheetData.ataques];
                                        novosAtaques[idx].bonus = e.target.value;
                                        updateSheetField('ataques', null, novosAtaques);
                                    }
                                })
                            ),
                            // Dano
                            el('div', { className: "col-span-3 text-center px-1" }, 
                                el('input', {
                                    className: "bg-transparent text-blue-400 font-black text-sm drop-shadow-[0_0_8px_rgba(59,130,246,0.3)] text-center outline-none w-full focus:text-white",
                                    defaultValue: atk.dano,
                                    onBlur: (e) => {
                                        const novosAtaques = [...characterSheetData.ataques];
                                        novosAtaques[idx].dano = e.target.value;
                                        updateSheetField('ataques', null, novosAtaques);
                                    }
                                })
                            ),
                            // Tipo
                            el('div', { className: "col-span-3 text-right" }, 
                                el('input', {
                                    className: "text-[10px] text-slate-500 font-black uppercase italic tracking-tighter bg-slate-900/50 px-2 py-1 rounded-md border border-slate-800 text-right outline-none w-full focus:text-slate-200",
                                    defaultValue: atk.tipo,
                                    onBlur: (e) => {
                                        const novosAtaques = [...characterSheetData.ataques];
                                        novosAtaques[idx].tipo = e.target.value;
                                        updateSheetField('ataques', null, novosAtaques);
                                    }
                                })
                            )
                        )
                    ),

                    // BOTÃO ADICIONAR ATAQUE
                    el('button', {
                        className: "w-full py-3 bg-slate-800/50 hover:bg-slate-700/50 border border-dashed border-slate-700 rounded-xl text-slate-500 hover:text-amber-500 text-[10px] font-black uppercase tracking-widest transition-all",
                        onClick: () => {
                            const novosAtaques = [...(characterSheetData.ataques || [])];
                            novosAtaques.push({ nome: "NOVO ATAQUE", bonus: "+0", dano: "1d6", tipo: "DANO" });
                            updateSheetField('ataques', null, novosAtaques);
                            AudioManager.play('click');
                        }
                    }, "+ Adicionar Ataque ou Magia")
                )
            ),
            // --- BLOCO 5: PERÍCIAS E TALENTOS (GRID 2) ---
            el('div', { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8" },
                // Perícias (4 colunas)
                el('div', { className: "lg:col-span-4 bg-slate-900 border border-slate-800 p-6 rounded-[2.5rem] shadow-xl flex flex-col h-[500px]" },
                    el('h4', { className: "text-amber-500 font-black mb-6 flex items-center gap-2 uppercase text-xs italic border-b border-amber-900/20 pb-3" }, "🎯 Perícias"),
                    el('div', { className: "flex-grow overflow-y-auto pr-2 custom-scrollbar space-y-1" },
                        (() => {
                            const currentProf = parseInt(characterSheetData.info?.['Proficiência']) || Math.floor((parseInt(characterSheetData.info?.['Nivel'] || 1) - 1) / 4) + 2;
                            const periciaToAttr = {
                                'Acrobacia': 'DES', 'Arcanismo': 'INT', 'Atletismo': 'FOR',
                                'Atuação': 'CAR', 'Enganação': 'CAR', 'Furtividade': 'DES',
                                'História': 'INT', 'Intimidação': 'CAR', 'Intuição': 'SAB',
                                'Investigação': 'INT', 'Lidar com Animais': 'SAB', 'Medicina': 'SAB',
                                'Natureza': 'INT', 'Percepção': 'SAB', 'Persuasão': 'CAR',
                                'Prestidigitação': 'DES', 'Religião': 'INT', 'Sobrevivência': 'SAB'
                            };

                            return Object.entries(characterSheetData.pericias || {}).map(([key, data]) => {
                                // Suporte a compatibilidade: se for string, converte pra novo formato assumindo sem proficiência
                                const isNewFormat = typeof data === 'object' && data !== null;
                                const value = isNewFormat ? data.val : data;
                                const isProficient = isNewFormat ? data.prof : false;

                                const attrKey = periciaToAttr[key];
                                const attrVal = (parseInt(characterSheetData.atributos?.[attrKey]) || 10) + (invBonuses[attrKey] || 0);
                                const attrMod = Math.floor((attrVal - 10) / 2);
                                const skillBonus = invBonuses.skills[key.toUpperCase()] || 0;
                                const baseValue = attrMod + (isProficient ? currentProf : 0) + skillBonus;
                                const baseValueStr = baseValue >= 0 ? `+${baseValue}` : `${baseValue}`;

                                const rawVal = parseInt(value) || 0;
                                const finalVal = rawVal + skillBonus;
                                const finalValStr = finalVal >= 0 ? `+${finalVal}` : `${finalVal}`;

                                return el('div', { key: key, className: "flex justify-between items-center text-[11px] border-b border-slate-800/30 py-2.5 hover:bg-white/5 px-2 rounded-lg group transition-colors" },
                                    el('span', { className: "text-slate-400 font-bold uppercase group-hover:text-slate-200 flex items-center gap-2" }, 
                                        el('button', {
                                            className: `w-2 h-2 rounded-full transition-all flex-shrink-0 ${characterSheetData.allowEditing ? 'cursor-pointer hover:scale-150 hover:bg-emerald-400' : 'cursor-default'} ${isProficient ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]' : 'border border-slate-700 bg-slate-900/50'}`,
                                            title: characterSheetData.allowEditing ? "Clique para inverter proficiência" : "",
                                            onClick: () => {
                                                if (!characterSheetData.allowEditing) return;
                                                const newPericias = JSON.parse(JSON.stringify(characterSheetData.pericias || {}));
                                                if (typeof newPericias[key] !== 'object' || newPericias[key] === null) {
                                                    newPericias[key] = { val: newPericias[key] || '+0', prof: false };
                                                }
                                                const isNowProf = !isProficient;
                                                newPericias[key].prof = isNowProf;
                                                
                                                let numericVal = parseInt(newPericias[key].val) || 0;
                                                numericVal += isNowProf ? currentProf : -currentProf;
                                                newPericias[key].val = numericVal >= 0 ? `+${numericVal}` : `${numericVal}`;
                                                
                                                updateSheetData({ ...characterSheetData, pericias: newPericias });
                                            }
                                        }),
                                        key,
                                        skillBonus !== 0 && el('span', { className: "text-[9px] text-amber-400 ml-1 font-normal lowercase tracking-widest", title: "Bônus de Equipamento" }, `(${skillBonus > 0 ? '+'+skillBonus : skillBonus})`)
                                    ),
                                    el('div', { className: "text-right flex items-center gap-2" },
                                        el('span', { className: "text-[9px] text-slate-600 font-bold hidden group-hover:block transition-all", title: "Valor base puro (Atributo + Proficiência)" }, `[${baseValueStr}]`),
                                        characterSheetData.allowEditing ? el('input', {
                                            key: `input-${key}-${skillBonus}`,
                                            className: "bg-transparent text-amber-400 font-black w-8 text-right outline-none hover:bg-slate-800 focus:bg-slate-800 rounded transition-colors cursor-text",
                                            defaultValue: finalValStr,
                                            onBlur: (e) => {
                                                const newVal = parseInt(e.target.value) || 0;
                                                const newBaseVal = newVal - skillBonus;
                                                const newBaseValStr = newBaseVal >= 0 ? `+${newBaseVal}` : `${newBaseVal}`;

                                                const newPericias = JSON.parse(JSON.stringify(characterSheetData.pericias || {}));
                                                if (typeof newPericias[key] !== 'object' || newPericias[key] === null) {
                                                    newPericias[key] = { val: newBaseValStr, prof: isProficient };
                                                } else {
                                                    newPericias[key].val = newBaseValStr;
                                                }
                                                updateSheetData({ ...characterSheetData, pericias: newPericias });
                                            }
                                        }) : el('span', { className: "text-amber-400 font-black w-6 text-right inline-block" }, finalValStr)
                                    )
                                );
                            });
                        })()
                    )
                ),
                // --- Características e Talentos Editáveis ---
                el('div', { key: 'talents-section', className: "lg:col-span-8 bg-slate-900 border border-slate-800 p-6 rounded-[2.5rem] shadow-xl flex flex-col" }, [
                    el('div', { key: 'talents-header', className: "flex justify-between items-center mb-6 border-b border-purple-900/20 pb-3" }, [
                        el('h4', { key: 'talents-title', className: "text-purple-400 font-black uppercase text-xs italic flex items-center gap-2 tracking-widest" }, "✨ Características e Talentos"),
                        el('button', {
                            key: 'add-talent-btn',
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
                    
                    el('div', { key: 'talents-list', className: "space-y-4 overflow-y-auto pr-2 custom-scrollbar flex-grow h-[400px]" },
                        // Pega a lista atual ou um array de 4 itens como base mínima (por compatibilidade)
                        (() => {
                            let talentosAtuais = characterSheetData.outros?.['Talentos'] || [];
                            if (!Array.isArray(talentosAtuais)) {
                                talentosAtuais = typeof talentosAtuais === 'string' ? talentosAtuais.split('/').map(s=>s.trim()) : [];
                            }
                            
                            // Garante que tenha pelo menos 1 item na tela
                            if (talentosAtuais.length === 0) talentosAtuais = [""];

                            return talentosAtuais.map((talentTitle, idx) => {
                                const talentDesc = characterSheetData.outros?.[`desc_talento_${idx}`] || "";

                                return el('div', {
                                    key: `talent-${idx}-${talentTitle}`,
                                    className: "bg-slate-950/50 p-4 rounded-3xl border border-slate-800 group focus-within:border-purple-500/50 transition-all relative"
                                }, [
                                    // BOTAO DE EXCLUIR
                                    el('button', {
                                        key: `delete-${idx}`,
                                        className: "absolute top-3 right-4 text-[10px] text-slate-600 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 uppercase tracking-widest font-black",
                                        onClick: () => {
                                            if (confirm(`Excluir a característica "${talentTitle || 'vazia'}"?`)) {
                                                const newTalents = [...talentosAtuais];
                                                newTalents.splice(idx, 1); 
                                                const fullData = JSON.parse(JSON.stringify(characterSheetData));
                                                if (!fullData.outros) fullData.outros = {};
                                                fullData.outros['Talentos'] = newTalents.join(' / ');
                                                updateSheetData(fullData);
                                            }
                                        }
                                    }, "×"),

                                    // CAMPO: NOME DO TALENTO
                                    el('input', {
                                        className: "bg-transparent text-slate-100 font-bold text-sm uppercase outline-none focus:text-purple-400 block w-full pr-10",
                                        placeholder: "Nova Característica...",
                                        key: `input-${idx}-${talentTitle}`,
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
                ])
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
                el('h3', { key: 'treasury-title', className: "text-3xl font-black text-amber-500 uppercase tracking-tighter italic flex items-center gap-4" }, "🔨 Bolsa de Tesouros e Itens"),

                el('div', { key: 'treasury-grid', className: "grid grid-cols-1 lg:grid-cols-12 gap-8" }, [

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
                                    key: `${sigla}-${characterSheetData.outros?.[sigla] || '0'}`,
                                    type: 'text',
                                    className: "bg-transparent text-3xl font-black text-white text-right w-24 outline-none focus:text-amber-500 transition-colors",
                                    defaultValue: characterSheetData.outros?.[sigla] || '0',
                                    onBlur: (e) => {
                                        if (characterSheetData.outros?.[sigla] !== e.target.value) {
                                            AudioManager.play('coins');
                                            updateSheetField('outros', sigla, e.target.value);
                                        }
                                    }
                                })
                            ])
                        )
                    ),

                    // --- BLOCO DA MOCHILA (MODO VISUALIZAÇÃO COM BOLHAS + MODO EDIÇÃO) ---
                    el('div', { key: 'bag-section', className: `lg:col-span-8 bg-slate-900 border-2 border-slate-800 p-8 rounded-[3rem] shadow-xl flex flex-col transition-transform ${bagEffect}` }, [
                        el('div', { key: 'bag-header', className: "flex justify-between items-center mb-6" }, [
                            el('h4', { key: 'bag-title', className: "text-slate-400 font-black uppercase text-xs tracking-widest flex items-center gap-2 italic" }, "🎒 Mochila de Itens"),
                            el('span', { key: 'bag-hint', className: "text-[10px] text-slate-600 font-bold uppercase" },
                                isEditingInventory ? "Editando..." : "Clique para editar"
                            )
                        ]),

                        el('div', {
                            className: `bg-slate-950/40 border-2 border-slate-800 rounded-3xl p-6 flex-grow min-h-[160px] transition-all ${isEditingInventory ? 'border-amber-500/50 ring-2 ring-amber-500/10' : 'hover:border-slate-700 hover:bg-slate-950/60'}`
                        },
                            useVisualInventory && !isEditingInventory ?
                                el(VisualInventory, {
                                    itemsString: characterSheetData.outros?.['Equipamento'] || "",
                                    onUpdate: (newVal) => updateSheetField('outros', 'Equipamento', newVal),
                                    onToggleClassic: () => setIsEditingInventory(true)
                                }) :
                                (isEditingInventory ?
                                    // --- MODO EDIÇÃO (TEXTAREA) ---
                                    el('textarea', {
                                        autoFocus: true,
                                        className: "w-full h-40 bg-transparent text-slate-300 font-medium text-sm outline-none resize-none leading-relaxed",
                                        placeholder: "Item 1, Item 2, Item 3...",
                                        defaultValue: characterSheetData.outros?.['Equipamento'] || "",
                                        onBlur: (e) => {
                                            setIsEditingInventory(false);
                                            updateSheetField('outros', 'Equipamento', e.target.value);
                                        }
                                    }) :
                                    // --- MODO VISUALIZAÇÃO (BOLHAS) ---
                                    el('div', { 
                                        className: "flex flex-wrap gap-2.5 content-start cursor-pointer",
                                        onClick: () => setIsEditingInventory(true)
                                    }, [
                                        (characterSheetData.outros?.['Equipamento'] || "").split(',').map((item, idx) => {
                                            const cleanItem = item.trim();
                                            if (!cleanItem || cleanItem === '-') return null;
                                            return el('span', {
                                                key: `item-${idx}-${cleanItem}`,
                                                className: "bg-amber-600/10 text-amber-400 px-4 py-1.5 rounded-full text-[10px] font-black border border-amber-600/20 shadow-sm transition-all hover:scale-105 hover:bg-amber-600/20 uppercase tracking-tight"
                                            }, cleanItem);
                                        }).filter(Boolean),
                                        (characterSheetData.outros?.['Equipamento'] || "").split(',').filter(item => item.trim() !== "" && item.trim() !== "-").length === 0 &&
                                        el('p', { className: "text-slate-700 italic text-sm" }, "Mochila vazia... Clique para adicionar itens.")
                                    ]))
                        )
                    ])
                ])
            ]),
            // --- BLOCO 8: GRIMÓRIO ARCANO ---
            el('div', { key: 'grimoire-section', className: "mt-12 space-y-8 border-t border-slate-800 pt-12" }, [

                // CABEÇALHO: Stats de Magia (Sempre Renderiza)
                el('div', { key: 'grimoire-header', className: "flex flex-col md:flex-row items-center justify-between gap-6" }, [
                    el('h3', { key: 'grimoire-title', className: "text-3xl font-black text-blue-500 uppercase tracking-tighter italic flex items-center gap-4" }, "🧙🏾‍♂️ Grimório Arcano"),

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
                                            updateSheetData(newData);
                                        }
                                    }
                                }, "🗑️"),

                                el('h4', { key: 'title-' + nivel, className: "text-blue-400 font-black uppercase text-xl italic mb-4 border-b border-blue-900/30 pb-5" }, nivel),

                                // --- CONTADOR DE SLOTS (O NOVO RECURSO) ---
                                (() => {
                                    const slots = characterSheetData.magias.slots || {};
                                    const slotInfo = slots[nivel] || { max: 0, used: 0 };
                                    const maxSlots = parseInt(slotInfo.max) || 0;
                                    const usedSlots = parseInt(slotInfo.used) || 0;

                                    return el('div', { key: 'slots-ctrl-' + nivel, className: "flex items-center justify-between mb-8 bg-blue-950/20 p-4 rounded-3xl border border-blue-500/20" }, [
                                        el('div', { className: "flex items-center gap-3 overflow-hidden" }, [
                                            el('span', { className: "text-[10px] font-black text-blue-400 uppercase tracking-widest whitespace-nowrap" }, "Slots:"),
                                            el('div', { className: "flex flex-wrap gap-2" }, 
                                                Array.from({ length: maxSlots }).map((_, i) => el('button', {
                                                    key: 'slot-' + i,
                                                    onClick: () => {
                                                        const newUsed = (i + 1 === usedSlots) ? i : i + 1;
                                                        const newSlots = { ...slots, [nivel]: { ...slotInfo, used: newUsed } };
                                                        updateSheetField('magias', 'slots', newSlots);
                                                        AudioManager.play('click');
                                                    },
                                                    className: `w-5 h-5 rounded-full border-2 transition-all ${i < usedSlots ? 'bg-blue-500 border-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.3)]' : 'border-blue-900/50 hover:border-blue-500/40'}`
                                                }))
                                            )
                                        ]),
                                        el('div', { className: "flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded-2xl border border-slate-800" }, [
                                            el('button', { 
                                                onClick: () => {
                                                    const newMax = Math.max(0, maxSlots - 1);
                                                    const newSlots = { ...slots, [nivel]: { ...slotInfo, max: newMax, used: Math.min(usedSlots, newMax) } };
                                                    updateSheetField('magias', 'slots', newSlots);
                                                },
                                                className: "text-blue-400 hover:text-white font-bold w-6 h-6 flex items-center justify-center bg-slate-800 rounded-lg transition-colors" 
                                            }, "−"),
                                            el('p', { className: "text-[10px] font-black text-blue-100 min-w-[3rem] text-center uppercase" }, `Max: ${maxSlots}`),
                                            el('button', { 
                                                onClick: () => {
                                                    const newMax = maxSlots + 1;
                                                    const newSlots = { ...slots, [nivel]: { ...slotInfo, max: newMax } };
                                                    updateSheetField('magias', 'slots', newSlots);
                                                },
                                                className: "text-blue-400 hover:text-white font-bold w-6 h-6 flex items-center justify-center bg-slate-800 rounded-lg transition-colors" 
                                            }, "+")
                                        ])
                                    ]);
                                })(),

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
                // Barra de Botões Fixos
                el('div', { key: 'footer-controls', className: "flex flex-col items-center gap-3" }, [
                    // MENU QUICK ROLL (FLUTUANTE SOBRE O DADO)
                    quickRollOpen && el('div', { key: 'qr-menu', className: "bg-slate-900/95 backdrop-blur-2xl border-2 border-purple-500/40 p-5 rounded-[2.5rem] shadow-2xl animate-slide-up mb-2 flex flex-col gap-4 min-w-[300px]" }, [
                        // Modos e Modificador
                        el('div', { key: 'top-opts', className: "flex items-center justify-between border-b border-slate-800 pb-3" }, [
                            el('div', { key: 'modes', className: "flex gap-2" }, [
                                el('button', {
                                    onClick: () => setLocalRollMode('normal'),
                                    className: `px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${localRollMode === 'normal' ? 'bg-purple-600 text-white' : 'bg-slate-800 text-slate-500 hover:text-slate-300'}`
                                }, "Normal"),
                                el('button', {
                                    onClick: () => setLocalRollMode('vantagem'),
                                    className: `px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${localRollMode === 'vantagem' ? 'bg-amber-600 text-white' : 'bg-slate-800 text-slate-500 hover:text-amber-500'}`
                                }, "Vant."),
                                el('button', {
                                    onClick: () => setLocalRollMode('desvantagem'),
                                    className: `px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${localRollMode === 'desvantagem' ? 'bg-red-600 text-white' : 'bg-slate-800 text-slate-500 hover:text-red-500'}`
                                }, "Desv."),
                            ]),
                            el('div', { key: 'mod', className: "flex items-center bg-slate-950 rounded-xl border border-slate-800 p-1" }, [
                                el('button', { onClick: () => setLocalModifier(m => m - 1), className: "px-2 text-white font-bold" }, "-"),
                                el('span', { className: "w-8 text-center text-xs font-black text-amber-500" }, localModifier >= 0 ? `+${localModifier}` : localModifier),
                                el('button', { onClick: () => setLocalModifier(m => m + 1), className: "px-2 text-white font-bold" }, "+")
                            ])
                        ]),
                        // Grid de Dados
                        el('div', { key: 'dice-grid', className: "grid grid-cols-4 gap-2" }, 
                            [4, 6, 8, 10, 12, 20, 100].map(sides => 
                                el('button', {
                                    key: sides,
                                    onClick: () => {
                                        triggerExternalRoll(sides, false, localModifier, localRollMode);
                                        setQuickRollOpen(false);
                                    },
                                    className: "h-12 bg-slate-800 hover:bg-amber-600 text-white font-black text-xs rounded-xl border border-slate-700 hover:border-amber-400 transition-all flex flex-col items-center justify-center group"
                                }, [
                                    el('span', { className: "text-[8px] text-slate-500 group-hover:text-amber-200" }, "D"),
                                    sides
                                ])
                            )
                        )
                    ]),
                    
                    el('div', { key: 'main-bar', className: "bg-slate-900/80 backdrop-blur-xl border border-slate-700 p-4 rounded-full shadow-2xl flex items-center gap-3" }, [
                        // Botão Dado (Abre o Canvas 3D global)
                        el('button', {
                            onClick: () => setQuickRollOpen(!quickRollOpen),
                            className: `w-16 h-16 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 border-4 ${quickRollOpen ? 'bg-red-600 border-red-400 rotate-45' : 'bg-amber-600 border-amber-400 hover:scale-110'}`
                        }, quickRollOpen ? el('span', { className: "text-3xl font-bold text-white" }, "+") : "🎲"),

                        // Botão Caderno
                        el('button', {
                            onClick: openJournal,
                            className: "w-14 h-14 bg-slate-800 hover:bg-orange-900 text-orange-400 hover:text-white rounded-full flex items-center justify-center transition-all border border-slate-700 shadow-xl"
                        }, "📖"),

                        // Botão Descanso
                        el('button', {
                            onClick: () => {
                                triggerEffect('rest');
                                handleDescansoLongo();
                            },
                            className: "w-14 h-14 bg-slate-800 hover:bg-purple-900 text-purple-400 hover:text-white rounded-full flex items-center justify-center transition-all border border-slate-700 shadow-xl"
                        }, "🌙"),

                        // Botão Editar (Apenas se o Mestre permitir)
                        characterSheetData.allowEditing && el('button', {
                            onClick: () => setEditableSheetData(characterSheetData),
                            className: "w-14 h-14 bg-slate-800 hover:bg-amber-600 text-amber-500 hover:text-white rounded-full flex items-center justify-center transition-all border border-slate-700 shadow-xl"
                        }, "✏️"),

                        // Botão Level Up (Condicional)
                        podeSubirNivel && el('button', {
                            onClick: () => setShowLevelUpModal(true),
                            className: "h-14 bg-amber-500 hover:bg-amber-400 text-black px-6 rounded-full font-black text-xs uppercase transition-all shadow-xl animate-bounce"
                        }, "🚀 Level Up!")
                    ])
                ]),
                // --- GERENCIADOR DE BALÕES (Fica invisível, apenas cuidando dos dados) ---
                el(DiceRoller, {
                    recentRolls,
                    characterName
                })
            ])
        ),

        // --- MODAL: CADERNO DE AVENTURAS ---
        showJournal && el('div', { key: 'journal-overlay', className: "fixed inset-0 journal-modal animate-fade-in" },
            el('div', { key: 'journal-paper', className: "notebook-container" }, [
                // --- TABS ESTILO MINECRAFT ---
                el('div', { key: 'notebook-tabs', className: "notebook-tabs" }, [
                    el('button', {
                        onClick: () => setJournalTab('private'),
                        className: `notebook-tab ${journalTab === 'private' ? 'active' : ''}`
                    }, [
                        el('span', { className: "text-lg mr-2" }, "🔒"),
                        "Meu Diário"
                    ]),
                    el('button', {
                        onClick: () => setJournalTab('group'),
                        className: `notebook-tab ${journalTab === 'group' ? 'active' : ''}`
                    }, [
                        el('span', { className: "text-lg mr-2" }, "👥"),
                        "Notas do Grupo",
                        groupNotes.length > 0 && el('span', { className: "ml-2 bg-red-500 text-white text-[8px] px-1.5 py-0.5 rounded-full" }, groupNotes.length)
                    ])
                ]),

                // Header do Caderno
                el('div', { key: 'journal-header-wrap', className: "notebook-header" }, [
                    el('button', {
                        key: 'journal-close',
                        onClick: () => setShowJournal(false),
                        className: "text-[#fab1a0] hover:text-white transition-colors text-xl"
                    }, "✕"),
                    el('h2', { key: 'journal-title', className: "text-lg font-bold" }, 
                        journalTab === 'private' ? (journalPage === 1 ? "📜 Minha História" : `📖 Diário de Aventuras - Página ${journalPage}`) : "👥 Memórias do Grupo"
                    ),
                    journalTab === 'private' ? el('div', { key: 'journal-pagination', className: "flex gap-4" }, [
                        el('button', { 
                            key: 'prev-page',
                            disabled: journalPage === 1,
                            onClick: () => changePage(journalPage - 1),
                            className: `px-3 py-1 bg-black/20 rounded-lg ${journalPage === 1 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-black/40'}`
                        }, "← Anterior"),
                        el('button', { 
                            key: 'next-page',
                            disabled: journalPage === 10,
                            onClick: () => changePage(journalPage + 1),
                            className: `px-3 py-1 bg-black/20 rounded-lg ${journalPage === 10 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-black/40'}`
                        }, "Próxima →")
                    ]) : el('div', { key: 'empty-spacer' })
                ]),

                // Conteúdo da Página
                el('div', { className: `paper-page ${pageAnimation} custom-scrollbar` }, 
                    journalTab === 'private' ? [
                        journalPage === 1 ?
                            el('textarea', {
                                key: 'bg-text',
                                className: "w-full h-full bg-transparent border-none outline-none resize-none scroll-hide",
                                defaultValue: characterSheetData.outros?.['Background'] || "O herói ainda não registrou sua origem...",
                                onBlur: (e) => updateSheetField('outros', 'Background', e.target.value)
                            }) :
                            el('textarea', {
                                key: `journal-page-${journalPage}`,
                                className: "w-full h-full bg-transparent border-none outline-none resize-none scroll-hide",
                                defaultValue: characterSheetData.outros?.[`journal_page_${journalPage}`] || "",
                                onBlur: (e) => updateSheetField('outros', `journal_page_${journalPage}`, e.target.value)
                            }),
                        // BOTÃO COMPARTILHAR
                        el('button', {
                            key: 'btn-share',
                            onClick: () => {
                                const text = journalPage === 1 ? characterSheetData.outros?.['Background'] : characterSheetData.outros?.[`journal_page_${journalPage}`];
                                if (text && text.trim()) {
                                    shareNote(text);
                                    alert("📜 Nota selada e enviada para o grupo!");
                                } else {
                                    alert("Página vazia não pode ser enviada.");
                                }
                            },
                            className: "absolute bottom-6 right-8 bg-[#d35400] text-white px-6 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl hover:bg-[#e67e22] transition-all flex items-center gap-2"
                        }, [el('span', { className: "text-lg" }, "✉️"), "Compartilhar"])
                    ] : 
                    // ABA DE GRUPO
                    el('div', { className: "space-y-8" }, [
                        groupNotes.length === 0 ? 
                            el('div', { className: "flex flex-col items-center justify-center py-20 opacity-40 grayscale" }, [
                                el('span', { className: "text-6xl mb-4" }, "📭"),
                                el('p', { className: "font-bold uppercase tracking-widest" }, "Nenhuma nota compartilhada ainda...")
                            ]) :
                            groupNotes.map(note => el('div', { key: note.id, className: "bg-white/40 p-6 rounded-3xl border-2 border-[#d35400]/20 shadow-sm relative group/note" }, [
                                el('div', { className: "flex justify-between items-start mb-3" }, [
                                    el('div', { className: "flex items-center gap-2" }, [
                                        el('span', { className: "bg-[#d35400] text-white text-[8px] font-black uppercase px-2 py-1 rounded-lg" }, note.sender),
                                        note.sender === characterName && el('button', {
                                            onClick: () => confirm("Deseja apagar esta nota do grupo?") && deleteNote(note.id),
                                            className: "text-[10px] text-red-500 hover:text-red-700 transition-colors ml-2",
                                            title: "Apagar minha nota"
                                        }, "🗑️")
                                    ]),
                                    el('span', { className: "text-[9px] text-slate-500 font-bold" }, note.timestamp)
                                ]),
                                el('p', { className: "text-sm leading-relaxed" }, note.text),
                                el('div', { className: "absolute -bottom-2 -right-2 opacity-0 group-hover/note:opacity-100 transition-opacity" }, "📜")
                            ]))
                    ])
                )
            ])
        ),
        
        // --- MODAL DE LEVEL UP ---
        showLevelUpModal && el('div', { key: 'level-up-modal', className: "fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in" },
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
                                    el('span', { key: 'attr-name', className: "text-[11px] font-black tracking-widest text-slate-400 uppercase" }, attr),
                                    el('div', { key: 'attr-controls', className: "flex items-center gap-3" }, [
                                        el('button', {
                                            key: 'attr-dec',
                                            onClick: () => handleAttributeChange(attr, -1),
                                            disabled: levelUpData.attributes[attr] === 0,
                                            className: "w-6 h-6 rounded-full bg-slate-700 hover:bg-slate-600 flex items-center justify-center font-bold text-slate-300 disabled:opacity-30 transition-all font-sans"
                                        }, "-"),
                                        el('span', { key: 'attr-val', className: `font-black text-lg ${levelUpData.attributes[attr] > 0 ? 'text-amber-400' : 'text-white'}` }, levelUpData.attributes[attr] > 0 ? `+${levelUpData.attributes[attr]}` : "0"),
                                        el('button', {
                                            key: 'attr-inc',
                                            onClick: () => handleAttributeChange(attr, 1),
                                            disabled: levelUpData.pointsToSpend === 0,
                                            className: "w-6 h-6 rounded-full bg-amber-500/20 hover:bg-amber-500 text-amber-500 hover:text-white flex items-center justify-center font-bold border border-amber-500/50 disabled:opacity-30 transition-all font-sans"
                                        }, "+")
                                    ])
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
        ),

        // 4. CHAT COM O MESTRE (FLOAT)
        el('div', { key: 'chat-floating-node', className: "fixed bottom-6 right-6 z-[300] font-sans" }, [
            !isChatOpen && el('button', {
                key: 'chat-toggle',
                onClick: () => setIsChatOpen(true),
                className: "relative w-16 h-16 bg-purple-600 hover:bg-purple-500 text-white rounded-2xl flex items-center justify-center text-3xl shadow-2xl transition-all active:scale-95 group"
            }, [
                "💬",
                chatMessages && chatMessages.length > 0 && el('span', { className: "absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full border-2 border-slate-900 animate-pulse" })
            ]),
            isChatOpen && el('div', {
                key: 'chat-window',
                className: "w-80 h-[28rem] bg-slate-900 border-2 border-purple-500/30 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden animate-slide-up"
            }, [
                el('div', { className: "p-5 bg-gradient-to-r from-purple-700 to-indigo-800 flex justify-between items-center text-white" }, [
                    el('div', { className: "flex flex-col" }, [
                        el('h4', { className: "text-[10px] font-black uppercase tracking-[0.2em]" }, "Chat com o Mestre"),
                        el('span', { className: "text-[8px] text-purple-200 uppercase font-bold" }, "🔒 Mensagens Privadas")
                    ]),
                    el('button', { onClick: () => setIsChatOpen(false), className: "w-8 h-8 rounded-full bg-black/20 text-white flex items-center justify-center hover:bg-red-500 transition-colors" }, "×")
                ]),
                el('div', { className: "flex-1 overflow-y-auto p-5 space-y-4 bg-slate-950/50 flex flex-col custom-scrollbar" }, 
                    (!chatMessages || chatMessages.length === 0) ? 
                        el('div', { className: "h-full flex flex-col items-center justify-center text-slate-600 space-y-2 opacity-50" }, [
                            el('span', { className: "text-4xl" }, "🕯️"),
                            el('p', { className: "text-[9px] font-black uppercase tracking-widest" }, "Silêncio na Masmorra...")
                        ]) :
                        chatMessages.map(m => el('div', { 
                            key: m.id, 
                            className: `flex flex-col ${m.sender === 'Mestre' ? 'items-start' : 'items-end'}`
                        }, [
                            el('div', { 
                                className: `max-w-[90%] p-3 rounded-2xl text-[11px] shadow-sm ${m.sender === 'Mestre' ? 'bg-slate-800 text-slate-200 border-l-2 border-purple-500' : 'bg-purple-600 text-white'}`
                            }, m.text),
                            el('span', { className: "text-[7px] font-black text-slate-600 uppercase mt-1 px-1" }, m.sender)
                        ]))
                ),
                el('div', { className: "p-4 bg-slate-900 flex gap-2" }, [
                    el('input', {
                        value: chatInput,
                        onChange: e => setChatInput(e.target.value),
                        onKeyDown: e => e.key === 'Enter' && chatInput.trim() && (sendChatMessage(chatInput, characterName), setChatInput('')),
                        placeholder: "Sussurre ao mestre...",
                        className: "flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-xs text-white outline-none"
                    }),
                    el('button', {
                        onClick: () => { if (chatInput.trim()) { sendChatMessage(chatInput, characterName); setChatInput(''); } },
                        className: "w-10 h-10 bg-purple-600 hover:bg-purple-500 text-white rounded-xl flex items-center justify-center transition-all shadow-lg text-lg"
                    }, "➔")
                ])
            ])
        ]),

        // --- 5. ROLAGEM SECRETA (FORÇADA PELO MESTRE) ---
        (sessionState?.rollRequests?.[characterName.toLowerCase()] && !hiddenRollRequests[characterName.toLowerCase()]) && el('div', {
            key: 'secret-roll-modal',
            className: "fixed inset-0 z-[1000] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
        }, [
            el('div', { className: "bg-slate-900 border-4 border-red-600 rounded-[3rem] p-10 max-w-lg w-full text-center shadow-[0_0_100px_rgba(220,38,38,0.5)] animate-pulse-soft flex flex-col items-center relative overflow-hidden" }, [
                el('div', { className: "absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9IjAuMDUiLz4KPC9zdmc+')] opacity-20" }),
                el('div', { className: "text-6xl mb-4 animate-bounce relative z-10" }, "🎲"),
                el('h2', { className: "text-3xl font-black text-red-500 uppercase tracking-tighter mb-2 relative z-10" }, "Teste Oculto Exigido!"),
                el('p', { className: "text-slate-300 text-lg mb-8 relative z-10" }, [
                    "O Mestre exige que você role ",
                    el('strong', { className: "text-amber-400 uppercase font-black px-2" }, sessionState.rollRequests[characterName.toLowerCase()].skill),
                    "."
                ]),
                el('p', { className: "text-xs text-slate-500 font-bold uppercase tracking-widest mb-8 relative z-10" }, "Os dados cairão às cegas. Apenas o mestre verá o resultado."),
                el('button', {
                    onClick: () => {
                        const skill = sessionState.rollRequests[characterName.toLowerCase()].skill;
                        let bonus = 0;
                        if (charData?.pericias?.[skill]) bonus = parseInt(charData.pericias[skill].val) || 0;
                        else if (charData?.modificadores?.[skill]) bonus = parseInt(charData.modificadores[skill]) || 0;
                        
                        const roll = Math.floor(Math.random() * 20) + 1;
                        const total = roll + bonus;
                        
                        const dbRef = firebase.firestore().collection('artifacts').doc(localStorage.getItem('current_rpg_app_id') || 'rpg-mega-trees-v7');
                        
                        dbRef.collection('public').doc('data').collection('rolls')
                            .add({
                                charName: characterName,
                                type: `Teste Oculto (${skill})`,
                                formula: `1d20 + ${bonus}`,
                                result: total,
                                details: `[?] + ${bonus}`, 
                                secret: true,
                                timestamp: firebase.firestore.FieldValue.serverTimestamp()
                            });
                        
                        // Hide instantly locally
                        setHiddenRollRequests(prev => ({ ...prev, [characterName.toLowerCase()]: true }));
                        
                        // Delete safely in firebase
                        const newRequests = { ...sessionState.rollRequests };
                        delete newRequests[characterName.toLowerCase()];
                        
                        dbRef.collection('public').doc('data').collection('global').doc('session')
                            .set({ rollRequests: newRequests }, { merge: true });
                        
                        triggerEffect('bag');
                    },
                    className: "bg-red-600 hover:bg-red-500 text-white w-full py-4 rounded-2xl text-xl font-black uppercase tracking-widest shadow-[0_0_30px_rgba(220,38,38,0.4)] transition-all active:scale-95 relative z-10"
                }, "Rolar Dados")
            ])
        ]),
        showTutorial && el(PlayerTutorialPopup, {
            key: 'player-tutorial',
            onClose: () => setShowTutorial(false)
        })
    ]);
}