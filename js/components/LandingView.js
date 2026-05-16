// js/components/LandingView.js
export function LandingView({
    campaigns = [],
    currentAppId,
    setCurrentAppId,
    createNewCampaign,
    importCampaign,
    deleteCampaign,
    onEnterRoom,
    onSync
}) {
    const el = React.createElement;
    const { useState } = React;
    const [isCreating, setIsCreating] = useState(false);

    return el('div', { className: "min-h-screen bg-slate-950 flex items-center justify-center p-6 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-950/20 via-slate-950 to-slate-950" }, [
        el('div', { key: 'content-grid', className: "max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-12 items-center" }, [
            // Esquerda: Intro
            el('div', { key: 'intro-section', className: "space-y-6 text-center md:text-left" }, [
                el('div', { key: 'version-badge', className: "inline-block p-3 bg-amber-500/10 rounded-2xl border border-amber-500/20 mb-4" }, 
                    el('span', { className: "text-amber-500 text-sm font-black uppercase tracking-widest" }, "🛡️ VTT RPG SYSTEM v3.0")
                ),
                el('h1', { key: 'hero-title', className: "text-5xl md:text-7xl font-black text-white leading-tight tracking-tighter italic uppercase" }, [
                    el(React.Fragment, { key: 'txt1' }, "Sua Próxima"), el('br', { key: 'br1' }), 
                    el('span', { key: 'span1', className: "text-amber-500" }, "Aventura"), 
                    el(React.Fragment, { key: 'txt2' }, " Começa Aqui")
                ]),
                el('p', { key: 'hero-desc', className: "text-slate-400 text-lg md:text-xl font-medium max-w-md mx-auto md:mx-0" }, 
                    "Gerencie suas campanhas, mapas e fichas em um ambiente sincronizado e seguro."
                )
            ]),

            // Direita: Seleção de Campanha
            el('div', { key: 'campaign-section', className: "bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-[2.5rem] p-8 shadow-2xl space-y-6" }, [
                el('div', { key: 'card-header', className: "flex justify-between items-center" }, [
                    el('h2', { key: 'title', className: "text-xl font-black text-white uppercase tracking-tight" }, "Minhas Campanhas"),
                    el('div', { key: 'actions', className: "flex gap-4" }, [
                        el('button', {
                            key: 'btn-sync',
                            onClick: onSync,
                            className: "text-[10px] font-black text-indigo-400 hover:text-white uppercase tracking-widest transition-colors flex items-center gap-1"
                        }, "🔄 Sincronizar"),
                        el('button', {
                            key: 'btn-import',
                            onClick: () => {
                                const id = prompt("ID da campanha:");
                                if(id) importCampaign(id);
                            },
                            className: "text-[10px] font-black text-slate-500 hover:text-white uppercase tracking-widest transition-colors"
                        }, "📥 Importar ID")
                    ])
                ]),

                el('div', { key: 'campaign-list', className: "space-y-3 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar" }, [
                    ...campaigns.map(camp => el('div', {
                        key: camp.id,
                        className: "group relative"
                    }, [
                        el('button', {
                            key: 'btn-room',
                            onClick: () => onEnterRoom(camp.id),
                            className: `w-full text-left p-4 rounded-2xl border-2 transition-all flex items-center justify-between ${
                                currentAppId === camp.id ? 'bg-indigo-600/10 border-indigo-500 shadow-[0_0_20px_rgba(79,70,229,0.2)]' : 'bg-slate-950/40 border-slate-800 hover:border-slate-700'
                            }`
                        }, [
                            el('div', { key: 'info' }, [
                                el('p', { key: 'label', className: "text-xs font-black text-indigo-500 uppercase tracking-widest mb-1" }, camp.id === 'rpg-default' ? 'Original' : 'Sessão Ativa'),
                                el('h3', { key: 'name', className: "text-lg font-bold text-white group-hover:text-indigo-400 transition-colors" }, camp.name)
                            ]),
                            el('span', { key: 'status', className: "text-slate-700 group-hover:text-indigo-500 transition-colors text-xl" }, camp.hasPassword ? "🔒" : "▶")
                        ]),
                        camp.id !== 'rpg-default' && el('button', {
                            key: 'btn-del',
                            onClick: (e) => { e.stopPropagation(); deleteCampaign(camp.id); },
                            className: "absolute -right-2 -top-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                        }, "×")
                    ])),
                    
                    el('button', {
                        key: 'btn-new',
                        onClick: () => setIsCreating(true),
                        className: "w-full p-4 rounded-2xl border-2 border-dashed border-slate-800 hover:border-amber-500/50 hover:bg-amber-500/5 transition-all text-slate-500 hover:text-amber-500 font-black uppercase tracking-widest text-xs"
                    }, "+ Criar Nova Sala")
                ]),

                // Footer
                el('div', { key: 'card-footer', className: "pt-4 border-t border-slate-800 flex justify-between items-center" }, [
                    el('p', { key: 'count', className: "text-[10px] text-slate-500 font-bold uppercase" }, `${campaigns.length} Salas Encontradas`),
                    el('span', { key: 'tag', className: "text-slate-700 text-xs" }, "Acesso Seguro Ativado")
                ])
            ])
        ]),

        // Modal Criar
        isCreating && el('div', { key: 'modal-overlay', className: "fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-md animate-fade-in" }, [
            el('div', { key: 'modal-container', className: "bg-slate-900 border border-slate-800 rounded-[2rem] p-8 max-w-sm w-full shadow-3xl animate-slide-up" }, [
                el('h3', { className: "text-2xl font-black text-white uppercase italic tracking-tighter mb-4" }, "Nova Campanha"),
                el('form', {
                    onSubmit: (e) => {
                        e.preventDefault();
                        const name = e.target.campName.value;
                        const pass = e.target.campPass.value;
                        if (name) {
                            createNewCampaign(name, pass);
                            setIsCreating(false);
                        }
                    }
                }, [
                    el('div', { className: "space-y-4 mb-8" }, [
                        el('div', null, [
                            el('label', { className: "text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block" }, "Nome da Sala"),
                            el('input', { name: "campName", required: true, className: "w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-white font-bold focus:border-amber-500 outline-none" })
                        ]),
                        el('div', null, [
                            el('label', { className: "text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block" }, "Senha da Sala (Opcional)"),
                            el('input', { name: "campPass", type: "password", placeholder: "Vazio para sala pública", className: "w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-white font-bold focus:border-amber-500 outline-none" })
                        ])
                    ]),
                    el('div', { className: "flex gap-3" }, [
                        el('button', { key: 'btn-cancel', type: "button", onClick: () => setIsCreating(false), className: "flex-1 p-4 bg-slate-800 text-slate-400 font-black uppercase text-[10px] rounded-xl" }, "Cancelar"),
                        el('button', { key: 'btn-create', type: "submit", className: "flex-1 p-4 bg-amber-600 text-white font-black uppercase text-[10px] rounded-xl shadow-lg shadow-amber-900/20" }, "Criar")
                    ])
                ])
            ])
        ])
    ]);
}
