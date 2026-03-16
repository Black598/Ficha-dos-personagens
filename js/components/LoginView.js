// js/components/LoginView.js

export function LoginView({
    allCharacters = [],
    onSelectCharacter,
    creatingCharacter,
    setCreatingCharacter,
    newCharacterName,
    setNewCharacterName,
    TALENT_TREES,
    iconMap,
    onCreateCharacter
}) {
    const el = React.createElement;

    // Componentes de ícone seguros
    const Crown = iconMap?.Crown ? iconMap.Crown({}) : '👑';
    const Users = iconMap?.Users ? iconMap.Users({}) : '👥';
    const Zap = iconMap?.Zap ? iconMap.Zap({}) : '⚡';

    return el('div', { className: "min-h-screen bg-slate-950 text-slate-100 animate-fade-in" },
        // --- HEADER ---
        el('header', { className: "bg-slate-900/90 backdrop-blur-xl border-b border-slate-800 p-4 md:p-6" },
            el('div', { className: "max-w-7xl mx-auto flex justify-between items-center" },
                el('div', null,
                    el('h1', { className: "text-2xl md:text-4xl font-black text-white mb-2 tracking-tighter uppercase italic" }, "Árvore de Talento"),
                    el('p', { className: "text-slate-500 text-xs md:text-[10px] uppercase font-bold tracking-[0.3em]" }, "O Despertar de novas habilidades")
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
                    onClick: () => setCreatingCharacter(true),
                    className: "bg-gradient-to-br from-amber-900/40 to-slate-900 border-2 border-dashed border-amber-500/60 rounded-[2rem] p-6 hover:border-amber-500 transition-all h-full min-h-[220px] flex flex-col items-center justify-center gap-4 group shadow-lg"
                },
                    el('div', { className: "text-4xl group-hover:scale-110 transition-transform" }, "✨"),
                    el('p', { className: "text-white font-black uppercase tracking-widest text-center text-sm" }, "Criar", el('br'), "Novo Herói")
                ),

                // Map de Personagens
                allCharacters.map(char => {

                    if (!char || !char.name) return null;

                    if (char.name.toLowerCase() === 'mestre') return null;

                    const tree = char.selectedTree ? TALENT_TREES[char.selectedTree] : null;
                    const talentsCount = char.unlocked ? Object.values(char.unlocked).filter(v => v > 0).length : 0;

                    return el('button', {
                        key: char.name,
                        onClick: () => onSelectCharacter(char.name),
                        className: `relative bg-slate-900 border-2 rounded-[2rem] p-6 transition-all h-full min-h-[220px] flex flex-col group shadow-lg ${tree ? `${tree.border} hover:shadow-[0_0_40px_rgba(0,0,0,0.6)]` : 'border-slate-800 hover:border-slate-600'}`
                    },
                        el('div', { className: "text-left" },
                            el('div', { className: `${tree?.color || 'bg-slate-800'} w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-xl mb-4 border border-white/10 group-hover:scale-110 transition-transform` },
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

        // --- MODAL DE CRIAÇÃO ---
        creatingCharacter && el('div', { className: "fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" },
            el('div', { className: "bg-slate-900 border-2 border-amber-500 rounded-3xl p-6 md:p-10 w-full max-w-md shadow-2xl relative overflow-hidden" },
                el('h2', { className: "text-xl md:text-2xl font-black text-white mb-2 uppercase italic text-center" }, "Criar Novo Herói"),
                el('p', { className: "text-slate-500 text-center text-xs mb-6 uppercase font-bold tracking-widest" }, "Digite o nome do personagem"),

                el('form', {
                    onSubmit: (e) => { e.preventDefault(); onCreateCharacter(); },
                    className: "space-y-4"
                },
                    el('input', {
                        type: "text",
                        placeholder: "Ex: Aragorn, Gandalf...",
                        value: newCharacterName,
                        onChange: e => setNewCharacterName(e.target.value),
                        autoFocus: true,
                        className: "w-full bg-slate-800 border-2 border-slate-700 rounded-2xl p-4 text-white outline-none focus:border-amber-500 transition-all font-bold"
                    }),
                    el('div', { className: "flex gap-3 pt-4" },
                        el('button', {
                            type: "button",
                            onClick: () => { setCreatingCharacter(false); setNewCharacterName(''); },
                            className: "flex-1 bg-slate-800 text-slate-300 font-black p-3 rounded-2xl border border-slate-700"
                        }, "Cancelar"),
                        el('button', {
                            type: "submit",
                            disabled: !newCharacterName.trim(),
                            className: "flex-1 bg-amber-600 hover:bg-amber-500 disabled:bg-slate-700 text-white font-black p-3 rounded-2xl shadow-lg"
                        }, "Criar Herói")
                    )
                )
            )
        )
    );
}