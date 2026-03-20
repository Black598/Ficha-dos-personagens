const { useState } = React;

export function OracleMural({ sessionState, updateSessionState, allPlayers = [] }) {
    const el = React.createElement;

    const renderTargetSelector = (currentValue, fieldName, themeColor) => {
        return el('div', { className: "flex items-center gap-2" }, [
            el('span', { className: `text-[8px] font-black uppercase text-${themeColor}-500/70` }, "🎯 Para:"),
            el('select', {
                value: currentValue || 'all',
                onChange: (e) => updateSessionState({ [fieldName]: e.target.value }),
                className: `bg-slate-950 border border-${themeColor}-500/20 rounded-lg px-2 py-1 text-[9px] font-black text-${themeColor}-400 outline-none focus:border-${themeColor}-500/50 transition-all cursor-pointer`
            }, [
                el('option', { key: 'all', value: 'all' }, "🌍 TODOS"),
                ...allPlayers.map(p => el('option', { key: p, value: p }, `👤 ${p.toUpperCase()}`))
            ])
        ]);
    };

    return el('div', { key: 'oracle-mural-root', className: "bg-slate-900 border-2 border-purple-500/20 rounded-[2.5rem] p-6 shadow-2xl space-y-6" }, [
        el('div', { key: 'header', className: "flex items-center justify-between border-b border-slate-800 pb-4" }, [
            el('h2', { key: 'title', className: "text-xs font-black uppercase tracking-[0.3em] text-purple-400 flex items-center gap-2" }, "📢 Mural e Handouts"),
            el('span', { key: 'status', className: "text-[9px] text-slate-500 font-bold uppercase" }, "Gerenciamento de Visibilidade")
        ]),
        el('div', { key: 'content-grid', className: "grid grid-cols-1 md:grid-cols-2 gap-6" }, [
            el('div', { key: 'announcement-section', className: "space-y-3" }, [
                el('div', { className: "flex justify-between items-center" }, [
                    el('label', { key: 'label', className: "text-[9px] font-black text-slate-500 uppercase ml-2" }, "Aviso/Narração Pública"),
                    renderTargetSelector(sessionState?.announcementTarget, 'announcementTarget', 'purple')
                ]),
                el('textarea', {
                    key: 'textarea',
                    className: "w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-xs text-slate-300 outline-none focus:border-purple-500/50 resize-none h-24",
                    placeholder: "O que os heróis estão vendo/ouvindo...",
                    value: sessionState?.announcement || '',
                    onChange: (e) => updateSessionState({ announcement: e.target.value })
                })
            ]),
            el('div', { key: 'handout-section', className: "space-y-3" }, [
                el('div', { className: "flex justify-between items-center" }, [
                    el('label', { key: 'label', className: "text-[9px] font-black text-slate-500 uppercase ml-2" }, "URL de Imagem (Handout)"),
                    renderTargetSelector(sessionState?.handoutTarget, 'handoutTarget', 'blue')
                ]),
                el('div', { key: 'input-wrapper', className: "relative" }, [
                    el('input', {
                        key: 'input',
                        className: "w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-xs text-blue-400 outline-none focus:border-blue-500/50 pr-12",
                        placeholder: "https://...",
                        value: sessionState?.handout || '',
                        onChange: (e) => updateSessionState({ handout: e.target.value })
                    }),
                    sessionState?.handout && el('button', {
                        key: 'clear-btn',
                        onClick: () => updateSessionState({ handout: '' }),
                        className: "absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 hover:text-red-500"
                    }, "×")
                ]),
                sessionState?.handout && el('div', { key: 'preview', className: "mt-2 h-16 w-full rounded-xl overflow-hidden border border-slate-800 bg-black flex items-center justify-center relative group" }, [
                    el('img', { src: sessionState.handout, className: "h-full object-cover opacity-40 group-hover:opacity-60 transition-opacity" }),
                    el('span', { className: "absolute inset-0 flex items-center justify-center text-[8px] font-black text-white/50 uppercase tracking-widest pointer-events-none" }, "Preview do Mestre")
                ])
            ])
        ])
    ]);
}
