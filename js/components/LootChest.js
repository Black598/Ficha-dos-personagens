// js/components/LootChest.js
import { LOOT_RARITY } from '../data/LootTables.js';
import { AudioManager } from '../AudioManager.js';

const { useState, useEffect } = React;
const el = React.createElement;

export function LootChest({ loot, characterName, onClose, onClaimItem, onClaimGold }) {
    const [step, setStep] = useState('closed'); // 'closed', 'opening', 'revealed'
    const [revealedItems, setRevealedItems] = useState([]);
    const [goldToClaim, setGoldToClaim] = useState(loot.gold);

    useEffect(() => {
        setGoldToClaim(loot.gold);
    }, [loot.gold]);

    const handleOpen = () => {
        if (step !== 'closed') return;
        setStep('opening');
        AudioManager.play('chest_open');
        
        setTimeout(() => {
            setStep('revealed');
            // Revela itens um a um com pequeno delay
            loot.items.forEach((item, idx) => {
                setTimeout(() => {
                    setRevealedItems(prev => [...prev, item]);
                    AudioManager.play('sparkle');
                }, idx * 400);
            });
        }, 1000);
    };

    return el('div', { className: "fixed inset-0 z-[600] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-fade-in" }, [
        el('div', { className: "max-w-xl w-full flex flex-col items-center gap-8" }, [
            
            // O BAÚ
            el('div', { 
                onClick: handleOpen,
                className: `relative cursor-pointer transition-all duration-500 transform ${step === 'closed' ? 'hover:scale-110 active:scale-95' : ''}`
            }, [
                // Luz de fundo
                el('div', { className: `absolute inset-0 bg-amber-500/20 blur-[100px] rounded-full transition-opacity duration-1000 ${step === 'revealed' ? 'opacity-100' : 'opacity-0'}` }),
                
                // Emoji do Baú
                el('div', { className: `text-[120px] md:text-[180px] drop-shadow-[0_0_30px_rgba(245,158,11,0.5)] ${step === 'opening' ? 'animate-chest-shake' : ''}` }, 
                    step === 'closed' || step === 'opening' ? "🧳" : "📂"
                ),

                step === 'closed' && el('div', { className: "absolute -bottom-4 left-1/2 -translate-x-1/2 bg-amber-600 text-white px-6 py-2 rounded-full text-xs font-black uppercase tracking-[0.3em] animate-pulse whitespace-nowrap shadow-xl border-2 border-amber-400" }, "Clique para Abrir")
            ]),

            // ITENS REVELADOS
            step === 'revealed' && el('div', { className: "w-full space-y-4 animate-slide-up" }, [
                el('div', { className: "bg-slate-900/60 backdrop-blur-md p-6 rounded-[2.5rem] border border-white/10 text-center space-y-4 shadow-2xl" }, [
                    el('div', null, [
                        el('h2', { className: "text-4xl font-black text-amber-500 drop-shadow-lg mb-1" }, `${loot.gold} PO`),
                        el('p', { className: "text-[10px] font-black uppercase tracking-[0.4em] text-slate-400" }, "Tesouro do Baú")
                    ]),
                    
                    loot.gold > 0 && el('div', { className: "flex items-center justify-center gap-2" }, [
                        el('input', {
                            type: 'number',
                            max: loot.gold,
                            min: 1,
                            value: goldToClaim,
                            onChange: (e) => setGoldToClaim(Math.min(loot.gold, parseInt(e.target.value) || 0)),
                            className: "w-20 bg-black/40 border border-white/10 rounded-xl p-2 text-center text-amber-500 font-black outline-none"
                        }),
                        el('button', {
                            onClick: () => onClaimGold(goldToClaim),
                            className: "bg-amber-600 hover:bg-amber-500 text-slate-900 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg active:scale-95"
                        }, "💰 Pegar Ouro")
                    ])
                ]),

                el('div', { className: "grid grid-cols-1 gap-3 max-h-[40vh] overflow-y-auto custom-scrollbar px-2" }, 
                    loot.items.map((item, idx) => el('div', { 
                        key: item.id || idx, 
                        className: "bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 flex items-center gap-4 animate-bounce-in shadow-xl group"
                    }, [
                        el('div', { 
                            className: "w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-inner shrink-0",
                            style: { background: LOOT_RARITY[item.rarity]?.color + '20', border: `2px solid ${LOOT_RARITY[item.rarity]?.color}` }
                        }, item.type === 'Arma' ? '⚔️' : item.type === 'Armadura' ? '🛡️' : item.type === 'Poção' ? '🧪' : '📜'),
                        el('div', { className: "flex-1" }, [
                            el('h3', { className: "text-sm font-black uppercase tracking-tight", style: { color: LOOT_RARITY[item.rarity]?.color } }, item.name),
                            el('p', { className: "text-[10px] text-slate-300 font-medium" }, item.effect)
                        ]),
                        el('button', {
                            onClick: () => onClaimItem(item),
                            className: "opacity-0 group-hover:opacity-100 bg-white text-slate-900 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all hover:bg-amber-500 hover:text-white shadow-xl"
                        }, "Pegar")
                    ]))
                ),

                el('button', {
                    onClick: onClose,
                    className: "w-full py-4 mt-4 bg-slate-800 text-slate-400 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] hover:bg-slate-700 hover:text-white transition-all shadow-2xl active:scale-95 border border-slate-700"
                }, "Fechar Baú")
            ])
        ])
    ]);
}

