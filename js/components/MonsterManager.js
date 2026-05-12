import { parseImageUrl } from '../utils.js';

const { useState } = React;

export function MonsterManager({ sessionState, updateSessionState, geminiApiKey }) {
    const el = React.createElement;
    const [isGenerating, setIsGenerating] = useState(false);

    const monsters = sessionState.monsters || [];

    const addMonster = () => {
        const monsterId = Date.now();
        const bestiaryId = Date.now() + 1;
        const newMonster = { id: monsterId, name: 'Novo Monstro', ca: 10, hpMax: 20, hpAtual: 20, details: '', bestiaryId: bestiaryId };
        
        const libraryItem = {
            id: bestiaryId,
            name: newMonster.name,
            description: `🛡️ CA: ${newMonster.ca} | ❤️ PV MÁX: ${newMonster.hpMax}\n\n${newMonster.details}`,
            image: ''
        };
        
        const currentLibrary = sessionState.library || { characters: [], books: [], bestiary: [] };
        const currentBestiary = currentLibrary.bestiary || [];

        updateSessionState({ 
            monsters: [...monsters, newMonster],
            library: {
                ...currentLibrary,
                bestiary: [...currentBestiary, libraryItem]
            }
        });
    };

    const removeMonster = (id) => {
        const newMonsters = monsters.filter(m => m.id !== id);
        updateSessionState({ monsters: newMonsters });
    };

    const updateMonster = (id, field, value) => {
        let currentLibrary = sessionState.library || { characters: [], books: [], bestiary: [] };
        let currentBestiary = [...(currentLibrary.bestiary || [])];

        const newMonsters = monsters.map(m => {
            if (m.id === id) {
                const updated = { ...m, [field]: value };
                if (field === 'hpMax') updated.hpAtual = value; // Sincroniza se mudar o max
                
                // Sync to bestiary
                const matchingIndex = currentBestiary.findIndex(b => (updated.bestiaryId && b.id === updated.bestiaryId) || b.name === m.name);
                
                if (matchingIndex !== -1) {
                    const bItem = currentBestiary[matchingIndex];
                    const newBItem = { ...bItem };
                    
                    if (field === 'name') newBItem.name = value;
                    if (field === 'imageUrl') newBItem.image = value;
                    if (['ca', 'hpMax', 'details'].includes(field)) {
                        newBItem.description = `🛡️ CA: ${updated.ca || 10} | ❤️ PV MÁX: ${updated.hpMax || 20}\n\n${updated.details || ''}`;
                    }
                    currentBestiary[matchingIndex] = newBItem;
                }
                
                return updated;
            }
            return m;
        });

        updateSessionState({ 
            monsters: newMonsters,
            library: {
                ...currentLibrary,
                bestiary: currentBestiary
            }
        });
    };

    return el('div', { key: 'monster-manager-root', className: "space-y-6" }, [
        el('div', { key: 'header', className: "flex items-center justify-between" }, [
            el('h2', { key: 'title', className: "text-sm font-black uppercase tracking-[0.3em] text-red-500 flex items-center gap-2" }, "⚔️ Ameaças e NPCs"),
            el('div', { key: 'header-btns', className: "flex gap-2" }, [
                el('button', {
                    key: 'ai-btn',
                    onClick: async () => {
                        if (!geminiApiKey) {
                            alert("Você precisa configurar a Chave da API do Gemini (nas Configurações ou no Cofre) para usar a IA.");
                            return;
                        }
                        const promptText = prompt("Descreva o monstro que deseja gerar (Ex: Goblin Xamã de Gelo, nível 3):");
                        if (!promptText) return;
                        
                        setIsGenerating(true);
                        try {
                            let data = null;
                            let retries = 3;
                            let delay = 2000;
                            
                            while (retries > 0) {
                                const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`, {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                        contents: [{
                                            parts: [{
                                                text: `Você é um gerador de monstros de RPG de mesa. 
                                                Com base na descrição do usuário: "${promptText}"
                                                Crie um monstro único, criativo e balanceado. 
                                                Você DEVE retornar APENAS um objeto JSON com as seguintes chaves:
                                                "name" (string, nome do monstro),
                                                "ca" (number, classe de armadura),
                                                "hpMax" (number, pontos de vida máximos),
                                                "details" (string, descreva habilidades, mecânicas, ataques e histórico. Use "\\n" literal para quebras de linha).`
                                            }]
                                        }],
                                        generationConfig: {
                                            responseMimeType: "application/json",
                                        }
                                    })
                                });
                                
                                if (!response.ok) {
                                    const errData = await response.json();
                                    const errorMsg = errData.error?.message || "Erro na API do Gemini.";
                                    if (response.status === 503 || response.status === 429) {
                                        retries--;
                                        if (retries === 0) throw new Error(errorMsg + " (A API continua ocupada após várias tentativas)");
                                        console.warn(`API ocupada (503/429). Tentando novamente em ${delay}ms... Tentativas restantes: ${retries}`);
                                        await new Promise(resolve => setTimeout(resolve, delay));
                                        delay *= 2; // Exponential backoff: 2s, 4s, 8s
                                        continue;
                                    }
                                    throw new Error(errorMsg);
                                }
                                
                                data = await response.json();
                                break;
                            }
                            let jsonStr = data.candidates[0].content.parts[0].text.trim();
                            const monsterData = JSON.parse(jsonStr);
                            
                            // A Pollinations AI costuma cair, então usando Robohash (set2 = Monstros) para sempre ter um avatar único.
                            const promptUrl = `https://robohash.org/${encodeURIComponent(monsterData.name)}?set=set2&bgset=bg1&size=256x256`;
                            const bestiaryId = Date.now() + 1;
                            
                            const newMonster = { 
                                id: Date.now(), 
                                name: monsterData.name || 'Monstro IA', 
                                ca: parseInt(monsterData.ca) || 10, 
                                hpMax: parseInt(monsterData.hpMax) || 20, 
                                hpAtual: parseInt(monsterData.hpMax) || 20,
                                details: monsterData.details || '',
                                imageUrl: promptUrl,
                                bestiaryId: bestiaryId
                            };
                            const newMonsters = [...monsters, newMonster];
                            
                            const libraryItem = {
                                id: bestiaryId,
                                name: newMonster.name,
                                description: `🛡️ CA: ${newMonster.ca} | ❤️ PV MÁX: ${newMonster.hpMax}\n\n${newMonster.details}`,
                                image: promptUrl
                            };
                            
                            const currentLibrary = sessionState.library || { characters: [], books: [], bestiary: [] };
                            const currentBestiary = currentLibrary.bestiary || [];

                            updateSessionState({ 
                                monsters: newMonsters,
                                library: {
                                    ...currentLibrary,
                                    bestiary: [...currentBestiary, libraryItem]
                                }
                            });
                        } catch (e) {
                            console.error("Erro no Gerador de Monstro:", e);
                            alert("Falha ao gerar monstro. Detalhe do Erro: " + e.message);
                        } finally {
                            setIsGenerating(false);
                        }
                    },
                    disabled: isGenerating,
                    className: `bg-amber-900/40 hover:bg-amber-600 text-amber-400 hover:text-white px-4 py-2 rounded-xl border border-amber-500/30 text-[10px] font-black uppercase tracking-widest transition-all ${isGenerating ? 'opacity-50 cursor-not-allowed animate-pulse' : ''}`
                }, isGenerating ? "Gerando..." : "✨ IA"),
                el('button', {
                    key: 'add-btn',
                    onClick: addMonster,
                    className: "bg-red-900/40 hover:bg-red-600 text-red-400 hover:text-white px-4 py-2 rounded-xl border border-red-500/30 text-[10px] font-black uppercase tracking-widest transition-all"
                }, "+ Adicionar")
            ])
        ]),

        el('div', { key: 'monsters-grid', className: "grid grid-cols-1 md:grid-cols-2 gap-4" }, 
            monsters.map(m => el('div', { key: m.id, className: "bg-slate-900 border border-slate-800 p-5 rounded-[2rem] shadow-xl relative group hover:border-red-500/30 transition-all" }, [
                // Deletar
                el('button', {
                    key: 'remove-btn',
                    onClick: () => removeMonster(m.id),
                    className: "absolute top-4 right-4 text-slate-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                }, "×"),

                el('div', { key: 'main-info', className: "flex items-center gap-4 mb-4" }, [
                    el('div', { 
                        key: 'icon-box', 
                        className: "w-12 h-12 bg-slate-800 rounded-2xl flex items-center justify-center border border-red-500/20 overflow-hidden shrink-0 shadow-inner cursor-pointer hover:border-amber-400 group/img relative transition-all",
                        title: "Clique para colar a URL de uma imagem épica ou ID do Google Drive",
                        onClick: () => {
                            const url = prompt("Cole o link da imagem (Google, Pinterest) ou ID do Google Drive:", m.imageUrl || '');
                            if (url !== null && url.trim() !== '') {
                                const finalUrl = parseImageUrl(url);
                                updateMonster(m.id, 'imageUrl', finalUrl);
                            } else if (url !== null && url.trim() === '') {
                                updateMonster(m.id, 'imageUrl', '');
                            }
                        }
                    }, [
                        m.imageUrl ? 
                            el('img', { 
                                key: 'monster-avatar',
                                src: m.imageUrl, 
                                className: "w-full h-full object-cover group-hover/img:opacity-40 transition-all", 
                                alt: "Monster",
                                onError: (e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'block'; }
                            }) : null,
                        el('span', { key: 'monster-icon', className: "text-lg absolute", style: { display: m.imageUrl ? 'none' : 'block' } }, "👹"),
                        el('div', { key: 'edit-overlay', className: "absolute inset-0 flex items-center justify-center opacity-0 group-hover/img:opacity-100 text-white font-black drop-shadow-md pointer-events-none" }, "✏️")
                    ]),
                    el('div', { key: 'name-ca-box', className: "flex-grow" }, [
                        el('input', {
                            key: 'name-input',
                            className: "bg-transparent text-white font-black uppercase text-sm outline-none w-full focus:text-red-400",
                            value: m.name,
                            onChange: (e) => updateMonster(m.id, 'name', e.target.value)
                        }),
                        el('div', { key: 'ca-row', className: "flex items-center gap-3 text-[10px] font-bold text-slate-500" }, [
                            el('span', { key: 'ca-label' }, "CA"),
                            el('input', {
                                key: 'ca-input',
                                type: 'number',
                                className: "bg-slate-950 border border-slate-800 rounded px-1.5 w-10 text-center text-red-400",
                                value: m.ca,
                                onChange: (e) => updateMonster(m.id, 'ca', parseInt(e.target.value))
                            })
                        ])
                    ])
                ]),

                // HP Bar
                el('div', { key: 'hp-section', className: "space-y-2 mb-4" }, [
                    el('div', { key: 'hp-header', className: "flex justify-between text-[10px] font-black uppercase" }, [
                        el('span', { key: 'hp-label', className: "text-slate-500" }, "Vitalidade"),
                        el('div', { key: 'hp-values', className: "flex items-center gap-1" }, [
                            el('input', {
                                key: 'hp-atual-input',
                                type: 'number',
                                className: "bg-transparent text-red-500 w-8 text-right outline-none",
                                value: m.hpAtual,
                                onChange: (e) => updateMonster(m.id, 'hpAtual', parseInt(e.target.value))
                            }),
                            el('span', { key: 'sep', className: "text-slate-700" }, "/"),
                            el('input', {
                                key: 'hp-max-input',
                                type: 'number',
                                className: "bg-transparent text-slate-500 w-8 outline-none",
                                value: m.hpMax,
                                onChange: (e) => updateMonster(m.id, 'hpMax', parseInt(e.target.value))
                            })
                        ])
                    ]),
                    el('div', { key: 'hp-bar-container', className: "h-2 bg-slate-800 rounded-full overflow-hidden flex gap-0.5 relative" }, [
                        el('div', {
                            key: 'hp-fill',
                            className: "h-full bg-red-600 transition-all duration-300",
                            style: { width: `${(m.hpAtual / m.hpMax) * 100}%` }
                        }),
                        // Botões de ajuste rápido
                        el('button', { 
                            key: 'hp-minus',
                            onClick: () => updateMonster(m.id, 'hpAtual', Math.max(0, m.hpAtual - 1)),
                            className: "absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-slate-950/80 hover:bg-red-900 rounded flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100 transition-all text-white font-bold"
                        }, "-"),
                        el('button', { 
                            key: 'hp-plus',
                            onClick: () => updateMonster(m.id, 'hpAtual', Math.min(m.hpMax, m.hpAtual + 1)),
                            className: "absolute left-7 top-1/2 -translate-y-1/2 w-4 h-4 bg-slate-950/80 hover:bg-green-900 rounded flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100 transition-all text-white font-bold"
                        }, "+")
                    ])
                ]),
                
                // Detalhes / Habilidades
                el('div', { key: 'details-section', className: "pt-4 border-t border-slate-800/50" }, [
                    el('textarea', {
                        key: 'details-textarea',
                        className: "w-full bg-slate-950/50 border border-slate-800/50 rounded-xl p-3 text-xs text-slate-400 outline-none focus:border-red-500/50 focus:text-slate-200 resize-y min-h-[80px] custom-scrollbar transition-colors leading-relaxed",
                        placeholder: "Habilidades, ataques, mecânicas e descrição...",
                        value: m.details || '',
                        onChange: (e) => updateMonster(m.id, 'details', e.target.value)
                    })
                ])
            ]))
        )
    ]);
}
