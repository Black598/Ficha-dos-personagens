import { parseImageUrl } from '../utils.js';

const { useState, useRef, useEffect } = React;
const el = React.createElement;

export function BattlemapView({ mode, battlemapData, updateSessionState, onBack, allCharacters, characterName, monsters = [], libraryData = {}, turnState, advanceTurn }) {
    // Expandimos a lista de monstros para incluir o bestiário da biblioteca
    const bestiary = libraryData.bestiary || [];
    const allAvailableNPCs = [...monsters, ...bestiary];

    // Estado da Câmera (Pan & Zoom)
    const [camera, setCamera] = useState({ x: 0, y: 0, scale: 1 });
    const [isDraggingCanvas, setIsDraggingCanvas] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const containerRef = useRef(null);
    const cameraRef = useRef(null);

    // Estado dos Tokens e Menus
    const [draggingToken, setDraggingToken] = useState(null);
    const [contextMenu, setContextMenu] = useState(null);

    // Estado dos Desenhos/Templates
    const [drawMode, setDrawMode] = useState(null);
    const [currentDraw, setCurrentDraw] = useState(null);
    const [drawColor, setDrawColor] = useState('#f59e0b');
    const [pings, setPings] = useState([]);

    const [isMapLibraryOpen, setIsMapLibraryOpen] = useState(false);
    const [isFogMode, setIsFogMode] = useState(false);
    const [fogBrushType, setFogBrushType] = useState('hide'); // 'hide' ou 'reveal'

    const STATUS_ICONS = {
        'burning': '🔥',
        'poisoned': '🤢',
        'stunned': '💫',
        'frozen': '❄️',
        'bleeding': '🩸',
        'blessed': '✨',
        'shielded': '🛡️',
        'dead': '💀'
    };

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
        
        const rect = containerRef.current.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        // Coordenadas relativas ao centro do container
        const ox = mouseX - rect.width / 2;
        const oy = mouseY - rect.height / 2;

        const scaleAmount = 0.15;
        const delta = e.deltaY > 0 ? -scaleAmount : scaleAmount;
        let newScale = camera.scale + delta;
        newScale = Math.max(0.1, Math.min(newScale, 10)); // Limites de zoom expandidos (10% a 1000%)

        // Calcula a posição do mundo sob o mouse ANTES do zoom
        const worldX = (ox - camera.x) / camera.scale;
        const worldY = (oy - camera.y) / camera.scale;

        // Ajusta a câmera para que a mesma posição do mundo continue sob o mouse DEPOIS do zoom
        const newX = ox - worldX * newScale;
        const newY = oy - worldY * newScale;

        setCamera({ x: newX, y: newY, scale: newScale });
    };

    const handlePointerDown = (e) => {
        const isTouch = e.pointerType === 'touch';
        // Botão direito/meio do mouse OU toque na tela para arrastar o mapa
        if (e.button === 1 || e.button === 2 || (isTouch && !drawMode && !draggingToken)) {
            setIsDraggingCanvas(true);
            setDragStart({ x: e.clientX, y: e.clientY });
        } else if (e.button === 0 && drawMode && !draggingToken) {
            const rect = cameraRef.current.getBoundingClientRect();
            const worldX = (e.clientX - rect.left) / camera.scale;
            const worldY = (e.clientY - rect.top) / camera.scale;
            setCurrentDraw({ shape: drawMode, startX: worldX, startY: worldY, endX: worldX, endY: worldY, color: drawColor });
        }
    };

    const handleTokenPointerDown = (e, token) => {
        if (e.button !== 0) return; // Apenas botão principal (esquerdo) ou toque
        e.stopPropagation();
        if (mode !== 'master' && token.name !== characterName && token.createdBy !== characterName) return; // Só arrasta o próprio token ou o que criou
        
        // Bloqueio de Turno (Apenas para Jogadores)
        if (mode !== 'master' && turnState?.activeChar && turnState.activeChar !== characterName) {
            alert(`Aguarde sua vez! É o turno de ${turnState.activeChar}.`);
            return;
        }
        
        if (e.target.setPointerCapture) {
            try { e.target.setPointerCapture(e.pointerId); } catch(err) {}
        }
        
        setDraggingToken({ ...token, startMouseX: e.clientX, startMouseY: e.clientY, initX: token.x, initY: token.y, pointerId: e.pointerId });
    };

    const handlePointerMove = (e) => {
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
            const rect = cameraRef.current.getBoundingClientRect();
            const worldX = (e.clientX - rect.left) / camera.scale;
            const worldY = (e.clientY - rect.top) / camera.scale;
            setCurrentDraw(prev => ({ ...prev, endX: worldX, endY: worldY }));
        } else if (isFogMode && mode === 'master' && e.buttons === 1) {
            // Pintar Névoa
            const rect = cameraRef.current.getBoundingClientRect();
            const worldX = (e.clientX - rect.left) / camera.scale;
            const worldY = (e.clientY - rect.top) / camera.scale;
            const gs = activeMap.gridSize || 50;
            const gx = Math.floor(worldX / gs);
            const gy = Math.floor(worldY / gs);
            const key = `${gx},${gy}`;
            
            let newFog = [...(battlemapData.fog || [])];
            if (fogBrushType === 'hide' && !newFog.includes(key)) {
                newFog.push(key);
                updateSessionState({ battlemap: { ...battlemapData, fog: newFog } });
            } else if (fogBrushType === 'reveal' && newFog.includes(key)) {
                newFog = newFog.filter(f => f !== key);
                updateSessionState({ battlemap: { ...battlemapData, fog: newFog } });
            }
        }
    };

    const handlePointerUp = (e) => {
        if (draggingToken && e.target.releasePointerCapture) {
            try { e.target.releasePointerCapture(e.pointerId); } catch(err) {}
        }

        if (isDraggingCanvas) {
            setIsDraggingCanvas(false);
        } else if (draggingToken) {
            const gs = activeMap.gridSize || 50;
            // Snap to Grid (arredonda para o múltiplo de gridSize mais próximo)
            const snappedX = Math.round(draggingToken.x / gs) * gs;
            const snappedY = Math.round(draggingToken.y / gs) * gs;

            const newTokens = tokens.map(t => 
                t.id === draggingToken.id ? { ...t, x: snappedX, y: snappedY } : t
            );
            
            updateSessionState({ battlemap: { ...battlemapData, tokens: newTokens } });
            setDraggingToken(null);
        } else if (currentDraw) {
            if (currentDraw.shape === 'wall') {
                const newWalls = [...(battlemapData.walls || []), { ...currentDraw, id: `wall_${Date.now()}_${Math.random().toString(36).substr(2,5)}` }];
                updateSessionState({ battlemap: { ...battlemapData, walls: newWalls } });
            } else {
                const newDrawings = [...drawings, { ...currentDraw, id: `draw_${Date.now()}_${Math.random().toString(36).substr(2,5)}` }];
                updateSessionState({ battlemap: { ...battlemapData, drawings: newDrawings } });
            }
            setCurrentDraw(null);
        } else if (e.altKey) {
            const rect = cameraRef.current.getBoundingClientRect();
            const worldX = (e.clientX - rect.left) / camera.scale;
            const worldY = (e.clientY - rect.top) / camera.scale;
            const newPing = { id: Date.now(), x: worldX, y: worldY, sender: characterName };
            const activePings = (battlemapData?.pings || []).filter(p => Date.now() - p.id < 3000);
            updateSessionState({ battlemap: { ...battlemapData, pings: [...activePings, newPing] } });
        }
    };

    // Auto-limpeza de pings locais
    useEffect(() => {
        const interval = setInterval(() => {
            const now = Date.now();
            const hasOldPings = (battlemapData?.pings || []).some(p => now - p.id > 3000);
            if (hasOldPings) {
                const activePings = (battlemapData?.pings || []).filter(p => now - p.id < 3000);
                updateSessionState({ battlemap: { ...battlemapData, pings: activePings } });
            }
        }, 1000);
        return () => clearInterval(interval);
    }, [battlemapData?.pings]);

    // Atrelar eventos no document para evitar que o drag quebre se sair da div
    useEffect(() => {
        const up = (e) => handlePointerUp(e);
        const move = (e) => handlePointerMove(e);
        
        if (isDraggingCanvas || draggingToken || currentDraw) {
            window.addEventListener('pointerup', up);
            window.addEventListener('pointermove', move);
        }
        
        return () => {
            window.removeEventListener('pointerup', up);
            window.removeEventListener('pointermove', move);
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
                        const currentOrder = turnState?.initiativeOrder || [];
                        if (currentOrder.length === 0) {
                            alert("A iniciativa está vazia. Adicione jogadores na tela do Mestre primeiro.");
                            return;
                        }
                        const activeIndex = currentOrder.findIndex(c => c.name === turnState.activeChar);
                        let nextIndex = activeIndex + 1;
                        if (nextIndex >= currentOrder.length || activeIndex === -1) {
                            nextIndex = 0;
                            // Se cruzou o fim, avança o round
                            updateSessionState({ turnState: { ...turnState, round: (turnState?.round || 1) + 1 } });
                        }
                        
                        if (advanceTurn) {
                            advanceTurn(currentOrder[nextIndex].name);
                        } else {
                            updateSessionState({ turnState: { ...turnState, activeChar: currentOrder[nextIndex].name } });
                        }
                    },
                    className: "px-4 py-2 hover:bg-emerald-600/20 text-emerald-500 rounded-xl text-xs font-bold uppercase border-r border-slate-700",
                    title: "Passar a vez no Combate"
                }, "▶️ Próximo Turno"),
                
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
                    onClick: () => setIsMapLibraryOpen(true),
                    className: "px-4 py-2 hover:bg-indigo-600/20 text-indigo-400 rounded-xl text-xs font-bold uppercase flex items-center gap-2",
                    title: "Gerenciar Biblioteca de Mapas"
                }, ["🗺️", "Mapas"]),
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
                        const monsterName = prompt("Digite o nome do monstro ou NPC (Biblioteca/Bestiário) para puxar:");
                        const gs = activeMap.gridSize || 50;
                        
                        if (monsterName) {
                            const m = allAvailableNPCs.find(mon => mon.name.toLowerCase().includes(monsterName.toLowerCase()));
                            if (m) {
                                const newToken = {
                                    id: `token_monster_${m.id || Date.now()}_${Math.random().toString(36).substr(2,5)}`,
                                    type: 'monster',
                                    name: m.name,
                                    imageUrl: m.imageUrl || '',
                                    x: 0, y: 0, size: 1,
                                    createdBy: characterName
                                };
                                updateSessionState({ battlemap: { ...battlemapData, tokens: [...tokens, newToken] } });
                            } else {
                                alert("NPC/Monstro não encontrado na biblioteca!");
                            }
                        } else {
                            const existingNames = tokens.map(t => t.name);
                            const monstersToAdd = monsters.filter(m => !existingNames.includes(m.name));
                            if (monstersToAdd.length === 0) {
                                alert("Não há monstros ativos novos para puxar!");
                                return;
                            }
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
                        }
                    },
                    className: "px-4 py-2 hover:bg-red-600/20 text-red-500 rounded-xl text-xs font-bold uppercase",
                    title: "Puxar Monstros/NPCs da Biblioteca"
                }, "👹 Biblioteca"),
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
                            size: 1,
                            createdBy: characterName
                        };
                        updateSessionState({ battlemap: { ...battlemapData, tokens: [...tokens, newToken] } });
                    },
                    className: "px-4 py-2 hover:bg-purple-600/20 text-purple-500 rounded-xl text-xs font-bold uppercase",
                    title: "Adicionar Token Genérico"
                }, "➕ Token"),

                el('button', {
                    onClick: () => {
                        const propName = prompt("O que você deseja adicionar? (Ex: barril, mesa, fogueira, árvore)");
                        if (!propName) return;
                        
                        // Busca simplificada de assets (usando placeholder ou link de assets RPG)
                        // Em uma versão real, isso poderia buscar em uma API de assets
                        const url = prompt(`Link da imagem para "${propName}" (ou deixe em branco para buscar padrão):`);
                        const gs = activeMap.gridSize || 50;
                        
                        const newToken = {
                            id: `prop_${Date.now()}_${Math.random().toString(36).substr(2,5)}`,
                            type: 'prop',
                            name: propName,
                            imageUrl: url || `https://api.dicebear.com/7.x/initials/svg?seed=${propName}&backgroundColor=71717a`,
                            x: 0,
                            y: gs * 3,
                            size: 1,
                            createdBy: characterName
                        };
                        updateSessionState({ battlemap: { ...battlemapData, tokens: [...tokens, newToken] } });
                    },
                    className: "px-4 py-2 hover:bg-stone-600/20 text-stone-400 rounded-xl text-xs font-bold uppercase",
                    title: "Adicionar Objeto/Prop ao Mapa"
                }, "📦 Props"),
                
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
                    mode === 'master' && el('button', {
                        onClick: () => setDrawMode(drawMode === 'wall' ? null : 'wall'),
                        className: `w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${drawMode === 'wall' ? 'bg-blue-500 text-white' : 'text-blue-400 hover:bg-blue-900/50'}`,
                        title: "Parede (Bloqueia Visão - Arrastar)"
                    }, "🧱"),
                    el('input', {
                        type: 'color',
                        value: drawColor,
                        onChange: (e) => setDrawColor(e.target.value),
                        className: "w-6 h-6 ml-1 bg-transparent cursor-pointer rounded-full overflow-hidden border-0 p-0"
                    }),
                    el('button', {
                        onClick: () => {
                            if (drawings.length > 0) {
                                const newDrawings = [...drawings];
                                newDrawings.pop();
                                updateSessionState({ battlemap: { ...battlemapData, drawings: newDrawings } });
                            }
                        },
                        className: `w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800 transition-colors`,
                        title: "Desfazer último desenho"
                    }, "↩️")
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
                        if (confirm("Limpar TODAS as paredes?")) {
                            updateSessionState({ battlemap: { ...battlemapData, walls: [] } });
                        }
                    },
                    className: "px-2 py-2 hover:bg-blue-600/20 text-blue-500 rounded-xl text-xs font-bold uppercase",
                    title: "Limpar Paredes"
                }, "🧱×"),
                
                mode === 'master' && el('div', { className: "flex items-center gap-1 bg-slate-950 p-1 rounded-xl" }, [
                    el('button', {
                        onClick: () => setIsFogMode(!isFogMode),
                        className: `px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${isFogMode ? 'bg-indigo-500 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800'}`,
                        title: "Ativar Modo Névoa (Pintar)"
                    }, "🌬️ Névoa"),
                    isFogMode && el('button', {
                        onClick: () => setFogBrushType('hide'),
                        className: `w-8 h-8 flex items-center justify-center rounded-lg ${fogBrushType === 'hide' ? 'bg-slate-700 text-white' : 'text-slate-500 hover:bg-slate-800'}`,
                        title: "Esconder Área"
                    }, "🌑"),
                    isFogMode && el('button', {
                        onClick: () => setFogBrushType('reveal'),
                        className: `w-8 h-8 flex items-center justify-center rounded-lg ${fogBrushType === 'reveal' ? 'bg-slate-700 text-white' : 'text-slate-500 hover:bg-slate-800'}`,
                        title: "Revelar Área"
                    }, "👁️"),
                    isFogMode && el('button', {
                        onClick: () => {
                            if (confirm("Cobrir TODO o mapa com névoa?")) {
                                // Cria uma névoa densa (ex: 50x50 cells)
                                const denseFog = [];
                                for(let x=-10; x<60; x++) {
                                    for(let y=-10; y<60; y++) denseFog.push(`${x},${y}`);
                                }
                                updateSessionState({ battlemap: { ...battlemapData, fog: denseFog } });
                            }
                        },
                        className: `w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800`,
                        title: "Cobrir Tudo"
                    }, "⬛"),
                    isFogMode && el('button', {
                        onClick: () => {
                            if (confirm("Revelar TODO o mapa (Remover toda a névoa)?")) {
                                updateSessionState({ battlemap: { ...battlemapData, fog: [] } });
                            }
                        },
                        className: `w-8 h-8 flex items-center justify-center rounded-lg text-red-500 hover:bg-red-500/10`,
                        title: "Limpar Névoa"
                    }, "🗑️")
                ]),
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
                el('button', { onClick: () => setCamera(prev => ({ ...prev, scale: Math.max(0.1, prev.scale - 0.2) })), className: "px-3 py-2 hover:bg-white/10 rounded-xl text-xs font-bold", title: "Afastar (-)" }, "➖"),
                el('button', { onClick: () => setCamera(prev => ({ ...prev, scale: Math.min(10, prev.scale + 0.2) })), className: "px-3 py-2 hover:bg-white/10 rounded-xl text-xs font-bold", title: "Aproximar (+)" }, "➕"),
                el('button', { onClick: () => setCamera({ x: 0, y: 0, scale: 1 }), className: "px-4 py-2 hover:bg-white/10 rounded-xl text-xs font-bold uppercase", title: "Centralizar Câmera" }, "🎯 Centro"),
                el('span', { className: "px-4 py-2 text-xs font-bold text-slate-500 min-w-[3rem] text-center" }, `${Math.round(camera.scale * 100)}%`)
            ])
        ]),

        // --- ÁREA DO CANVAS (Mundo) ---
        el('div', {
            key: 'canvas-container',
            ref: containerRef,
            // touch-none é vital para mobile para não rolar a página enquanto arrasta
            className: `w-full h-full relative outline-none ${isDraggingCanvas ? 'cursor-grabbing' : 'cursor-grab'} overflow-hidden touch-none`,
            onPointerDown: handlePointerDown,
            onWheel: handleWheel
        }, [
            // A "Câmera" aplica a transformação
            el('div', {
                key: 'camera',
                ref: cameraRef,
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
                    style: { 
                        filter: 'drop-shadow(0 0 50px rgba(0,0,0,0.5))',
                        maxWidth: 'none', // Importante: Impede que o Tailwind/Mobile redimensione o mapa
                        width: 'auto'
                    },
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

                // Paredes (Apenas Master ou levemente visível)
                [...(battlemapData.walls || []), currentDraw?.shape === 'wall' ? currentDraw : null].filter(Boolean).map(w => {
                    const dx = w.endX - w.startX;
                    const dy = w.endY - w.startY;
                    const distance = Math.sqrt(dx*dx + dy*dy);
                    const angle = Math.atan2(dy, dx) * 180 / Math.PI;
                    
                    if (mode !== 'master' && w.id) return null; // Jogador não vê as linhas de parede
                    
                    return el('div', {
                        key: w.id || 'current_wall',
                        className: "absolute origin-left pointer-events-none rounded-full z-40",
                        style: {
                            left: `${w.startX}px`,
                            top: `${w.startY}px`,
                            width: `${distance}px`,
                            height: `6px`,
                            transform: `translateY(-50%) rotate(${angle}deg)`,
                            backgroundColor: '#3b82f6', // Blue for master
                            boxShadow: '0 0 10px #3b82f6',
                            opacity: 0.8
                        }
                    });
                }),

                // Tokens
                [...tokens].sort((a, b) => {
                    if (mode === 'master') return 0;
                    const aIsMine = a.name === characterName || a.createdBy === characterName;
                    const bIsMine = b.name === characterName || b.createdBy === characterName;
                    if (aIsMine && !bIsMine) return 1; // Coloca pro final (renderiza por cima)
                    if (!aIsMine && bIsMine) return -1;
                    return 0;
                }).map(t => {
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
                            onPointerDown: (e) => handleTokenPointerDown(e, t),
                            onContextMenu: (e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                if (mode === 'master' || t.name === characterName || t.createdBy === characterName) {
                                    setContextMenu({ token: t, x: e.clientX, y: e.clientY });
                                }
                            },
                            className: `w-full h-full rounded-full border-2 border-white/20 shadow-2xl overflow-hidden cursor-pointer hover:border-amber-500 hover:scale-105 transition-transform ${isDraggingThis ? 'border-amber-500 shadow-[0_0_30px_rgba(245,158,11,0.5)]' : ''}`
                        }, [
                            renderToken.imageUrl ? 
                                el('img', { src: renderToken.imageUrl, className: "w-full h-full object-cover pointer-events-none" }) : 
                                el('div', { className: "w-full h-full bg-slate-800 flex items-center justify-center pointer-events-none" }, el('span', { className: "text-[10px] font-black uppercase text-slate-400" }, renderToken.name.substring(0,2)))
                        ]),

                        // Marcadores de Status
                        el('div', {
                            key: 'status-markers',
                            className: "absolute top-0 right-0 flex flex-wrap-reverse gap-0.5 justify-end pointer-events-none z-20"
                        }, (t.status || []).map(s => el('span', { 
                            key: s, 
                            className: "text-lg drop-shadow-md animate-bounce-soft",
                            style: { animationDelay: `${Math.random()}s` }
                        }, STATUS_ICONS[s] || '❓')))
                    ]);
                }),

                // Névoa de Guerra (Layer)
                (battlemapData.fog || []).map(key => {
                    const [gx, gy] = key.split(',').map(Number);
                    const gs = activeMap.gridSize || 50;
                    
                    // Lógica de Visão Dinâmica: Esconder névoa perto de jogadores
                    const centerX = (gx * gs) + (gs / 2);
                    const centerY = (gy * gs) + (gs / 2);
                    
                    const walls = battlemapData.walls || [];
                    
                    // Helper para intersecção de segmentos
                    const intersect = (x1,y1, x2,y2, x3,y3, x4,y4) => {
                        const den = (x1-x2)*(y3-y4) - (y1-y2)*(x3-x4);
                        if(den === 0) return false;
                        const t = ((x1-x3)*(y3-y4) - (y1-y3)*(x3-x4)) / den;
                        const u = -((x1-x2)*(y1-y3) - (y1-y2)*(x1-x3)) / den;
                        return t > 0 && t < 1 && u > 0 && u < 1;
                    };
                    
                    const isRevealedByVision = tokens.some(t => {
                        if (t.type !== 'player') return false;
                        const tx = t.x + (gs * (t.size || 1) / 2);
                        const ty = t.y + (gs * (t.size || 1) / 2);
                        const dist = Math.sqrt(Math.pow(centerX - tx, 2) + Math.pow(centerY - ty, 2));
                        const visionRange = (t.visionRadius || 3) * gs; // Padrão 3 quadrados
                        if (dist >= visionRange) return false;
                        
                        // Verificar colisão com paredes (LoS)
                        const hitWall = walls.some(w => intersect(tx, ty, centerX, centerY, w.startX, w.startY, w.endX, w.endY));
                        return !hitWall;
                    });

                    if (isRevealedByVision && mode !== 'master') return null;

                    return el('div', {
                        key: `fog-${key}`,
                        className: "absolute pointer-events-none transition-opacity duration-300",
                        style: {
                            left: `${gx * gs}px`,
                            top: `${gy * gs}px`,
                            width: `${gs + 0.8}px`,
                            height: `${gs + 0.8}px`,
                            backgroundColor: '#000000',
                            zIndex: 90,
                            opacity: isRevealedByVision ? 0.1 : (mode === 'master' ? 0.5 : 1.0)
                        }
                    });
                }),

                // Pings
                (battlemapData?.pings || []).map(p => el('div', {
                    key: p.id,
                    className: "absolute pointer-events-none z-[100]",
                    style: { left: `${p.x}px`, top: `${p.y}px` }
                }, [
                    el('div', { className: "w-10 h-10 -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-amber-500 animate-ping-strong" }),
                    el('div', { className: "absolute top-6 left-0 -translate-x-1/2 bg-amber-500 text-slate-900 text-[8px] font-black px-1.5 py-0.5 rounded uppercase whitespace-nowrap shadow-lg" }, p.sender)
                ]))
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
                
                (() => {
                    const t = contextMenu.token;
                    const canEdit = mode === 'master' || t.name === characterName || t.createdBy === characterName;
                    
                    return el(React.Fragment, null, [
                        // Tamanho
                        el('div', { className: "flex justify-between items-center opacity-80" }, [
                            el('span', { className: "text-[10px] font-black uppercase text-slate-400 tracking-widest" }, "📏 Tamanho:"),
                            canEdit ? el('input', {
                                type: "number",
                                min: 0.5, step: 0.5,
                                defaultValue: t.size || 1,
                                className: "w-16 bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white text-center font-bold focus:border-amber-500 outline-none",
                                onBlur: (e) => {
                                    const val = parseFloat(e.target.value);
                                    if (val > 0) {
                                        const newTokens = tokens.map(tok => tok.id === t.id ? { ...tok, size: val } : tok);
                                        updateSessionState({ battlemap: { ...battlemapData, tokens: newTokens } });
                                    }
                                }
                            }) : el('span', { className: "text-amber-500 font-bold" }, `${t.size || 1}x`)
                        ]),

                        // Visão (NOVO)
                        el('div', { className: "flex justify-between items-center opacity-80" }, [
                            el('span', { className: "text-[10px] font-black uppercase text-slate-400 tracking-widest" }, "👁️ Visão (sqr):"),
                            canEdit ? el('input', {
                                type: "number",
                                min: 0, step: 1,
                                defaultValue: t.visionRadius || 3,
                                className: "w-16 bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white text-center font-bold focus:border-amber-500 outline-none",
                                onBlur: (e) => {
                                    const val = parseInt(e.target.value);
                                    const newTokens = tokens.map(tok => tok.id === t.id ? { ...tok, visionRadius: val } : tok);
                                    updateSessionState({ battlemap: { ...battlemapData, tokens: newTokens } });
                                }
                            }) : el('span', { className: "text-amber-500 font-bold" }, `${t.visionRadius || 3}`)
                        ]),

                        // Imagem (NOVO)
                        el('div', { className: "flex flex-col gap-1" }, [
                            el('span', { className: "text-[10px] font-black uppercase text-slate-400 tracking-widest" }, "🖼️ Imagem (URL):"),
                            canEdit ? el('input', {
                                type: "text",
                                placeholder: "Cole o link da imagem...",
                                defaultValue: t.imageUrl || '',
                                className: "w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-[10px] text-white focus:border-blue-500 outline-none",
                                onBlur: (e) => {
                                    const val = parseImageUrl(e.target.value);
                                    const newTokens = tokens.map(tok => tok.id === t.id ? { ...tok, imageUrl: val } : tok);
                                    updateSessionState({ battlemap: { ...battlemapData, tokens: newTokens } });
                                }
                            }) : el('p', { className: "text-[9px] text-slate-500 italic truncate" }, t.imageUrl || 'Nenhuma imagem'),
                            
                            // Sincronizar Avatar (NOVO)
                            t.type === 'player' && canEdit && el('button', {
                                onClick: () => {
                                    const char = allCharacters.find(c => c.name === t.name);
                                    const avatar = char?.sheetData?.info?.['Avatar'];
                                    if (avatar) {
                                        const newTokens = tokens.map(tok => tok.id === t.id ? { ...tok, imageUrl: avatar } : tok);
                                        updateSessionState({ battlemap: { ...battlemapData, tokens: newTokens } });
                                    } else {
                                        alert("Nenhum Avatar encontrado na ficha deste personagem!");
                                    }
                                },
                                className: "mt-1 text-[8px] bg-blue-900/30 hover:bg-blue-600 text-blue-400 hover:text-white px-2 py-1 rounded-md transition-all font-black uppercase tracking-tighter w-fit self-end"
                            }, "🔄 Sincronizar com Ficha")
                        ]),

                        // Status
                        el('div', { className: "flex flex-col gap-2" }, [
                            el('span', { className: "text-[10px] font-black uppercase text-slate-400 tracking-widest" }, "🎭 Status / Marcadores:"),
                            el('div', { className: "flex flex-wrap gap-2" }, Object.entries(STATUS_ICONS).map(([key, icon]) => {
                                const hasStatus = (t.status || []).includes(key);
                                return el('button', {
                                    key: key,
                                    onClick: () => {
                                        if (!canEdit) return;
                                        let newStatus = [...(t.status || [])];
                                        if (hasStatus) newStatus = newStatus.filter(s => s !== key);
                                        else newStatus.push(key);
                                        const newTokens = tokens.map(tok => tok.id === t.id ? { ...tok, status: newStatus } : tok);
                                        updateSessionState({ battlemap: { ...battlemapData, tokens: newTokens } });
                                    },
                                    className: `w-8 h-8 rounded-xl flex items-center justify-center text-lg transition-all border-2 ${
                                        hasStatus ? 'bg-amber-500 border-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.4)]' : 'bg-slate-800 border-slate-700 hover:border-slate-500 grayscale opacity-40'
                                    } ${!canEdit ? 'cursor-default' : 'cursor-pointer'}`
                                }, icon);
                            }))
                        ]),

                        // Aura
                        el('div', { className: "space-y-3 p-3 bg-slate-950/50 rounded-2xl border border-slate-800" }, [
                            el('div', { className: "flex justify-between items-center" }, [
                                el('span', { className: "text-[10px] font-bold text-slate-400" }, "Raio da Aura:"),
                                canEdit ? el('input', {
                                    type: "number",
                                    min: 0, step: 1,
                                    defaultValue: t.auraRadius || 0,
                                    className: "w-12 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white text-center font-bold focus:border-purple-500 outline-none",
                                    onBlur: (e) => {
                                        const val = parseFloat(e.target.value);
                                        const newTokens = tokens.map(tok => tok.id === t.id ? { ...tok, auraRadius: val } : tok);
                                        updateSessionState({ battlemap: { ...battlemapData, tokens: newTokens } });
                                    }
                                }) : el('span', { className: "text-purple-400 font-bold" }, `${t.auraRadius || 0}`)
                            ]),
                            el('div', { className: "flex justify-between items-center" }, [
                                el('span', { className: "text-[10px] font-bold text-slate-400" }, "Cor da Aura:"),
                                canEdit ? el('input', {
                                    type: "color",
                                    defaultValue: t.auraColor || "#3b82f6",
                                    className: "w-10 h-6 bg-slate-800 border border-slate-700 rounded cursor-pointer",
                                    onBlur: (e) => {
                                        const val = e.target.value;
                                        const newTokens = tokens.map(tok => tok.id === t.id ? { ...tok, auraColor: val } : tok);
                                        updateSessionState({ battlemap: { ...battlemapData, tokens: newTokens } });
                                    }
                                }) : el('div', { className: "w-6 h-6 rounded-full", style: { backgroundColor: t.auraColor || "#3b82f6" } })
                            ])
                        ]),

                        // Botão Deletar Token
                        canEdit && el('button', {
                            onClick: () => {
                                const newTokens = tokens.filter(tok => tok.id !== t.id);
                                updateSessionState({ battlemap: { ...battlemapData, tokens: newTokens } });
                                setContextMenu(null);
                            },
                            className: "mt-2 w-full bg-red-900/40 hover:bg-red-600 text-red-400 hover:text-white text-xs font-bold py-2 rounded-lg transition-colors border border-red-500/30 flex justify-center items-center gap-2"
                        }, ["🗑️", "Remover do Mapa"])
                    ]);
                })()
            ])
        ]),

        // --- MODAL DE BIBLIOTECA DE MAPAS ---
        isMapLibraryOpen && el('div', {
            className: "fixed inset-0 z-[600] bg-slate-950/80 backdrop-blur-xl flex items-center justify-center p-6",
            onClick: () => setIsMapLibraryOpen(false)
        }, [
            el('div', {
                className: "bg-slate-900 border border-slate-800 rounded-[2.5rem] w-full max-w-2xl shadow-3xl overflow-hidden",
                onClick: (e) => e.stopPropagation()
            }, [
                el('div', { className: "p-8 border-b border-slate-800 flex justify-between items-center bg-indigo-600/5" }, [
                    el('div', null, [
                        el('h2', { className: "text-2xl font-black text-white flex items-center gap-3" }, [
                            el('span', { className: "text-indigo-500" }, "🗺️"), "Biblioteca de Mapas"
                        ]),
                        el('p', { className: "text-slate-500 text-xs mt-1 font-bold uppercase tracking-widest" }, "Gerencie seus cenários e batalhas")
                    ]),
                    el('button', {
                        onClick: () => {
                            const name = prompt("Nome do novo mapa:");
                            if (!name) return;
                            const url = prompt("URL da imagem do mapa:");
                            if (!url) return;
                            const newMap = { id: `map_${Date.now()}`, name, imageUrl: parseImageUrl(url), gridSize: 50 };
                            updateSessionState({ 
                                battlemap: { 
                                    ...battlemapData, 
                                    maps: [...maps, newMap],
                                    activeMapId: newMap.id 
                                } 
                            });
                        },
                        className: "bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg active:scale-95"
                    }, "+ Novo Mapa")
                ]),
                el('div', { className: "p-8 max-h-[60vh] overflow-y-auto grid grid-cols-2 gap-4" }, maps.map(m => {
                    const isActive = m.id === activeMapId;
                    return el('div', {
                        key: m.id,
                        className: `group relative rounded-3xl border-2 transition-all cursor-pointer overflow-hidden ${
                            isActive ? 'border-indigo-500 ring-4 ring-indigo-500/20' : 'border-slate-800 hover:border-slate-600'
                        }`,
                        onClick: () => {
                            updateSessionState({ battlemap: { ...battlemapData, activeMapId: m.id } });
                        }
                    }, [
                        el('img', { src: m.imageUrl, className: "w-full h-40 object-cover opacity-60 group-hover:opacity-100 transition-opacity" }),
                        el('div', { className: "absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-slate-900 to-transparent" }, [
                            el('h4', { className: "text-sm font-black text-white" }, m.name),
                            el('span', { className: "text-[10px] text-slate-400" }, `${m.gridSize}px Grid`)
                        ]),
                        isActive && el('div', { className: "absolute top-4 right-4 bg-indigo-500 text-white text-[10px] font-black px-3 py-1 rounded-full" }, "ATIVO"),
                        !isActive && mode === 'master' && el('button', {
                            onClick: (e) => {
                                e.stopPropagation();
                                if (confirm(`Deseja excluir o mapa "${m.name}"?`)) {
                                    const newMaps = maps.filter(map => map.id !== m.id);
                                    updateSessionState({ battlemap: { ...battlemapData, maps: newMaps } });
                                }
                            },
                            className: "absolute top-4 right-4 bg-red-500/20 hover:bg-red-500 text-red-500 hover:text-white w-8 h-8 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
                        }, "×")
                    ]);
                })),
                el('div', { className: "p-6 bg-slate-950 flex justify-end" }, [
                    el('button', {
                        onClick: () => setIsMapLibraryOpen(false),
                        className: "bg-slate-800 hover:bg-slate-700 text-slate-400 px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all"
                    }, "Fechar")
                ])
            ])
        ])
    ]);
}
