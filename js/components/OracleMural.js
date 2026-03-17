const { useState } = React;

export function OracleMural({ sessionState, updateSessionState, oracleMessages }) {
    const el = React.createElement;

    return el('div', { key: 'oracle-mural-root', className: "bg-slate-900 border-2 border-purple-500/20 rounded-[2.5rem] p-6 shadow-2xl space-y-6" }, [
        el('div', { key: 'header', className: "flex items-center justify-between border-b border-slate-800 pb-4" }, [
            el('h2', { key: 'title', className: "text-xs font-black uppercase tracking-[0.3em] text-purple-400 flex items-center gap-2" }, "📢 Mural e Handouts"),
            el('span', { key: 'status', className: "text-[9px] text-slate-500 font-bold uppercase" }, "Visível para todos")
        ]),
        el('div', { key: 'content-grid', className: "grid grid-cols-1 md:grid-cols-2 gap-6" }, [
            el('div', { key: 'announcement-section', className: "space-y-2" }, [
                el('label', { key: 'label', className: "text-[9px] font-black text-slate-500 uppercase ml-2" }, "Aviso/Narração Pública"),
                el('textarea', {
                    key: 'textarea',
                    className: "w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-xs text-slate-300 outline-none focus:border-purple-500/50 resize-none h-24",
                    placeholder: "O que os heróis estão vendo/ouvindo...",
                    value: sessionState?.announcement || '',
                    onChange: (e) => updateSessionState({ announcement: e.target.value })
                })
            ]),
            el('div', { key: 'handout-section', className: "space-y-2" }, [
                el('label', { key: 'label', className: "text-[9px] font-black text-slate-500 uppercase ml-2" }, "URL de Imagem (Handout)"),
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
                sessionState?.handout && el('div', { key: 'preview', className: "mt-2 h-16 w-full rounded-xl overflow-hidden border border-slate-800 bg-black flex items-center justify-center" }, 
                    el('img', { src: sessionState.handout, className: "h-full object-cover opacity-50" })
                )
            ])
        ])
    ]);
}
