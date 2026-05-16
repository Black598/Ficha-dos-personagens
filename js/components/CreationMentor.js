const { useState, useEffect } = React;

export function CreationMentor({ 
    sessionState, 
    characterSheetData, 
    onUpdateField, 
    askGemini, 
    rollDice, 
    recentRolls, 
    onClose,
    canEdit
}) {
    const el = React.createElement;
    const [activeTab, setActiveTab] = useState('atributos'); // atributos, wiki, chat
    const [wikiSearch, setWikiSearch] = useState('');
    const [wikiResult, setWikiResult] = useState(null);
    const [chatInput, setChatInput] = useState('');
    const [chatLog, setChatLog] = useState([{ role: 'assistant', content: 'Olá! Sou seu Mentor de Criação. Como posso ajudar você a construir seu herói hoje?' }]);
    const [isRolling, setIsRolling] = useState(false);
    const [rolledStats, setRolledStats] = useState([]);
    const [allowOneMoreRoll, setAllowOneMoreRoll] = useState(false);
    const [statsDistribution, setStatsDistribution] = useState({});

    // Efeito para capturar os dados do rolador 3D quando o Mentor está rolando atributos
    useEffect(() => {
        if (isRolling && recentRolls.length > 0) {
            // Pegamos a última rolagem que condiz com a regra
            // Nota: Em um sistema real, poderíamos ter um ID único para a transação de rolagem
            const lastRoll = recentRolls[0];
            // Se a rolagem é recente (últimos 5 segundos)
            if (Date.now() - (lastRoll.timestamp?.seconds * 1000 || Date.now()) < 5000) {
                 // Aqui precisaríamos de uma lógica para acumular as rolagens se forem múltiplas
            }
        }
    }, [recentRolls]);

    // Escuta evento de retorno de dado alocado
    useEffect(() => {
        const handleReturnStat = (e) => {
            const { val } = e.detail;
            setRolledStats(prev => {
                const next = [...prev];
                // Encontra o primeiro dado com esse valor que está marcado como usado
                const found = next.find(s => s.val === parseInt(val) && s.used);
                if (found) found.used = false;
                return next;
            });
        };
        window.addEventListener('return-stat', handleReturnStat);
        return () => window.removeEventListener('return-stat', handleReturnStat);
    }, []);

    const handleRollStats = async () => {
        const rule = sessionState.attributeRule || "4d6 drop lowest";
        setIsRolling(true);
        setRolledStats([]);

        try {
            const prompt = `Analise a regra de RPG: "${rule}". 
            Extraia: 
            1. Quantos dados rolar? (ex: 8)
            2. Qual o tipo do dado? (ex: 20)
            3. Qual a lógica de descarte? (ex: remover os 2 menores)
            Responda APENAS em JSON: {"count": number, "sides": number, "drop": number, "dropMode": "lowest"|"highest"}`;
            
            const response = await askGemini(prompt);
            const config = JSON.parse(response.replace(/```json|```/g, '').trim());

            const localResults = [];
            for (let i = 0; i < config.count; i++) {
                const res = Math.floor(Math.random() * config.sides) + 1;
                localResults.push(res);
                rollDice(config.sides, res, `Atributo ${i+1}`);
            }

            const sorted = [...localResults].sort((a, b) => a - b);
            const excludedValues = sorted.slice(0, config.drop);
            
            let badStatsCount = 0;
            const finalValues = localResults.map((v, idx) => {
                const isExcluded = excludedValues.includes(v);
                if (isExcluded) excludedValues.splice(excludedValues.indexOf(v), 1);
                else if (v < 10) badStatsCount++; // Conta apenas os que NÃO foram excluídos
                return {
                    id: idx,
                    val: v,
                    excluded: isExcluded,
                    used: false
                };
            });

            setRolledStats(finalValues);
            
            // Lógica de Misericórdia: Se mais de 4 dados forem < 10, avisa que pode rolar de novo
            if (badStatsCount > 4) {
                setAllowOneMoreRoll(true);
                alert(`Misericórdia do Mestre! Você tirou ${badStatsCount} valores abaixo de 10. Você ganhou uma nova rolagem!`);
            } else {
                setAllowOneMoreRoll(false);
            }
        } catch (e) {
            console.error("Erro ao processar regra:", e);
            alert("Não consegui interpretar a regra do mestre automaticamente.");
        }
        setIsRolling(false);
    };

    const handleWikiSearch = async () => {
        if (!wikiSearch) return;
        setWikiResult("Buscando no grimório...");
        try {
            const prompt = `Pesquise e resuma os aspectos técnicos da raça/classe/habilidade "${wikiSearch}" de D&D 5e (pode usar wikidot como base). 
            Formate em tópicos curtos e claros para um jogador preencher na ficha.`;
            const res = await askGemini(prompt);
            setWikiResult(res);
        } catch(e) { setWikiResult("Erro na busca."); }
    };

    const handleChat = async () => {
        if (!chatInput) return;
        const newMsg = { role: 'user', content: chatInput };
        setChatLog(prev => [...prev, newMsg]);
        setChatInput('');
        
        try {
            const context = characterSheetData ? JSON.stringify(characterSheetData) : "Personagem ainda não criado";
            const prompt = `Contexto do personagem atual: ${context}. 
            Pergunta do jogador: ${chatInput}. 
            Responda como um Mentor de RPG experiente, dando dicas práticas de como preencher a ficha.
            IMPORTANTE: Se você sugerir mudanças técnicas (como trocar raça, classe, ou preencher atributos), inclua no FINAL da sua resposta um bloco JSON começando com "SUGESTÃO_FICHA:" contendo apenas os campos que devem ser alterados. Ex: SUGESTÃO_FICHA:{"info": {"Raça": "Anão"}, "atributos": {"CON": "18"}}`;
            
            const res = await askGemini(prompt);
            
            // Verifica se há sugestão de dados
            let cleanRes = res;
            let suggestion = null;
            if (res.includes('SUGESTÃO_FICHA:')) {
                const parts = res.split('SUGESTÃO_FICHA:');
                cleanRes = parts[0];
                try { suggestion = JSON.parse(parts[1].trim()); } catch(e) { console.error("Erro no JSON da IA"); }
            }

            setChatLog(prev => [...prev, { role: 'assistant', content: cleanRes, suggestion }]);
        } catch(e) { setChatLog(prev => [...prev, { role: 'assistant', content: "Houve um erro na minha conexão mística..." }]); }
    };

    const applySuggestion = (sug) => {
        Object.keys(sug).forEach(section => {
            if (typeof sug[section] === 'object') {
                Object.keys(sug[section]).forEach(field => {
                    onUpdateField(section, field, sug[section][field]);
                });
            } else {
                onUpdateField(section, null, sug[section]);
            }
        });
        alert("Dados aplicados na ficha!");
    };

    return el('div', { className: "fixed right-0 top-0 bottom-0 w-80 bg-slate-900/95 backdrop-blur-xl border-l border-slate-800 z-[150] shadow-3xl flex flex-col animate-slide-left" }, [
        // Header
        el('div', { className: "p-4 border-b border-slate-800 flex justify-between items-center bg-indigo-950/20" }, [
            el('h3', { className: "text-xs font-black uppercase tracking-tighter text-indigo-400" }, "🧠 Mentor de Criação"),
            el('button', { onClick: onClose, className: "text-slate-500 hover:text-white" }, "×")
        ]),

        // Tabs
        el('div', { className: "flex border-b border-slate-800" }, [
            ['atributos', '🎲'], ['wiki', '📖'], ['chat', '💬']
        ].map(([id, icon]) => el('button', {
            key: id,
            onClick: () => setActiveTab(id),
            className: `flex-1 py-3 text-sm transition-all ${activeTab === id ? 'bg-indigo-600/20 text-indigo-400 border-b-2 border-indigo-500' : 'text-slate-500 hover:bg-slate-800'}`
        }, icon))),

        // Content
        el('div', { className: "flex-1 overflow-y-auto p-4 custom-scrollbar" }, [
            activeTab === 'atributos' && el('div', { className: "space-y-6" }, [
                el('div', { className: "bg-slate-950/50 p-4 rounded-xl border border-slate-800" }, [
                    el('p', { className: "text-[10px] font-black text-slate-500 uppercase mb-2" }, "Regra da Sala"),
                    el('p', { className: "text-xs text-white italic" }, sessionState.attributeRule || "Padrão: 4d6 descarta menor")
                ]),

                (canEdit && (!checkStatsRolled(characterSheetData) || allowOneMoreRoll)) ? el('button', {
                    onClick: handleRollStats,
                    disabled: isRolling,
                    className: "w-full py-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-black uppercase text-[10px] tracking-widest rounded-xl transition-all shadow-lg"
                }, isRolling ? "Rolando Destino..." : (allowOneMoreRoll ? "🎲 Usar Rolagem de Misericórdia" : "🎲 Rolar Meus Atributos")) : 
                el('div', { className: "p-4 bg-amber-900/20 border border-amber-500/30 rounded-xl text-center" }, [
                    el('p', { className: "text-[10px] font-black text-amber-500 uppercase" }, "✨ Atributos Definidos"),
                    el('p', { className: "text-[9px] text-amber-200/60 mt-1" }, canEdit ? "Os dados de destino já foram alocados para este herói." : "A rolagem de atributos está bloqueada pelo mestre.")
                ]),

                rolledStats.length > 0 && el('div', { className: "space-y-4 animate-fade-in" }, [
                    el('p', { className: "text-[10px] font-black text-amber-500 uppercase text-center" }, "Seus Resultados"),
                    el('div', { className: "grid grid-cols-4 gap-2" }, rolledStats.map((s, i) => el('div', {
                        key: i,
                        draggable: !s.excluded && !s.used,
                        onDragStart: (e) => {
                            e.dataTransfer.setData('text/plain', JSON.stringify({ val: s.val, id: s.id }));
                            e.dataTransfer.effectAllowed = 'copy';
                        },
                        // Ao terminar o arraste com sucesso, marcamos como usado localmente
                        onDragEnd: (e) => {
                            if (e.dataTransfer.dropEffect !== 'none') {
                                setRolledStats(prev => prev.map(st => st.id === s.id ? { ...st, used: true } : st));
                            }
                        },
                        className: `aspect-square flex items-center justify-center rounded-lg border-2 font-black transition-all ${
                            s.excluded ? 'border-red-900/30 text-red-900/50 line-through text-xs' : 
                            s.used ? 'border-slate-800 bg-slate-950 text-slate-700 cursor-not-allowed opacity-40 scale-90' :
                            'border-indigo-500/50 text-white text-lg bg-indigo-950/30 cursor-grab active:cursor-grabbing hover:border-amber-500 hover:scale-105 shadow-lg'
                        }`
                    }, s.val))),
                    el('p', { className: "text-[9px] text-slate-500 italic text-center" }, "Clique e arraste os valores. Clique no atributo na ficha para devolvê-lo.")
                ])
            ]),

            activeTab === 'wiki' && el('div', { className: "space-y-4" }, [
                el('div', { className: "flex gap-2" }, [
                    el('input', {
                        placeholder: "O que quer consultar?",
                        value: wikiSearch,
                        onChange: (e) => setWikiSearch(e.target.value),
                        onKeyDown: (e) => e.key === 'Enter' && handleWikiSearch(),
                        className: "flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-indigo-500"
                    }),
                    el('button', { onClick: handleWikiSearch, className: "bg-indigo-600 p-2 rounded-lg" }, "🔍")
                ]),
                wikiResult && el('div', { className: "text-[11px] text-slate-300 leading-relaxed whitespace-pre-wrap bg-slate-950/30 p-3 rounded-lg border border-slate-800" }, wikiResult)
            ]),

            activeTab === 'chat' && el('div', { className: "h-full flex flex-col" }, [
                el('div', { className: "flex-1 space-y-4 mb-4" }, chatLog.map((m, i) => el('div', {
                    key: i,
                    className: `p-3 rounded-xl text-xs ${m.role === 'assistant' ? 'bg-indigo-900/20 text-indigo-200 border border-indigo-500/20' : 'bg-slate-800 text-slate-300 ml-4'}`
                }, [
                    el('div', null, m.content),
                    (m.suggestion && canEdit) && el('button', {
                        onClick: () => applySuggestion(m.suggestion),
                        className: "mt-3 w-full py-2 bg-amber-600 hover:bg-amber-500 text-white text-[9px] font-black uppercase rounded-lg transition-all shadow-md"
                    }, "🪄 Aplicar Sugestões na Ficha"),
                    (m.suggestion && !canEdit) && el('div', { className: "mt-2 p-2 bg-slate-950/50 rounded-lg border border-slate-800 text-[8px] text-slate-500 italic" }, 
                        "⚠️ Ficha bloqueada pelo mestre. O mentor não pode aplicar mudanças agora."
                    )
                ]))),
                el('div', { className: "flex gap-2" }, [
                    el('input', {
                        placeholder: "Pergunte ao Mentor...",
                        value: chatInput,
                        onChange: (e) => setChatInput(e.target.value),
                        onKeyDown: (e) => e.key === 'Enter' && handleChat(),
                        className: "flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-indigo-500"
                    }),
                    el('button', { onClick: handleChat, className: "bg-indigo-600 p-2 rounded-lg" }, "➔")
                ])
            ])
        ]),

        // Footer Dica
        el('div', { className: "p-4 bg-slate-950/80 border-t border-slate-800 text-[9px] text-slate-500 italic text-center" }, 
            "Dica: Arraste os valores rolados para os campos de Atributos na ficha."
        )
    ]);
}

function checkStatsRolled(characterSheetData) {
    if (!characterSheetData || !characterSheetData.atributos) return false;
    const attrs = ['FOR', 'DES', 'CON', 'INT', 'SAB', 'CAR'];
    // Se TODOS os atributos forem diferentes de 10, consideramos que já foi rolado
    return attrs.every(attr => {
        const val = characterSheetData.atributos[attr];
        return val && val !== '10' && val !== 10;
    });
}
