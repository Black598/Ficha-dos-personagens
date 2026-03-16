// js/components/RawDataEditor.js
const el = React.createElement;

export function RawDataEditor({ data, onSave, onClose }) {
    if (!data) return null;

    return el('div', {
        className: "fixed inset-0 z-[200] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 animate-fade-in"
    }, [
        el('div', { className: "bg-slate-900 border-2 border-amber-500/30 rounded-[3rem] p-8 max-w-4xl w-full shadow-2xl flex flex-col h-[80vh]" }, [
            el('div', { className: "flex justify-between items-center mb-6 border-b border-amber-900/20 pb-4" }, [
                el('h3', { className: "text-amber-500 font-black uppercase tracking-[0.2em] text-sm" }, "🛠️ Editor de Células Brutas"),
                el('button', {
                    onClick: onClose,
                    className: "text-slate-500 hover:text-white transition-colors"
                }, "Fechar [ESC]")
            ]),
            el('p', { className: "text-[10px] text-slate-500 italic mb-4" },
                "Aviso: Você está editando o núcleo da ficha. Qualquer erro de sintaxe JSON impedirá o salvamento."
            ),
            el('textarea', {
                id: "raw-json-editor",
                className: "flex-grow bg-black/40 border border-slate-800 rounded-3xl p-6 text-xs text-amber-200 font-mono outline-none focus:border-amber-500/50 resize-none custom-scrollbar shadow-inner",
                defaultValue: JSON.stringify(data, null, 2)
            }),
            el('div', { className: "mt-6 flex gap-4" }, [
                el('button', {
                    onClick: onClose,
                    className: "flex-1 py-4 bg-slate-800 hover:bg-slate-700 text-slate-400 font-black uppercase text-[10px] rounded-2xl transition-all"
                }, "Cancelar"),
                el('button', {
                    onClick: async () => {
                        const text = document.getElementById('raw-json-editor').value;
                        try {
                            const parsed = JSON.parse(text);
                            await onSave(parsed);
                            onClose();
                        } catch (e) {
                            alert("❌ Erro no JSON: Verifique vírgulas e aspas.\n\n" + e.message);
                        }
                    },
                    className: "flex-1 py-4 bg-amber-600 hover:bg-amber-500 text-slate-950 font-black uppercase text-[10px] rounded-2xl transition-all shadow-lg"
                }, "Salvar Alterações")
            ])
        ])
    ]);
}
