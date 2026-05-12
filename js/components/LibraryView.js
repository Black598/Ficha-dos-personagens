import { parseImageUrl } from '../utils.js';

const { useState } = React;
const el = React.createElement;

export function LibraryView({ mode, libraryData, updateSessionState, onBack }) {
    const [activeTab, setActiveTab] = useState('characters');
    const [isAdding, setIsAdding] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [newItem, setNewItem] = useState({ name: '', title: '', description: '', image: '' });
    const [searchQuery, setSearchQuery] = useState('');

    const [zoomImage, setZoomImage] = useState(null);

    const categories = [
        { id: 'characters', label: 'Personagens', icon: '👥' },
        { id: 'books', label: 'Livros', icon: '📜' },
        { id: 'bestiary', label: 'Bestiário', icon: '🐲' }
    ];

    const currentItems = (libraryData?.[activeTab] || []).filter(item => {
        const title = item.name || item.title || '';
        return title.toLowerCase().includes(searchQuery.toLowerCase()) || 
               (item.description || '').toLowerCase().includes(searchQuery.toLowerCase());
    });

    const handleSaveItem = () => {
        if (!newItem.name && !newItem.title && !newItem.description) return;
        
        let updatedCategory;
        if (editingItem) {
            updatedCategory = libraryData[activeTab].map(item => 
                item.id === editingItem.id ? { ...newItem, id: item.id } : item
            );
        } else {
            updatedCategory = [...(libraryData?.[activeTab] || []), { ...newItem, id: Date.now() }];
        }

        updateSessionState({
            library: {
                ...libraryData,
                [activeTab]: updatedCategory
            }
        });
        
        setNewItem({ name: '', title: '', description: '', image: '' });
        setIsAdding(false);
        setEditingItem(null);
    };

    const handleDeleteItem = (e, id) => {
        e.stopPropagation();
        if (!confirm('Deseja apagar este item permanentemente?')) return;
        const updatedCategory = libraryData[activeTab].filter(item => item.id !== id);
        updateSessionState({
            library: {
                ...libraryData,
                [activeTab]: updatedCategory
            }
        });
    };

    const startEditing = (item) => {
        setNewItem(item);
        setEditingItem(item);
        setIsAdding(true);
    };

    return el('div', { className: "fixed inset-0 z-[200] bg-slate-950/95 backdrop-blur-2xl flex flex-col p-6 animate-fade-in text-slate-100 overflow-hidden" }, [
        
        // --- HEADER ---
        el('header', { key: 'lib-header', className: "max-w-6xl mx-auto w-full flex flex-col md:flex-row justify-between items-center gap-6 mb-10 pb-8 border-b border-slate-800" }, [
            el('div', { className: "flex items-center gap-6" }, [
                el('button', {
                    onClick: onBack,
                    className: "w-12 h-12 bg-slate-900 border border-slate-700 rounded-2xl flex items-center justify-center text-xl hover:bg-slate-800 hover:border-amber-500/50 transition-all shadow-lg group"
                }, "⬅️"),
                el('div', null, [
                    el('h2', { className: "text-3xl font-black italic uppercase tracking-tighter bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent" }, "📚 Grande Biblioteca"),
                    el('p', { className: "text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1" }, 
                        mode === 'master' ? "📜 Modo de Arquivista (Mestre)" : "📖 Consulta de Viajante"
                    )
                ])
            ]),

            // TABS
            el('div', { className: "flex bg-slate-900/50 p-1.5 rounded-3xl border border-slate-800" }, 
                categories.map(cat => el('button', {
                    key: cat.id,
                    onClick: () => { setActiveTab(cat.id); setIsAdding(false); setEditingItem(null); },
                    className: `px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-3 ${activeTab === cat.id ? 'bg-amber-600 text-slate-900 shadow-xl' : 'text-slate-500 hover:text-slate-300'}`
                }, [
                    el('span', { className: "text-lg" }, cat.icon),
                    cat.label
                ]))
            )
        ]),

        // --- BUSCA E AÇÕES ---
        el('div', { key: 'lib-top-bar', className: "max-w-6xl mx-auto w-full flex gap-4 mb-8" }, [
            el('div', { className: "relative flex-grow" }, [
                el('span', { className: "absolute left-5 top-1/2 -translate-y-1/2 text-slate-500" }, "🔍"),
                el('input', {
                    value: searchQuery,
                    onChange: (e) => setSearchQuery(e.target.value),
                    placeholder: "Buscar na biblioteca...",
                    className: "w-full bg-slate-900 border border-slate-800 rounded-[2rem] pl-14 pr-6 py-4 text-xs text-white outline-none focus:border-amber-500/40 transition-all"
                })
            ]),
            mode === 'master' && !isAdding && el('button', {
                onClick: () => {
                    setNewItem({ name: '', title: '', description: '', image: '' });
                    setEditingItem(null);
                    setIsAdding(true);
                },
                className: "bg-amber-600 hover:bg-amber-500 text-slate-900 px-8 rounded-[2rem] font-black uppercase text-[10px] tracking-widest transition-all shadow-lg"
            }, "+ Adicionar")
        ]),

        // --- CONTEÚDO PRINCIPAL ---
        el('div', { key: 'lib-content', className: "max-w-6xl mx-auto w-full flex-grow overflow-y-auto pr-4 custom-scrollbar" }, 
            isAdding ? 
            // FORMULÁRIO DE EDIÇÃO (MESTRE)
            el('div', { className: "bg-slate-900 border-2 border-amber-500/20 rounded-[3rem] p-10 max-w-2xl mx-auto animate-zoom-in shadow-2xl" }, [
                el('h3', { className: "text-amber-500 font-black uppercase tracking-widest mb-8 text-center" }, 
                    editingItem ? "✏️ Editar Registro" : "📝 Novo Registro"
                ),
                el('div', { key: 'lib-form-body', className: "space-y-6" }, [
                    el('div', { key: 'name-group' }, [
                        el('label', { key: 'name-label', className: "text-[9px] text-slate-500 font-black uppercase mb-2 block" }, "Nome / Título"),
                        el('input', {
                            key: 'name-input',
                            value: newItem.name || newItem.title || '',
                            onChange: (e) => setNewItem({...newItem, name: e.target.value, title: e.target.value}),
                            className: "w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-sm text-white outline-none focus:border-amber-500/50"
                        })
                    ]),
                    el('div', { key: 'image-group' }, [
                        el('label', { key: 'image-label', className: "text-[9px] text-slate-500 font-black uppercase mb-2 block" }, "Link da Imagem (URL)"),
                        el('input', {
                            key: 'image-input',
                            value: newItem.image || '',
                            onChange: (e) => setNewItem({...newItem, image: parseImageUrl(e.target.value)}),
                            placeholder: "https://... ou ID do Drive",
                            className: "w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-sm text-white outline-none focus:border-amber-500/50 font-mono"
                        })
                    ]),
                    el('div', { key: 'desc-group' }, [
                        el('label', { key: 'desc-label', className: "text-[9px] text-slate-500 font-black uppercase mb-2 block" }, "Descrição / Lore"),
                        el('textarea', {
                            key: 'desc-input',
                            value: newItem.description || '',
                            onChange: (e) => setNewItem({...newItem, description: e.target.value}),
                            className: "w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-xs text-slate-300 outline-none focus:border-amber-500/50 h-48 resize-none"
                        })
                    ]),
                    el('div', { key: 'form-actions', className: "flex gap-4 pt-4" }, [
                        el('button', {
                            key: 'btn-cancel',
                            onClick: () => { setIsAdding(false); setEditingItem(null); },
                            className: "flex-1 bg-slate-800 hover:bg-slate-700 text-slate-400 font-black py-4 rounded-2xl uppercase text-[10px] tracking-widest transition-all"
                        }, "Cancelar"),
                        el('button', {
                            key: 'btn-save',
                            onClick: handleSaveItem,
                            className: "flex-1 bg-amber-600 hover:bg-amber-500 text-slate-900 font-black py-4 rounded-2xl uppercase text-[10px] tracking-widest transition-all shadow-xl"
                        }, "Salvar Registro")
                    ])
                ])
            ])
            :
            // GRID DE ITENS
            currentItems.length === 0 ? 
                el('div', { key: 'empty-state', className: "h-64 flex flex-col items-center justify-center text-slate-700 italic gap-4" }, [
                    el('span', { key: 'candle', className: "text-6xl" }, "🕯️"),
                    el('p', { key: 'msg' }, "Nenhum segredo encontrado nestas prateleiras...")
                ])
                :
                el('div', { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-32" }, 
                    currentItems.map(item => el('div', {
                        key: item.id,
                        onClick: () => mode === 'master' && startEditing(item),
                        className: `group bg-slate-900 border border-slate-800 rounded-[2.5rem] overflow-hidden shadow-xl transition-all hover:border-amber-500/30 hover:-translate-y-2 cursor-pointer flex flex-col ${mode === 'master' ? 'active:scale-95' : ''}`
                    }, [
                        el('div', { 
                            onClick: (e) => { e.stopPropagation(); if (item.image) setZoomImage(item.image); },
                            className: "relative h-56 bg-slate-950 overflow-hidden cursor-zoom-in group/img" 
                        }, [
                            item.image ? 
                                el('img', { 
                                    src: item.image, 
                                    className: "w-full h-full object-cover transition-transform duration-700 group-hover/img:scale-110",
                                    alt: item.name || item.title
                                }) :
                                el('div', { className: "w-full h-full flex items-center justify-center opacity-20" }, 
                                    el('span', { className: "text-5xl" }, categories.find(c => c.id === activeTab).icon)
                                ),
                            // Indicador de Zoom
                            item.image && el('div', { className: "absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity" }, [
                                el('span', { className: "text-3xl" }, "🔍")
                            ]),
                            // DELETE BUTTON (MASTER)
                            mode === 'master' && el('button', {
                                onClick: (e) => handleDeleteItem(e, item.id),
                                className: "absolute top-4 right-4 w-10 h-10 bg-red-900/80 backdrop-blur-md rounded-xl flex items-center justify-center text-white opacity-0 group-hover:opacity-100 hover:bg-red-600 transition-all border border-red-500/50"
                            }, "🗑️")
                        ]),
                        // CONTENT AREA
                        el('div', { className: "p-8 flex-grow flex flex-col" }, [
                            el('h4', { className: "text-lg font-black uppercase text-amber-500 tracking-tighter mb-4" }, item.name || item.title),
                            el('p', { className: "text-xs text-slate-400 line-clamp-4 leading-relaxed italic" }, item.description),
                            el('div', { className: "mt-auto pt-6 flex justify-end" }, [
                                el('span', { className: "text-[8px] font-black text-slate-600 uppercase tracking-widest group-hover:text-amber-500 transition-colors" }, 
                                    mode === 'master' ? "Clique para editar →" : "Consultar detalhes"
                                )
                            ])
                        ])
                    ]))
                )
        ),

        // --- OVERLAY DE ZOOM ---
        zoomImage && el('div', { 
            key: 'zoom-overlay',
            onClick: () => setZoomImage(null),
            className: "fixed inset-0 z-[1000] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 md:p-12 animate-fade-in cursor-zoom-out" 
        }, [
            el('div', { className: "relative max-w-5xl max-h-full flex items-center justify-center animate-zoom-in" }, [
                el('img', { 
                    src: zoomImage, 
                    className: "max-w-full max-h-[85vh] rounded-3xl shadow-2xl border-4 border-white/5 object-contain",
                    onClick: (e) => e.stopPropagation()
                }),
                el('button', {
                    onClick: () => setZoomImage(null),
                    className: "absolute -top-6 -right-6 w-14 h-14 bg-white text-slate-900 rounded-2xl flex items-center justify-center text-4xl font-light hover:bg-red-500 hover:text-white transition-all shadow-2xl active:scale-90"
                }, "×")
            ])
        ])
    ]);
}
