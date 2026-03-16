export function TreeView({
    TALENT_TREES,
    characterData,
    characterName,
    characterSheetData,
    onBack,
    onToggleSheet,
    upgradeTalent,
    showTooltip,
    saveCharacter,
    iconMap
}) {
    const el = React.createElement;

    // Tenta encontrar o ID da árvore em todas as camadas possíveis
    const selectedTreeKey = characterData?.selectedTree ||
        characterData?.selectedtree ||
        characterData?.sheetData?.selectedTree

    console.log("🔍 [DEBUG] Buscando ID da árvore em:", characterData)
    console.log("🌳 [RESULTADO] ID encontrado:", selectedTreeKey)

    const selectTree = (treeKey) => {
        if (selectedTreeKey) return
        const updated = {
            ...characterData,
            name: characterName,
            selectedTree: treeKey,
            unlocked: characterData?.unlocked || {}
        };
        saveCharacter(characterName, updated)
    };

    return el('div', { className: "min-h-screen bg-slate-950 text-slate-100 pb-32 animate-fade-in relative overflow-x-hidden" },
        // --- BACKGROUND DECORATIVO (BRILHO) ---
        el('div', { className: "fixed inset-0 pointer-events-none opacity-20 z-0", key: 'bg' },
            el('div', { className: "absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-amber-500/10 blur-[120px] rounded-full" })
        ),

        el('main', { className: "relative z-10 max-w-7xl mx-auto p-4 md:p-6", key: 'main' },

            // --- HEADER DA ÁRVORE ---
            el('div', { className: "flex flex-col md:flex-row justify-between items-center mb-12 gap-6 bg-slate-900/50 p-8 rounded-[3rem] border border-slate-800 backdrop-blur-sm shadow-2xl mt-4", key: 'header' },
                el('div', { className: "flex items-center gap-4" },
                    el('div', { className: "bg-amber-500/20 p-4 rounded-2xl border border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.1)]" },
                        iconMap.Star ? iconMap.Star({ className: "text-amber-500", size: 32 }) : "⭐"
                    ),
                    el('div', null,
                        el('h2', { className: "text-3xl font-black text-white uppercase italic tracking-tighter" }, "Caminhos do Destino"),
                        el('p', { className: "text-slate-500 text-[10px] font-bold uppercase tracking-[0.3em]" },
                            `Herói: ${characterName} | Nível: ${characterSheetData?.info?.Nivel || '1'}`
                        )
                    )
                ),
                el('div', { className: "flex gap-3" },
                    el('button', {
                        onClick: onToggleSheet,
                        className: "bg-slate-800 hover:bg-amber-600 text-white font-black px-6 py-4 rounded-2xl transition-all uppercase text-xs tracking-widest border border-slate-700 hover:border-amber-400 shadow-lg flex items-center gap-3"
                    }, "📜 Ver Atributos"),
                    el('button', {
                        onClick: onBack,
                        className: "bg-slate-800 hover:bg-red-900/40 text-slate-400 px-6 py-4 rounded-2xl transition-all uppercase text-xs font-black border border-slate-700"
                    }, "Sair")
                )
            ),

            // --- AVISO DE SELEÇÃO (Apenas se não houver árvore) ---
            !selectedTreeKey && el('div', { className: "col-span-full mb-12 bg-gradient-to-br from-amber-900/30 to-slate-900 border-2 border-amber-500/40 rounded-[3rem] p-10 relative overflow-hidden group shadow-2xl animate-pulse", key: 'alert' },
                el('div', { className: "absolute right-0 top-0 w-64 h-64 bg-amber-500/10 blur-[80px] -mr-32 -mt-32" }),
                el('div', { className: "relative z-10" },
                    el('h3', { className: "text-2xl font-black text-amber-500 mb-2 uppercase italic" }, "A Ascensão do Poder"),
                    el('p', { className: "text-slate-400 text-sm leading-relaxed max-w-3xl" },
                        "A jornada marca o início da sua especialização. Escolha uma das Vertentes do Destino. ",
                        el('span', { className: "text-white font-black block mt-4 underline decoration-amber-500 uppercase italic" },
                            "A escolha é permanente e selará as outras árvores para sempre."
                        )
                    )
                )
            ),

            // --- GRID DE CARTÕES ---
            el('div', { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8", key: 'grid' },
                Object.entries(TALENT_TREES).map(([key, tree]) => {
                    const isSelected = selectedTreeKey === key;
                    const isBlocked = selectedTreeKey && !isSelected;
                    const IconComp = iconMap[tree.icon];

                    return el('div', {
                        key: key,
                        onClick: () => !selectedTreeKey && selectTree(key),
                        className: `relative bg-slate-900 border-2 rounded-[3.5rem] p-8 transition-all duration-700 flex flex-col group
                            ${isSelected ? `${tree.border} shadow-[0_0_50px_rgba(0,0,0,0.5)] scale-[1.02] bg-slate-900/90` : 'border-slate-800 hover:border-slate-600'}
                            ${isBlocked ? 'opacity-10 grayscale blur-[2px] pointer-events-none scale-95' : 'cursor-pointer'}`
                    }, [
                        // Brilho de fundo
                        el('div', { key: 'glow', className: `absolute inset-0 rounded-[3.5rem] opacity-0 group-hover:opacity-5 transition-opacity duration-500 ${tree.color}` }),

                        // Cabeçalho do Card
                        el('div', { key: 'card-header', className: "flex items-center gap-4 mb-8 relative z-10" },
                            el('div', { className: `${tree.color} p-4 rounded-3xl shadow-2xl border border-white/10 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500` },
                                IconComp ? IconComp({ size: 24, className: "text-white" }) : "✨"
                            ),
                            el('div', null,
                                el('h3', { className: "text-lg font-black text-white uppercase tracking-tighter group-hover:text-amber-500 transition-colors italic" }, tree.title),
                                isSelected && el('span', { className: "text-[9px] font-black text-green-500 uppercase tracking-widest flex items-center gap-1" }, "● Trilha Ativa")
                            )
                        ),

                        // Conteúdo: Talentos (se selecionado) ou Descrição (se não)
                        isSelected ?
                            el('div', { key: 'talents', className: "space-y-6 mt-6 animate-fade-in-up relative z-10" },
                                (tree.talents || []).map(talent => {
                                    const currentLv = characterData?.unlocked?.[talent.id] || 0;

                                    return el('div', { key: talent.id, className: "space-y-3 bg-slate-950/20 p-4 rounded-[2rem] border border-slate-800/40" },
                                        el('div', { className: "flex justify-between items-center px-2" },
                                            el('span', { className: "text-[10px] font-black text-slate-400 uppercase flex items-center gap-2" },
                                                iconMap[talent.icon] ? iconMap[talent.icon]({ size: 14 }) : "🔸",
                                                talent.name
                                            )
                                        ),
                                        el('div', { className: "flex gap-2" },
                                            (talent.levels || []).map(level => {
                                                const isAtivo = currentLv >= level.lv;
                                                const isDisponivel = level.lv === currentLv + 1;

                                                return el('button', {
                                                    key: level.lv,
                                                    onMouseEnter: (e) => showTooltip(e, talent.name, level),
                                                    onMouseLeave: () => showTooltip(null),
                                                    onClick: (e) => {
                                                        e.stopPropagation();
                                                        if (isAtivo || isDisponivel) upgradeTalent(talent.id, level.lv);
                                                    },
                                                    className: `flex-1 py-4 rounded-2xl font-black text-[10px] transition-all border-2
                                                    ${isAtivo ? `${tree.color} border-white/20 text-white shadow-lg` :
                                                            isDisponivel ? 'bg-slate-800 border-slate-700 text-slate-500 hover:border-amber-500 hover:text-white' :
                                                                'bg-slate-950 border-transparent text-slate-800 cursor-not-allowed'}`
                                                }, level.lv === 1 ? 'I' : level.lv === 2 ? 'II' : 'III');
                                            })
                                        )
                                    );
                                })
                            ) :
                            el('div', { key: 'tree-desc', className: "flex-grow flex flex-col relative z-10" },
                                el('p', { className: "text-slate-500 text-sm italic leading-relaxed mb-8 pr-4" }, `"${tree.description}"`),
                                el('div', { className: "mt-auto bg-slate-950/50 p-5 rounded-3xl border border-slate-800 text-center uppercase" },
                                    el('span', { className: "text-[10px] font-black text-amber-500 tracking-[0.3em]" }, "Selar Trilha")
                                )
                            )
                    ]);
                })
            )
        )
    );
}