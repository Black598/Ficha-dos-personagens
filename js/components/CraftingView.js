import { AudioManager } from '../AudioManager.js';

const { useState, useEffect } = React;

export function CraftingView({ sheetData, onUpdateSheet, onBack, askGemini, isMaster }) {
    const el = React.createElement;
    const [mode, setMode] = useState('alchemy'); // 'alchemy' or 'forge'
    const [slots, setSlots] = useState([null, null, null]);
    const [result, setResult] = useState(null);
    const [isCrafting, setIsCrafting] = useState(false);
    const [isAskingAI, setIsAskingAI] = useState(false);

    const inventoryString = sheetData?.inventario || "";
    const inventoryItems = inventoryString.split(',').map(s => s.trim()).filter(s => s && s !== '-');

    // Receitas Padrão
    const RECIPES = [
        { mode: 'alchemy', inputs: ['Erva', 'Frasco de Água'], output: 'Poção de Cura', icon: '🧪' },
        { mode: 'alchemy', inputs: ['Erva', 'Erva'], output: 'Tônico de Energia', icon: '🧪' },
        { mode: 'alchemy', inputs: ['Cogumelo', 'Álcool'], output: 'Veneno Básico', icon: '🧴' },
        { mode: 'forge', inputs: ['Espada', 'Minério'], output: 'Espada Amolada (+1)', icon: '⚔️' },
        { mode: 'forge', inputs: ['Escudo', 'Minério'], output: 'Escudo Reforçado (+1)', icon: '🛡️' },
        { mode: 'forge', inputs: ['Armadura', 'Runa'], output: 'Armadura Rúnica', icon: '🛡️' }
    ];

    const cleanName = (name) => name.replace(/\s*\[.*?\]\s*/g, ' ').replace(/\s*\{E\}\s*/g, ' ').replace(/\s*\(.*?\)\s*/g, ' ').trim();

    const handleAddToSlot = (item, index) => {
        const newSlots = [...slots];
        const firstEmpty = newSlots.findIndex(s => s === null);
        if (firstEmpty !== -1) {
            newSlots[firstEmpty] = { name: item, originalIndex: index };
            setSlots(newSlots);
            AudioManager.play('click');
        }
    };

    const handleRemoveFromSlot = (slotIdx) => {
        const newSlots = [...slots];
        newSlots[slotIdx] = null;
        setSlots(newSlots);
        setResult(null);
        AudioManager.play('click');
    };

    const checkRecipe = () => {
        const activeInputs = slots.filter(s => s !== null).map(s => cleanName(s.name).toLowerCase());
        if (activeInputs.length < 2) return;

        const found = RECIPES.find(r => {
            if (r.mode !== mode) return false;
            const rInputs = r.inputs.map(i => i.toLowerCase());
            // Verifica se todos os inputs da receita estão presentes nos slots (simplificado)
            return rInputs.every(ri => activeInputs.some(ai => ai.includes(ri))) && activeInputs.length === rInputs.length;
        });

        if (found) {
            setResult({ name: found.output, icon: found.icon });
        } else {
            setResult({ name: 'Resíduo Inútil', icon: '🗑️', fail: true });
        }
    };

    const handleCraft = () => {
        if (!result || result.fail) return;

        setIsCrafting(true);
        AudioManager.play(mode === 'alchemy' ? 'magia' : 'armor');

        setTimeout(() => {
            // Remove itens usados
            const usedIndices = slots.filter(s => s !== null).map(s => s.originalIndex);
            const newInventory = inventoryItems.filter((_, idx) => !usedIndices.includes(idx));
            
            // Adiciona resultado
            newInventory.push(`[${result.icon}] ${result.name}`);

            onUpdateSheet({ inventario: newInventory.join(', ') });
            
            setSlots([null, null, null]);
            setResult(null);
            setIsCrafting(false);
            AudioManager.play('sparkle');
        }, 1500);
    };

    const handleAskAI = async () => {
        const activeItems = slots.filter(s => s !== null).map(s => cleanName(s.name));
        if (activeItems.length === 0) {
            alert("Coloque algum item nos slots para perguntar ao guia!");
            return;
        }

        setIsAskingAI(true);
        try {
            const prompt = `Como um mestre de RPG experiente, o que eu poderia criar combinando estes itens: ${activeItems.join(', ')}? 
            Sugira um nome criativo, ícone (emoji) e o que o item faz em termos de regras de RPG.
            Seja breve e místico.`;
            const response = await askGemini(prompt);
            alert(`📜 O Guia diz:\n\n${response}`);
        } catch (e) {
            alert("Erro ao consultar o guia: " + e.message);
        } finally {
            setIsAskingAI(false);
        }
    };

    return el('div', { className: "fixed inset-0 z-[100] bg-slate-950 flex flex-col animate-fade-in" }, [
        // Header
        el('div', { className: "p-6 flex justify-between items-center border-b border-slate-800" }, [
            el('div', { className: "flex items-center gap-4" }, [
                el('button', { onClick: onBack, className: "text-slate-400 hover:text-white" }, "← Voltar"),
                el('h2', { className: "text-xl font-black uppercase tracking-tighter text-white" }, "Alquimia e Crafting")
            ]),
            el('div', { className: "flex bg-slate-900 rounded-2xl p-1 border border-slate-800" }, [
                el('button', {
                    onClick: () => { setMode('alchemy'); setSlots([null, null, null]); },
                    className: `px-6 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${mode === 'alchemy' ? 'bg-emerald-600 text-white' : 'text-slate-500 hover:text-slate-300'}`
                }, "⚗️ Alquimia"),
                el('button', {
                    onClick: () => { setMode('forge'); setSlots([null, null, null]); },
                    className: `px-6 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${mode === 'forge' ? 'bg-amber-600 text-white' : 'text-slate-500 hover:text-slate-300'}`
                }, "⚒️ Forja")
            ])
        ]),

        // Main Content
        el('div', { className: "flex-grow grid grid-cols-1 lg:grid-cols-2 overflow-hidden" }, [
            
            // Left: Crafting Area
            el('div', { className: `p-8 flex flex-col items-center justify-center space-y-12 transition-colors duration-500 ${mode === 'alchemy' ? 'bg-emerald-950/10' : 'bg-amber-950/10'}` }, [
                
                // Visual Center (Cauldron or Anvil)
                el('div', { className: "relative w-64 h-64 flex items-center justify-center" }, [
                    // Animação de Fundo
                    el('div', { className: `absolute inset-0 rounded-full blur-3xl animate-pulse opacity-20 ${mode === 'alchemy' ? 'bg-emerald-500' : 'bg-amber-500'}` }),
                    
                    el('span', { className: `text-[120px] drop-shadow-2xl z-10 ${isCrafting ? 'animate-bounce' : ''}` }, mode === 'alchemy' ? '⚗️' : '⚒️'),

                    // Slots Orbitando
                    [0, 1, 2].map(i => {
                        const slot = slots[i];
                        const angle = (i * 120) - 90;
                        const radius = 140;
                        const x = Math.cos(angle * Math.PI / 180) * radius;
                        const y = Math.sin(angle * Math.PI / 180) * radius;

                        return el('div', {
                            key: `craft-slot-${i}`,
                            onClick: () => slot && handleRemoveFromSlot(i),
                            style: { transform: `translate(${x}px, ${y}px)` },
                            className: `absolute w-20 h-20 rounded-2xl border-2 flex items-center justify-center transition-all cursor-pointer ${
                                slot ? 'bg-slate-900 border-white text-3xl shadow-xl' : 'bg-slate-950/40 border-slate-800 border-dashed text-slate-700'
                            }`
                        }, slot ? cleanName(slot.name)[0].toUpperCase() : '+');
                    })
                ]),

                // Botões de Ação
                el('div', { className: "flex flex-col items-center gap-4 w-full max-w-sm" }, [
                    result && el('div', { className: "text-center animate-bounce-in" }, [
                        el('p', { className: "text-[10px] font-black uppercase text-slate-500 mb-1" }, "Resultado Provável"),
                        el('div', { className: "flex items-center gap-3 bg-slate-900 px-6 py-3 rounded-2xl border border-slate-700" }, [
                            el('span', { className: "text-2xl" }, result.icon),
                            el('span', { className: `font-black uppercase tracking-widest ${result.fail ? 'text-red-500' : 'text-amber-500'}` }, result.name)
                        ])
                    ]),

                    el('div', { className: "flex gap-3 w-full" }, [
                        el('button', {
                            onClick: handleCraft,
                            disabled: !result || result.fail || isCrafting,
                            className: `flex-grow py-4 rounded-2xl font-black uppercase tracking-widest transition-all shadow-xl ${
                                !result || result.fail ? 'bg-slate-800 text-slate-600 opacity-50 cursor-not-allowed' : 
                                mode === 'alchemy' ? 'bg-emerald-600 text-white hover:bg-emerald-500' : 'bg-amber-600 text-white hover:bg-amber-500'
                            }`
                        }, isCrafting ? "Processando..." : "Criar Item"),

                        el('button', {
                            onClick: handleAskAI,
                            disabled: isAskingAI,
                            className: "px-6 bg-purple-600 hover:bg-purple-500 text-white rounded-2xl font-black transition-all shadow-xl flex items-center justify-center gap-2"
                        }, isAskingAI ? "..." : "✨")
                    ]),

                    el('button', {
                        onClick: checkRecipe,
                        className: "text-[10px] font-black uppercase text-slate-500 hover:text-white transition-colors"
                    }, "Verificar Combinação")
                ])
            ]),

            // Right: Inventory Pick Area
            el('div', { className: "p-8 border-l border-slate-800 overflow-y-auto custom-scrollbar bg-slate-900/50" }, [
                el('h3', { className: "text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 mb-6" }, "Sua Mochila"),
                el('div', { className: "grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-4 gap-3" }, 
                    inventoryItems.map((item, idx) => {
                        const isUsed = slots.some(s => s?.originalIndex === idx);
                        const name = cleanName(item);
                        
                        return el('div', {
                            key: `inv-${idx}`,
                            onClick: () => !isUsed && handleAddToSlot(item, idx),
                            className: `aspect-square rounded-2xl border-2 flex items-center justify-center transition-all relative group ${
                                isUsed ? 'opacity-20 border-slate-800' : 'bg-slate-900 border-slate-800 cursor-pointer hover:border-amber-500 hover:scale-105'
                            }`
                        }, [
                            el('span', { className: "text-2xl" }, name[0].toUpperCase()),
                            el('div', { className: "absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-slate-950 text-white text-[8px] font-black px-2 py-1 rounded border border-slate-800 pointer-events-none opacity-0 group-hover:opacity-100 whitespace-nowrap z-50 uppercase" }, name)
                        ]);
                    })
                )
            ])
        ])
    ]);
}
