// js/components/SoulGrimoire.js
const { useState, useEffect, useRef } = React;

const DEBUFFS_DEFAULT = [
    { deaths: "0-2", title: "Cicatrizes Narrativas", desc: "Mudança na cor dos olhos, pele fria, pesadelos.", color: "text-slate-400" },
    { deaths: "3", title: "Fragmentação Mental", desc: "Esquece NPCs ou eventos. Desvantagem em História.", color: "text-amber-500" },
    { deaths: "4", title: "Rejeição Divina", desc: "Corpo poroso à magia. Curas recuperam -1 dado.", color: "text-orange-600" },
    { deaths: "5", title: "Necrose Física", desc: "Perda de membro. -1 Atributo. Vulnerável a Necrótico.", color: "text-red-500" },
    { deaths: "6", title: "Fio da Vida Frágil", desc: "Falhas em Death Saves contam como 2 falhas.", color: "text-red-700" },
    { deaths: "7+", title: "Condenação", desc: "Ressurreição falha. Apenas Desejo ou Intervenção.", color: "text-white" }
];

export function SoulGrimoire({ souls, updateSouls, sessionState, updateSessionState, askGemini }) {
    const el = React.createElement;
    const chartRef = useRef(null);
    const chartInstance = useRef(null);
    const [newName, setNewName] = useState('');
    const [newClass, setNewClass] = useState('Guerreiro');
    const [showSettings, setShowSettings] = useState(false);

    // Settings State
    const settings = sessionState?.soulSettings || {};
    const debuffs = settings.debuffs || DEBUFFS_DEFAULT;
    const autoCount = settings.autoCountDeaths ?? true;

    // Modal Edit State
    const [tempDebuffs, setTempDebuffs] = useState([...debuffs]);
    const [tempAutoCount, setTempAutoCount] = useState(autoCount);
    const [aiLoading, setAiLoading] = useState(false);

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

    // Chart logic
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
                plugins: { legend: { display: false } }
            }
        });

        return () => {
            if (chartInstance.current) chartInstance.current.destroy();
        };
    }, [souls]);

    const handleSaveSettings = () => {
        updateSessionState({
            soulSettings: {
                autoCountDeaths: tempAutoCount,
                debuffs: tempDebuffs
            }
        });
        setShowSettings(false);
    };

    const askAISuggestions = async () => {
        if(!askGemini) return alert("IA Indisponível. Destranque o Cofre primeiro.");
        try {
            setAiLoading(true);
            const prompt = `Você é um mestre de RPG cruel e sombrio. Preciso de uma lista de consequências para mortes dos jogadores. 
O sistema chama-se "Contador de Almas Fragmentadas". A cada morte o personagem fica mais corrompido e com debuffs ou preços a pagar pela ressurreição.
Retorne APENAS um JSON válido. Não inclua crases ou formatação markdown, apenas o array JSON puro.
Deve ser um array de objetos com:
{
  "deaths": "número ou range, ex: '1-2'",
  "title": "Nome da Consequência",
  "desc": "Descrição mecânica ou narrativa curta do que acontece com o corpo ou mente do aventureiro, ou qual o preço exigido pelos deuses.",
  "color": "Escolha uma destas classes do tailwind baseada na gravidade: text-slate-400, text-amber-500, text-orange-600, text-red-500, text-red-700, text-white"
}
Crie 5 ou 6 estágios progressivos, do mais brando (1 morte) ao fatal/condenação absoluta (7+ mortes).`;
            const result = await askGemini(prompt);
            let cleaned = result.replace(/```json/gi, '').replace(/```/g, '').trim();
            const json = JSON.parse(cleaned);
            if(Array.isArray(json)) {
                setTempDebuffs(json);
            }
        } catch(e) {
            alert("Erro ao consultar a IA: " + e.message);
        } finally {
            setAiLoading(false);
        }
    };

    return el('div', { key: 'soul-grimoire-root', className: "bg-slate-900/50 border-2 border-red-900/30 rounded-[3rem] p-8 shadow-2xl space-y-8 relative" }, [
        
        // Header
        el('div', { key: 'header', className: "text-center space-y-2 border-b border-red-900/20 pb-6 relative" }, [
            el('button', {
                key: 'settings-btn',
                onClick: () => { setTempDebuffs([...debuffs]); setTempAutoCount(autoCount); setShowSettings(true); },
                className: "absolute right-0 top-0 bg-slate-800 hover:bg-slate-700 text-slate-300 p-3 rounded-2xl transition-all shadow-lg text-lg",
                title: "Configurar Regras e Preços"
            }, "⚙️"),
            el('h2', { key: 'title', className: "text-2xl font-black text-red-600 uppercase tracking-widest font-cinzel flex items-center justify-center gap-3" }, [
                el('span', { key: 'icon' }, "💀"),
                el('span', { key: 'text' }, "Contador de Almas Fragmentadas")
            ]),
            el('p', { key: 'subtitle', className: "text-[10px] text-slate-500 italic font-medieval" }, "Mecânica Secreta de Ressurreição")
        ]),

        // Formulario de Adicionar
        el('div', { key: 'form', className: "grid grid-cols-1 md:grid-cols-12 gap-3 bg-black/40 p-4 rounded-3xl border border-slate-800" }, [
            el('input', {
                key: 'name-input',
                type: 'text',
                placeholder: 'Nome do Aventureiro',
                value: newName,
                onChange: (e) => setNewName(e.target.value),
                className: "md:col-span-6 bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs outline-none focus:border-red-600 transition-all font-cinzel"
            }),
            el('select', {
                key: 'class-select',
                value: newClass,
                onChange: (e) => setNewClass(e.target.value),
                className: "md:col-span-4 bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs outline-none focus:border-red-600 font-cinzel"
            }, [
                "Guerreiro", "Mago", "Ladino", "Clérigo", "Bárbaro", "Bardo", "Bruxo", "Druida", "Feiticeiro", "Monge", "Paladino", "Patrulheiro", "Artífice"
            ].map(c => el('option', { key: c, value: c }, c))),
            el('button', {
                key: 'add-btn',
                onClick: addCharacter,
                className: "md:col-span-2 bg-red-800 hover:bg-red-700 text-white font-black py-3 rounded-xl transition-all shadow-lg active:scale-95 text-xs uppercase"
            }, "ADD")
        ]),

        // Grid Principal (Gráfico + Tabela)
        el('div', { key: 'main-grid', className: "grid grid-cols-1 lg:grid-cols-2 gap-8" }, [
            // Gráfico
            el('div', { key: 'chart-container', className: "bg-black/20 p-6 rounded-3xl border border-slate-800 flex flex-col items-center shadow-inner" }, [
                el('h3', { key: 'chart-title', className: "text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4" }, "Integridade da Party"),
                el('div', { key: 'canvas-wrapper', className: "w-full h-64" }, el('canvas', { key: 'chart-canvas', ref: chartRef }))
            ]),

            // Tabela de Debuffs
            el('div', { key: 'debuffs-container', className: "bg-black/20 p-6 rounded-3xl border border-red-900/10 shadow-inner overflow-hidden flex flex-col" }, [
                el('h3', { key: 'debuffs-title', className: "text-[10px] font-black text-red-500 uppercase tracking-widest mb-4" }, "O Preço do Além (Consequências)"),
                el('div', { key: 'debuffs-list', className: "space-y-4 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar flex-grow" }, debuffs.map((d, i) => (
                    el('div', { key: `debuff-${i}`, className: "group border-b border-white/5 pb-2 last:border-0" }, [
                        el('div', { key: 'header', className: "flex justify-between items-center mb-1" }, [
                            el('span', { key: 'title', className: `text-[11px] font-black ${d.color || 'text-slate-400'}` }, `${d.deaths} Mortes: ${d.title}`),
                        ]),
                        el('p', { key: 'desc', className: "text-[10px] text-slate-500 italic leading-tight" }, d.desc)
                    ])
                )))
            ])
        ]),

        // Lista de Cards
        el('div', { key: 'souls-list', className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" }, 
            souls.length === 0 ? 
                el('div', { key: 'empty-msg', className: "col-span-full py-16 text-center border-2 border-dashed border-slate-800 rounded-[2.5rem]" }, [
                    el('p', { key: 'msg', className: "text-slate-600 font-black uppercase text-[10px] italic" }, "O Grimório das Almas está vazio...")
                ]) :
                souls.map(char => {
                    const info = getStatusInfo(char.deaths);
                    return el('div', { key: `soul-${char.id}`, className: `bg-slate-900 border-l-4 ${info.border} p-5 rounded-r-[2rem] shadow-xl relative group transition-all hover:-translate-y-1` }, [
                        el('button', {
                            key: 'remove-btn',
                            onClick: () => removeCharacter(char.id),
                            className: "absolute top-4 right-4 text-slate-700 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all font-bold"
                        }, "✕"),
                        
                        el('div', { key: 'header', className: "flex justify-between items-start mb-4 pr-6" }, [
                            el('div', { key: 'info' }, [
                                el('h4', { key: 'name', className: "font-cinzel font-black text-white text-md uppercase tracking-tighter" }, char.name),
                                el('span', { key: 'class', className: "text-[9px] uppercase font-bold text-red-900" }, char.className)
                            ]),
                            el('div', { key: 'deaths-box', className: "text-center bg-black/40 px-3 py-1 rounded-xl border border-slate-800" }, [
                                el('span', { key: 'label', className: "block text-[8px] text-slate-500 uppercase font-black" }, "Mortes"),
                                el('span', { key: 'value', className: `text-xl font-black ${char.deaths > 0 ? 'text-red-600' : 'text-slate-700'}` }, char.deaths)
                            ])
                        ]),

                        el('div', { key: 'controls', className: "flex items-center gap-3 bg-black/60 p-2 rounded-2xl mb-4 shadow-inner" }, [
                            el('button', {
                                key: 'minus-btn',
                                onClick: () => changeDeath(char.id, -1),
                                className: "w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 font-bold transition-all shadow-md active:scale-90"
                            }, "−"),
                            el('div', { key: 'bar-container', className: "flex-grow h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700" }, [
                                el('div', { 
                                    key: 'bar-fill',
                                    className: "h-full bg-red-600", 
                                    style: { width: `${Math.min(char.deaths * 15, 100)}%`, boxShadow: '0 0 10px rgba(220, 38, 38, 0.5)' } 
                                })
                            ]),
                            el('button', {
                                key: 'plus-btn',
                                onClick: () => changeDeath(char.id, 1),
                                className: "w-8 h-8 rounded-xl bg-red-900 hover:bg-red-800 text-white font-bold transition-all shadow-lg active:scale-90"
                            }, "＋")
                        ]),

                        el('div', { key: 'footer', className: "pt-3 border-t border-slate-800/50 flex justify-between items-center text-[10px]" }, [
                            el('span', { key: 'label', className: "uppercase font-black text-slate-500" }, "Status:"),
                            el('span', { key: 'status', className: `${info.color} font-black uppercase tracking-tighter` }, info.title)
                        ])
                    ]);
                })
        ),

        // Settings Modal
        showSettings && el('div', { key: 'settings-modal', className: "fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in" }, [
            el('div', { className: "bg-slate-950 border-2 border-red-900/50 rounded-3xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden" }, [
                // Modal Header
                el('div', { className: "p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900" }, [
                    el('h3', { className: "text-xl font-black text-white uppercase flex items-center gap-3" }, [
                        el('span', null, "⚙️"), "Configurações do Grimório"
                    ]),
                    el('button', { onClick: () => setShowSettings(false), className: "text-slate-400 hover:text-white font-bold text-xl" }, "✕")
                ]),
                
                // Modal Body
                el('div', { className: "p-6 overflow-y-auto flex-grow space-y-6 custom-scrollbar" }, [
                    // Trigger Setting
                    el('div', { className: "bg-slate-900/50 p-4 rounded-2xl border border-slate-800" }, [
                        el('h4', { className: "text-[10px] uppercase text-amber-500 font-black tracking-widest mb-2" }, "Regra de Contagem"),
                        el('label', { className: "flex items-center gap-3 cursor-pointer group" }, [
                            el('div', { className: "relative w-12 h-6" }, [
                                el('input', { 
                                    type: "checkbox", 
                                    className: "sr-only peer", 
                                    checked: tempAutoCount,
                                    onChange: (e) => setTempAutoCount(e.target.checked)
                                }),
                                el('div', { className: "w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500" })
                            ]),
                            el('span', { className: "text-sm text-slate-300 group-hover:text-white transition-colors" }, "Contar morte automaticamente quando o PV do jogador chegar a Zero (0).")
                        ]),
                        el('p', { className: "text-[10px] text-slate-500 mt-2 italic" }, "Se desativado, você precisará gerenciar as mortes manualmente apertando os botões (+/-) no card de cada personagem.")
                    ]),

                    // Preços do Além
                    el('div', null, [
                        el('div', { className: "flex justify-between items-center mb-4" }, [
                            el('h4', { className: "text-[10px] uppercase text-red-500 font-black tracking-widest" }, "Consequências (O Preço do Além)"),
                            el('button', { 
                                onClick: askAISuggestions,
                                disabled: aiLoading,
                                className: "bg-purple-900/30 hover:bg-purple-800 text-purple-400 hover:text-white border border-purple-600/30 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-2"
                            }, aiLoading ? "Gerando..." : [el('span', null, "🔮"), "Sugerir com IA"])
                        ]),
                        
                        el('div', { className: "space-y-3" }, tempDebuffs.map((d, index) => 
                            el('div', { key: `edit-${index}`, className: "bg-black/30 p-4 rounded-2xl border border-slate-800 grid grid-cols-1 md:grid-cols-12 gap-3" }, [
                                el('input', {
                                    className: "md:col-span-3 bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white",
                                    placeholder: "Mortes (ex: 1, 2, 7+)",
                                    value: d.deaths,
                                    onChange: e => {
                                        const newD = [...tempDebuffs];
                                        newD[index].deaths = e.target.value;
                                        setTempDebuffs(newD);
                                    }
                                }),
                                el('input', {
                                    className: "md:col-span-9 bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white font-bold",
                                    placeholder: "Título (ex: Fragmentação)",
                                    value: d.title,
                                    onChange: e => {
                                        const newD = [...tempDebuffs];
                                        newD[index].title = e.target.value;
                                        setTempDebuffs(newD);
                                    }
                                }),
                                el('textarea', {
                                    className: "md:col-span-12 bg-slate-900 border border-slate-700 rounded-lg p-2 text-[10px] text-slate-300 resize-none h-16 custom-scrollbar",
                                    placeholder: "Descrição da consequência ou custo...",
                                    value: d.desc,
                                    onChange: e => {
                                        const newD = [...tempDebuffs];
                                        newD[index].desc = e.target.value;
                                        setTempDebuffs(newD);
                                    }
                                })
                            ])
                        ))
                    ])
                ]),
                
                // Modal Footer
                el('div', { className: "p-6 border-t border-slate-800 bg-slate-900/50 flex justify-end gap-3" }, [
                    el('button', { onClick: () => setShowSettings(false), className: "px-6 py-3 rounded-xl text-slate-400 hover:bg-slate-800 font-bold transition-all" }, "Cancelar"),
                    el('button', { onClick: handleSaveSettings, className: "px-6 py-3 rounded-xl bg-red-800 hover:bg-red-700 text-white font-black uppercase tracking-widest shadow-lg transition-all" }, "Salvar Configurações")
                ])
            ])
        ])
    ]);
}
