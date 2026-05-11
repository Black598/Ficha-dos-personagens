// js/components/LoginView.js
import { CharacterCreationModal } from './CharacterCreationModal.js';

export function LoginView({
    allCharacters = [],
    onSelectCharacter,
    onCreateCharacter,
    creatingCharacter,
    isCreating,
    TALENT_TREES,
    iconMap,
    campaigns = [],
    currentAppId,
    setCurrentAppId,
    createNewCampaign
}) {
    const el = React.createElement;
    const { useState } = React;

    const [isCreatingCampaign, setIsCreatingCampaign] = useState(false);

    // Componentes de ícone seguros
    const Crown = iconMap?.Crown ? iconMap.Crown({}) : '👑';
    const Users = iconMap?.Users ? iconMap.Users({}) : '👥';
    const Zap = iconMap?.Zap ? iconMap.Zap({}) : '⚡';

    return el('div', { className: "min-h-screen bg-slate-950 text-slate-100 animate-fade-in" },
        // --- HEADER ---
        el('header', { className: "bg-slate-900/90 backdrop-blur-xl border-b border-slate-800 p-4 md:p-6" },
            el('div', { className: "max-w-7xl mx-auto flex justify-between items-center" },
                el('div', null,
                    el('h1', { className: "text-2xl md:text-4xl font-black text-white mb-2 tracking-tighter uppercase italic" }, "Selecione seu Herói"),
                    el('div', { className: "flex items-center gap-2" },
                        el('select', {
                            value: currentAppId,
                            onChange: (e) => {
                                if (e.target.value === 'new') {
                                    setIsCreatingCampaign(true);
                                } else {
                                    setCurrentAppId(e.target.value);
                                }
                            },
                            className: "bg-slate-950/50 text-amber-500 text-xs md:text-sm uppercase font-bold tracking-[0.2em] border border-slate-800 rounded-lg p-2 focus:outline-none focus:border-amber-500 cursor-pointer hover:bg-slate-900 transition-all"
                        }, [
                            ...campaigns.map(camp => el('option', { key: camp.id, value: camp.id }, camp.name)),
                            el('option', { key: 'new', value: 'new', className: "text-emerald-400" }, "+ CRIAR NOVA SALA/CAMPANHA")
                        ])
                    )
                ),
                el('button', {
                    onClick: () => onSelectCharacter('mestre'),
                    className: "bg-purple-950/40 border-2 border-purple-500/60 hover:border-purple-500 rounded-2xl p-3 md:p-4 transition-all group shadow-lg"
                }, Crown)
            )
        ),

        // --- LISTA DE PERSONAGENS ---
        el('main', { className: "max-w-7xl mx-auto p-4 md:p-6 pb-20" },
            el('h2', { className: "text-xl md:text-2xl font-black text-white mb-6 uppercase tracking-tight italic flex items-center gap-3" },
                el('span', { className: "text-amber-500" }, Users),
                " Selecionar Herói"
            ),

            el('div', { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6" },
                // Botão Criar Novo
                el('button', {
                    onClick: () => onCreateCharacter(null), // Sinaliza que quer abrir o modal
                    className: "bg-gradient-to-br from-amber-900/40 to-slate-900 border-2 border-dashed border-amber-500/60 rounded-[2rem] p-6 hover:border-amber-500 transition-all h-full min-h-[220px] flex flex-col items-center justify-center gap-4 group shadow-lg"
                },
                    el('div', { className: "text-4xl group-hover:scale-110 transition-transform" }, "✨"),
                    el('p', { className: "text-white font-black uppercase tracking-widest text-center text-sm" }, "Criar", el('br'), "Novo Herói")
                ),

                // Map de Personagens
                allCharacters.map(char => {

                    if (!char || !char.name) return null;

                    if (char.name.toLowerCase() === 'mestre') return null;
                    if (char.pendingDeletion) return null;

                    const tree = char.selectedTree ? TALENT_TREES[char.selectedTree] : null;
                    const talentsCount = char.unlocked ? Object.values(char.unlocked).filter(v => v > 0).length : 0;

                    return el('button', {
                        key: char.name,
                        onClick: () => onSelectCharacter(char.name),
                        className: `relative bg-slate-900 border-2 rounded-[2rem] p-6 transition-all h-full min-h-[220px] flex flex-col group shadow-lg ${tree ? `${tree.border} hover:shadow-[0_0_40px_rgba(0,0,0,0.6)]` : 'border-slate-800 hover:border-slate-600'}`
                    },
                        el('div', { className: "text-left" },
                            el('div', { className: `${tree?.color || 'bg-slate-800'} w-16 h-16 rounded-2xl flex items-center justify-center text-white font-black text-2xl mb-4 border border-white/10 group-hover:scale-110 transition-transform overflow-hidden shadow-lg` },
                                char.imageUrl ? 
                                    el('img', { src: char.imageUrl, className: "w-full h-full object-cover" }) : 
                                    char.name[0].toUpperCase()
                            ),
                            el('h3', { className: "text-lg font-black text-white uppercase tracking-tight mb-1 group-hover:text-amber-400 transition-colors" }, char.name),
                            el('p', { className: "text-xs font-bold text-amber-500 uppercase tracking-widest mb-4" },
                                tree ? tree.title : '⚠️ Sem classe'
                            ),
                            el('div', { className: "bg-slate-950/60 px-2 py-1 rounded-lg border border-slate-800/50 w-fit" },
                                el('p', { className: "text-[10px] text-slate-400 font-bold uppercase" },
                                    el('span', { className: "inline mr-1 text-amber-500" }, Zap),
                                    ` ${talentsCount} Talentos`
                                )
                            )
                        ),
                        el('div', { className: "mt-auto text-amber-500/30 group-hover:text-amber-500 transition-colors text-right" }, "▶")
                    );
                })
            )
        ),

        // --- MODAL DE CRIAÇÃO DE PERSONAGEM ---
        creatingCharacter && el(CharacterCreationModal, {
            onClose: () => onCreateCharacter(false), // Função para fechar (passando null/false para o estado no app.js)
            onCreate: (name) => onCreateCharacter(name), // Função para realmente criar
            isCreating: isCreating
        }),

        // --- MODAL DE CRIAÇÃO DE CAMPANHA ---
        isCreatingCampaign && el('div', { className: "fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in" },
            el('div', { className: "bg-slate-900 border border-slate-700 rounded-3xl p-8 max-w-sm w-full shadow-2xl relative animate-slide-up" },
                el('h3', { className: "text-2xl font-black text-white uppercase italic tracking-tighter mb-4" }, "Nova Campanha"),
                el('p', { className: "text-slate-400 text-sm mb-6" }, "Dê um nome para a nova sala de RPG. Todos que acessarem essa sala terão um novo conjunto de personagens, chat e grimório."),
                el('form', {
                    onSubmit: (e) => {
                        e.preventDefault();
                        const name = e.target.campaignName.value.trim();
                        if (name) {
                            createNewCampaign(name);
                            setIsCreatingCampaign(false);
                        }
                    }
                },
                    el('input', {
                        name: 'campaignName',
                        autoFocus: true,
                        placeholder: "Ex: Cyberpunk 2077",
                        className: "w-full bg-slate-950 border-2 border-slate-800 rounded-xl p-4 text-white font-bold mb-6 focus:outline-none focus:border-amber-500 transition-colors"
                    }),
                    el('div', { className: "flex gap-3" },
                        el('button', {
                            type: 'button',
                            onClick: () => setIsCreatingCampaign(false),
                            className: "flex-1 px-4 py-3 bg-slate-800 text-slate-300 font-bold uppercase tracking-widest text-xs rounded-xl hover:bg-slate-700 transition-colors"
                        }, "Cancelar"),
                        el('button', {
                            type: 'submit',
                            className: "flex-1 px-4 py-3 bg-amber-600 text-white font-black uppercase tracking-widest text-xs rounded-xl hover:bg-amber-500 hover:shadow-[0_0_20px_rgba(217,119,6,0.4)] transition-all"
                        }, "Criar Sala")
                    )
                )
            )
        )
    );
}