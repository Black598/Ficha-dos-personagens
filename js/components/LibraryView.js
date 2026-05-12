import { parseImageUrl } from '../utils.js';

const { useState } = React;
const el = React.createElement;

// Tabs da biblioteca — animals é aberta para todos; outras são master-only
const CATEGORIES = [
    { id: 'characters', label: 'Personagens / NPCs', icon: '👥', masterOnly: true  },
    { id: 'books',      label: 'Livros & Mapas',     icon: '📜', masterOnly: true  },
    { id: 'bestiary',   label: 'Monstros',           icon: '👹', masterOnly: true  },
    { id: 'animals',    label: 'Glossário Animal',   icon: '🐾', masterOnly: false },
];

const EMPTY_CREATURE = { name: '', type: '', cr: '', hp: '', ca: '', description: '', image: '' };
const EMPTY_ENTRY    = { name: '', title: '', description: '', image: '' };

export function LibraryView({ mode, libraryData, updateSessionState, onBack }) {
    const [activeTab,    setActiveTab]    = useState('animals');
    const [isAdding,     setIsAdding]     = useState(false);
    const [editingItem,  setEditingItem]  = useState(null);
    const [newItem,      setNewItem]      = useState(EMPTY_ENTRY);
    const [searchQuery,  setSearchQuery]  = useState('');
    const [zoomImage,    setZoomImage]    = useState(null);
    const [detailItem,   setDetailItem]   = useState(null);

    const activeCat  = CATEGORIES.find(c => c.id === activeTab);
    const canEdit    = mode === 'master' || !activeCat.masterOnly; // bestiary: todos podem

    // Lista filtrada
    const currentItems = (libraryData?.[activeTab] || []).filter(item => {
        const title = item.name || item.title || '';
        return title.toLowerCase().includes(searchQuery.toLowerCase()) ||
               (item.description || '').toLowerCase().includes(searchQuery.toLowerCase());
    });

    // --- Salvar ---
    const handleSaveItem = () => {
        const required = activeTab === 'bestiary' ? newItem.name : (newItem.name || newItem.title);
        if (!required) return;

        const item = (activeTab === 'bestiary' || activeTab === 'animals')
            ? { ...newItem }
            : { name: newItem.name, title: newItem.name, description: newItem.description, image: newItem.image };

        let updatedCategory;
        if (editingItem) {
            updatedCategory = (libraryData?.[activeTab] || []).map(i =>
                i.id === editingItem.id ? { ...item, id: i.id } : i
            );
        } else {
            updatedCategory = [...(libraryData?.[activeTab] || []), { ...item, id: Date.now() }];
        }

        updateSessionState({ library: { ...libraryData, [activeTab]: updatedCategory } });
        setNewItem(activeTab === 'bestiary' ? EMPTY_CREATURE : EMPTY_ENTRY);
        setIsAdding(false);
        setEditingItem(null);
    };

    // --- Deletar (só mestre) ---
    const handleDeleteItem = (e, id) => {
        e.stopPropagation();
        if (mode !== 'master') return;
        if (!confirm('Apagar este registro permanentemente?')) return;
        const updatedCategory = (libraryData?.[activeTab] || []).filter(i => i.id !== id);
        updateSessionState({ library: { ...libraryData, [activeTab]: updatedCategory } });
        if (detailItem?.id === id) setDetailItem(null);
    };

    // --- Abrir formulário de edição ---
    const startAdding = () => {
        setNewItem(activeTab === 'bestiary' ? { ...EMPTY_CREATURE } : { ...EMPTY_ENTRY });
        setEditingItem(null);
        setIsAdding(true);
    };

    const startEditing = (item) => {
        if (!canEdit) { setDetailItem(item); return; }
        setNewItem(item);
        setEditingItem(item);
        setIsAdding(true);
    };

    // ─────────────────────────────────────────────
    //  FORMULÁRIO DE ADIÇÃO / EDIÇÃO
    // ─────────────────────────────────────────────
    const renderForm = () =>
        el('div', { className: "bg-slate-900 border-2 border-amber-500/20 rounded-[3rem] p-10 max-w-2xl mx-auto animate-zoom-in shadow-2xl" }, [
            el('h3', { className: "text-amber-500 font-black uppercase tracking-widest mb-8 text-center" },
                editingItem ? '✏️ Editar Registro' : ((activeTab === 'bestiary' || activeTab === 'animals') ? '🐾 Nova Criatura' : '📝 Novo Registro')
            ),
            el('div', { className: "space-y-5" }, [

                // NOME
                el('div', null, [
                    el('label', { className: "text-[9px] text-slate-500 font-black uppercase mb-2 block" }, "Nome"),
                    el('input', {
                        value: newItem.name || '',
                        onChange: e => setNewItem({ ...newItem, name: e.target.value, title: e.target.value }),
                        className: "w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-sm text-white outline-none focus:border-amber-500/50"
                    })
                ]),

                // IMAGEM
                el('div', null, [
                    el('label', { className: "text-[9px] text-slate-500 font-black uppercase mb-2 block" }, "Link da Imagem (URL ou Drive)"),
                    el('input', {
                        value: newItem.image || '',
                        onChange: e => setNewItem({ ...newItem, image: parseImageUrl(e.target.value) }),
                        placeholder: "https://... ou ID do Drive",
                        className: "w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-sm text-white outline-none focus:border-amber-500/50 font-mono"
                    })
                ]),

                // CAMPOS EXCLUSIVOS DO BESTIÁRIO E GLOSSÁRIO
                (activeTab === 'bestiary' || activeTab === 'animals') && el('div', { className: "grid grid-cols-2 gap-4" }, [
                    el('div', null, [
                        el('label', { className: "text-[9px] text-slate-500 font-black uppercase mb-2 block" }, "Tipo (ex: Besta, Morto-vivo)"),
                        el('input', {
                            value: newItem.type || '',
                            onChange: e => setNewItem({ ...newItem, type: e.target.value }),
                            className: "w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-sm text-white outline-none focus:border-amber-500/50"
                        })
                    ]),
                    el('div', null, [
                        el('label', { className: "text-[9px] text-slate-500 font-black uppercase mb-2 block" }, "CR / Nível de Desafio"),
                        el('input', {
                            value: newItem.cr || '',
                            onChange: e => setNewItem({ ...newItem, cr: e.target.value }),
                            placeholder: "1/2, 1, 5...",
                            className: "w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-sm text-white outline-none focus:border-amber-500/50"
                        })
                    ]),
                    el('div', null, [
                        el('label', { className: "text-[9px] text-slate-500 font-black uppercase mb-2 block" }, "PV (Pontos de Vida)"),
                        el('input', {
                            value: newItem.hp || '',
                            onChange: e => setNewItem({ ...newItem, hp: e.target.value }),
                            placeholder: "ex: 52 (8d10+8)",
                            className: "w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-sm text-white outline-none focus:border-amber-500/50"
                        })
                    ]),
                    el('div', null, [
                        el('label', { className: "text-[9px] text-slate-500 font-black uppercase mb-2 block" }, "CA (Classe de Armadura)"),
                        el('input', {
                            value: newItem.ca || '',
                            onChange: e => setNewItem({ ...newItem, ca: e.target.value }),
                            placeholder: "ex: 13 (couro natural)",
                            className: "w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-sm text-white outline-none focus:border-amber-500/50"
                        })
                    ]),
                ]),

                // DESCRIÇÃO
                el('div', null, [
                    el('label', { className: "text-[9px] text-slate-500 font-black uppercase mb-2 block" },
                        activeTab === 'bestiary' ? "Habilidades, Comportamento & Lore" : activeTab === 'animals' ? "Comportamento, Habitat & Curiosidades" : "Descrição / Lore"
                    ),
                    el('textarea', {
                        value: newItem.description || '',
                        onChange: e => setNewItem({ ...newItem, description: e.target.value }),
                        className: "w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-xs text-slate-300 outline-none focus:border-amber-500/50 h-48 resize-none"
                    })
                ]),

                // AÇÕES
                el('div', { className: "flex gap-4 pt-4" }, [
                    el('button', {
                        onClick: () => { setIsAdding(false); setEditingItem(null); },
                        className: "flex-1 bg-slate-800 hover:bg-slate-700 text-slate-400 font-black py-4 rounded-2xl uppercase text-[10px] tracking-widest transition-all"
                    }, "Cancelar"),
                    el('button', {
                        onClick: handleSaveItem,
                        className: "flex-1 bg-amber-600 hover:bg-amber-500 text-slate-900 font-black py-4 rounded-2xl uppercase text-[10px] tracking-widest transition-all shadow-xl"
                    }, "Salvar Registro")
                ])
            ])
        ]);

    // ─────────────────────────────────────────────
    //  CARD DE CRIATURA (Bestiário)
    // ─────────────────────────────────────────────
    const renderBestiaryCard = (item) =>
        el('div', {
            key: item.id,
            onClick: () => setDetailItem(item),
            className: "group bg-slate-900 border border-slate-800 rounded-[2.5rem] overflow-hidden shadow-xl transition-all hover:border-amber-500/40 hover:-translate-y-2 cursor-pointer flex flex-col"
        }, [
            // Imagem
            el('div', {
                onClick: e => { e.stopPropagation(); if (item.image) setZoomImage(item.image); },
                className: "relative h-48 bg-slate-950 overflow-hidden cursor-zoom-in group/img"
            }, [
                item.image
                    ? el('img', { src: item.image, className: "w-full h-full object-cover transition-transform duration-700 group-hover/img:scale-110", alt: item.name })
                    : el('div', { className: "w-full h-full flex items-center justify-center opacity-20" }, el('span', { className: "text-6xl" }, "🐾")),
                item.image && el('div', { className: "absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity" }, el('span', null, "🔍")),
                // Badge de CR
                item.cr && el('div', { className: "absolute top-4 left-4 bg-amber-600 text-slate-900 font-black text-[9px] uppercase px-3 py-1 rounded-xl shadow-lg" }, `CR ${item.cr}`),
                // Botão deletar (só mestre)
                mode === 'master' && el('button', {
                    onClick: e => handleDeleteItem(e, item.id),
                    className: "absolute top-4 right-4 w-10 h-10 bg-red-900/80 backdrop-blur-md rounded-xl flex items-center justify-center text-white opacity-0 group-hover:opacity-100 hover:bg-red-600 transition-all border border-red-500/50"
                }, "🗑️")
            ]),
            // Info
            el('div', { className: "p-6 flex-grow flex flex-col gap-3" }, [
                el('h4', { className: "text-lg font-black uppercase text-amber-500 tracking-tighter" }, item.name),
                item.type && el('span', { className: "text-[9px] font-bold text-slate-500 uppercase tracking-widest border border-slate-800 px-3 py-1 rounded-full self-start" }, item.type),
                // PV + CA
                (item.hp || item.ca) && el('div', { className: "flex gap-3" }, [
                    item.hp && el('div', { className: "bg-red-950/50 border border-red-900/50 rounded-xl px-3 py-2 flex items-center gap-2" }, [
                        el('span', { className: "text-red-400 text-xs" }, "❤️"),
                        el('span', { className: "text-red-400 font-black text-xs" }, item.hp)
                    ]),
                    item.ca && el('div', { className: "bg-blue-950/50 border border-blue-900/50 rounded-xl px-3 py-2 flex items-center gap-2" }, [
                        el('span', { className: "text-blue-400 text-xs" }, "🛡️"),
                        el('span', { className: "text-blue-400 font-black text-xs" }, item.ca)
                    ]),
                ]),
                el('p', { className: "text-xs text-slate-500 line-clamp-2 italic leading-relaxed mt-auto" }, item.description),
            ])
        ]);

    // ─────────────────────────────────────────────
    //  CARD GENÉRICO (characters, books)
    // ─────────────────────────────────────────────
    const renderGenericCard = (item) =>
        el('div', {
            key: item.id,
            onClick: () => mode === 'master' ? startEditing(item) : setDetailItem(item),
            className: "group bg-slate-900 border border-slate-800 rounded-[2.5rem] overflow-hidden shadow-xl transition-all hover:border-amber-500/30 hover:-translate-y-2 cursor-pointer flex flex-col"
        }, [
            el('div', {
                onClick: e => { e.stopPropagation(); if (item.image) setZoomImage(item.image); },
                className: "relative h-56 bg-slate-950 overflow-hidden cursor-zoom-in group/img"
            }, [
                item.image
                    ? el('img', { src: item.image, className: "w-full h-full object-cover transition-transform duration-700 group-hover/img:scale-110", alt: item.name || item.title })
                    : el('div', { className: "w-full h-full flex items-center justify-center opacity-20" }, el('span', { className: "text-5xl" }, activeCat.icon)),
                item.image && el('div', { className: "absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity" }, el('span', null, "🔍")),
                mode === 'master' && el('button', {
                    onClick: e => handleDeleteItem(e, item.id),
                    className: "absolute top-4 right-4 w-10 h-10 bg-red-900/80 backdrop-blur-md rounded-xl flex items-center justify-center text-white opacity-0 group-hover:opacity-100 hover:bg-red-600 transition-all border border-red-500/50"
                }, "🗑️")
            ]),
            el('div', { className: "p-8 flex-grow flex flex-col" }, [
                el('h4', { className: "text-lg font-black uppercase text-amber-500 tracking-tighter mb-4" }, item.name || item.title),
                el('p', { className: "text-xs text-slate-400 line-clamp-4 leading-relaxed italic" }, item.description),
                el('div', { className: "mt-auto pt-6 flex justify-end" }, [
                    el('span', { className: "text-[8px] font-black text-slate-600 uppercase tracking-widest group-hover:text-amber-500 transition-colors" },
                        mode === 'master' ? "Clique para editar →" : "Consultar detalhes"
                    )
                ])
            ])
        ]);

    // ─────────────────────────────────────────────
    //  MODAL DE DETALHE (leitura pura)
    // ─────────────────────────────────────────────
    const renderDetailModal = () => {
        if (!detailItem) return null;
        const isBeast = activeTab === 'bestiary' || activeTab === 'animals';
        return el('div', {
            onClick: () => setDetailItem(null),
            className: "fixed inset-0 z-[300] bg-black/80 backdrop-blur-xl flex items-center justify-center p-6 animate-fade-in"
        }, [
            el('div', {
                onClick: e => e.stopPropagation(),
                className: "bg-slate-900 border border-slate-800 rounded-[3rem] max-w-xl w-full shadow-3xl overflow-hidden animate-zoom-in"
            }, [
                detailItem.image && el('div', { className: "h-64 overflow-hidden" }, [
                    el('img', { src: detailItem.image, className: "w-full h-full object-cover", alt: detailItem.name })
                ]),
                el('div', { className: "p-10 space-y-6" }, [
                    el('div', { className: "flex justify-between items-start" }, [
                        el('div', null, [
                            isBeast && detailItem.type && el('p', { className: "text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1" }, detailItem.type),
                            el('h3', { className: "text-2xl font-black uppercase text-amber-500 tracking-tighter" }, detailItem.name || detailItem.title),
                        ]),
                        el('button', { onClick: () => setDetailItem(null), className: "text-slate-600 hover:text-white text-3xl" }, "×")
                    ]),
                    isBeast && (detailItem.hp || detailItem.ca || detailItem.cr) && el('div', { className: "flex gap-4 flex-wrap" }, [
                        detailItem.cr && el('div', { className: "bg-amber-500/10 border border-amber-500/30 rounded-2xl px-4 py-3 text-center" }, [
                            el('p', { className: "text-[8px] text-amber-500 font-black uppercase" }, "CR"),
                            el('p', { className: "text-amber-500 font-black text-lg" }, detailItem.cr)
                        ]),
                        detailItem.hp && el('div', { className: "bg-red-950/50 border border-red-900 rounded-2xl px-4 py-3 text-center" }, [
                            el('p', { className: "text-[8px] text-red-400 font-black uppercase" }, "PV"),
                            el('p', { className: "text-red-400 font-black text-lg" }, detailItem.hp)
                        ]),
                        detailItem.ca && el('div', { className: "bg-blue-950/50 border border-blue-900 rounded-2xl px-4 py-3 text-center" }, [
                            el('p', { className: "text-[8px] text-blue-400 font-black uppercase" }, "CA"),
                            el('p', { className: "text-blue-400 font-black text-lg" }, detailItem.ca)
                        ]),
                    ]),
                    detailItem.description && el('p', { className: "text-sm text-slate-300 leading-relaxed whitespace-pre-wrap" }, detailItem.description),
                    // Editar (canEdit)
                    canEdit && el('button', {
                        onClick: () => { setDetailItem(null); startEditing(detailItem); },
                        className: "w-full bg-amber-600 hover:bg-amber-500 text-slate-900 font-black py-3 rounded-2xl uppercase text-[10px] tracking-widest transition-all mt-4"
                    }, "✏️ Editar")
                ])
            ])
        ]);
    };

    // ─────────────────────────────────────────────
    //  RENDER PRINCIPAL
    // ─────────────────────────────────────────────
    return el('div', { className: "fixed inset-0 z-[200] bg-slate-950/95 backdrop-blur-2xl flex flex-col p-6 animate-fade-in text-slate-100 overflow-hidden" }, [

        // HEADER
        el('header', { key: 'lib-header', className: "max-w-6xl mx-auto w-full flex flex-col md:flex-row justify-between items-center gap-6 mb-10 pb-8 border-b border-slate-800" }, [
            el('div', { className: "flex items-center gap-6" }, [
                el('button', {
                    onClick: onBack,
                    className: "w-12 h-12 bg-slate-900 border border-slate-700 rounded-2xl flex items-center justify-center text-xl hover:bg-slate-800 hover:border-amber-500/50 transition-all shadow-lg"
                }, "⬅️"),
                el('div', null, [
                    el('h2', { className: "text-3xl font-black italic uppercase tracking-tighter bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent" }, "📚 Grande Biblioteca"),
                    el('p', { className: "text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1" },
                        mode === 'master' ? "📜 Modo de Arquivista (Mestre)" : "📖 Consulta de Viajante"
                    )
                ])
            ]),
            // TABS
            el('div', { className: "flex bg-slate-900/50 p-1.5 rounded-3xl border border-slate-800 gap-1 flex-wrap justify-center" },
                CATEGORIES.map(cat =>
                    el('button', {
                        key: cat.id,
                        onClick: () => { setActiveTab(cat.id); setIsAdding(false); setEditingItem(null); setDetailItem(null); },
                        className: `px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === cat.id ? 'bg-amber-600 text-slate-900 shadow-xl' : 'text-slate-500 hover:text-slate-300'}`
                    }, [
                        el('span', { className: "text-base" }, cat.icon),
                        cat.label,
                        !cat.masterOnly && el('span', { className: "text-[8px] bg-emerald-600/20 text-emerald-400 px-2 py-0.5 rounded-full" }, "Todos")
                    ])
                )
            )
        ]),

        // BARRA DE BUSCA + BOTÃO ADICIONAR
        el('div', { key: 'lib-top-bar', className: "max-w-6xl mx-auto w-full flex gap-4 mb-8" }, [
            el('div', { className: "relative flex-grow" }, [
                el('span', { className: "absolute left-5 top-1/2 -translate-y-1/2 text-slate-500" }, "🔍"),
                el('input', {
                    value: searchQuery,
                    onChange: e => setSearchQuery(e.target.value),
                    placeholder: "Buscar na biblioteca...",
                    className: "w-full bg-slate-900 border border-slate-800 rounded-[2rem] pl-14 pr-6 py-4 text-xs text-white outline-none focus:border-amber-500/40 transition-all"
                })
            ]),
            // Botão visível se: mestre em qualquer aba, OU jogador na aba bestiary
            !isAdding && canEdit && el('button', {
                onClick: startAdding,
                className: "bg-amber-600 hover:bg-amber-500 text-slate-900 px-8 rounded-[2rem] font-black uppercase text-[10px] tracking-widest transition-all shadow-lg whitespace-nowrap"
            }, activeTab === 'bestiary' ? '🐾 + Adicionar Monstro' : activeTab === 'animals' ? '🐾 + Adicionar Animal' : '+ Adicionar')
        ]),

        // CONTEÚDO
        el('div', { key: 'lib-content', className: "max-w-6xl mx-auto w-full flex-grow overflow-y-auto pr-4 custom-scrollbar" },
            isAdding
                ? renderForm()
                : currentItems.length === 0
                    ? el('div', { className: "h-64 flex flex-col items-center justify-center text-slate-700 italic gap-4" }, [
                        el('span', { className: "text-6xl" }, "🕯️"),
                        el('p', null, "Nenhum registro encontrado nestas prateleiras...")
                    ])
                    : el('div', { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-32" },
                        currentItems.map(item =>
                            (activeTab === 'bestiary' || activeTab === 'animals') ? renderBestiaryCard(item) : renderGenericCard(item)
                        )
                    )
        ),

        // MODAL DETALHE
        renderDetailModal(),

        // ZOOM DE IMAGEM
        zoomImage && el('div', {
            onClick: () => setZoomImage(null),
            className: "fixed inset-0 z-[1000] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 md:p-12 animate-fade-in cursor-zoom-out"
        }, [
            el('div', { className: "relative max-w-5xl max-h-full flex items-center justify-center animate-zoom-in" }, [
                el('img', {
                    src: zoomImage,
                    className: "max-w-full max-h-[85vh] rounded-3xl shadow-2xl border-4 border-white/5 object-contain",
                    onClick: e => e.stopPropagation()
                }),
                el('button', {
                    onClick: () => setZoomImage(null),
                    className: "absolute -top-6 -right-6 w-14 h-14 bg-white text-slate-900 rounded-2xl flex items-center justify-center text-4xl font-light hover:bg-red-500 hover:text-white transition-all shadow-2xl"
                }, "×")
            ])
        ])
    ]);
}
