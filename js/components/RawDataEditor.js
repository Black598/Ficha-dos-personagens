// js/components/RawDataEditor.js
const { useState } = React;
const el = React.createElement;

export function RawDataEditor({ data, onSave, onClose }) {
    if (!data) return null;

    const [editData, setEditData] = useState(() => JSON.parse(JSON.stringify(data)));

    const updateField = (path, newValue) => {
        setEditData(prev => {
            const newData = JSON.parse(JSON.stringify(prev));
            let ref = newData;
            for (let i = 0; i < path.length - 1; i++) {
                if (!ref[path[i]]) ref[path[i]] = {};
                ref = ref[path[i]];
            }
            ref[path[path.length - 1]] = newValue;
            return newData;
        });
    };

    const renderFields = (obj, path = []) => {
        return Object.entries(obj).map(([key, value]) => {
            const currentPath = [...path, key];
            
            if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                return el('div', { key: currentPath.join('-'), className: "mt-4 bg-slate-900 border border-slate-800/80 p-5 rounded-[2rem] shadow-inner" }, [
                    el('h4', { className: "text-amber-500 font-black uppercase text-[9px] mb-4 tracking-[0.2em] flex items-center gap-2 border-b border-slate-800/50 pb-2" }, [
                        el('span', { className: "w-1.5 h-1.5 bg-amber-500 rounded-full" }),
                        key
                    ]),
                    el('div', { className: "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4" }, 
                        renderFields(value, currentPath)
                    )
                ]);
            } else {
                const isArray = Array.isArray(value);
                const displayValue = isArray ? value.join(', ') : (value === null || value === undefined ? "" : value);
                const isLongText = typeof value === 'string' && value.length > 30;
                
                return el('div', { key: currentPath.join('-'), className: "flex flex-col bg-slate-950/80 p-3 rounded-2xl border border-slate-800 hover:border-amber-500/40 transition-colors focus-within:border-amber-500/70" }, [
                    el('label', { className: "text-[7px] text-slate-500 font-black uppercase mb-1.5 truncate tracking-widest" }, key),
                    el(isLongText ? 'textarea' : 'input', {
                        type: typeof value === 'number' ? 'number' : undefined,
                        value: displayValue,
                        onChange: (e) => {
                            let val = e.target.value;
                            if (typeof value === 'number') val = Number(val) || 0;
                            if (isArray) val = val.split(',').map(s => s.trim());
                            updateField(currentPath, val);
                        },
                        className: `bg-transparent text-[11px] font-black text-amber-50 outline-none w-full ${isLongText ? 'h-16 resize-none custom-scrollbar' : ''}`
                    })
                ]);
            }
        });
    };

    let rootFields = [];
    let rootObjects = [];
    
    Object.entries(editData).forEach(([k, v]) => {
        if (typeof v === 'object' && v !== null && !Array.isArray(v)) {
            rootObjects.push({k, v});
        } else {
            rootFields.push({k, v});
        }
    });

    return el('div', {
        className: "fixed inset-0 z-[300] bg-black/95 backdrop-blur-xl flex items-center justify-center p-3 md:p-8 animate-fade-in"
    }, [
        el('div', { className: "bg-slate-900 border border-amber-500/30 rounded-[3rem] p-6 md:p-10 max-w-6xl w-full shadow-[0_0_50px_rgba(0,0,0,0.6)] flex flex-col h-[90vh]" }, [
            el('div', { className: "flex justify-between items-center mb-6 border-b border-amber-900/20 pb-4 shrink-0" }, [
                el('h3', { className: "text-amber-500 font-black uppercase tracking-widest text-[11px] md:text-sm flex items-center gap-3" }, [
                   "✨ Editor Visual da Ficha",
                   el('span', { className: "text-[7px] bg-amber-500/20 text-amber-400 px-2 py-1 rounded-full border border-amber-500/30" }, "MODO SEGURO")
                ]),
                el('button', {
                    onClick: onClose,
                    className: "text-slate-500 hover:text-white transition-colors text-2xl font-light w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-800"
                }, "×")
            ]),
            el('p', { className: "text-[10px] text-slate-400 mb-6 shrink-0 italic" },
                "Aqui você edita os valores nativos do personagem diretamente. Não se preocupe em cometer erros de formatação na estrutura: as chaves estão trancadas!"
            ),
            
            el('div', { className: "flex-grow overflow-y-auto custom-scrollbar pr-3 pb-4 space-y-4" }, [
                rootFields.length > 0 && el('div', { className: "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4" },
                    rootFields.map(f => renderFields({[f.k]: f.v}, [])[0])
                ),
                ...rootObjects.map(f => renderFields({[f.k]: f.v}, [])[0])
            ]),
            
            el('div', { className: "mt-8 flex gap-4 shrink-0 border-t border-slate-800 pt-6" }, [
                el('button', {
                    onClick: onClose,
                    className: "w-1/3 py-4 bg-slate-800 hover:bg-red-900/40 text-slate-400 hover:text-red-400 font-black uppercase text-[10px] rounded-2xl transition-all border border-slate-700 hover:border-red-500/30"
                }, "Descartar"),
                el('button', {
                    onClick: () => {
                        onSave(editData);
                        onClose();
                    },
                    className: "w-2/3 py-4 bg-amber-600 hover:bg-amber-500 text-slate-950 font-black uppercase text-xs rounded-2xl transition-all shadow-[0_0_20px_rgba(217,119,6,0.2)] hover:shadow-[0_0_30px_rgba(217,119,6,0.4)]"
                }, "✅ Salvar Alterações")
            ])
        ])
    ]);
}
