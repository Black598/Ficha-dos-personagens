import { AudioManager } from '../AudioManager.js';

const { useState, useEffect } = React;

export function TradingSystem({ sheetData, sessionState, updateSessionState, onUpdateSheet, onBack, isMaster, characterName }) {
    const el = React.createElement;
    const [selectedTab, setSelectedTab] = useState('buy'); // 'buy' or 'sell' (for players)
    const [newItem, setNewItem] = useState({ name: '', price: 0, icon: '📦', description: '' });
    const [isProcessing, setIsProcessing] = useState(false);

    const shopItems = sessionState.shopInventory || [];

    const handleAddItem = async () => {
        if (!newItem.name || newItem.price <= 0) {
            alert("Preencha o nome e um preço válido!");
            return;
        }
        const updatedShop = [...shopItems, { ...newItem, id: Date.now() }];
        await updateSessionState({ shopInventory: updatedShop });
        setNewItem({ name: '', price: 0, icon: '📦', description: '' });
        AudioManager.play('click');
    };

    const handleRemoveItem = async (itemId) => {
        const updatedShop = shopItems.filter(i => i.id !== itemId);
        await updateSessionState({ shopInventory: updatedShop });
    };

    const handleBuyItem = async (item) => {
        if (isProcessing) return;
        
        // 1. Verificar Ouro do Jogador
        const playerGold = parseInt(sheetData?.outros?.['PO'] || 0);
        if (playerGold < item.price) {
            alert("Você não tem ouro suficiente!");
            AudioManager.play('error');
            return;
        }

        if (!confirm(`Deseja comprar "${item.name}" por ${item.price} PO?`)) return;

        setIsProcessing(true);
        try {
            // 2. Deduzir Ouro
            const newGold = playerGold - item.price;
            
            // 3. Adicionar Item ao Inventário
            const currentInv = sheetData?.outros?.['Equipamento'] || "";
            const itemString = `[${item.icon}] ${item.name}`;
            const newInv = currentInv ? `${currentInv}, ${itemString}` : itemString;

            // 4. Salvar Alterações na Ficha
            await onUpdateSheet({ 
                outros: { 
                    ...sheetData.outros, 
                    'PO': newGold.toString(),
                    'Equipamento': newInv
                } 
            });

            AudioManager.play('coins');
            alert(`Você comprou ${item.name}!`);
        } catch (e) {
            console.error(e);
            alert("Erro ao processar compra.");
        } finally {
            setIsProcessing(false);
        }
    };

    const renderMasterPanel = () => {
        return el('div', { className: "space-y-8 p-6 bg-slate-900/50 rounded-[2.5rem] border border-slate-800" }, [
            el('div', { className: "flex flex-col gap-4" }, [
                el('h3', { className: "text-amber-500 font-black uppercase text-xs tracking-[0.2em]" }, "➕ Adicionar Novo Item à Vitrine"),
                el('div', { className: "grid grid-cols-1 md:grid-cols-4 gap-4" }, [
                    el('input', {
                        placeholder: "Nome do Item",
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
                    el('input', {
                        placeholder: "Ícone (Emoji)",
                        value: newItem.icon,
                        onChange: e => setNewItem({ ...newItem, icon: e.target.value }),
                        className: "bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-amber-500/50 text-center"
                    }),
                    el('button', {
                        onClick: handleAddItem,
                        className: "bg-amber-600 hover:bg-amber-500 text-white font-black py-3 rounded-xl uppercase text-[10px] tracking-widest transition-all shadow-lg"
                    }, "Colocar à Venda")
                ]),
                el('textarea', {
                    placeholder: "Descrição curta do item...",
                    value: newItem.description,
                    onChange: e => setNewItem({ ...newItem, description: e.target.value }),
                    className: "w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-amber-500/50 h-20 resize-none"
                })
            ]),

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
                                el('p', { className: "text-sm font-black text-white uppercase tracking-tighter" }, item.name),
                                el('p', { className: "text-amber-500 font-bold text-xs" }, `${item.price} PO`)
                            ])
                        ]),
                        item.description && el('p', { className: "text-[10px] text-slate-500 italic" }, item.description)
                    ]))
                )
            ])
        ]);
    };

    const renderPlayerPanel = () => {
        const gold = parseInt(sheetData?.outros?.['PO'] || 0);
        return el('div', { className: "space-y-10" }, [
            // Status do Jogador
            el('div', { className: "flex justify-center" }, [
                el('div', { className: "bg-slate-900/80 border border-amber-500/30 px-10 py-4 rounded-full flex items-center gap-4 shadow-2xl" }, [
                    el('span', { className: "text-2xl" }, "💰"),
                    el('div', {}, [
                        el('p', { className: "text-[8px] font-black text-amber-500/60 uppercase tracking-widest" }, "Seu Dinheiro"),
                        el('p', { className: "text-xl font-black text-white" }, `${gold} Moedas de Ouro`)
                    ])
                ])
            ]),

            // Vitrine
            el('div', { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" }, 
                shopItems.length === 0 ? 
                el('div', { className: "col-span-full py-20 text-center text-slate-600 italic uppercase tracking-[0.3em] text-xs" }, "A loja está fechada ou sem estoque...") :
                shopItems.map(item => el('div', { key: item.id, className: "bg-slate-900 border-2 border-slate-800 hover:border-amber-500/50 p-6 rounded-[2.5rem] flex flex-col gap-6 transition-all hover:translate-y-[-4px] shadow-xl group" }, [
                    el('div', { className: "flex items-center gap-4" }, [
                        el('div', { className: "w-16 h-16 bg-slate-950 rounded-2xl flex items-center justify-center text-3xl shadow-inner" }, item.icon),
                        el('div', { className: "flex-1" }, [
                            el('h4', { className: "text-sm font-black text-white uppercase tracking-tight" }, item.name),
                            el('p', { className: "text-amber-500 font-black text-lg" }, `${item.price} PO`)
                        ])
                    ]),
                    el('div', { className: "flex-1" }, [
                        el('p', { className: "text-[10px] text-slate-400 leading-relaxed" }, item.description || "Sem descrição disponível.")
                    ]),
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
        // Header Estilizado
        el('div', { className: "p-8 flex justify-between items-center border-b border-slate-800 bg-slate-900/30" }, [
            el('div', { className: "flex items-center gap-6" }, [
                el('button', { 
                    onClick: onBack, 
                    className: "w-12 h-12 rounded-full bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center transition-all shadow-lg" 
                }, "←"),
                el('div', {}, [
                    el('h2', { className: "text-3xl font-black uppercase tracking-tighter text-white italic" }, isMaster ? "🏬 Gestão da Loja" : "🛒 Mercado de Itens"),
                    el('p', { className: "text-[10px] font-bold text-amber-500 uppercase tracking-[0.3em]" }, isMaster ? "Modo Administrador" : "Explore e Negocie")
                ])
            ]),
            !isMaster && el('div', { className: "flex gap-4" }, [
                el('button', {
                    onClick: () => setSelectedTab('buy'),
                    className: `px-6 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${selectedTab === 'buy' ? 'bg-amber-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`
                }, "Comprar"),
                el('button', {
                    onClick: () => setSelectedTab('sell'),
                    className: `px-6 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${selectedTab === 'sell' ? 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-50' : 'text-slate-500'}`
                }, "Vender (Breve)")
            ])
        ]),

        // Área Central de Scroll
        el('div', { className: "flex-1 overflow-y-auto p-10 custom-scrollbar" }, [
            el('div', { className: "max-w-6xl mx-auto" }, 
                isMaster ? renderMasterPanel() : renderPlayerPanel()
            )
        ]),

        // Footer Informativo
        el('div', { className: "p-6 border-t border-slate-800 bg-slate-950 text-center" }, [
            el('p', { className: "text-[8px] font-black text-slate-600 uppercase tracking-[0.5em]" }, "Sistema de Trocas e Comércio • VTT 2026")
        ])
    ]);
}
