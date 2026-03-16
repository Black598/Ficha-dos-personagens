const { useState } = React;

export function CharacterSetupModal({ initialName, onSave, onClose }) {
    const el = React.createElement;

    const [form, setForm] = useState({
        'Nome do Personagem': initialName || '',
        'Classe': '',
        'Raça': '',
        'Antecedente': '',
        'Alinhamento': '',
        'Jogador': '',
        'Nivel': '1',
        'PV Máximo': '',
        'CA': '',
    });

    const set = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

    const handleSave = () => {
        onSave(form);
    };

    const field = (label, key, placeholder = '', type = 'text') =>
        el('div', { key, className: "flex flex-col gap-1" },
            el('label', { className: "text-[9px] font-black text-slate-500 uppercase tracking-widest" }, label),
            el('input', {
                type,
                placeholder,
                value: form[key],
                onChange: e => set(key, e.target.value),
                className: "bg-slate-800 border border-slate-700 rounded-xl p-3 text-white font-bold text-sm outline-none focus:border-amber-500 transition-all placeholder:text-slate-600"
            })
        );

    return el('div', { className: "fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[200] p-4" },
        el('div', { className: "bg-slate-900 border-2 border-amber-500 rounded-3xl p-6 md:p-8 w-full max-w-lg shadow-2xl relative overflow-hidden animate-fade-in" },
            // BG deco
            el('div', { className: "absolute -top-20 -right-20 w-48 h-48 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" }),

            el('div', { className: "relative z-10" },
                el('h2', { className: "text-xl font-black text-white uppercase italic tracking-tighter mb-1" }, "⚔️ Configurar Personagem"),
                el('p', { className: "text-slate-500 text-xs font-bold uppercase tracking-widest mb-6" }, "Preencha as informações básicas da ficha"),

                el('div', { className: "grid grid-cols-1 sm:grid-cols-2 gap-4" },
                    field("Nome do Personagem", "Nome do Personagem", "Aragorn, Gandalf..."),
                    field("Jogador", "Jogador", "Seu nome"),
                    field("Classe", "Classe", "Guerreiro, Mago..."),
                    field("Raça", "Raça", "Humano, Elfo..."),
                    field("Antecedente", "Antecedente", "Soldado, Nobre..."),
                    field("Alinhamento", "Alinhamento", "Neutro Bom..."),
                    field("Nível", "Nivel", "1", "number"),
                    field("PV Máximo", "PV Máximo", "10", "number"),
                    field("Classe de Armadura", "CA", "10", "number"),
                ),

                el('div', { className: "flex gap-3 mt-6" },
                    el('button', {
                        onClick: onClose,
                        className: "flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-black p-3 rounded-2xl border border-slate-700 transition-colors text-sm"
                    }, "Preencher depois"),
                    el('button', {
                        onClick: handleSave,
                        className: "flex-1 bg-amber-600 hover:bg-amber-500 text-white font-black p-3 rounded-2xl shadow-lg transition-all active:scale-95 text-sm"
                    }, "Salvar e Entrar")
                )
            )
        )
    );
}
