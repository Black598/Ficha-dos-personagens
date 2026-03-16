
const { useState } = React;


import { DiceRoller } from './DiceRoller.js';

export function SheetView({
    characterName,
    characterSheetData,
    onBack,
    onToggleTree,
    rollDice,
    handleDescansoLongo,
    setEditableSheetData,
    onUpdateSheet,
    updateSheetField,
    recentRolls
}) {

    const [isEditingInventory, setIsEditingInventory] = useState(false);
    // Menu flutuante de dados interno
    const [isDiceMenuOpen, setIsDiceMenuOpen] = React.useState(false);
    const el = React.createElement;
    // Helper para formatar bônus
    const fmtNum = (n) => {
        const num = parseInt(n);
        if (isNaN(num)) return n;
        return num >= 0 ? `+${num}` : num;
    };

    // Lógica de Level Up
    const xpAtual = parseInt(characterSheetData.info?.['XP']) || 0;
    const nivelAtual = parseInt(characterSheetData.info?.['Nivel']) || 1;
    const xpNecessario = nivelAtual * 1000;
    const podeSubirNivel = xpAtual >= xpNecessario;

    // --- FUNÇÃO DE ATUALIZAÇÃO DE FICHA (Local + Planilha) ---
    // Atualiza um campo específico da ficha e sincroniza com a planilha
    el('div', { className: "p-4 bg-slate-900 rounded-3xl border border-slate-800" }, [
        el('h3', { className: "text-amber-500 font-black mb-2" }, "CARACTERÍSTICAS"),
        el('textarea', {
            className: "w-full bg-slate-950 text-slate-300 p-3 rounded-xl border-none outline-none min-h-[100px] text-sm",
            defaultValue: characterSheetData.info?.['Características'] || "",
            onBlur: (e) => updateSheetField('info', 'Características', e.target.value),
            placeholder: "Descreva seu personagem..."
        })
    ]),
        el('div', { className: "p-4 bg-slate-900 rounded-3xl border border-slate-800 mt-4" }, [
            el('h3', { className: "text-amber-500 font-black mb-2" }, "TALENTOS ADICIONAIS"),
            el('textarea', {
                className: "w-full bg-slate-950 text-slate-300 p-3 rounded-xl border-none outline-none min-h-[100px] text-sm",
                defaultValue: characterSheetData.info?.['Talentos Adicionais'] || "",
                onBlur: (e) => updateSheetField('info', 'Talentos Adicionais', e.target.value),
                placeholder: "Talentos de raça ou classe..."
            })
        ])
    // 1. Atualiza a UI localmente sem recarregar a ficha
    const handleSyncUpdate = async (newData) => {

        // 2. Calcula o novo PV Atual baseado no máximo e perdido para mostrar na tela
        const max = parseInt(newData.recursos['PV Máximo']) || 0;
        const perdido = parseInt(newData.recursos['PV Perdido']) || 0;
        newData.recursos['PV Atual'] = max - perdido;

        // 3. Dispara salvamento no Firebase 
        // Aqui você pode chamar uma prop onUpdate(newData)

        // 4. Dispara Webhook da Planilha (Sincronização de Fundo)
        const scriptWebhook = "SUA_URL_AQUI";
        const char = allCharacters.find(c => c.name.toLowerCase() === characterName.toLowerCase());
        const idPlanilha = extractSpreadsheetId(char?.url || char?.URL || "");

        // Chamamos a função global definida no App
        setEditableSheetData(null); // Fecha modo edição se estiver aberto
        // Aqui no seu App.js, você deve atualizar o estado para refletir a mudança
        // Exemplo: setCharacterSheetData(newData);

        if (idPlanilha) {
            updateSheetViaScript(scriptWebhook, idPlanilha, newData);
        }
    };

    //Renderiza a ficha
    return el('div', { className: "min-h-screen bg-slate-950 text-slate-100 pb-32 animate-fade-in relative" },
        // --- HEADER FICHADO ---
        el('header', { className: "bg-slate-900/90 backdrop-blur-xl border-b border-slate-800 p-4 md:p-6 sticky top-0 z-40" },
            el('div', { className: "max-w-7xl mx-auto flex justify-between items-center" },
                el('div', { className: "flex items-center gap-4" },
                    el('div', { className: "bg-slate-800 p-2 rounded-xl border border-slate-700 shadow-inner" }, "📄"),
                    el('div', null,
                        el('h2', { className: "text-xl md:text-2xl font-black uppercase tracking-tighter text-white" }, characterName),
                        el('p', { className: "text-slate-500 text-[10px] font-bold uppercase tracking-widest italic" }, characterSheetData.info?.['Classe'] || 'Aventureiro')
                    )
                ),
                el('div', { className: "flex gap-3" },
                    el('button', {
                        onClick: onToggleTree,
                        className: "bg-purple-600/10 hover:bg-purple-600 text-purple-500 hover:text-white text-[10px] font-black uppercase tracking-widest border border-purple-600/30 px-4 py-2 rounded-xl transition-all"
                    }, "⭐ Talentos"),

                    // BOTÃO SAIR ADICIONADO NO HEADER
                    el('button', {
                        onClick: onBack,
                        className: "bg-slate-800 hover:bg-red-900/40 text-slate-400 hover:text-red-400 border border-slate-700 hover:border-red-900/50 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                    }, "Sair")
                )
            )
        ),
        // --- CONTEÚDO PRINCIPAL ---
        el('main', { className: "max-w-7xl mx-auto p-4 md:p-6 space-y-10" },
            // --- BLOCO 1: INFORMAÇÕES INICIAIS ---
            el('div', { className: "bg-slate-900 border-2 border-slate-800 p-6 rounded-[2.5rem] shadow-xl" },
                el('div', { className: "grid grid-cols-1 md:grid-cols-4 gap-6" },
                    // Coluna 1: Nome do Personagem (Destaque)
                    el('div', { className: "flex flex-col justify-center border-r border-slate-800 pr-4" },
                        el('p', { className: "text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1" }, "Nome do Personagem"),
                        el('p', { className: "text-2xl font-black text-amber-400 tracking-tighter" }, characterSheetData.info?.['Nome do Personagem'] || '---')
                    ),
                    // Coluna 2: Classe e Raça
                    el('div', { className: "space-y-4" },
                        el('div', null,
                            el('p', { className: "text-[8px] font-black text-slate-500 uppercase mb-1" }, "Classe"),
                            el('p', { className: "text-sm font-bold text-white" }, characterSheetData.info?.['Classe'] || '---')
                        ),
                        el('div', null,
                            el('p', { className: "text-[8px] font-black text-slate-500 uppercase mb-1" }, "Raça"),
                            el('p', { className: "text-sm font-bold text-white" }, characterSheetData.info?.['Raça'] || '---')
                        )
                    ),
                    // Coluna 3: Antecedente e Alinhamento
                    el('div', { className: "space-y-4" },
                        el('div', null,
                            el('p', { className: "text-[8px] font-black text-slate-500 uppercase mb-1" }, "Antecedente"),
                            el('p', { className: "text-sm font-bold text-white" }, characterSheetData.info?.['Antecedente'] || '---')
                        ),
                        el('div', null,
                            el('p', { className: "text-[8px] font-black text-slate-500 uppercase mb-1" }, "Alinhamento"),
                            el('p', { className: "text-sm font-bold text-white" }, characterSheetData.info?.['Alinhamento'] || '---')
                        )
                    ),
                    // Coluna 4: Jogador, XP e Nível
                    el('div', { className: "space-y-3 bg-slate-950/50 p-3 rounded-2xl border border-slate-800" },
                        el('div', { className: "flex justify-between" },
                            el('p', { className: "text-[8px] font-black text-slate-500 uppercase" }, "Jogador"),
                            el('p', { className: "text-[10px] font-bold text-white" }, characterSheetData.info?.['Jogador'] || '---')
                        ),
                        el('div', { className: "flex justify-between border-t border-slate-800 pt-2" },
                            el('p', { className: "text-[8px] font-black text-slate-500 uppercase" }, "XP"),
                            el('p', { className: "text-[10px] font-bold text-amber-500" }, characterSheetData.info?.['XP'] || '0')
                        ),
                        el('div', { className: "flex justify-between border-t border-slate-800 pt-2" },
                            el('p', { className: "text-[8px] font-black text-slate-500 uppercase" }, "Nível"),
                            el('p', { className: "text-[10px] font-black text-white" }, characterSheetData.info?.['Nivel'] || '1')
                        )
                    )
                )
            ),
            // --- BLOCO 2: VITALIDADE E RECURSOS ---
            el('div', { className: "grid grid-cols-1 lg:grid-cols-12 gap-8" },

                // CALCULADORA (Esquerda - 4 Colunas)
                el('div', { className: "lg:col-span-4 bg-slate-900 border-2 border-amber-500/20 p-6 rounded-[2.5rem] shadow-xl flex flex-col justify-center" },
                    el('h4', { className: "text-amber-500 font-black mb-4 uppercase text-[10px] tracking-widest italic" }, "⚔️ Modificador de Vitalidade"),
                    el('div', { className: "space-y-4" },
                        el('input', {
                            type: "number",
                            id: "hpModifierInput",
                            placeholder: "Valor",
                            className: "w-full bg-slate-950 border-2 border-slate-800 rounded-2xl p-4 text-white font-black text-2xl outline-none focus:border-amber-500 transition-all"
                        }),
                        el('div', { className: "grid grid-cols-3 gap-2" },
                            // BOTÃO DANO
                            el('button', {
                                className: "bg-red-900/20 hover:bg-red-600 text-red-500 hover:text-white font-black py-3 rounded-xl border border-red-500/30 transition-all uppercase text-[10px]",
                                onClick: async () => {
                                    const val = parseInt(document.getElementById('hpModifierInput').value) || 0;
                                    if (val <= 0) return;

                                    const newData = JSON.parse(JSON.stringify(characterSheetData));
                                    let temp = parseInt(newData.recursos['PV Temporário']) || 0;
                                    let danoRestante = val;

                                    if (temp > 0) {
                                        if (temp >= val) { temp -= val; danoRestante = 0; }
                                        else { danoRestante = val - temp; temp = 0; }
                                    }

                                    const perdido = parseInt(newData.recursos['PV Perdido']) || 0;
                                    const max = parseInt(newData.recursos['PV Máximo']) || 0;

                                    newData.recursos['PV Perdido'] = perdido + danoRestante;
                                    newData.recursos['PV Temporário'] = temp;
                                    newData.recursos['PV Atual'] = max - (perdido + danoRestante);

                                    await onUpdateSheet(newData); // Envia para a planilha correta
                                    document.getElementById('hpModifierInput').value = '';
                                }
                            }, "Dano"),

                            // BOTÃO CURA
                            el('button', {
                                className: "bg-green-900/20 hover:bg-green-600 text-green-500 hover:text-white font-black py-3 rounded-xl border border-green-500/30 transition-all uppercase text-[10px]",
                                onClick: async () => {
                                    const val = parseInt(document.getElementById('hpModifierInput').value) || 0;
                                    if (val <= 0) return;

                                    const newData = JSON.parse(JSON.stringify(characterSheetData));
                                    const perdido = parseInt(newData.recursos['PV Perdido']) || 0;
                                    const max = parseInt(newData.recursos['PV Máximo']) || 0;

                                    const novoPerdido = Math.max(0, perdido - val);
                                    newData.recursos['PV Perdido'] = novoPerdido;
                                    newData.recursos['PV Atual'] = max - novoPerdido;

                                    await onUpdateSheet(newData);
                                    document.getElementById('hpModifierInput').value = '';
                                }
                            }, "Cura"),

                            // BOTÃO ESCUDO (TEMPORÁRIO)
                            el('button', {
                                className: "bg-blue-900/20 hover:bg-blue-600 text-blue-500 hover:text-white font-black py-3 rounded-xl border border-blue-500/30 transition-all uppercase text-[10px]",
                                onClick: async () => {
                                    const val = parseInt(document.getElementById('hpModifierInput').value) || 0;
                                    if (val <= 0) return;

                                    const newData = JSON.parse(JSON.stringify(characterSheetData));
                                    const tempAtual = parseInt(newData.recursos['PV Temporário']) || 0;
                                    newData.recursos['PV Temporário'] = tempAtual + val;

                                    await onUpdateSheet(newData);
                                    document.getElementById('hpModifierInput').value = '';
                                }
                            }, "Escudo")
                        )
                    )
                ),

                // STATUS (Direita - 8 Colunas)
                el('div', { className: "lg:col-span-8 grid grid-cols-2 md:grid-cols-4 gap-4" },
                    // CA, Iniciativa, Deslocamento, PV Máximo
                    [['CA', characterSheetData.recursos?.['CA'], 'text-blue-400', "🛡️"],
                    ['Iniciativa', fmtNum(characterSheetData.recursos?.['Iniciativa']), 'text-amber-500', "⚡"],
                    ['Deslocamento', characterSheetData.recursos?.['Deslocamento'], 'text-emerald-400', "👣"],
                    ['PV Máximo', characterSheetData.recursos?.['PV Máximo'], 'text-green-500', "❤️"]
                    ].map(([label, val, color, icon]) =>
                        el('div', { key: label, className: "bg-slate-900 border-2 border-slate-800 p-5 rounded-[2rem] text-center shadow-xl transition-all" },
                            el('span', { className: `${color} text-xl` }, icon),
                            el('p', { className: "text-[9px] font-black text-slate-500 uppercase mt-1" }, label),
                            el('p', { className: `text-2xl font-black ${color}` }, val)
                        )
                    ),
                    // PV ATUAL (Grande)
                    el('div', { className: "col-span-2 bg-slate-900 border-2 border-slate-800 p-5 rounded-[2rem] text-center shadow-xl relative overflow-hidden" },
                        el('div', { className: "absolute inset-0 opacity-10 bg-green-600" }),
                        el('p', { className: "text-[9px] font-black text-slate-500 uppercase relative z-10" }, "PV Atual"),
                        el('p', { className: "text-5xl font-black text-green-500 relative z-10" }, characterSheetData.recursos?.['PV Atual']),
                        el('div', { className: "w-full h-1.5 bg-slate-800 rounded-full mt-3 relative z-10 overflow-hidden" },
                            el('div', {
                                className: "h-full bg-green-500",
                                style: { width: `${(parseInt(characterSheetData.recursos?.['PV Atual']) / parseInt(characterSheetData.recursos?.['PV Máximo'])) * 100}%` }
                            })
                        )
                    ),
                    // PV TEMPORÁRIO (Grande)
                    el('div', { className: "col-span-2 bg-slate-900 border-2 border-slate-800 p-5 rounded-[2rem] text-center shadow-xl flex flex-col justify-center relative overflow-hidden" },
                        el('div', { className: "absolute inset-0 opacity-5 bg-cyan-500" }),
                        el('p', { className: "text-[9px] font-black text-slate-500 uppercase relative z-10" }, "PV Temporário"),
                        el('p', { className: "text-5xl font-black text-cyan-400 relative z-10" }, characterSheetData.recursos?.['PV Temporário'] || '0')
                    )
                )
            ),
            // --- BLOCO 3: ATRIBUTOS (6) ---
            el('div', { className: "grid grid-cols-3 md:grid-cols-6 gap-4" },
                ['FOR', 'DES', 'CON', 'INT', 'SAB', 'CAR'].map(key => {
                    const value = characterSheetData.atributos?.[key] || '10';
                    const mod = characterSheetData.modificadores?.[key] || '0';

                    return el('div', { key: key, className: "bg-slate-900 border-2 border-slate-800 rounded-3xl text-center shadow-xl hover:border-amber-500/40 transition-all overflow-hidden flex flex-col" },
                        el('div', { className: "p-3 pb-2" },
                            el('p', { className: "text-[9px] font-black text-slate-500 uppercase mb-1" }, key),
                            el('p', { className: "text-xs font-bold text-slate-400 italic" }, value)
                        ),
                        el('div', { className: "border-t border-slate-800 w-full" }),
                        el('div', { className: "p-4 bg-slate-950/40 flex-grow flex items-center justify-center" },
                            el('p', { className: `text-4xl font-black ${parseInt(mod) >= 0 ? 'text-amber-500' : 'text-red-500'}` }, fmtNum(mod))
                        )
                    );
                })
            ),
            // --- BLOCO 4: ATAQUES E COMBATE ---
            el('div', { className: "bg-slate-900 border-2 border-slate-800 rounded-[2.5rem] overflow-hidden shadow-xl" },
                el('div', { className: "bg-slate-800/50 px-8 py-4 border-b border-slate-700 flex items-center justify-between" },
                    el('h3', { className: "text-sm font-black text-slate-200 uppercase tracking-widest italic flex items-center gap-2" }, "⚔️ Ataques e Conjuração"),
                    el('span', { className: "text-[10px] text-slate-500 font-bold uppercase tracking-widest" }, "Tabela de Combate")
                ),
                el('div', { className: "p-6 space-y-3" },
                    // Cabeçalho
                    el('div', { className: "grid grid-cols-12 px-4 text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]" },
                        el('div', { className: "col-span-4" }, "Arma/Ataque"),
                        el('div', { className: "col-span-2 text-center" }, "Bônus"),
                        el('div', { className: "col-span-3 text-center" }, "Dano"),
                        el('div', { className: "col-span-3 text-right" }, "Tipo")
                    ),
                    // Linhas de Ataque
                    characterSheetData.ataques?.map((atk, idx) =>
                        el('div', { key: idx, className: "grid grid-cols-12 items-center bg-slate-950/40 border border-slate-800 p-4 rounded-2xl group hover:border-amber-500/40 transition-all" },
                            el('div', { className: "col-span-4 text-slate-200 font-bold text-sm truncate uppercase tracking-tight" }, atk.nome),
                            el('div', { className: "col-span-2 text-center" }, el('span', { className: "bg-slate-900 px-3 py-1 rounded-lg text-amber-500 font-black text-xs border border-slate-800 shadow-inner" }, fmtNum(atk.bonus))),
                            el('div', { className: "col-span-3 text-center" }, el('p', { className: "text-blue-400 font-black text-sm drop-shadow-[0_0_8px_rgba(59,130,246,0.3)]" }, atk.dano)),
                            el('div', { className: "col-span-3 text-right" }, el('span', { className: "text-[10px] text-slate-500 font-black uppercase italic tracking-tighter bg-slate-900/50 px-2 py-1 rounded-md border border-slate-800" }, atk.tipo))
                        )
                    )
                )
            ),
            // --- BLOCO 5: PERÍCIAS E TALENTOS (GRID 2) ---
            el('div', { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8" },
                // Perícias (4 colunas)
                el('div', { className: "lg:col-span-4 bg-slate-900 border border-slate-800 p-6 rounded-[2.5rem] shadow-xl flex flex-col h-[500px]" },
                    el('h4', { className: "text-amber-500 font-black mb-6 flex items-center gap-2 uppercase text-xs italic border-b border-amber-900/20 pb-3" }, "🎯 Perícias"),
                    el('div', { className: "flex-grow overflow-y-auto pr-2 custom-scrollbar space-y-1" },
                        Object.entries(characterSheetData.pericias || {}).map(([key, value]) => (
                            el('div', { key: key, className: "flex justify-between items-center text-[11px] border-b border-slate-800/30 py-2.5 hover:bg-white/5 px-2 rounded-lg group transition-colors" },
                                el('span', { className: "text-slate-400 font-bold uppercase group-hover:text-slate-200" }, key),
                                el('span', { className: "text-amber-400 font-black" }, value || '+0')
                            )
                        ))
                    )
                ),
                // --- Características e Talentos Editáveis ---
                el('div', { className: "lg:col-span-8 bg-slate-900 border border-slate-800 p-6 rounded-[2.5rem] shadow-xl flex flex-col" },
                    el('h4', { className: "text-purple-400 font-black mb-6 uppercase text-xs italic flex items-center gap-2 tracking-widest border-b border-purple-900/20 pb-3" }, "✨ Características e Talentos"),
                    el('div', { className: "space-y-4 overflow-y-auto pr-2 custom-scrollbar flex-grow h-[400px]" },
                        // Criamos um array de 0 a 7 (8 posições) para garantir que sempre existam os campos
                        [0, 1, 2, 3, 4, 5, 6, 7].map((idx) => {
                            const talentTitle = characterSheetData.outros?.['Talentos']?.[idx] || "";
                            const talentDesc = characterSheetData.outros?.[`desc_talento_${idx}`] || "";

                            return el('div', {
                                key: idx,
                                className: "bg-slate-950/50 p-4 rounded-3xl border border-slate-800 group focus-within:border-purple-500/50 transition-all"
                            }, [
                                // CAMPO: TÍTULO DO TALENTO
                                el('input', {
                                    type: 'text',
                                    className: "w-full bg-transparent text-xs text-purple-300 font-black uppercase mb-1 outline-none placeholder:text-purple-900/30",
                                    placeholder: "Nome do Talento...",

                                    key: `title-input-${idx}-${talentTitle}`,
                                    defaultValue: talentTitle,
                                    onBlur: (e) => {
                                        const newValue = e.target.value;
                                        if (newValue === talentTitle) return;

                                        const newTalents = [...(characterSheetData.outros?.['Talentos'] || [])];

                                        while (newTalents.length <= idx) newTalents.push("");

                                        newTalents[idx] = newValue;
                                        updateSheetField('outros', 'Talentos', newTalents);
                                    }
                                }),

                                // CAMPO: DESCRIÇÃO DO TALENTO
                                el('textarea', {
                                    className: "w-full bg-transparent text-[11px] text-slate-400 italic leading-tight outline-none resize-none placeholder:text-slate-800",
                                    placeholder: "Clique para descrever o efeito do talento...",
                                    key: `desc-input-${idx}-${talentDesc}`,
                                    rows: 2,
                                    defaultValue: talentDesc,
                                    onBlur: (e) => {
                                        const newValue = e.target.value;
                                        if (newValue === talentDesc) return;
                                        updateSheetField('outros', `desc_talento_${idx}`, newValue);
                                    }
                                })
                            ]);
                        })
                    )
                )
            ),
            // --- BLOCO 6: TRAÇOS DE PERSONALIDADE (GRID 4) ---
            el('div', { className: "grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6" },
                Object.entries(characterSheetData.personalidade || {}).map(([key, value]) => (
                    el('div', { key: key, className: "bg-slate-900/50 border border-slate-800 p-5 rounded-3xl shadow-sm hover:bg-slate-900 transition-colors group" },
                        el('h4', { className: "text-amber-600 font-black mb-2 uppercase text-[9px] tracking-[0.2em] italic flex items-center gap-1.5" }, key),
                        el('p', { className: "text-slate-400 text-[11px] leading-snug italic group-hover:text-slate-200 transition-colors" }, value || '---')
                    )
                ))
            ),

            // --- BLOCO 7: BOLSA DE TESOUROS E INVENTÁRIO ---
            el('div', { key: 'block-7', className: "mt-12 space-y-8 border-t border-slate-800 pt-12" }, [
                el('h3', { className: "text-3xl font-black text-amber-500 uppercase tracking-tighter italic flex items-center gap-4" }, "🔨 Bolsa de Tesouros e Itens"),

                el('div', { className: "grid grid-cols-1 lg:grid-cols-12 gap-8" }, [

                    // 1. MOEDAS (Editáveis)
                    el('div', { className: "lg:col-span-4 grid grid-cols-1 gap-4" },
                        [['PO', 'Ouro', 'bg-amber-500/20 text-amber-500'],
                        ['PP', 'Prata', 'bg-slate-400/20 text-slate-400'],
                        ['PC', 'Cobre', 'bg-orange-700/20 text-orange-700']
                        ].map(([sigla, nome, colorClass]) =>
                            el('div', {
                                key: sigla,
                                className: "bg-slate-900 border-2 border-slate-800 p-6 rounded-[2rem] flex items-center justify-between shadow-xl group hover:border-amber-500/30 transition-all"
                            }, [
                                el('div', { className: "flex items-center gap-4" }, [
                                    el('div', { className: `${colorClass} w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xl shadow-inner` }, sigla),
                                    el('p', { className: "text-sm font-black text-slate-500 uppercase tracking-widest" }, nome)
                                ]),
                                el('input', {
                                    type: 'text',
                                    className: "bg-transparent text-3xl font-black text-white text-right w-24 outline-none focus:text-amber-500 transition-colors",
                                    defaultValue: characterSheetData.outros?.[sigla] || '0',
                                    onBlur: (e) => updateSheetField('outros', sigla, e.target.value)
                                })
                            ])
                        )
                    ),

                    // --- BLOCO DA MOCHILA (MODO VISUALIZAÇÃO COM BOLHAS + MODO EDIÇÃO) ---
                    el('div', { className: "lg:col-span-8 bg-slate-900 border-2 border-slate-800 p-8 rounded-[3rem] shadow-xl flex flex-col" }, [
                        el('div', { className: "flex justify-between items-center mb-6" }, [
                            el('h4', { className: "text-slate-400 font-black uppercase text-xs tracking-widest flex items-center gap-2 italic" }, "🎒 Mochila de Itens"),
                            el('span', { className: "text-[10px] text-slate-600 font-bold uppercase" },
                                isEditingInventory ? "Editando..." : "Clique para editar"
                            )
                        ]),

                        el('div', {
                            // ADICIONEI min-h-[160px] E bg-slate-950/40 PARA VISIBILIDADE
                            className: `bg-slate-950/40 border-2 border-slate-800 rounded-3xl p-6 flex-grow min-h-[160px] transition-all cursor-text ${isEditingInventory ? 'border-amber-500/50 ring-2 ring-amber-500/10' : 'hover:border-slate-700 hover:bg-slate-950/60'}`,
                            onClick: () => !isEditingInventory && setIsEditingInventory(true)
                        },
                            isEditingInventory ?
                                // --- MODO EDIÇÃO (TEXTAREA) ---
                                el('textarea', {
                                    autoFocus: true,
                                    className: "w-full h-full bg-transparent text-slate-300 font-medium text-sm outline-none resize-none leading-relaxed",
                                    placeholder: "Item 1, Item 2, Item 3...",
                                    defaultValue: characterSheetData.outros?.['Equipamento'] || "",
                                    onBlur: (e) => {
                                        setIsEditingInventory(false);
                                        updateSheetField('outros', 'Equipamento', e.target.value);
                                    }
                                }) :
                                // --- MODO VISUALIZAÇÃO (BOLHAS) ---
                                // ADICIONEI flex E flex-wrap PARA ORGANIZAR AS BOLHAS
                                el('div', { className: "flex flex-wrap gap-2.5 content-start" }, [
                                    (characterSheetData.outros?.['Equipamento'] || "").split(',').map((item, idx) => {
                                        const cleanItem = item.trim();
                                        // Ignora itens vazios ou apenas traços
                                        if (!cleanItem || cleanItem === '-') return null;

                                        // ESTILIZAÇÃO DAS BOLHAS PARA ALTO CONTRASTE (ESTILO DADOS/MOEDAS)
                                        return el('span', {
                                            key: idx,
                                            className: "bg-amber-600/10 text-amber-400 px-4 py-1.5 rounded-full text-[10px] font-black border border-amber-600/20 shadow-sm transition-all hover:scale-105 hover:bg-amber-600/20 uppercase tracking-tight"
                                        }, cleanItem);
                                    }).filter(Boolean), // Remove os itens nulos do array para renderização limpa

                                    // Texto de feedback se estiver vazia (aparece mesmo sem altura colapsada)
                                    (characterSheetData.outros?.['Equipamento'] || "").split(',').filter(item => item.trim() !== "" && item.trim() !== "-").length === 0 &&
                                    el('p', { className: "text-slate-700 italic text-sm" }, "Mochila vazia... Clique para adicionar itens.")
                                ])
                        )
                    ])
                ])
            ]),
            // --- BLOCO 8: GRIMÓRIO ARCANO ---
            el('div', { key: 'grimoire', className: "mt-12 space-y-8 border-t border-slate-800 pt-12" }, [
                el('div', { className: "flex flex-col md:flex-row items-center justify-between gap-6" }, [
                    el('h3', { className: "text-3xl font-black text-blue-500 uppercase tracking-tighter italic flex items-center gap-4" }, "🧙🏾‍♂️ Grimório Arcano"),

                    // BOTÃO PARA ADICIONAR CÍRCULO
                    el('select', {
                        className: "bg-slate-800 text-blue-400 text-[10px] font-black uppercase p-2 rounded-xl border border-blue-500/30 outline-none",
                        onChange: (e) => {
                            const nivel = e.target.value;
                            if (!nivel) return;
                            // Inicializa o nível no Firebase/Estado
                            const novaMagia = { ...characterSheetData.magias, temMagia: true };
                            if (!novaMagia[nivel]) novaMagia[nivel] = ["", "", "", ""];
                            updateSheetField('magias', nivel, novaMagia[nivel]);
                        }
                    }, [
                        el('option', { value: "" }, "+ ADICIONAR CÍRCULO"),
                        ["Infusões", "Círculo 0 (Truques)", "Círculo 1", "Círculo 2", "Círculo 3", "Círculo 4", "Círculo 5", "Círculo 6", "Círculo 7", "Círculo 8", "Círculo 9"].map(n => el('option', { key: n, value: n }, n))
                    ])
                ]),

                // Renderiza apenas os círculos que têm dados ou foram adicionados
                el('div', { className: "grid grid-cols-1 xl:grid-cols-2 gap-10" },
                    Object.keys(characterSheetData.magias)
                        .filter(k => k !== 'temMagia' && Array.isArray(characterSheetData.magias[k]))
                        .sort() // Organiza por ordem alfabética/numérica
                        .map((nivel) => (
                            el('div', { key: nivel, className: "bg-slate-900 border-2 border-slate-800 p-8 rounded-[3.5rem] shadow-2xl" }, [
                                el('h4', { className: "text-blue-400 font-black uppercase text-xl italic mb-8 border-b border-blue-900/30 pb-5" }, nivel),
                                el('div', { className: "space-y-5" },
                                    [0, 1, 2, 3].map((idx) => {
                                        const nomeMagia = characterSheetData.magias[nivel]?.[idx] || "";
                                        const descMagia = characterSheetData.outros?.[`spell_desc_${nivel}_${idx}`] || "";

                                        return el('div', { key: idx, className: "bg-slate-950/60 border border-slate-800 rounded-[2rem] p-6 focus-within:border-blue-500/50" }, [
                                            el('input', {
                                                type: 'text',
                                                className: "w-full bg-transparent text-blue-50 text-base font-black uppercase outline-none",
                                                defaultValue: nomeMagia,
                                                onBlur: (e) => {
                                                    const novaLista = [...(characterSheetData.magias[nivel] || ["", "", "", ""])];
                                                    novaLista[idx] = e.target.value;
                                                    updateSheetField('magias', nivel, novaLista);
                                                }
                                            }),
                                            el('textarea', {
                                                className: "w-full bg-transparent text-[11px] text-slate-500 italic mt-2 outline-none resize-none",
                                                defaultValue: descMagia,
                                                onBlur: (e) => updateSheetField('outros', `spell_desc_${nivel}_${idx}`, e.target.value)
                                            })
                                        ]);
                                    })
                                )
                            ])
                        ))
                )
            ])
        ),
        // --- MENU FIXO INFERIOR (CONTROLES) ---
        el('div', { className: "fixed bottom-0 left-0 w-full p-6 z-[60] pointer-events-none" },
            el('div', { className: "max-w-7xl mx-auto flex items-end justify-center gap-4 pointer-events-auto" }, [
                // Janela flutuante de dados (Aparece em cima do botão)
                isDiceMenuOpen && el('div', { className: "bg-slate-900 border-2 border-amber-500/50 p-4 rounded-3xl shadow-2xl flex flex-col gap-3 mb-2 animate-fade-in-up" }, [
                    el('p', { className: "text-[9px] font-black text-amber-500 uppercase tracking-widest text-center" }, "Rolar Dados"),
                    el('div', { className: "grid grid-cols-2 gap-2" },
                        [20, 12, 10, 8, 6, 4].map(sides => el('button', {
                            key: sides,
                            onClick: () => { rollDice(sides); setIsDiceMenuOpen(false); },
                            className: "bg-slate-800 hover:bg-amber-600 text-white font-black py-3 px-4 rounded-xl transition-all border border-slate-700 flex flex-col items-center"
                        }, [
                            el('span', { className: "text-[8px] text-slate-500" }, "D"),
                            sides
                        ]))
                    )
                ]),
                // Barra de Botões Fixos
                el('div', { className: "bg-slate-900/80 backdrop-blur-xl border border-slate-700 p-4 rounded-full shadow-2xl flex items-center gap-3" }, [
                    // Botão Dado (Agora controla o menu de dados aqui mesmo)
                    el('button', {
                        onClick: () => setIsDiceMenuOpen(!isDiceMenuOpen),
                        className: `w-16 h-16 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 border-4 ${isDiceMenuOpen ? 'bg-red-600 border-red-400 rotate-45' : 'bg-amber-600 border-amber-400 hover:scale-110'}`
                    }, isDiceMenuOpen ? el('span', { className: "text-3xl font-bold text-white" }, "+") : "🎲"),

                    // Botão Descanso
                    el('button', {
                        onClick: handleDescansoLongo,
                        className: "w-14 h-14 bg-slate-800 hover:bg-purple-900 text-purple-400 hover:text-white rounded-full flex items-center justify-center transition-all border border-slate-700 shadow-xl"
                    }, "🌙"),

                    // Botão Editar
                    el('button', {
                        onClick: () => setEditableSheetData(characterSheetData),
                        className: "w-14 h-14 bg-slate-800 hover:bg-amber-600 text-amber-500 hover:text-white rounded-full flex items-center justify-center transition-all border border-slate-700 shadow-xl"
                    }, "✏️"),

                    // Botão Level Up (Condicional)
                    podeSubirNivel && el('button', {
                        onClick: () => {/* sua lógica de level up */ },
                        className: "h-14 bg-amber-500 hover:bg-amber-400 text-black px-6 rounded-full font-black text-xs uppercase transition-all shadow-xl animate-bounce"
                    }, "🚀 Level Up!")
                ]),
                // --- GERENCIADOR DE BALÕES (Fica invisível, apenas cuidando dos dados) ---
                el(DiceRoller, {
                    recentRolls,
                    characterName
                })
            ])
        ),
    )
}