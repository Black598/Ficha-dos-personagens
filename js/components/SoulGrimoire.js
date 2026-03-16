// js/components/SoulGrimoire.js
const { useState, useEffect, useRef } = React;

export function SoulGrimoire({ souls, updateSouls }) {
    const el = React.createElement;
    const chartRef = useRef(null);
    const chartInstance = useRef(null);
    const [newName, setNewName] = useState('');
    const [newClass, setNewClass] = useState('Guerreiro');

    const DEBUFFS = [
        { deaths: "0-2", title: "Cicatrizes Narrativas", desc: "Mudança na cor dos olhos, pele fria, pesadelos.", color: "text-slate-400" },
        { deaths: "3", title: "Fragmentação Mental", desc: "Esquece NPCs ou eventos. Desvantagem em História.", color: "text-amber-500" },
        { deaths: "4", title: "Rejeição Divina", desc: "Corpo poroso à magia. Curas recuperam -1 dado.", color: "text-orange-600" },
        { deaths: "5", title: "Necrose Física", desc: "Perda de membro. -1 Atributo. Vulnerável a Necrótico.", color: "text-red-500" },
        { deaths: "6", title: "Fio da Vida Frágil", desc: "Falhas em Death Saves contam como 2 falhas.", color: "text-red-700" },
        { deaths: "7+", title: "Condenação", desc: "Ressurreição falha. Apenas Desejo ou Intervenção.", color: "text-white" }
    ];

    const getStatusInfo = (deaths) => {
        if (deaths === 0) return { title: "Alma Intacta", color: "text-slate-500", border: "border-slate-800" };
        if (deaths <= 2) return { title: "Cicatrizes", color: "text-slate-300", border: "border-slate-700" };
        if (deaths === 3) return { title: "Mental", color: "text-amber-500", border: "border-amber-600" };
        if (deaths === 4) return { title: "Frágil", color: "text-orange-600", border: "border-orange-700" };
        if (deaths === 5) return { title: "Corrompido", color: "text-red-500", border: "border-red-600" };
        if (deaths === 6) return { title: "Quase Fim", color: "text-red-700", border: "border-red-800" };
        return { title: "CONDENADO", color: "text-white animate-pulse", border: "border-white" };
    };

    const addCharacter = () => {
        if (!newName.trim()) return;
        const newList = [...souls, {
            id: Date.now(),
            name: newName,
            className: newClass,
            deaths: 0
        }];
        updateSouls(newList);
        setNewName('');
    };

    const changeDeath = (id, delta) => {
        const newList = souls.map(s => {
            if (s.id === id) {
                const d = Math.max(0, s.deaths + delta);
                return { ...s, deaths: d };
            }
            return s;
        });
        updateSouls(newList);
    };

    const removeCharacter = (id) => {
        if (confirm("Remover este aventureiro do grimório?")) {
            updateSouls(souls.filter(s => s.id !== id));
        }
    };

    useEffect(() => {
        if (!chartRef.current) return;

        const ctx = chartRef.current.getContext('2d');
        const data = souls.map(s => s.deaths);
        const labels = souls.map(s => s.name);

        if (chartInstance.current) {
            chartInstance.current.destroy();
        }

        chartInstance.current = new Chart(ctx, {
            type: 'radar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Mortes',
                    data: data,
                    backgroundColor: 'rgba(239, 68, 68, 0.2)',
                    borderColor: 'rgba(239, 68, 68, 0.8)',
                    pointBackgroundColor: '#ef4444',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    r: {
                        angleLines: { color: 'rgba(255,255,255,0.1)' },
                        grid: { color: 'rgba(255,255,255,0.1)' },
                        pointLabels: { color: '#94a3b8', font: { size: 10, family: 'Cinzel' } },
                        ticks: { display: false, stepSize: 1 },
                        suggestedMin: 0,
                        suggestedMax: 7
                    }
                },
                plugins: {
                    legend: { display: false }
                }
            }
        });

        return () => {
            if (chartInstance.current) chartInstance.current.destroy();
        };
    }, [souls]);

    return el('div', { className: "bg-slate-900/50 border-2 border-red-900/30 rounded-[3rem] p-8 shadow-2xl space-y-8" }, [
        // Header
        el('div', { className: "text-center space-y-2 border-b border-red-900/20 pb-6" }, [
            el('h2', { className: "text-2xl font-black text-red-600 uppercase tracking-widest font-cinzel flex items-center justify-center gap-3" }, [
                el('span', { key: 'icon' }, "💀"),
                el('span', { key: 'title' }, "Contador de Almas Fragmentadas")
            ]),
            el('p', { className: "text-[10px] text-slate-500 italic font-medieval" }, "Mecânica Secreta de Ressurreição")
        ]),

        // Formulario
        el('div', { className: "grid grid-cols-1 md:grid-cols-12 gap-3 bg-black/40 p-4 rounded-3xl border border-slate-800" }, [
            el('input', {
                type: 'text',
                placeholder: 'Nome do Aventureiro',
                value: newName,
                onChange: (e) => setNewName(e.target.value),
                className: "md:col-span-6 bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs outline-none focus:border-red-600 transition-all font-cinzel"
            }),
            el('select', {
                value: newClass,
                onChange: (e) => setNewClass(e.target.value),
                className: "md:col-span-4 bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs outline-none focus:border-red-600 font-cinzel"
            }, [
                "Guerreiro", "Mago", "Ladino", "Clérigo", "Bárbaro", "Bardo", "Bruxo", "Druida", "Feiticeiro", "Monge", "Paladino", "Patrulheiro", "Artífice"
            ].map(c => el('option', { key: c, value: c }, c))),
            el('button', {
                onClick: addCharacter,
                className: "md:col-span-2 bg-red-800 hover:bg-red-700 text-white font-black py-3 rounded-xl transition-all shadow-lg active:scale-95 text-xs uppercase"
            }, "ADD")
        ]),

        // Grid Principal (Gráfico + Tabela)
        el('div', { className: "grid grid-cols-1 lg:grid-cols-2 gap-8" }, [
            // Gráfico
            el('div', { className: "bg-black/20 p-6 rounded-3xl border border-slate-800 flex flex-col items-center shadow-inner" }, [
                el('h3', { className: "text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4" }, "Integridade da Party"),
                el('div', { className: "w-full h-64" }, el('canvas', { ref: chartRef }))
            ]),

            // Tabela de Debuffs
            el('div', { className: "bg-black/20 p-6 rounded-3xl border border-red-900/10 shadow-inner overflow-hidden" }, [
                el('h3', { className: "text-[10px] font-black text-red-500 uppercase tracking-widest mb-4" }, "O Preço do Além"),
                el('div', { className: "space-y-4 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar" }, DEBUFFS.map((d, i) => (
                    el('div', { key: i, className: "group border-b border-white/5 pb-2 last:border-0" }, [
                        el('div', { className: "flex justify-between items-center mb-1" }, [
                            el('span', { className: `text-[11px] font-black ${d.color}` }, `${d.deaths} Mortes: ${d.title}`),
                        ]),
                        el('p', { className: "text-[10px] text-slate-500 italic leading-tight" }, d.desc)
                    ])
                )))
            ])
        ]),

        // Lista de Cards
        el('div', { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" }, 
            souls.length === 0 ? 
                el('div', { className: "col-span-full py-16 text-center border-2 border-dashed border-slate-800 rounded-[2.5rem]" }, [
                    el('p', { className: "text-slate-600 font-black uppercase text-[10px] italic" }, "O Grimório das Almas está vazio...")
                ]) :
                souls.map(char => {
                    const info = getStatusInfo(char.deaths);
                    return el('div', { key: char.id, className: `bg-slate-900 border-l-4 ${info.border} p-5 rounded-r-[2rem] shadow-xl relative group transition-all hover:-translate-y-1` }, [
                        el('button', {
                            onClick: () => removeCharacter(char.id),
                            className: "absolute top-4 right-4 text-slate-700 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all font-bold"
                        }, "✕"),
                        
                        el('div', { className: "flex justify-between items-start mb-4 pr-6" }, [
                            el('div', null, [
                                el('h4', { className: "font-cinzel font-black text-white text-md uppercase tracking-tighter" }, char.name),
                                el('span', { className: "text-[9px] uppercase font-bold text-red-900" }, char.className)
                            ]),
                            el('div', { className: "text-center bg-black/40 px-3 py-1 rounded-xl border border-slate-800" }, [
                                el('span', { className: "block text-[8px] text-slate-500 uppercase font-black" }, "Mortes"),
                                el('span', { className: `text-xl font-black ${char.deaths > 0 ? 'text-red-600' : 'text-slate-700'}` }, char.deaths)
                            ])
                        ]),

                        el('div', { className: "flex items-center gap-3 bg-black/60 p-2 rounded-2xl mb-4 shadow-inner" }, [
                            el('button', {
                                onClick: () => changeDeath(char.id, -1),
                                className: "w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 font-bold transition-all shadow-md active:scale-90"
                            }, "−"),
                            el('div', { className: "flex-grow h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700" }, [
                                el('div', { 
                                    className: "h-full bg-red-600", 
                                    style: { width: `${Math.min(char.deaths * 15, 100)}%`, boxShadow: '0 0 10px rgba(220, 38, 38, 0.5)' } 
                                })
                            ]),
                            el('button', {
                                onClick: () => changeDeath(char.id, 1),
                                className: "w-8 h-8 rounded-xl bg-red-900 hover:bg-red-800 text-white font-bold transition-all shadow-lg active:scale-90"
                            }, "＋")
                        ]),

                        el('div', { className: "pt-3 border-t border-slate-800/50 flex justify-between items-center text-[10px]" }, [
                            el('span', { className: "uppercase font-black text-slate-500" }, "Status:"),
                            el('span', { className: `${info.color} font-black uppercase tracking-tighter` }, info.title)
                        ])
                    ]);
                })
        )
    ]);
}
