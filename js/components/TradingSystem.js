import { AudioManager } from '../AudioManager.js';

const { useState, useEffect } = React;

export function TradingSystem({ sheetData, sessionState, updateSessionState, onUpdateSheet, onBack, isMaster, characterName, askGemini }) {
    const el = React.createElement;
    const [selectedTab, setSelectedTab] = useState('buy'); // 'buy' or 'sell' (for players)
    const [newItem, setNewItem] = useState({ name: '', price: 0, icon: '📦', description: '', rarity: 'Comum', stats: '' });
    const [isProcessing, setIsProcessing] = useState(false);
    const [isGeneratingAI, setIsGeneratingAI] = useState(false);

    const vendorType = sessionState.vendorType || 'Geral';
    const shopContext = sessionState.shopContext || '';
    const priceMultiplier = sessionState.priceMultiplier || 1;
    const shopItems = sessionState.shopInventory || [];

    const RARITY_COLORS = {
        'Comum': 'text-slate-400',
        'Incomum': 'text-emerald-400',
        'Raro': 'text-blue-400',
        'Épico': 'text-purple-400',
        'Lendário': 'text-amber-400'
    };

    const handleGenerateAI = async () => {
        if (!askGemini) return;
        setIsGeneratingAI(true);
        try {
            const prompt = `Gere um item de RPG único para vender em uma loja do tipo "${vendorType}". 
            Contexto Econômico Local: ${shopContext || 'Normal'}.
            Modificador de Preço Atual: ${priceMultiplier}x.

            Retorne APENAS um JSON puro (sem markdown) com os campos: 
            name, 
            price (número JÁ MULTIPLICADO por ${priceMultiplier}), 
            icon (um emoji), 
            description (flavor text imersivo para o jogador), 
            stats (dados técnicos apenas para o mestre, ex: CA:+2, Dano:1d8 fôgo, etc),
            rarity (Comum, Incomum, Raro, Épico ou Lendário).`;
            
            const response = await askGemini(prompt);
            const jsonStr = response.replace(/```json|```/g, '').trim();
            const data = JSON.parse(jsonStr);
            
            setNewItem({
                name: data.name || "Item Misterioso",
                price: data.price || Math.floor(50 * priceMultiplier),
                icon: data.icon || "📦",
                description: data.description || "Um item gerado pelo oráculo.",
                stats: data.stats || "",
                rarity: data.rarity || "Comum"
            });
            AudioManager.play('sparkle');
        } catch (e) {
            console.error(e);
            alert("Erro ao gerar item com IA.");
        } finally {
            setIsGeneratingAI(false);
        }
    };

    const handleAddItem = async () => {
        if (!newItem.name || newItem.price <= 0) {
            alert("Preencha o nome e um preço válido!");
            return;
        }
        const updatedShop = [...shopItems, { ...newItem, id: Date.now() }];
        await updateSessionState({ shopInventory: updatedShop });
        setNewItem({ name: '', price: 0, icon: '📦', description: '', rarity: 'Comum', stats: '' });
        AudioManager.play('click');
    };

    const handleRemoveItem = async (itemId) => {
        const updatedShop = shopItems.filter(i => i.id !== itemId);
        await updateSessionState({ shopInventory: updatedShop });
    };

    const handleBuyItem = async (item) => {
        if (isProcessing) return;
        
        const playerGold = parseInt(sheetData?.outros?.['PO'] || 0);
        if (playerGold < item.price) {
            alert("Você não tem ouro suficiente!");
            AudioManager.play('error');
            return;
        }

        if (!confirm(`Deseja comprar "${item.name}" por ${item.price} PO?`)) return;

        setIsProcessing(true);
        try {
            const newGold = playerGold - item.price;
            const currentInv = sheetData?.outros?.['Equipamento'] || "";
            // Inclui status técnicos se existirem para o jogador ver na ficha
            const statsSuffix = item.stats ? ` {${item.stats}}` : "";
            const itemString = `[${item.icon}] ${item.name}${statsSuffix}`;
            const newInv = currentInv ? `${currentInv}, ${itemString}` : itemString;

            await onUpdateSheet({ 
                outros: { 
                    ...sheetData.outros, 
                    'PO': newGold.toString(),
                    'Equipamento': newInv
                } 
            });

            AudioManager.play('coins');
            alert(`Compra realizada!\nItem: ${item.name}\nAtributos Revelados: ${item.stats || 'Nenhum'}`);
        } catch (e) {
            console.error(e);
            alert("Erro ao processar compra.");
        } finally {
            setIsProcessing(false);
        }
    };

    const renderMasterPanel = () => {
        return el('div', { className: "space-y-8" }, [
            // Configuração do Vendedor e Economia
            el('div', { className: "grid grid-cols-1 md:grid-cols-3 gap-6 items-end bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-800" }, [
                el('div', { className: "space-y-2" }, [
                    el('p', { className: "text-[10px] font-black text-slate-500 uppercase tracking-widest" }, "Tipo de Vendedor"),
                    el('select', {
                        value: vendorType,
                        onChange: e => updateSessionState({ vendorType: e.target.value }),
                        className: "w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-amber-500/50"
                    }, [
                        'Geral', 'Armeiro (Armas)', 'Armoreiro (Armaduras)', 'Alquimista (Poções)', 'Escriba (Pergaminhos)', 'Joalheiro (Acessórios)', 'Exótico (Itens Especiais)'
                    ].map(t => el('option', { key: t, value: t }, t)))
                ]),
                el('div', { className: "space-y-2" }, [
                    el('p', { className: "text-[10px] font-black text-slate-500 uppercase tracking-widest" }, "Contexto da Economia"),
                    el('input', {
                        placeholder: "Ex: Cidade em guerra, Inflação alta...",
                        value: shopContext,
                        onChange: e => updateSessionState({ shopContext: e.target.value }),
                        className: "w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-amber-500/50"
                    })
                ]),
                el('div', { className: "space-y-2" }, [
                    el('p', { className: "text-[10px] font-black text-slate-500 uppercase tracking-widest" }, "Multiplicador de Preço"),
                    el('div', { className: "flex items-center gap-4 bg-slate-950 border border-slate-800 rounded-xl px-4 py-1" }, [
                        el('input', {
                            type: 'range',
                            min: 0.1,
                            max: 5,
                            step: 0.1,
                            value: priceMultiplier,
                            onChange: e => updateSessionState({ priceMultiplier: parseFloat(e.target.value) }),
                            className: "flex-1 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                        }),
                        el('span', { className: "text-amber-500 font-bold text-xs min-w-[3rem] text-right" }, `${priceMultiplier}x`)
                    ])
                ])
            ]),

            // Formulário de Novo Item
            el('div', { className: "p-6 bg-slate-900/50 rounded-[2.5rem] border border-slate-800 space-y-4" }, [
                el('h3', { className: "text-amber-500 font-black uppercase text-xs tracking-[0.2em]" }, "➕ Adicionar Novo Item"),
                el('div', { className: "grid grid-cols-1 md:grid-cols-5 gap-4" }, [
                    el('input', {
                        placeholder: "Nome",
                        value: newItem.name,
                        onChange: e => setNewItem({ ...newItem, name: e.target.value }),
                        className: "bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-amber-500/50"
                    }),
                    el('input', {
                        type: 'number',
                        placeholder: "Preço (PO)",
                        value: newItem.price || '',
                        onChange: e => setNewItem({ ...newItem, price: parseInt(e.target.value) || 0 }),
                        className: "bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-amber-500/50"
                    }),
                    el('select', {
                        value: newItem.rarity,
                        onChange: e => setNewItem({ ...newItem, rarity: e.target.value }),
                        className: "bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-amber-500/50"
                    }, Object.keys(RARITY_COLORS).map(r => el('option', { key: r, value: r }, r))),
                    el('input', {
                        placeholder: "Emoji",
                        value: newItem.icon,
                        onChange: e => setNewItem({ ...newItem, icon: e.target.value }),
                        className: "bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-amber-500/50 text-center"
                    }),
                    el('div', { className: "flex gap-2" }, [
                        el('button', {
                            onClick: handleGenerateAI,
                            disabled: isGeneratingAI,
                            className: "px-4 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-black transition-all shadow-lg flex items-center justify-center"
                        }, isGeneratingAI ? "..." : "✨"),
                        el('button', {
                            onClick: handleAddItem,
                            className: "flex-grow bg-amber-600 hover:bg-amber-500 text-white font-black py-3 rounded-xl uppercase text-[10px] tracking-widest transition-all shadow-lg"
                        }, "OK")
                    ])
                ]),
                el('div', { className: "grid grid-cols-1 md:grid-cols-2 gap-4" }, [
                    el('textarea', {
                        placeholder: "Descrição (Para o Jogador)...",
                        value: newItem.description,
                        onChange: e => setNewItem({ ...newItem, description: e.target.value }),
                        className: "w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-amber-500/50 h-20 resize-none"
                    }),
                    el('textarea', {
                        placeholder: "Atributos Técnicos (Apenas para o Mestre)...",
                        value: newItem.stats,
                        onChange: e => setNewItem({ ...newItem, stats: e.target.value }),
                        className: "w-full bg-slate-950 border border-purple-900/30 rounded-xl px-4 py-3 text-xs text-purple-400 outline-none focus:border-purple-500/50 h-20 resize-none shadow-inner"
                    })
                ])
            ]),

            // Vitrine de Gestão
            el('div', { className: "space-y-4" }, [
                el('h3', { className: "text-slate-500 font-black uppercase text-[10px] tracking-widest" }, "📦 Vitrine Atual"),
                el('div', { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" }, 
                    shopItems.map(item => el('div', { key: item.id, className: "bg-slate-950 border border-slate-800 p-5 rounded-3xl flex flex-col gap-3 group relative" }, [
                        el('button', {
                            onClick: () => handleRemoveItem(item.id),
                            className: "absolute top-4 right-4 text-slate-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        }, "🗑️"),
                        el('div', { className: "flex items-center gap-4" }, [
                            el('span', { className: "text-3xl" }, item.icon),
                            el('div', {}, [
                                el('p', { className: `text-sm font-black uppercase tracking-tighter ${RARITY_COLORS[item.rarity || 'Comum']}` }, item.name),
                                el('p', { className: "text-amber-500 font-bold text-xs" }, `${item.price} PO`)
                            ])
                        ]),
                        el('p', { className: "text-[10px] text-slate-500 italic line-clamp-2 border-b border-slate-900 pb-2" }, item.description),
                        item.stats && el('div', { className: "bg-purple-950/20 p-2 rounded-lg border border-purple-900/30" }, [
                            el('p', { className: "text-[8px] font-black text-purple-500 uppercase tracking-widest mb-1" }, "📊 Atributos Secretos"),
                            el('p', { className: "text-[10px] text-purple-300 font-mono" }, item.stats)
                        ])
                    ]))
                )
            ])
        ]);
    };

    const renderPlayerPanel = () => {
        const gold = parseInt(sheetData?.outros?.['PO'] || 0);
        return el('div', { className: "space-y-10" }, [
            el('div', { className: "flex flex-col items-center gap-6" }, [
                el('div', { className: "bg-slate-900/80 border border-amber-500/30 px-10 py-4 rounded-full flex items-center gap-4 shadow-2xl" }, [
                    el('span', { className: "text-2xl" }, "💰"),
                    el('div', {}, [
                        el('p', { className: "text-[8px] font-black text-amber-500/60 uppercase tracking-widest" }, "Seu Dinheiro"),
                        el('p', { className: "text-xl font-black text-white" }, `${gold} Moedas de Ouro`)
                    ])
                ]),
                shopContext && el('div', { className: "bg-amber-600/10 border border-amber-500/20 px-6 py-2 rounded-2xl flex items-center gap-3 animate-pulse" }, [
                    el('span', { className: "text-xs" }, "📢"),
                    el('p', { className: "text-[10px] text-amber-500 font-bold uppercase tracking-wider" }, `Mercado: ${shopContext} (${priceMultiplier}x)` )
                ])
            ]),

            el('div', { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" }, 
                shopItems.length === 0 ? 
                el('div', { className: "col-span-full py-20 text-center text-slate-600 italic uppercase tracking-[0.3em] text-xs" }, "A loja está fechada ou sem estoque...") :
                shopItems.map(item => el('div', { key: item.id, className: "bg-slate-900 border-2 border-slate-800 hover:border-amber-500/50 p-6 rounded-[2.5rem] flex flex-col gap-6 transition-all hover:translate-y-[-4px] shadow-xl" }, [
                    el('div', { className: "flex items-center gap-4" }, [
                        el('div', { className: "w-16 h-16 bg-slate-950 rounded-2xl flex items-center justify-center text-3xl shadow-inner" }, item.icon),
                        el('div', { className: "flex-1" }, [
                            el('h4', { className: `text-sm font-black uppercase tracking-tight ${RARITY_COLORS[item.rarity || 'Comum']}` }, item.name),
                            el('p', { className: "text-amber-500 font-black text-lg" }, `${item.price} PO`)
                        ])
                    ]),
                    el('p', { className: "text-[10px] text-slate-400 leading-relaxed flex-1" }, item.description || "Sem descrição disponível."),
                    el('button', {
                        onClick: () => handleBuyItem(item),
                        disabled: gold < item.price || isProcessing,
                        className: `w-full py-4 rounded-2xl font-black uppercase text-xs tracking-[0.2em] transition-all ${
                            gold < item.price ? 'bg-slate-800 text-slate-600 cursor-not-allowed' : 'bg-amber-600 text-slate-900 hover:bg-amber-500 shadow-lg active:scale-95'
                        }`
                    }, gold < item.price ? "Sem Ouro" : "Comprar")
                ]))
            )
        ]);
    };

    return el('div', { className: "fixed inset-0 z-[150] bg-slate-950 flex flex-col animate-fade-in overflow-hidden" }, [
        el('div', { className: "p-8 flex justify-between items-center border-b border-slate-800 bg-slate-900/30" }, [
            el('div', { className: "flex items-center gap-6" }, [
                el('button', { onClick: onBack, className: "w-12 h-12 rounded-full bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center transition-all shadow-lg" }, "←"),
                el('div', {}, [
                    el('h2', { className: "text-3xl font-black uppercase tracking-tighter text-white italic" }, isMaster ? `🏬 ${vendorType}` : `🛒 ${vendorType}`),
                    el('p', { className: "text-[10px] font-bold text-amber-500 uppercase tracking-[0.3em]" }, isMaster ? "Gestão de Mercadoria" : "Vitrine de Itens")
                ])
            ])
        ]),

        el('div', { className: "flex-1 overflow-y-auto p-10 custom-scrollbar" }, [
            el('div', { className: "max-w-6xl mx-auto" }, isMaster ? renderMasterPanel() : renderPlayerPanel())
        ]),

        el('div', { className: "p-6 border-t border-slate-800 bg-slate-950 text-center" }, [
            el('p', { className: "text-[8px] font-black text-slate-600 uppercase tracking-[0.5em]" }, "Sistema de Trocas e Comércio • VTT 2026")
        ])
    ]);
}
