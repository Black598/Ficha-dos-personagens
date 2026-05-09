const { useState } = React;
const el = React.createElement;

export function DevilsBargain({ mode, bargainData, updateSessionState, onBack, allPlayers = [], characterName }) {
    const [activeTab, setActiveTab ] = useState('draw'); // 'draw' or 'manage'
    const [selectedCategory, setSelectedCategory] = useState('leve');
    const [drawResult, setDrawResult] = useState(null);
    const [duration, setDuration] = useState(1);
    const [durationType, setDurationType] = useState('rounds'); // 'rounds' or 'days'
    const [targetPlayer, setTargetPlayer] = useState('');
    const [newEffectText, setNewEffectText] = useState('');

    const CATEGORIES = [
        { id: 'muito-leve', label: 'Muito Leve', color: 'text-emerald-400', border: 'border-emerald-500/30', bg: 'bg-emerald-500/10' },
        { id: 'leve', label: 'Leve', color: 'text-blue-400', border: 'border-blue-500/30', bg: 'bg-blue-500/10' },
        { id: 'media', label: 'Média', color: 'text-amber-400', border: 'border-amber-500/30', bg: 'bg-amber-500/10' },
        { id: 'pesada', label: 'Pesada', color: 'text-orange-500', border: 'border-orange-500/30', bg: 'bg-orange-500/10' },
        { id: 'muito-pesada', label: 'Muito Pesada', color: 'text-red-500', border: 'border-red-500/30', bg: 'bg-red-500/10' }
    ];

    const handleDraw = () => {
        const effects = bargainData.categories[selectedCategory] || [];
        if (effects.length === 0) return;
        const randomIndex = Math.floor(Math.random() * effects.length);
        setDrawResult(effects[randomIndex]);
        setTargetPlayer(allPlayers[0] || '');
    };

    const handleApply = () => {
        if (!drawResult) return;
        
        const newBargain = {
            id: Date.now(),
            text: drawResult,
            player: targetPlayer,
            duration: parseInt(duration),
            unit: durationType,
            timestamp: Date.now()
        };

        const activeBargains = [...(bargainData.activeBargains || []), newBargain];
        
        updateSessionState({
            devilsBargain: {
                ...bargainData,
                activeBargains
            }
        });

        setDrawResult(null);
        alert(`Barganha aplicada a ${targetPlayer}!`);
    };

    const handleAddEffect = () => {
        if (!newEffectText.trim()) return;
        
        const updatedCategories = {
            ...bargainData.categories,
            [selectedCategory]: [...(bargainData.categories[selectedCategory] || []), newEffectText.trim()]
        };

        updateSessionState({
            devilsBargain: {
                ...bargainData,
                categories: updatedCategories
            }
        });

        setNewEffectText('');
        alert('Efeito adicionado à categoria!');
    };

    const removeActiveBargain = (id) => {
        const activeBargains = (bargainData.activeBargains || []).filter(b => b.id !== id);
        updateSessionState({
            devilsBargain: {
                ...bargainData,
                activeBargains
            }
        });
    };

    const renderDrawTab = () => el('div', { key: 'draw-grid', className: "grid grid-cols-1 lg:grid-cols-2 gap-10" }, [
        // Coluna Escolha
        el('div', { key: 'draw-col-left', className: "space-y-8" }, [
            el('div', { key: 'intensity-box', className: "bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8" }, [
                el('h3', { key: 'i-title', className: "text-xs font-black uppercase tracking-[0.3em] text-slate-500 mb-6" }, "1. Selecionar Intensidade"),
                el('div', { key: 'i-btns', className: "flex flex-wrap gap-3" }, 
                    CATEGORIES.map(cat => el('button', {
                        key: cat.id,
                        onClick: () => setSelectedCategory(cat.id),
                        className: `px-6 py-4 rounded-2xl border text-[10px] font-black uppercase tracking-widest transition-all ${selectedCategory === cat.id ? `${cat.bg} ${cat.border} ${cat.color}` : 'bg-slate-950 border-slate-900 text-slate-600 hover:text-slate-400'}`
                    }, cat.label))
                ),
                el('button', {
                    key: 'btn-roll-bargain',
                    onClick: handleDraw,
                    className: "w-full mt-10 bg-red-600 hover:bg-red-500 text-white font-black py-5 rounded-3xl uppercase text-[10px] tracking-[0.2em] transition-all shadow-2xl shadow-red-900/20"
                }, "🎲 Rolar Efeito Aleatório")
            ]),

            drawResult && el('div', { key: 'draw-result-box', className: "bg-gradient-to-br from-red-900/20 to-slate-950 border-2 border-red-500/30 rounded-[2.5rem] p-8 animate-zoom-in" }, [
                el('h4', { key: 'dr-title', className: "text-red-500 font-black uppercase text-[10px] mb-4 tracking-widest" }, "✨ Efeito Sorteado"),
                el('p', { key: 'dr-text', className: "text-xl italic text-amber-100 font-serif leading-relaxed" }, `"${drawResult}"`),
                
                el('div', { key: 'dr-controls', className: "grid grid-cols-2 gap-6 mt-10" }, [
                    el('div', { key: 'dr-target' }, [
                        el('label', { key: 'target-lbl', className: "text-[9px] text-slate-500 font-black uppercase mb-3 block" }, "Alvo"),
                        el('select', {
                            key: 'target-select',
                            value: targetPlayer,
                            onChange: (e) => setTargetPlayer(e.target.value),
                            className: "w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white outline-none"
                        }, allPlayers.map(p => el('option', { key: p, value: p }, p)))
                    ]),
                    el('div', { key: 'dr-duration' }, [
                        el('label', { key: 'dur-lbl', className: "text-[9px] text-slate-500 font-black uppercase mb-3 block" }, "Duração"),
                        el('div', { key: 'dur-row', className: "flex gap-2" }, [
                            el('input', {
                                key: 'dur-val',
                                type: 'number',
                                value: duration,
                                onChange: (e) => setDuration(e.target.value),
                                className: "w-16 bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-center text-white"
                            }),
                            el('select', {
                                key: 'dur-unit',
                                value: durationType,
                                onChange: (e) => setDurationType(e.target.value),
                                className: "flex-grow bg-slate-950 border border-slate-800 rounded-xl p-3 text-[10px] font-black uppercase text-white"
                            }, [
                                el('option', { key: 'opt-r', value: 'rounds' }, 'Rodadas'),
                                el('option', { key: 'opt-d', value: 'days' }, 'Dias')
                            ])
                        ])
                    ])
                ]),

                el('button', {
                    key: 'btn-apply-bargain',
                    onClick: handleApply,
                    className: "w-full mt-8 bg-amber-600 hover:bg-amber-500 text-slate-950 font-black py-4 rounded-2xl uppercase text-[10px] tracking-widest transition-all"
                }, "🔥 Aplicar ao Jogador")
            ])
        ]),

        // Coluna Adicionar Custom
        el('div', { key: 'add-custom-col', className: "bg-slate-900/40 border border-slate-800 rounded-[2.5rem] p-8 h-fit" }, [
            el('h3', { key: 'ac-title', className: "text-xs font-black uppercase tracking-[0.3em] text-slate-500 mb-6" }, "Adicionar Novo Efeito"),
            el('p', { key: 'ac-subtitle', className: "text-[9px] text-slate-600 mb-4" }, `Adicionando à categoria: ${CATEGORIES.find(c => c.id === selectedCategory)?.label}`),
            el('textarea', {
                key: 'ac-input',
                value: newEffectText,
                onChange: (e) => setNewEffectText(e.target.value),
                placeholder: "Ex: Seu braço fica dormente por 2 rodadas...",
                className: "w-full bg-slate-950 border border-slate-800 rounded-2xl p-6 text-xs text-slate-400 outline-none h-32 mb-4 focus:border-red-500/40"
            }),
            el('button', {
                key: 'ac-btn',
                onClick: handleAddEffect,
                className: "w-full bg-slate-800 hover:bg-slate-700 text-slate-400 font-black py-4 rounded-2xl uppercase text-[10px] tracking-widest transition-all border border-slate-700"
            }, "+ Salvar na Categoria")
        ])
    ]);

    const renderManageTab = () => el('div', { key: 'manage-list-root', className: "space-y-6" }, [
        el('h3', { key: 'ml-title', className: "text-xs font-black uppercase tracking-[0.3em] text-slate-500 mb-10 text-center" }, "📜 Dívidas Atuais com o Sobrenatural"),
        el('div', { key: 'ml-grid', className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" }, 
            (bargainData.activeBargains || []).map(b => el('div', { key: b.id, className: "bg-slate-900 border border-slate-800 p-8 rounded-[2.5rem] relative group" }, [
                el('div', { key: 'b-header', className: "flex justify-between items-start mb-6" }, [
                    el('div', { key: 'b-info' }, [
                        el('h4', { key: 'b-player', className: "text-amber-500 font-black uppercase text-lg tracking-tighter" }, b.player),
                        el('p', { key: 'b-time', className: "text-[8px] font-black text-slate-600 uppercase tracking-widest" }, 
                            `Desde ${new Date(b.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                        )
                    ]),
                    el('button', {
                        key: 'b-del',
                        onClick: () => removeActiveBargain(b.id),
                        className: "w-8 h-8 bg-red-900/20 text-red-600 rounded-lg hover:bg-red-600 hover:text-white transition-all text-sm flex items-center justify-center opacity-0 group-hover:opacity-100"
                    }, "×")
                ]),
                el('p', { key: 'b-text', className: "text-slate-300 italic mb-10 text-xs leading-relaxed" }, `"${b.text}"`),
                el('div', { key: 'b-footer', className: "flex justify-between items-center" }, [
                    el('span', { key: 'b-dur-badge', className: `px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest ${b.unit === 'rounds' ? 'bg-blue-600/20 text-blue-400' : 'bg-emerald-600/20 text-emerald-400'}` }, 
                        `${b.duration} ${b.unit === 'rounds' ? 'Rounds' : 'Dias'}`
                    ),
                    el('div', { key: 'b-controls', className: "flex gap-1" }, [
                        el('button', {
                            key: 'b-dec',
                            onClick: () => {
                                const active = bargainData.activeBargains.map(item => 
                                    item.id === b.id ? { ...item, duration: Math.max(0, item.duration - 1) } : item
                                );
                                updateSessionState({ devilsBargain: { ...bargainData, activeBargains: active } });
                            },
                            className: "w-6 h-6 bg-slate-800 rounded-md flex items-center justify-center text-slate-400 hover:text-white"
                        }, "−"),
                        el('button', {
                            key: 'b-inc',
                            onClick: () => {
                                const active = bargainData.activeBargains.map(item => 
                                    item.id === b.id ? { ...item, duration: item.duration + 1 } : item
                                );
                                updateSessionState({ devilsBargain: { ...bargainData, activeBargains: active } });
                            },
                            className: "w-6 h-6 bg-slate-800 rounded-md flex items-center justify-center text-slate-400 hover:text-white"
                        }, "+")
                    ])
                ])
            ]))
        ),
        (bargainData.activeBargains || []).length === 0 && el('p', { key: 'ml-empty', className: "text-center text-slate-700 italic py-20" }, "Nenhuma barganha ativa no momento.")
    ]);

    // Renderiza a lista de barganhas ativas para os jogadores (visualização simples)
    if (mode === 'player') {
        const playerBargains = (bargainData.activeBargains || []).filter(b => b.player === characterName);
        
        return el('div', { key: 'player-bargain-overlay', className: "fixed inset-0 z-[200] bg-slate-950/95 backdrop-blur-xl flex items-center justify-center p-6 animate-fade-in" }, [
            el('div', { key: 'player-bargain-modal', className: "bg-slate-900 border-2 border-red-500/30 rounded-[3rem] p-10 max-w-2xl w-full shadow-3xl flex flex-col max-h-[80vh]" }, [
                el('div', { key: 'player-bargain-header', className: "flex justify-between items-center mb-8" }, [
                    el('h2', { key: 'pb-title', className: "text-2xl font-black uppercase italic tracking-tighter text-red-500" }, "🔥 Suas Barganhas"),
                    el('button', { key: 'pb-close', onClick: onBack, className: "text-slate-500 hover:text-white text-3xl" }, "×")
                ]),
                el('div', { key: 'player-bargain-list', className: "flex-grow overflow-y-auto space-y-4 pr-4 custom-scrollbar" }, 
                    playerBargains.length === 0 ? 
                    el('p', { key: 'pb-empty', className: "text-center text-slate-600 italic py-10" }, "Nenhuma dívida com o diabo... por enquanto.") :
                    playerBargains.map(b => el('div', { key: b.id, className: "bg-slate-950 border border-red-900/40 p-6 rounded-2xl" }, [
                        el('p', { key: 'pb-text', className: "text-amber-100 italic mb-4" }, `"${b.text}"`),
                        el('div', { key: 'pb-footer', className: "flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-500" }, [
                            el('span', { key: 'pb-dur' }, `Duração: ${b.duration} ${b.unit === 'rounds' ? 'Rodadas' : 'Dias'}`),
                            el('span', { key: 'pb-status', className: "text-red-500" }, "DÍVIDA ATIVA")
                        ])
                    ]))
                )
            ])
        ]);
    }

    // Modo Mestre (Gerenciamento completo)
    return el('div', { key: 'master-bargain-root', className: "fixed inset-0 z-[200] bg-slate-950/98 backdrop-blur-2xl flex flex-col p-6 animate-fade-in text-slate-100 overflow-hidden" }, [
        el('header', { key: 'mb-header', className: "max-w-6xl mx-auto w-full flex flex-col md:flex-row justify-between items-center gap-6 mb-10 pb-8 border-b border-slate-800" }, [
            el('div', { key: 'mb-h-left', className: "flex items-center gap-6" }, [
                el('button', {
                    key: 'mb-back',
                    onClick: onBack,
                    className: "w-12 h-12 bg-slate-900 border border-slate-700 rounded-2xl flex items-center justify-center text-xl hover:bg-slate-800 hover:border-red-500/50 transition-all shadow-lg"
                }, "⬅️"),
                el('div', { key: 'mb-h-info' }, [
                    el('h2', { key: 'mb-title', className: "text-3xl font-black italic uppercase tracking-tighter bg-gradient-to-r from-red-500 to-orange-600 bg-clip-text text-transparent" }, "👹 Barganha do Diabo"),
                    el('p', { key: 'mb-subtitle', className: "text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1" }, "O preço do poder é sempre alto")
                ])
            ]),

            el('div', { key: 'mb-tabs', className: "flex bg-slate-900/50 p-1.5 rounded-3xl border border-slate-800" }, [
                el('button', {
                    key: 'tab-draw',
                    onClick: () => setActiveTab('draw'),
                    className: `px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'draw' ? 'bg-red-600 text-white shadow-xl' : 'text-slate-500 hover:text-slate-300'}`
                }, "Sorteio"),
                el('button', {
                    key: 'tab-manage',
                    onClick: () => setActiveTab('manage'),
                    className: `px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'manage' ? 'bg-red-600 text-white shadow-xl' : 'text-slate-500 hover:text-slate-300'}`
                }, "Gerenciar Ativas")
            ])
        ]),

        el('div', { key: 'mb-content-area', className: "max-w-6xl mx-auto w-full flex-grow overflow-y-auto custom-scrollbar pr-4 pb-32" }, [
            activeTab === 'draw' ? renderDrawTab() : renderManageTab()
        ])
    ]);
}
