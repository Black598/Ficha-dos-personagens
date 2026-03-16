// js/components/CharacterCreationModal.js

const { useState } = React;

export function CharacterCreationModal({
    onClose,
    onCreate, // (name) => Promise<boolean>
    isCreating
}) {
    const el = React.createElement;
    const [name, setName] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name.trim() || isCreating) return;
        
        await onCreate(name.trim());
    };

    return el('div', { className: "fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in" },
        el('div', { className: "bg-slate-900 border-2 border-amber-500 rounded-3xl p-6 md:p-10 w-full max-w-md shadow-2xl relative overflow-hidden" },
            // Decoração de fundo
            el('div', { className: "absolute -top-20 -right-20 w-40 h-40 bg-amber-500/10 rounded-full blur-3xl" }),
            
            el('h2', { className: "text-xl md:text-2xl font-black text-white mb-2 uppercase italic text-center relative z-10" }, "Criar Novo Herói"),
            el('p', { className: "text-slate-500 text-center text-xs mb-6 uppercase font-bold tracking-widest relative z-10" }, "Digite o nome do personagem"),

            el('form', {
                onSubmit: handleSubmit,
                className: "space-y-4 relative z-10"
            },
                el('input', {
                    key: "input-name",
                    type: "text",
                    placeholder: "Ex: Aragorn, Gandalf...",
                    value: name,
                    onChange: e => setName(e.target.value),
                    autoFocus: true,
                    disabled: isCreating,
                    className: "w-full bg-slate-800 border-2 border-slate-700 rounded-2xl p-4 text-white outline-none focus:border-amber-500 transition-all font-bold disabled:opacity-50"
                }),
                
                isCreating && el('div', { key: "loading-state", className: "flex flex-col items-center gap-2 py-4 animate-pulse" },
                    el('div', { className: "w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" }),
                    el('p', { className: "text-[10px] text-amber-500 font-black uppercase tracking-widest" }, "Criando ficha no Drive...")
                ),

                el('div', { key: "actions", className: "flex gap-3 pt-4" },
                    el('button', {
                        key: "btn-cancel",
                        type: "button",
                        onClick: onClose,
                        disabled: isCreating,
                        className: "flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-black p-3 rounded-2xl border border-slate-700 transition-colors disabled:opacity-50"
                    }, "Cancelar"),
                    el('button', {
                        key: "btn-create",
                        type: "submit",
                        disabled: !name.trim() || isCreating,
                        className: "flex-1 bg-amber-600 hover:bg-amber-500 disabled:bg-slate-700 text-white font-black p-3 rounded-2xl shadow-lg transition-all transform active:scale-95"
                    }, isCreating ? "Processando..." : "Criar Herói")
                )
            )
        )
    );
}

