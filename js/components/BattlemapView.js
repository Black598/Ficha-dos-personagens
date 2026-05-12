import { parseImageUrl } from '../utils.js';

const { useState, useRef, useEffect } = React;
const el = React.createElement;

export function BattlemapView({ mode, battlemapData, updateSessionState, onBack, allCharacters, characterName, monsters = [] }) {
    // Estado da Câmera (Pan & Zoom)
    const [camera, setCamera] = useState({ x: 0, y: 0, scale: 1 });
    const [isDraggingCanvas, setIsDraggingCanvas] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const containerRef = useRef(null);

    // Estado dos Tokens e Menus
    const [draggingToken, setDraggingToken] = useState(null);
    const [contextMenu, setContextMenu] = useState(null);

    // Estado dos Desenhos/Templates
    const [drawMode, setDrawMode] = useState(null);
    const [currentDraw, setCurrentDraw] = useState(null);
    const [drawColor, setDrawColor] = useState('#f59e0b');

    // Dados do Mapa Atual
    const maps = battlemapData?.maps || [];
    const activeMapId = battlemapData?.activeMapId || null;
    const tokens = battlemapData?.tokens || [];
    const drawings = battlemapData?.drawings || [];
    const activeMap = maps.find(m => m.id === activeMapId) || {
        imageUrl: '',
        gridSize: 50,
        offsetX: 0,
        offsetY: 0
    };

    // --- CONTROLES DA CÂMERA ---
    const handleWheel = (e) => {
        // Bloqueia rolagem padrão da página
        e.preventDefault(); 
        
        const scaleAmount = 0.1;
        const delta = e.deltaY > 0 ? -scaleAmount : scaleAmount;
        let newScale = camera.scale + delta;
        newScale = Math.max(0.2, Math.min(newScale, 5)); // Limites de zoom (20% a 500%)

        setCamera(prev => ({ ...prev, scale: newScale }));
    };

    const handleMouseDown = (e) => {
        // Botão direito do mouse OU botão do meio para arrastar o mapa
        if (e.button === 1 || e.button === 2) {
            e.preventDefault();
            setIsDraggingCanvas(true);
            setDragStart({ x: e.clientX, y: e.clientY });
        } else if (e.button === 0 && drawMode && !draggingToken) {
            const rect = containerRef.current.getBoundingClientRect();
            const worldX = (e.clientX - rect.left - rect.width/2 - camera.x) / camera.scale;
            const worldY = (e.clientY - rect.top - rect.height/2 - camera.y) / camera.scale;
            setCurrentDraw({ shape: drawMode, startX: worldX, startY: worldY, endX: worldX, endY: worldY, color: drawColor });
        }
    };

    const handleTokenMouseDown = (e, token) => {
        if (e.button !== 0) return; // Apenas botão esquerdo do mouse
        e.stopPropagation();
        if (mode !== 'master' && token.name !== characterName) return; // Só arrasta o próprio token
        setDraggingToken({ ...token, startMouseX: e.clientX, startMouseY: e.clientY, initX: token.x, initY: token.y });
    };

    const handleMouseMove = (e) => {
        if (isDraggingCanvas) {
            const dx = e.clientX - dragStart.x;
            const dy = e.clientY - dragStart.y;
            setCamera(prev => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
            setDragStart({ x: e.clientX, y: e.clientY });
        } else if (draggingToken) {
            const dx = (e.clientX - draggingToken.startMouseX) / camera.scale;
            const dy = (e.clientY - draggingToken.startMouseY) / camera.scale;
            setDraggingToken(prev => ({ ...prev, x: prev.initX + dx, y: prev.initY + dy }));
        } else if (currentDraw) {
            const rect = containerRef.current.getBoundingClientRect();
            const worldX = (e.clientX - rect.left - rect.width/2 - camera.x) / camera.scale;
            const worldY = (e.clientY - rect.top - rect.height/2 - camera.y) / camera.scale;
            setCurrentDraw(prev => ({ ...prev, endX: worldX, endY: worldY }));
        }
    };

    const handleMouseUp = (e) => {
        if (e.button === 1 || e.button === 2) {
            setIsDraggingCanvas(false);
        }
        if (draggingToken) {
            const gs = activeMap.gridSize || 50;
            // Snap to Grid (arredonda para o múltiplo de gridSize mais próximo)
            const snappedX = Math.round(draggingToken.x / gs) * gs;
            const snappedY = Math.round(draggingToken.y / gs) * gs;

            const newTokens = tokens.map(t => 
                t.id === draggingToken.id ? { ...t, x: snappedX, y: snappedY } : t
            );
            
            updateSessionState({ battlemap: { ...battlemapData, tokens: newTokens } });
            setDraggingToken(null);
        }
        if (currentDraw) {
            const newDrawings = [...drawings, { ...currentDraw, id: `draw_${Date.now()}_${Math.random().toString(36).substr(2,5)}` }];
            updateSessionState({ battlemap: { ...battlemapData, drawings: newDrawings } });
            setCurrentDraw(null);
        }
    };

    // Atrelar eventos no document para evitar que o drag quebre se sair da div
    useEffect(() => {
        const up = (e) => handleMouseUp(e);
        const move = (e) => handleMouseMove(e);
        
        if (isDraggingCanvas || draggingToken || currentDraw) {
            window.addEventListener('mouseup', up);
            window.addEventListener('mousemove', move);
        }
        
        return () => {
            window.removeEventListener('mouseup', up);
            window.removeEventListener('mousemove', move);
        };
    }, [isDraggingCanvas, draggingToken, dragStart, camera, tokens, battlemapData, activeMap, currentDraw, drawMode, drawColor]);

    // Ocultar menu de contexto padrão (clique direito) dentro do mapa
    const handleContextMenu = (e) => {
        e.preventDefault();
    };

    // --- RENDERIZAÇÃO ---
    return el('div', { 
        className: "fixed inset-0 z-[200] bg-slate-950 flex flex-col animate-fade-in text-slate-100 overflow-hidden select-none",
        onContextMenu: handleContextMenu
    }, [
        
        // --- HEADER ---
        el('header', { key: 'map-header', className: "absolute top-0 left-0 w-full z-10 p-6 flex justify-between items-center bg-gradient-to-b from-slate-950 to-transparent pointer-events-none" }, [
            el('div', { className: "flex items-center gap-6 pointer-events-auto" }, [
                el('button', {
                    onClick: onBack,
                    className: "w-12 h-12 bg-slate-900 border border-slate-700 rounded-2xl flex items-center justify-center text-xl hover:bg-slate-800 hover:border-amber-500/50 transition-all shadow-lg"
                }, "⬅️"),
                el('div', null, [
                    el('h2', { className: "text-3xl font-black italic uppercase tracking-tighter bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent drop-shadow-lg" }, "🗺️ Campo de Batalha"),
                    el('p', { className: "text-[10px] font-black text-slate-300 uppercase tracking-widest mt-1 drop-shadow" }, 
                        activeMap.name || "Nenhum mapa carregado"
                    )
                ])
            ]),

            // Controles Rápidos (Zoom, etc)
            el('div', { className: "flex gap-2 pointer-events-auto bg-slate-900/80 p-2 rounded-2xl border border-slate-800 backdrop-blur-md" }, [
                mode === 'master' && el('button', {
                    onClick: () => {
                        const url = prompt("Cole o Link (URL) da imagem do Mapa:", activeMap.imageUrl);
                        if (url !== null) {
                            const parsedUrl = parseImageUrl(url);
                            const newMap = { ...activeMap, id: activeMap.id || 'map_1', imageUrl: parsedUrl, name: 'Mapa Atual' };
                            const newMaps = maps.filter(m => m.id !== newMap.id);
                            newMaps.push(newMap);
                            updateSessionState({ 
                                battlemap: { 
                                    ...battlemapData, 
                                    activeMapId: newMap.id, 
                                    maps: newMaps 
                                } 
                            });
                        }
                    },
                    className: "px-4 py-2 hover:bg-amber-600/20 text-amber-500 rounded-xl text-xs font-bold uppercase",
                    title: "Trocar Imagem do Mapa"
                }, "🖼️ Fundo"),
                mode === 'master' && el('button', {
                    onClick: () => {
                        const size = prompt("Tamanho do Grid em pixels (Padrão: 50):", activeMap.gridSize || 50);
                        if (size !== null && !isNaN(parseInt(size))) {
                            const newMap = { ...activeMap, gridSize: parseInt(size) };
                            const newMaps = maps.map(m => m.id === newMap.id ? newMap : m);
                            updateSessionState({ 
                                battlemap: { ...battlemapData, maps: newMaps } 
                            });
                        }
                    },
                    className: "px-4 py-2 hover:bg-amber-600/20 text-amber-500 rounded-xl text-xs font-bold uppercase",
                    title: "Ajustar Tamanho do Grid"
                }, "📏 Grid"),
                mode === 'master' && el('button', {
                    onClick: () => {
                        const existingNames = tokens.map(t => t.name);
                        const playersToAdd = (allCharacters || []).filter(c => c.name.toLowerCase() !== 'mestre' && !existingNames.includes(c.name));
                        if (playersToAdd.length === 0) {
                            alert("Todos os jogadores já estão no mapa!");
                            return;
                        }
                        const gs = activeMap.gridSize || 50;
                        const newTokens = playersToAdd.map((p, idx) => ({
                            id: `token_player_${p.name}`,
                            type: 'player',
                            name: p.name,
                            imageUrl: p.sheetData?.info?.['Avatar'] || '',
                            x: (idx * gs),
                            y: 0,
                            size: 1
                        }));
                        updateSessionState({ battlemap: { ...battlemapData, tokens: [...tokens, ...newTokens] } });
                    },
                    className: "px-4 py-2 hover:bg-green-600/20 text-green-500 rounded-xl text-xs font-bold uppercase",
                    title: "Puxar todos os jogadores para o mapa"
                }, "🎲 Jogadores"),
                mode === 'master' && el('button', {
                    onClick: () => {
                        const existingNames = tokens.map(t => t.name);
                        const monstersToAdd = monsters.filter(m => !existingNames.includes(m.name));
                        if (monstersToAdd.length === 0) {
                            alert("Não há monstros ativos novos para puxar!");
                            return;
                        }
                        const gs = activeMap.gridSize || 50;
                        const newTokens = monstersToAdd.map((m, idx) => ({
                            id: `token_monster_${m.id}_${Date.now()}`,
                            type: 'monster',
                            name: m.name,
                            imageUrl: m.imageUrl || '',
                            x: (idx * gs),
                            y: gs,
                            size: 1
                        }));
                        updateSessionState({ battlemap: { ...battlemapData, tokens: [...tokens, ...newTokens] } });
                    },
                    className: "px-4 py-2 hover:bg-red-600/20 text-red-500 rounded-xl text-xs font-bold uppercase",
                    title: "Puxar Monstros do Combate Ativo"
                }, "👹 Monstros"),
                // Removido "mode === 'master' &&" para jogadores também usarem
                el('button', {
                    onClick: () => {
                        const name = prompt("Nome do NPC ou Ficha Genérica:");
                        if (!name) return;
                        const url = prompt("Link da Imagem (Opcional - Google Drive/Net):");
                        const parsedUrl = url ? parseImageUrl(url) : '';
                        const gs = activeMap.gridSize || 50;
                        const newToken = {
                            id: `token_npc_${Date.now()}_${Math.random().toString(36).substr(2,5)}`,
                            type: 'npc',
                            name: name,
                            imageUrl: parsedUrl,
                            x: 0,
                            y: gs * 2,
                            size: 1
                        };
                        updateSessionState({ battlemap: { ...battlemapData, tokens: [...tokens, newToken] } });
                    },
                    className: "px-4 py-2 hover:bg-purple-600/20 text-purple-500 rounded-xl text-xs font-bold uppercase",
                    title: "Adicionar Token Genérico"
                }, "➕ Token"),
                
                // Ferramentas de Desenho (Apenas quando no mapa)
                el('div', { className: "w-px bg-slate-800 mx-1" }), // Separator
                el('div', { className: "flex items-center gap-1 bg-slate-950 p-1 rounded-xl" }, [
                    el('button', {
                        onClick: () => setDrawMode(drawMode === 'cone' ? null : 'cone'),
                        className: `w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${drawMode === 'cone' ? 'bg-amber-500 text-slate-900' : 'text-slate-400 hover:bg-slate-800'}`,
                        title: "Cone (Arrastar)"
                    }, "📐"),
                    el('button', {
                        onClick: () => setDrawMode(drawMode === 'line' ? null : 'line'),
                        className: `w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${drawMode === 'line' ? 'bg-amber-500 text-slate-900' : 'text-slate-400 hover:bg-slate-800'}`,
                        title: "Linha (Arrastar)"
                    }, "➖"),
                    el('button', {
                        onClick: () => setDrawMode(drawMode === 'circle' ? null : 'circle'),
                        className: `w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${drawMode === 'circle' ? 'bg-amber-500 text-slate-900' : 'text-slate-400 hover:bg-slate-800'}`,
                        title: "Círculo/Raio (Arrastar)"
                    }, "⭕"),
                    el('input', {
                        type: 'color',
                        value: drawColor,
                        onChange: (e) => setDrawColor(e.target.value),
                        className: "w-6 h-6 ml-1 bg-transparent cursor-pointer rounded-full overflow-hidden border-0 p-0"
                    })
                ]),
                mode === 'master' && el('button', {
                    onClick: () => {
                        if (confirm("Limpar TODOS os desenhos/magias?")) {
                            updateSessionState({ battlemap: { ...battlemapData, drawings: [] } });
                        }
                    },
                    className: "px-4 py-2 hover:bg-red-600/20 text-red-500 rounded-xl text-xs font-bold uppercase",
                    title: "Limpar todos os desenhos"
                }, "🧹 Limpar Desenhos"),
                mode === 'master' && el('button', {
                    onClick: () => {
                        if (confirm("Tem certeza que deseja limpar TODOS os tokens do mapa?")) {
                            updateSessionState({ battlemap: { ...battlemapData, tokens: [] } });
                        }
                    },
                    className: "px-4 py-2 hover:bg-slate-700/50 text-slate-400 rounded-xl text-xs font-bold uppercase",
                    title: "Remover todos os tokens do mapa"
                }, "🗑️ Limpar Tokens"),
                el('div', { className: "w-px bg-slate-800 mx-1" }), // Separator
                el('button', { onClick: () => setCamera({ x: 0, y: 0, scale: 1 }), className: "px-4 py-2 hover:bg-white/10 rounded-xl text-xs font-bold uppercase", title: "Centralizar Câmera" }, "🎯 Centro"),
                el('span', { className: "px-4 py-2 text-xs font-bold text-slate-500" }, `${Math.round(camera.scale * 100)}%`)
            ])
        ]),

        // --- ÁREA DO CANVAS (Mundo) ---
        el('div', {
            key: 'canvas-container',
            ref: containerRef,
            className: `w-full h-full relative outline-none ${isDraggingCanvas ? 'cursor-grabbing' : 'cursor-grab'} overflow-hidden`,
            onMouseDown: handleMouseDown,
            onWheel: handleWheel
        }, [
            // A "Câmera" aplica a transformação
            el('div', {
                key: 'camera',
                className: "absolute top-1/2 left-1/2 origin-center", // Removido will-change-transform para o navegador re-renderizar em alta resolução
                style: {
                    transform: `translate(calc(-50% + ${camera.x}px), calc(-50% + ${camera.y}px)) scale(${camera.scale})`
                }
            }, [
                // Mapa (Fundo)
                activeMap.imageUrl ? el('img', {
                    key: 'map-image',
                    src: activeMap.imageUrl,
                    className: "block pointer-events-none",
                    style: { filter: 'drop-shadow(0 0 50px rgba(0,0,0,0.5))' },
                    alt: "Mapa"
                }) : el('div', { className: "w-[800px] h-[600px] bg-slate-900 border-4 border-dashed border-slate-800 flex items-center justify-center rounded-[3rem]" }, [
                    el('span', { className: "text-slate-700 font-black text-2xl uppercase tracking-widest" }, "Vazio")
                ]),

                // Malha do Grid (Sobreposta)
                activeMap.imageUrl && activeMap.gridSize > 0 && el('div', {
                    key: 'grid-overlay',
                    className: "absolute inset-0 pointer-events-none",
                    style: {
                        backgroundImage: `linear-gradient(to right, rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.1) 1px, transparent 1px)`,
                        backgroundSize: `${activeMap.gridSize}px ${activeMap.gridSize}px`,
                        backgroundPosition: `${activeMap.offsetX}px ${activeMap.offsetY}px`
                    }
                }),

                // --- EFEITOS E DESENHOS ---
                [...drawings, currentDraw].filter(Boolean).map(d => {
                    const dx = d.endX - d.startX;
                    const dy = d.endY - d.startY;
                    const distance = Math.sqrt(dx*dx + dy*dy);
                    const angle = Math.atan2(dy, dx) * 180 / Math.PI;

                    if (d.shape === 'circle') {
                        return el('div', {
                            key: d.id || 'current',
                            className: "absolute rounded-full border-[3px] opacity-60 bg-white/10 pointer-events-none",
                            style: {
                                left: `${d.startX}px`,
                                top: `${d.startY}px`,
                                width: `${distance * 2}px`,
                                height: `${distance * 2}px`,
                                transform: 'translate(-50%, -50%)',
                                borderColor: d.color || '#f59e0b',
                                backgroundColor: d.color ? `${d.color}33` : undefined // 20% opacity
                            }
                        });
                    }
                    if (d.shape === 'line') {
                        return el('div', {
                            key: d.id || 'current',
                            className: "absolute origin-left opacity-80 pointer-events-none rounded-full",
                            style: {
                                left: `${d.startX}px`,
                                top: `${d.startY}px`,
                                width: `${distance}px`,
                                height: `${Math.max(10, (activeMap.gridSize || 50) / 2)}px`,
                                transform: `translateY(-50%) rotate(${angle}deg)`,
                                backgroundColor: d.color || '#f59e0b',
                                boxShadow: `0 0 15px ${d.color || '#f59e0b'}`
                            }
                        });
                    }
                    if (d.shape === 'cone') {
                        return el('div', {
                            key: d.id || 'current',
                            className: "absolute origin-left opacity-50 pointer-events-none",
                            style: {
                                left: `${d.startX}px`,
                                top: `${d.startY}px`,
                                width: `${distance}px`,
                                height: `${distance}px`,
                                transform: `translateY(-50%) rotate(${angle}deg)`,
                                clipPath: 'polygon(0 50%, 100% 0, 100% 100%)',
                                backgroundColor: d.color || '#f59e0b'
                            }
                        });
                    }
                }),

                // Tokens
                tokens.map(t => {
                    const isDraggingThis = draggingToken && draggingToken.id === t.id;
                    const renderToken = isDraggingThis ? draggingToken : t;
                    const gs = activeMap.gridSize || 50;

                    return el('div', {
                        key: t.id,
                        className: `absolute group ${isDraggingThis ? 'z-50' : 'z-10'}`,
                        style: {
                            left: `${renderToken.x}px`,
                            top: `${renderToken.y}px`,
                            width: `${gs * (t.size || 1)}px`,
                            height: `${gs * (t.size || 1)}px`,
                        }
                    }, [
                        // Aura (renderizada atrás do token, ancorada no centro)
                        (t.auraRadius > 0) && el('div', {
                            key: 'aura',
                            className: "absolute rounded-full pointer-events-none opacity-30 animate-pulse-soft border-2",
                            style: {
                                width: `${t.auraRadius * gs * 2 + (gs * (t.size || 1))}px`,
                                height: `${t.auraRadius * gs * 2 + (gs * (t.size || 1))}px`,
                                top: '50%',
                                left: '50%',
                                transform: 'translate(-50%, -50%)',
                                backgroundColor: t.auraColor || '#3b82f6',
                                borderColor: t.auraColor || '#3b82f6',
                                zIndex: -1
                            }
                        }),

                        el('div', {
                            key: 'token-img-container',
                            onMouseDown: (e) => handleTokenMouseDown(e, t),
                            onContextMenu: (e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                if (mode === 'master' || t.name === characterName) {
                                    setContextMenu({ token: t, x: e.clientX, y: e.clientY });
                                }
                            },
                            className: `w-full h-full rounded-full border-2 border-white/20 shadow-2xl overflow-hidden cursor-pointer hover:border-amber-500 hover:scale-105 transition-transform ${isDraggingThis ? 'border-amber-500 shadow-[0_0_30px_rgba(245,158,11,0.5)]' : ''}`
                        }, [
                            renderToken.imageUrl ? 
                                el('img', { src: renderToken.imageUrl, className: "w-full h-full object-cover pointer-events-none" }) : 
                                el('div', { className: "w-full h-full bg-slate-800 flex items-center justify-center pointer-events-none" }, el('span', { className: "text-[10px] font-black uppercase text-slate-400" }, renderToken.name.substring(0,2)))
                        ])
                    ]);
                })
            ])
        ]),

        // --- CONTEXT MENU OVERLAY (Configuração de Token) ---
        contextMenu && el('div', {
            key: 'context-menu-overlay',
            className: "fixed inset-0 z-[500]",
            onClick: () => setContextMenu(null),
            onContextMenu: (e) => { e.preventDefault(); setContextMenu(null); }
        }, [
            el('div', {
                className: "absolute bg-slate-900/95 backdrop-blur-md border border-amber-500/50 rounded-2xl p-5 shadow-[0_0_50px_rgba(0,0,0,0.8)] flex flex-col gap-4 w-72 animate-slide-up",
                style: { 
                    // Garante que o menu não saia da tela
                    top: Math.min(contextMenu.y, window.innerHeight - 250), 
                    left: Math.min(contextMenu.x, window.innerWidth - 300) 
                },
                onClick: (e) => e.stopPropagation()
            }, [
                el('h3', { className: "text-xs font-black uppercase text-amber-500 tracking-widest border-b border-slate-800 pb-2 flex justify-between" }, [
                    "⚙️ Configurar Token",
                    el('button', { onClick: () => setContextMenu(null), className: "text-slate-500 hover:text-white" }, "×")
                ]),
                
                // Tamanho
                el('div', { className: "flex justify-between items-center" }, [
                    el('span', { className: "text-xs font-bold text-slate-300" }, "Multiplicador de Tamanho:"),
                    el('input', {
                        type: "number",
                        min: 0.5, step: 0.5,
                        defaultValue: contextMenu.token.size || 1,
                        className: "w-16 bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white text-center font-bold focus:border-amber-500 outline-none",
                        onBlur: (e) => {
                            const val = parseFloat(e.target.value);
                            if (val > 0) {
                                const newTokens = tokens.map(tok => tok.id === contextMenu.token.id ? { ...tok, size: val } : tok);
                                updateSessionState({ battlemap: { ...battlemapData, tokens: newTokens } });
                            }
                        }
                    })
                ]),

                // Aura (Raio)
                el('div', { className: "flex justify-between items-center" }, [
                    el('span', { className: "text-xs font-bold text-slate-300" }, "Raio da Aura (Quadrados):"),
                    el('input', {
                        type: "number",
                        min: 0, step: 1,
                        defaultValue: contextMenu.token.auraRadius || 0,
                        className: "w-16 bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white text-center font-bold focus:border-purple-500 outline-none",
                        onBlur: (e) => {
                            const val = parseFloat(e.target.value);
                            const newTokens = tokens.map(tok => tok.id === contextMenu.token.id ? { ...tok, auraRadius: val } : tok);
                            updateSessionState({ battlemap: { ...battlemapData, tokens: newTokens } });
                        }
                    })
                ]),

                // Aura (Cor)
                el('div', { className: "flex justify-between items-center" }, [
                    el('span', { className: "text-xs font-bold text-slate-300" }, "Cor da Aura:"),
                    el('input', {
                        type: "color",
                        defaultValue: contextMenu.token.auraColor || "#3b82f6",
                        className: "w-12 h-8 bg-slate-950 border border-slate-700 rounded cursor-pointer",
                        onBlur: (e) => {
                            const val = e.target.value;
                            const newTokens = tokens.map(tok => tok.id === contextMenu.token.id ? { ...tok, auraColor: val } : tok);
                            updateSessionState({ battlemap: { ...battlemapData, tokens: newTokens } });
                        }
                    })
                ]),

                // Botão Deletar Token
                el('button', {
                    onClick: () => {
                        const newTokens = tokens.filter(tok => tok.id !== contextMenu.token.id);
                        updateSessionState({ battlemap: { ...battlemapData, tokens: newTokens } });
                        setContextMenu(null);
                    },
                    className: "mt-2 w-full bg-red-900/40 hover:bg-red-600 text-red-400 hover:text-white text-xs font-bold py-2 rounded-lg transition-colors border border-red-500/30 flex justify-center items-center gap-2"
                }, ["🗑️", "Remover do Mapa"])
            ])
        ])
    ]);
}
