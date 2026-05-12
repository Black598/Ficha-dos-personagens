// js/components/LootManager.js
import { LOOT_RARITY } from '../data/LootTables.js';

const { useState } = React;
const el = React.createElement;

export function LootManager({ sessionState, generateLoot, approveLoot, clearLoot, askGemini, allPlayers = [], updateSessionState }) {
    const [isGeneratingAI, setIsGeneratingAI] = useState(false);
    const [showCustomForm, setShowCustomForm] = useState(false);
    const [customItem, setCustomItem] = useState({ name: '', rarity: 'COMMON', effect: '', type: 'Item' });
    const activeLoot = sessionState.activeLoot;

    const handleAILoot = async () => {
        setIsGeneratingAI(true);
        try {
            const prompt = "Gere um item mágico único para um RPG de fantasia. Retorne apenas um JSON com as chaves: name, type, rarity (escolha entre RARE, EPIC, LEGENDARY), effect (descrição curta).";
            const response = await askGemini(prompt);
            const jsonStr = response.match(/\{.*\}/s)?.[0];
            if (jsonStr) {
                const aiItem = JSON.parse(jsonStr);
                const currentLoot = activeLoot || { gold: 0, items: [], approved: false, target: 'all' };
                updateSessionState({
                    activeLoot: {
                        ...currentLoot,
                        items: [...currentLoot.items, { ...aiItem, id: Date.now() }]
                    }
                });
            }
        } catch (e) {
            console.error("Erro IA Loot:", e);
        }
        setIsGeneratingAI(false);
    };

    const addCustomItem = () => {
        if (!customItem.name) return;
        const currentLoot = activeLoot || { gold: 0, items: [], approved: false, target: 'all' };
        updateSessionState({
            activeLoot: {
                ...currentLoot,
                items: [...currentLoot.items, { ...customItem, id: Date.now() }]
            }
        });
        setCustomItem({ name: '', rarity: 'COMMON', effect: '', type: 'Item' });
        setShowCustomForm(false);
    };

    const removeItem = (id) => {
        const updatedItems = activeLoot.items.filter(item => item.id !== id);
        updateSessionState({
            activeLoot: { ...activeLoot, items: updatedItems }
        });
    };

    const updateGold = (val) => {
        updateSessionState({
            activeLoot: { ...activeLoot, gold: Math.max(0, parseInt(val) || 0) }
        });
    };

    const updateTarget = (target) => {
        updateSessionState({
            activeLoot: { ...activeLoot, target }
        });
    };

    return el('div', { className: "bg-slate-900/40 border border-slate-800 p-8 rounded-[3rem] shadow-2xl space-y-6" }, [
        el('div', { key: 'loot-header', className: "flex justify-between items-center border-b border-slate-800 pb-4" }, [
            el('h2', { key: 'loot-title', className: "text-xs font-black uppercase tracking-[0.4em] text-amber-500" }, "💰 Gerador de Tesouros"),
            activeLoot && el('button', {
                key: 'loot-clear-btn',
                onClick: clearLoot,
                className: "text-[10px] font-bold uppercase text-slate-500 hover:text-white transition-colors"
            }, "Limpar")
        ]),

        !activeLoot ? (
            el('div', { key: 'no-loot-view', className: "space-y-6" }, [
                el('div', { key: 'loot-presets', className: "grid grid-cols-2 md:grid-cols-4 gap-4" }, [
                    ['low', 'Pobre 📦'],
                    ['medium', 'Médio 💎'],
                    ['high', 'Rico 💰'],
                    ['epic', 'Épico 👑']
                ].map(([lv, label]) => 
                    el('button', {
                        key: lv,
                        onClick: () => generateLoot(lv),
                        className: "bg-slate-800/50 hover:bg-amber-600 p-4 rounded-2xl border border-slate-700 hover:border-amber-400 transition-all text-xs font-black uppercase tracking-widest text-slate-300 hover:text-white"
                    }, label)
                )),
                el('button', {
                    key: 'custom-loot-btn',
                    onClick: () => {
                        updateSessionState({ activeLoot: { gold: 0, items: [], approved: false, target: 'all' } });
                        setShowCustomForm(true);
                    },
                    className: "w-full py-3 bg-slate-800/30 border border-dashed border-slate-700 rounded-2xl text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:border-amber-500/50 hover:text-amber-500 transition-all"
                }, "➕ Criar Loot Customizado")
            ])
        ) : (
            el('div', { className: "space-y-6 animate-fade-in" }, [
                // Configurações do Loot (Target e Gold)
                el('div', { className: "grid grid-cols-2 gap-4" }, [
                    el('div', null, [
                        el('label', { className: "text-[9px] font-black text-slate-500 uppercase mb-2 block" }, "Destinatário"),
                        el('select', {
                            value: activeLoot.target || 'all',
                            onChange: (e) => updateTarget(e.target.value),
                            className: "w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs text-white outline-none"
                        }, [
                            el('option', { key: 'all', value: 'all' }, "🌍 Todos os Jogadores"),
                            ...allPlayers.map(p => el('option', { key: p, value: p }, `👤 ${p}`))
                        ])
                    ]),
                    el('div', null, [
                        el('label', { className: "text-[9px] font-black text-slate-500 uppercase mb-2 block" }, "Ouro (PO)"),
                        el('input', {
                            type: 'number',
                            value: activeLoot.gold,
                            onChange: (e) => updateGold(e.target.value),
                            className: "w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs text-amber-500 font-bold outline-none"
                        })
                    ])
                ]),

                // Preview do Loot
                el('div', { className: "bg-slate-950/50 p-6 rounded-3xl border border-amber-500/20" }, [
                    el('div', { className: "flex justify-between items-center mb-4" }, [
                        el('span', { className: "text-2xl font-black text-amber-500" }, `${activeLoot.gold} PO`),
                        el('button', {
                            onClick: () => setShowCustomForm(!showCustomForm),
                            className: "text-[9px] font-black bg-amber-500/20 text-amber-500 px-3 py-1 rounded-full uppercase hover:bg-amber-500 hover:text-slate-900 transition-all"
                        }, "+ Item")
                    ]),

                    showCustomForm && el('div', { className: "bg-slate-900 p-4 rounded-2xl border border-amber-500/30 mb-4 space-y-3 animate-zoom-in" }, [
                        el('input', {
                            placeholder: "Nome do Item",
                            value: customItem.name,
                            onChange: (e) => setCustomItem({ ...customItem, name: e.target.value }),
                            className: "w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white"
                        }),
                        el('div', { className: "flex gap-2" }, [
                            el('select', {
                                value: customItem.rarity,
                                onChange: (e) => setCustomItem({ ...customItem, rarity: e.target.value }),
                                className: "flex-1 bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white"
                            }, Object.keys(LOOT_RARITY).map(r => el('option', { key: r, value: r }, r))),
                            el('input', {
                                placeholder: "Tipo (Arma, Poção...)",
                                value: customItem.type,
                                onChange: (e) => setCustomItem({ ...customItem, type: e.target.value }),
                                className: "flex-1 bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white"
                            })
                        ]),
                        el('input', {
                            placeholder: "Efeito/Descrição",
                            value: customItem.effect,
                            onChange: (e) => setCustomItem({ ...customItem, effect: e.target.value }),
                            className: "w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white"
                        }),
                        el('div', { className: "flex gap-2" }, [
                            el('button', {
                                onClick: handleAILoot,
                                disabled: isGeneratingAI,
                                className: "flex-1 bg-purple-600 hover:bg-purple-500 text-white text-[9px] font-black uppercase py-2 rounded-lg transition-all"
                            }, isGeneratingAI ? "Gerando..." : "✨ IA"),
                            el('button', {
                                onClick: addCustomItem,
                                className: "flex-1 bg-amber-600 hover:bg-amber-500 text-slate-900 text-[9px] font-black uppercase py-2 rounded-lg transition-all"
                            }, "Adicionar")
                        ])
                    ]),

                    el('div', { className: "space-y-2" }, activeLoot.items.map((item, idx) => 
                        el('div', { key: item.id || idx, className: "flex justify-between items-center text-sm bg-slate-900/50 p-3 rounded-xl border border-slate-800 group" }, [
                            el('div', null, [
                                el('span', { className: "font-bold", style: { color: LOOT_RARITY[item.rarity]?.color } }, item.name),
                                el('p', { className: "text-[10px] text-slate-500" }, item.effect)
                            ]),
                            el('div', { className: "flex items-center gap-3" }, [
                                el('span', { className: "text-[9px] uppercase font-black opacity-30" }, item.rarity),
                                el('button', {
                                    onClick: () => removeItem(item.id || idx),
                                    className: "text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                }, "×")
                            ])
                        ])
                    ))
                ]),

                // Ações do Mestre
                el('div', { className: "flex gap-4" }, [
                    el('button', {
                        onClick: approveLoot,
                        disabled: activeLoot.approved,
                        className: `flex-1 py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-xl ${activeLoot.approved ? 'bg-slate-800 text-slate-500 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-500 text-white animate-pulse-soft'}`
                    }, activeLoot.approved ? "✅ Loot Liberado" : "🔓 Liberar para Jogadores"),
                    
                    el('button', {
                        onClick: () => generateLoot('medium'), // Re-gerar
                        className: "px-6 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-2xl border border-slate-700 transition-all"
                    }, "🔄")
                ]),

                activeLoot.approved && el('p', { className: "text-center text-[10px] text-emerald-500 font-bold uppercase animate-pulse" }, 
                    activeLoot.target === 'all' ? "Todos os jogadores podem ver o baú!" : `O baú está disponível para ${activeLoot.target}!`
                )
            ])
        )
    ]);
}

