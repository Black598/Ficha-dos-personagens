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
    const [selectedTokenId, setSelectedTokenId] = useState(null);

    const [isMapLibraryOpen, setIsMapLibraryOpen] = useState(false);
    const [creatureSelectorOpen, setCreatureSelectorOpen] = useState(null); // 'bestiary', 'characters', 'animals' or null
    const [creatureSearchQuery, setCreatureSearchQuery] = useState('');
    const [isFogMode, setIsFogMode] = useState(false);
    const [fogBrushType, setFogBrushType] = useState('hide'); // 'hide' ou 'reveal'
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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

        // Deselecionar token ao clicar no fundo com botão esquerdo
        if (e.button === 0) {
            setSelectedTokenId(null);
        }

        // PING COM BOTÃO DO MEIO (Middle-click)
        if (e.button === 1) {
            e.preventDefault();
            e.stopPropagation();
            const rect = cameraRef.current.getBoundingClientRect();
            const worldX = (e.clientX - rect.left) / camera.scale;
            const worldY = (e.clientY - rect.top) / camera.scale;
            const newPing = { id: Date.now(), x: worldX, y: worldY, sender: characterName };
            const activePings = (battlemapData?.pings || []).filter(p => Date.now() - p.id < 3000);
            updateSessionState({ battlemap: { ...battlemapData, pings: [...activePings, newPing] } });
            return;
        }

        // Botão direito do mouse OU toque na tela para arrastar o mapa (removido botão do meio daqui para usar no ping)
        if (e.button === 2 || (isTouch && !drawMode && !draggingToken)) {
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
        
        // Seleciona o token ao clicar nele
        setSelectedTokenId(token.id);

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
    // --- AÇÕES DO MAPA ---
    const handleNextTurn = () => {
        const currentOrder = turnState?.initiativeOrder || [];
        if (currentOrder.length === 0) {
            alert("A iniciativa está vazia. Adicione jogadores na tela do Mestre primeiro.");
            return;
        }
        const activeIndex = currentOrder.findIndex(c => c.name === turnState.activeChar);
        let nextIndex = activeIndex + 1;
        if (nextIndex >= currentOrder.length || activeIndex === -1) {
            nextIndex = 0;
            updateSessionState({ turnState: { ...turnState, round: (turnState?.round || 1) + 1 } });
        }
        if (advanceTurn) advanceTurn(currentOrder[nextIndex].name);
        else updateSessionState({ turnState: { ...turnState, activeChar: currentOrder[nextIndex].name } });
    };

    const handleUpdateBackground = () => {
        const url = prompt("Link da Imagem:", activeMap.imageUrl);
        if (url !== null) {
            const parsedUrl = parseImageUrl(url);
            const newMap = { ...activeMap, id: activeMap.id || 'map_1', imageUrl: parsedUrl, name: 'Mapa Atual' };
            const newMaps = maps.filter(m => m.id !== newMap.id);
            newMaps.push(newMap);
            updateSessionState({ battlemap: { ...battlemapData, activeMapId: newMap.id, maps: newMaps } });
        }
    };

    const handleUpdateGrid = () => {
        const size = prompt("Tamanho do Grid:", activeMap.gridSize || 50);
        if (size !== null && !isNaN(parseInt(size))) {
            const newMap = { ...activeMap, gridSize: parseInt(size) };
            const newMaps = maps.map(m => m.id === newMap.id ? newMap : m);
            updateSessionState({ battlemap: { ...battlemapData, maps: newMaps } });
        }
    };

    const handleAddAllPlayers = () => {
        const existingNames = tokens.map(t => t.name);
        const playersToAdd = (allCharacters || []).filter(c => c.name.toLowerCase() !== 'mestre' && !existingNames.includes(c.name));
        if (playersToAdd.length === 0) return alert("Todos os jogadores já estão no mapa!");
        const gs = activeMap.gridSize || 50;
        const newTokens = playersToAdd.map((p, idx) => ({
            id: `token_player_${p.name}`,
            type: 'player',
            name: p.name,
            imageUrl: p.imageUrl || p.sheetData?.info?.['Avatar'] || '',
            x: (idx * gs), y: 0, size: 1
        }));
        updateSessionState({ battlemap: { ...battlemapData, tokens: [...tokens, ...newTokens] } });
    };

    const handleAddMonster = () => {
        const monsterName = prompt("Nome do Monstro/NPC:");
        const gs = activeMap.gridSize || 50;
        if (monsterName) {
            const m = allAvailableNPCs.find(mon => mon.name.toLowerCase().includes(monsterName.toLowerCase()));
            if (m) {
                const newToken = {
                    id: `token_monster_${m.id || Date.now()}_${Math.random().toString(36).substr(2,5)}`,
                    type: 'monster', name: m.name, imageUrl: m.imageUrl || '',
                    x: 0, y: 0, size: 1, createdBy: characterName
                };
                updateSessionState({ battlemap: { ...battlemapData, tokens: [...tokens, newToken] } });
            } else alert("Não encontrado!");
        }
    };

    const handleAddNewToken = () => {
        const name = prompt("Nome do Token:");
        if (!name) return;
        const url = prompt("Link da Imagem:");
        const parsedUrl = url ? parseImageUrl(url) : '';
        const gs = activeMap.gridSize || 50;
        const newToken = {
            id: `token_npc_${Date.now()}_${Math.random().toString(36).substr(2,5)}`,
            type: 'npc', name: name, imageUrl: parsedUrl, x: 0, y: gs * 2, size: 1, createdBy: characterName
        };
        updateSessionState({ battlemap: { ...battlemapData, tokens: [...tokens, newToken] } });
    };

    const handleAddProp = () => {
        const propName = prompt("O que deseja adicionar?");
        if (!propName) return;
        const url = prompt(`Link da imagem:`);
        const gs = activeMap.gridSize || 50;
        const newToken = {
            id: `prop_${Date.now()}_${Math.random().toString(36).substr(2,5)}`,
            type: 'prop', name: propName,
            imageUrl: url || `https://api.dicebear.com/7.x/initials/svg?seed=${propName}&backgroundColor=71717a`,
            x: 0, y: gs * 3, size: 1, createdBy: characterName
        };
        updateSessionState({ battlemap: { ...battlemapData, tokens: [...tokens, newToken] } });
    };

    const handleClearDrawings = () => {
        if (confirm("Limpar desenhos?")) updateSessionState({ battlemap: { ...battlemapData, drawings: [] } });
    };

    const handleClearWalls = () => {
        if (confirm("Limpar paredes?")) updateSessionState({ battlemap: { ...battlemapData, walls: [] } });
    };

    const handleClearTokens = () => {
        if (confirm("Limpar todos os tokens?")) updateSessionState({ battlemap: { ...battlemapData, tokens: [] } });
    };

    const handleContextMenu = (e) => {
        e.preventDefault();
    };

    // --- MODAL DE SELEÇÃO VISUAL DE CRIATURAS (Monstros, NPCs, Animais) ---
    const renderCreatureSelectorModal = () => {
        if (!creatureSelectorOpen) return null;

        const categories = [
            { id: 'bestiary', label: 'Monstros', icon: '👹' },
            { id: 'characters', label: 'NPCs / Personagens', icon: '👥' },
            { id: 'animals', label: 'Glossário Animal', icon: '🐾' }
        ];

        let items = [];
        if (creatureSelectorOpen === 'bestiary') {
            items = [...(libraryData.bestiary || []), ...monsters];
        } else if (creatureSelectorOpen === 'characters') {
            items = libraryData.characters || [];
        } else if (creatureSelectorOpen === 'animals') {
            items = libraryData.animals || [];
        }

        const uniqueItemsMap = new Map();
        items.forEach(item => {
            const name = item.name || item.title;
            if (name && !uniqueItemsMap.has(name.toLowerCase())) {
                uniqueItemsMap.set(name.toLowerCase(), item);
            }
        });

        const filteredItems = Array.from(uniqueItemsMap.values()).filter(item => {
            const name = item.name || item.title || '';
            const desc = item.description || '';
            const type = item.type || '';
            const query = creatureSearchQuery.toLowerCase();
            return name.toLowerCase().includes(query) || 
                   desc.toLowerCase().includes(query) || 
                   type.toLowerCase().includes(query);
        });

        return el('div', {
            key: 'creature-selector-modal',
            onClick: () => { setCreatureSelectorOpen(null); setCreatureSearchQuery(''); },
            className: "fixed inset-0 z-[400] bg-slate-950/90 backdrop-blur-xl flex items-center justify-center p-4 animate-fade-in text-slate-100 pointer-events-auto"
        }, [
            el('div', {
                onClick: (e) => e.stopPropagation(),
                className: "bg-slate-900 border border-slate-800 rounded-[3rem] w-full max-w-4xl h-[85vh] flex flex-col shadow-[0_25px_60px_rgba(0,0,0,0.8)] overflow-hidden animate-zoom-in"
            }, [
                // Header
                el('header', { className: "p-6 border-b border-slate-800 flex flex-row justify-between items-center gap-4 bg-slate-950/40 relative" }, [
                    el('div', { className: "flex items-center gap-4" }, [
                        el('span', { className: "text-2xl animate-pulse-soft" }, "🔮"),
                        el('div', null, [
                            el('h3', { className: "text-xl font-black uppercase tracking-tighter bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent" }, "Invocador de Criaturas"),
                            el('p', { className: "text-[9px] font-black text-slate-500 uppercase tracking-widest mt-0.5" }, "Selecione na lista para invocar um token no centro da câmera")
                        ])
                    ]),
                    el('button', { 
                        onClick: () => { setCreatureSelectorOpen(null); setCreatureSearchQuery(''); },
                        className: "w-10 h-10 bg-slate-800 hover:bg-red-500 hover:text-white rounded-xl flex items-center justify-center text-xl transition-all shadow-lg border border-slate-700 hover:scale-105 active:scale-95"
                    }, "×")
                ]),

                // Subheader (Search & Tabs)
                el('div', { className: "p-6 border-b border-slate-850 bg-slate-950/20 flex flex-col md:flex-row gap-4 justify-between items-center" }, [
                    el('div', { className: "flex bg-slate-950/60 p-1.5 rounded-2xl border border-slate-800 gap-1 w-full md:w-auto overflow-x-auto hide-scrollbar" }, 
                        categories.map(cat => 
                            el('button', {
                                key: cat.id,
                                onClick: () => { setCreatureSelectorOpen(cat.id); setCreatureSearchQuery(''); },
                                className: `px-5 py-3 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 whitespace-nowrap ${creatureSelectorOpen === cat.id ? 'bg-amber-600 text-slate-900 shadow-md font-black' : 'text-slate-500 hover:text-slate-300'}`
                            }, [
                                el('span', { className: "text-sm" }, cat.icon),
                                cat.label
                            ])
                        )
                    ),
                    el('div', { className: "relative w-full md:w-80" }, [
                        el('span', { className: "absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-xs" }, "🔍"),
                        el('input', {
                            type: 'text',
                            value: creatureSearchQuery,
                            onChange: (e) => setCreatureSearchQuery(e.target.value),
                            placeholder: `Buscar em ${categories.find(c => c.id === creatureSelectorOpen)?.label || ''}...`,
                            className: "w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white focus:border-amber-500/50 outline-none transition-all"
                        })
                    ])
                ]),

                // Content (Grid List)
                el('div', { className: "flex-grow overflow-y-auto p-8 custom-scrollbar bg-slate-900/40" }, [
                    filteredItems.length === 0 ? 
                        el('div', { className: "h-64 flex flex-col items-center justify-center text-slate-600 italic gap-3" }, [
                            el('span', { className: "text-5xl" }, "🕯️"),
                            el('p', { className: "text-xs font-black uppercase tracking-wider" }, "Nenhuma criatura disponível nesta categoria...")
                        ]) :
                        el('div', { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" }, 
                            filteredItems.map(item => {
                                const name = item.name || item.title || 'Criatura';
                                const img = item.image || item.imageUrl || '';
                                return el('div', {
                                    key: item.id,
                                    className: "group bg-slate-950/40 border border-slate-850 hover:border-amber-500/30 rounded-[2rem] overflow-hidden flex flex-col p-5 transition-all duration-300 hover:-translate-y-1 shadow-md hover:shadow-xl relative"
                                }, [
                                    el('div', { className: "flex gap-4 items-start" }, [
                                        el('div', { className: "w-16 h-16 rounded-2xl overflow-hidden bg-slate-900 border border-slate-850 flex-shrink-0 flex items-center justify-center" }, 
                                            img ? 
                                                el('img', { src: img, className: "w-full h-full object-cover" }) :
                                                el('span', { className: "text-2xl opacity-40" }, categories.find(c => c.id === creatureSelectorOpen)?.icon || '🐾')
                                        ),
                                        el('div', { className: "flex-grow min-w-0" }, [
                                            el('h4', { className: "font-black uppercase text-amber-500 text-xs tracking-tighter truncate" }, name),
                                            item.type && el('span', { className: "text-[8px] font-bold text-slate-500 uppercase tracking-widest mt-0.5 block" }, item.type),
                                            (item.hp || item.ca || item.cr) && el('div', { className: "flex gap-1.5 mt-2 flex-wrap" }, [
                                                item.cr && el('span', { className: "bg-amber-600/10 border border-amber-500/20 text-amber-500 text-[8px] font-black uppercase px-1.5 py-0.5 rounded" }, `CR ${item.cr}`),
                                                item.hp && el('span', { className: "bg-red-950/40 border border-red-900/30 text-red-400 text-[8px] font-black uppercase px-1.5 py-0.5 rounded flex items-center gap-0.5" }, ["❤️", item.hp]),
                                                item.ca && el('span', { className: "bg-blue-950/40 border border-blue-900/30 text-blue-400 text-[8px] font-black uppercase px-1.5 py-0.5 rounded flex items-center gap-0.5" }, ["🛡️", item.ca])
                                            ].filter(Boolean))
                                        ])
                                    ]),
                                    item.description && el('p', { className: "text-[10px] text-slate-400 italic line-clamp-2 mt-3 leading-normal border-t border-slate-800/40 pt-2" }, item.description),
                                    el('button', {
                                        onClick: () => {
                                            const gs = activeMap.gridSize || 50;
                                            let posX = 0;
                                            let posY = 0;
                                            if (containerRef.current) {
                                                const rect = containerRef.current.getBoundingClientRect();
                                                const cx = (rect.width / 2 - camera.x) / camera.scale;
                                                const cy = (rect.height / 2 - camera.y) / camera.scale;
                                                posX = Math.round(cx / gs) * gs;
                                                posY = Math.round(cy / gs) * gs;
                                            }
                                            const newToken = {
                                                id: `token_${creatureSelectorOpen}_${item.id || Date.now()}_${Math.random().toString(36).substr(2,5)}`,
                                                type: creatureSelectorOpen === 'bestiary' ? 'monster' : 'npc',
                                                name: name,
                                                imageUrl: img,
                                                x: posX, y: posY, size: 1,
                                                createdBy: characterName
                                            };
                                            updateSessionState({ battlemap: { ...battlemapData, tokens: [...tokens, newToken] } });
                                        },
                                        className: "w-full bg-slate-900 hover:bg-amber-600 hover:text-slate-950 text-slate-300 text-[9px] font-black uppercase tracking-wider py-2.5 rounded-xl transition-all duration-200 mt-4 border border-slate-800 hover:border-amber-500 shadow-sm"
                                    }, "➕ Invocar Token")
                                ]);
                            })
                        )
                ])
            ])
        ]);
    };

    // --- RENDERIZAÇÃO ---
    return el('div', { 
        className: "fixed inset-0 z-[200] bg-slate-950 flex flex-col animate-fade-in text-slate-100 overflow-hidden select-none",
        onContextMenu: handleContextMenu
    }, [
        
        // --- HEADER ---
        el('header', { key: 'map-header', className: "absolute top-0 left-0 w-full z-[100] p-4 md:p-6 flex justify-between items-center bg-gradient-to-b from-slate-950 to-transparent pointer-events-none" }, [
            el('div', { className: "flex items-center gap-4 md:gap-6 pointer-events-auto" }, [
                el('button', {
                    onClick: onBack,
                    className: "w-10 h-10 md:w-12 md:h-12 bg-slate-900 border border-slate-700 rounded-2xl flex items-center justify-center text-lg md:text-xl hover:bg-slate-800 hover:border-amber-500/50 transition-all shadow-lg"
                }, "⬅️"),
                el('div', null, [
                    el('h2', { className: "text-xl md:text-3xl font-black italic uppercase tracking-tighter bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent drop-shadow-lg" }, "🗺️ Mapa"),
                    el('p', { className: "text-[8px] md:text-[10px] font-black text-slate-300 uppercase tracking-widest mt-1 drop-shadow" }, 
                        activeMap.name || "Nenhum mapa"
                    )
                ])
            ]),

            // BOTÃO HAMBURGUER (Mobile Only)
            el('button', {
                key: 'mobile-menu-toggle',
                onClick: () => setIsMobileMenuOpen(true),
                className: "md:hidden w-10 h-10 bg-slate-900 border border-slate-700 rounded-xl flex items-center justify-center text-xl text-amber-500 pointer-events-auto shadow-lg"
            }, "☰"),

            // TOOLBAR DESKTOP (Modular Frosted Glass Dropdowns - Match Master/Sheet consistency)
            el('div', { className: "hidden md:flex gap-3 pointer-events-auto bg-slate-900/90 backdrop-blur-xl p-2 rounded-2xl border border-slate-800 shadow-2xl items-center z-[150]" }, [
                
                // GRUPO 1: MAPA (Master Only)
                mode === 'master' && el('div', { className: "group relative" }, [
                    el('button', { className: "bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-400 border border-emerald-500/30 px-3.5 py-2 rounded-xl transition-all duration-300 flex items-center gap-2 text-[10px] font-black uppercase tracking-wider hover:scale-105 active:scale-95 shadow-[0_0_10px_rgba(16,185,129,0.05)]" }, [
                        el('span', { className: "text-sm" }, "🗺️"), "Mapa"
                    ]),
                    el('div', { className: "absolute top-full mt-2 right-0 w-64 bg-slate-900/95 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-[0_15px_50px_rgba(0,0,0,0.6)] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all flex flex-col py-2 z-[200] transform origin-top group-hover:scale-100 scale-95 duration-200" }, [
                        el('button', { onClick: handleUpdateBackground, className: "w-full text-left px-5 py-3 hover:bg-emerald-500/10 border-l-2 border-l-transparent hover:border-l-emerald-500 hover:pl-6 flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-slate-300 hover:text-white transition-all duration-150" }, ["🖼️ Mudar Imagem Fundo"]),
                        el('button', { onClick: () => setIsMapLibraryOpen(true), className: "w-full text-left px-5 py-3 hover:bg-emerald-500/10 border-l-2 border-l-transparent hover:border-l-emerald-500 hover:pl-6 flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-slate-300 hover:text-white transition-all duration-150" }, ["📁 Biblioteca de Mapas"]),
                        el('button', { onClick: handleUpdateGrid, className: "w-full text-left px-5 py-3 hover:bg-emerald-500/10 border-l-2 border-l-transparent hover:border-l-emerald-500 hover:pl-6 flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-slate-300 hover:text-white transition-all duration-150" }, ["📏 Ajustar Grid de Células"])
                    ])
                ]),

                // GRUPO 2: ENTIDADES / TOKENS
                el('div', { className: "group relative" }, [
                    el('button', { className: "bg-purple-950/40 hover:bg-purple-900/60 text-purple-400 border border-purple-500/30 px-3.5 py-2 rounded-xl transition-all duration-300 flex items-center gap-2 text-[10px] font-black uppercase tracking-wider hover:scale-105 active:scale-95 shadow-[0_0_10px_rgba(139,92,246,0.05)]" }, [
                        el('span', { className: "text-sm" }, "👤"), "Tokens"
                    ]),
                    el('div', { className: "absolute top-full mt-2 right-0 w-64 bg-slate-900/95 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-[0_15px_50px_rgba(0,0,0,0.6)] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all flex flex-col py-2 z-[200] transform origin-top group-hover:scale-100 scale-95 duration-200" }, [
                        mode === 'master' && el('button', { onClick: handleAddAllPlayers, className: "w-full text-left px-5 py-3 hover:bg-purple-500/10 border-l-2 border-l-transparent hover:border-l-purple-500 hover:pl-6 flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-slate-300 hover:text-white transition-all duration-150" }, ["🎲 Puxar Todos os Jogadores"]),
                        mode === 'master' && el('button', { onClick: () => setCreatureSelectorOpen('bestiary'), className: "w-full text-left px-5 py-3 hover:bg-purple-500/10 border-l-2 border-l-transparent hover:border-l-purple-500 hover:pl-6 flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-slate-300 hover:text-white transition-all duration-150" }, ["👹 Invocar Monstro"]),
                        mode === 'master' && el('button', { onClick: () => setCreatureSelectorOpen('characters'), className: "w-full text-left px-5 py-3 hover:bg-purple-500/10 border-l-2 border-l-transparent hover:border-l-purple-500 hover:pl-6 flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-slate-300 hover:text-white transition-all duration-150" }, ["👥 Invocar NPC / Figurante"]),
                        mode === 'master' && el('button', { onClick: () => setCreatureSelectorOpen('animals'), className: "w-full text-left px-5 py-3 hover:bg-purple-500/10 border-l-2 border-l-transparent hover:border-l-purple-500 hover:pl-6 flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-slate-300 hover:text-white transition-all duration-150" }, ["🐾 Invocar Animal / Pet"]),
                        el('button', { onClick: handleAddNewToken, className: "w-full text-left px-5 py-3 hover:bg-purple-500/10 border-l-2 border-l-transparent hover:border-l-purple-500 hover:pl-6 flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-slate-300 hover:text-white transition-all duration-150 border-t border-slate-800/80 mt-1 pt-3" }, ["➕ Criar Token Livre"]),
                        el('button', { onClick: handleAddProp, className: "w-full text-left px-5 py-3 hover:bg-purple-500/10 border-l-2 border-l-transparent hover:border-l-purple-500 hover:pl-6 flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-slate-300 hover:text-white transition-all duration-150 border-t border-slate-800/80 mt-1 pt-3" }, ["📦 Criar Objeto / Cenário (Prop)"])
                    ].filter(Boolean))
                ]),

                // GRUPO 3: DESENHO E MEDIÇÃO
                el('div', { className: "group relative" }, [
                    el('button', { className: `bg-amber-950/40 hover:bg-amber-900/60 text-amber-400 border border-amber-500/30 px-3.5 py-2 rounded-xl transition-all duration-300 flex items-center gap-2 text-[10px] font-black uppercase tracking-wider hover:scale-105 active:scale-95 shadow-[0_0_10px_rgba(245,158,11,0.05)] ${drawMode ? 'border-amber-400 bg-amber-500/20' : ''}` }, [
                        el('span', { className: "text-sm" }, "✏️"), drawMode ? `Desenho: ${drawMode}` : "Desenhar"
                    ]),
                    el('div', { className: "absolute top-full mt-2 right-0 w-64 bg-slate-900/95 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-[0_15px_50px_rgba(0,0,0,0.6)] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all flex flex-col py-2 z-[200] transform origin-top group-hover:scale-100 scale-95 duration-200" }, [
                        el('div', { className: "px-5 py-3 border-b border-slate-800/80 flex items-center justify-between" }, [
                            el('span', { className: "text-[9px] font-black text-slate-500 uppercase tracking-widest" }, "🎨 Cor do Pincel:"),
                            el('input', {
                                type: 'color', value: drawColor, onChange: (e) => setDrawColor(e.target.value),
                                className: "w-6 h-6 bg-transparent cursor-pointer rounded-full overflow-hidden border-0 p-0 hover:scale-110 transition-transform"
                            })
                        ]),
                        el('button', { onClick: () => setDrawMode(drawMode === 'cone' ? null : 'cone'), className: `w-full text-left px-5 py-3 flex items-center gap-3 text-[10px] font-black uppercase tracking-widest transition-all duration-150 hover:bg-amber-500/10 border-l-2 ${drawMode === 'cone' ? 'border-l-amber-500 bg-amber-500/5 text-amber-300' : 'border-l-transparent text-slate-300'}` }, ["📐 Molde de Cone"]),
                        el('button', { onClick: () => setDrawMode(drawMode === 'line' ? null : 'line'), className: `w-full text-left px-5 py-3 flex items-center gap-3 text-[10px] font-black uppercase tracking-widest transition-all duration-150 hover:bg-amber-500/10 border-l-2 ${drawMode === 'line' ? 'border-l-amber-500 bg-amber-500/5 text-amber-300' : 'border-l-transparent text-slate-300'}` }, ["➖ Régua / Linha"]),
                        el('button', { onClick: () => setDrawMode(drawMode === 'circle' ? null : 'circle'), className: `w-full text-left px-5 py-3 flex items-center gap-3 text-[10px] font-black uppercase tracking-widest transition-all duration-150 hover:bg-amber-500/10 border-l-2 ${drawMode === 'circle' ? 'border-l-amber-500 bg-amber-500/5 text-amber-300' : 'border-l-transparent text-slate-300'}` }, ["⭕ Molde de Círculo"]),
                        mode === 'master' && el('button', { onClick: () => setDrawMode(drawMode === 'wall' ? null : 'wall'), className: `w-full text-left px-5 py-3 flex items-center gap-3 text-[10px] font-black uppercase tracking-widest transition-all duration-150 hover:bg-amber-500/10 border-l-2 ${drawMode === 'wall' ? 'border-l-blue-500 bg-blue-500/5 text-blue-300' : 'border-l-transparent text-slate-300'}` }, ["🧱 Parede de Bloqueio"]),
                        el('button', {
                            onClick: () => {
                                if (drawings.length > 0) {
                                    const newDrawings = [...drawings]; newDrawings.pop();
                                    updateSessionState({ battlemap: { ...battlemapData, drawings: newDrawings } });
                                }
                            },
                            className: "w-full text-left px-5 py-3 hover:bg-amber-500/10 border-l-2 border-l-transparent hover:border-l-amber-500 hover:pl-6 flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white border-t border-slate-800/80 mt-1 pt-3 transition-all duration-150"
                        }, ["↩️ Desfazer Último"])
                    ].filter(Boolean))
                ]),

                // GRUPO 4: NÉVOA DE GUERRA (Master Only)
                mode === 'master' && el('div', { className: "group relative" }, [
                    el('button', { className: `bg-indigo-950/40 hover:bg-indigo-900/60 text-indigo-400 border border-indigo-500/30 px-3.5 py-2 rounded-xl transition-all duration-300 flex items-center gap-2 text-[10px] font-black uppercase tracking-wider hover:scale-105 active:scale-95 shadow-[0_0_10px_rgba(99,102,241,0.05)] ${isFogMode ? 'border-indigo-400 bg-indigo-500/20' : ''}` }, [
                        el('span', { className: "text-sm" }, "🌫️"), isFogMode ? `Névoa: ${fogBrushType === 'hide' ? 'Esconder' : 'Revelar'}` : "Névoa"
                    ]),
                    el('div', { className: "absolute top-full mt-2 right-0 w-64 bg-slate-900/95 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-[0_15px_50px_rgba(0,0,0,0.6)] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all flex flex-col py-2 z-[200] transform origin-top group-hover:scale-100 scale-95 duration-200" }, [
                        el('button', { onClick: () => setIsFogMode(!isFogMode), className: `w-full text-left px-5 py-3 flex items-center gap-3 text-[10px] font-black uppercase tracking-widest transition-all duration-150 hover:bg-indigo-500/10 border-l-2 ${isFogMode ? 'border-l-indigo-500 bg-indigo-500/5 text-indigo-300' : 'border-l-transparent text-slate-300'}` }, [isFogMode ? "✅ Ativa (Desligar)" : "❌ Inativa (Ativar)"]),
                        isFogMode && el('button', { onClick: () => setFogBrushType('hide'), className: `w-full text-left px-5 py-3 flex items-center gap-3 text-[10px] font-black uppercase tracking-widest transition-all duration-150 hover:bg-indigo-500/10 border-l-2 ${fogBrushType === 'hide' ? 'border-l-indigo-500 bg-indigo-500/5 text-indigo-300' : 'border-l-transparent text-slate-300'}` }, ["🌑 Pincel: Esconder"]),
                        isFogMode && el('button', { onClick: () => setFogBrushType('reveal'), className: `w-full text-left px-5 py-3 flex items-center gap-3 text-[10px] font-black uppercase tracking-widest transition-all duration-150 hover:bg-indigo-500/10 border-l-2 ${fogBrushType === 'reveal' ? 'border-l-indigo-500 bg-indigo-500/5 text-indigo-300' : 'border-l-transparent text-slate-300'}` }, ["👁️ Pincel: Revelar"])
                    ].filter(Boolean))
                ]),

                // GRUPO 5: COMBATE / AÇÕES GERAIS
                el('div', { className: "group relative" }, [
                    el('button', { className: "bg-red-950/40 hover:bg-red-900/60 text-red-400 border border-red-500/30 px-3.5 py-2 rounded-xl transition-all duration-300 flex items-center gap-2 text-[10px] font-black uppercase tracking-wider hover:scale-105 active:scale-95 shadow-[0_0_10px_rgba(239,68,68,0.05)]" }, [
                        el('span', { className: "text-sm" }, "⚙️"), "Ações"
                    ]),
                    el('div', { className: "absolute top-full mt-2 right-0 w-64 bg-slate-900/95 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-[0_15px_50px_rgba(0,0,0,0.6)] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all flex flex-col py-2 z-[200] transform origin-top group-hover:scale-100 scale-95 duration-200" }, [
                        mode === 'master' && el('button', { onClick: handleNextTurn, className: "w-full text-left px-5 py-3 hover:bg-emerald-500/10 border-l-2 border-l-transparent hover:border-l-emerald-500 hover:pl-6 flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-emerald-400 hover:text-emerald-300 transition-all duration-150 font-black" }, ["▶️ Passar Vez (Próximo)"]),
                        el('button', { onClick: handleClearDrawings, className: "w-full text-left px-5 py-3 hover:bg-red-500/10 border-l-2 border-l-transparent hover:border-l-red-500 hover:pl-6 flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-slate-300 hover:text-white transition-all duration-150" }, ["🧹 Limpar Desenhos"]),
                        mode === 'master' && el('button', { onClick: handleClearWalls, className: "w-full text-left px-5 py-3 hover:bg-red-500/10 border-l-2 border-l-transparent hover:border-l-red-500 hover:pl-6 flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-slate-300 hover:text-white transition-all duration-150" }, ["🧱× Limpar Todas as Paredes"]),
                        mode === 'master' && el('button', { onClick: handleClearTokens, className: "w-full text-left px-5 py-3 hover:bg-red-500/10 border-l-2 border-l-transparent hover:border-l-red-500 hover:pl-6 flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-red-400 hover:text-red-300 transition-all duration-150 border-t border-slate-800/80 mt-1 pt-3" }, ["🗑️ Limpar Todos os Tokens"])
                    ].filter(Boolean))
                ]),

                el('div', { className: "w-px bg-slate-800 h-6 mx-1" }),

                // ZOOM & CAMERA RÁPIDOS
                el('div', { className: "flex items-center gap-1.5 bg-slate-950/60 p-1 rounded-xl border border-slate-800" }, [
                    el('button', { 
                        onClick: () => setCamera(prev => ({ ...prev, scale: Math.max(0.1, prev.scale - 0.15) })), 
                        className: "w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-all",
                        title: "Diminuir Zoom"
                    }, "➖"),
                    el('button', { 
                        onClick: () => setCamera(prev => ({ ...prev, scale: Math.min(10, prev.scale + 0.15) })), 
                        className: "w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-all",
                        title: "Aumentar Zoom"
                    }, "➕"),
                    el('button', { 
                        onClick: () => setCamera({ x: 0, y: 0, scale: 1 }), 
                        className: "px-3 py-1.5 bg-slate-900 border border-slate-700 hover:border-amber-500/50 hover:text-amber-400 text-slate-400 text-[9px] font-black uppercase rounded-lg transition-all",
                        title: "Centralizar Câmera no Mapa"
                    }, "🎯 Centro"),
                    el('span', { className: "text-[9px] font-black text-slate-500 w-12 text-center select-none" }, `${Math.round(camera.scale * 100)}%`)
                ])
            ])
        ]),

        // --- ÁREA DO CANVAS (Mundo) ---
        el('div', {
            key: 'canvas-container',
            ref: containerRef,
            // touch-none é vital para mobile para não rolar a página enquanto arrasta
            className: `w-full h-full relative outline-none ${isDraggingCanvas ? 'cursor-grabbing' : 'cursor-grab'} overflow-hidden touch-none`,
            onPointerDown: handlePointerDown,
            onWheel: handleWheel,
            onDoubleClick: (e) => {
                if (drawMode || draggingToken) return;
                e.preventDefault();
                e.stopPropagation();
                const rect = cameraRef.current.getBoundingClientRect();
                const worldX = (e.clientX - rect.left) / camera.scale;
                const worldY = (e.clientY - rect.top) / camera.scale;
                const newPing = { id: Date.now(), x: worldX, y: worldY, sender: characterName };
                const activePings = (battlemapData?.pings || []).filter(p => Date.now() - p.id < 3000);
                updateSessionState({ battlemap: { ...battlemapData, pings: [...activePings, newPing] } });
            }
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

                    const gs = activeMap.gridSize || 50;
                    const cellCount = (distance / gs).toFixed(1);
                    const distanceFeet = Math.round((distance / gs) * 5); // 5 pés por quadrado
                    const distanceMeters = ((distance / gs) * 1.5).toFixed(1); // 1.5 metros por quadrado

                    if (d.shape === 'circle') {
                        return el('div', {
                            key: d.id || 'current',
                            className: "absolute rounded-full border-[3px] opacity-60 bg-white/10 pointer-events-none flex items-center justify-center",
                            style: {
                                left: `${d.startX}px`,
                                top: `${d.startY}px`,
                                width: `${distance * 2}px`,
                                height: `${distance * 2}px`,
                                transform: 'translate(-50%, -50%)',
                                borderColor: d.color || '#f59e0b',
                                backgroundColor: d.color ? `${d.color}33` : undefined // 20% opacity
                            }
                        }, [
                            el('div', {
                                key: 'circle-ruler-badge',
                                className: "absolute bg-slate-950/90 backdrop-blur-sm border border-slate-800 px-2 py-0.5 rounded text-[8px] font-black tracking-wider text-amber-400 whitespace-nowrap shadow-2xl z-50 pointer-events-none select-none text-center"
                            }, `Raio: ${cellCount} Qdr | ${distanceFeet} ft | ${distanceMeters} m`)
                        ]);
                    }
                    if (d.shape === 'line') {
                        return el('div', {
                            key: d.id || 'current',
                            className: "absolute origin-left opacity-80 pointer-events-none rounded-full flex items-center justify-center",
                            style: {
                                left: `${d.startX}px`,
                                top: `${d.startY}px`,
                                width: `${distance}px`,
                                height: `${Math.max(10, (activeMap.gridSize || 50) / 2)}px`,
                                transform: `translateY(-50%) rotate(${angle}deg)`,
                                backgroundColor: d.color || '#f59e0b',
                                boxShadow: `0 0 15px ${d.color || '#f59e0b'}`
                            }
                        }, [
                            // Rotaciona o texto na direção inversa do ângulo para mantê-lo sempre horizontal e perfeitamente legível!
                            el('div', {
                                key: 'line-ruler-badge',
                                className: "absolute bg-slate-950/90 backdrop-blur-sm border border-slate-800 px-2 py-0.5 rounded text-[8px] font-black tracking-wider text-amber-400 whitespace-nowrap shadow-2xl z-50 pointer-events-none select-none text-center",
                                style: {
                                    left: '50%',
                                    top: '50%',
                                    transform: `translate(-50%, -50%) rotate(${-angle}deg)`
                                }
                            }, `${cellCount} Qdr | ${distanceFeet} ft | ${distanceMeters} m`)
                        ]);
                    }
                    if (d.shape === 'cone') {
                        return el('div', {
                            key: d.id || 'current',
                            className: "absolute origin-left opacity-50 pointer-events-none flex items-center justify-center",
                            style: {
                                left: `${d.startX}px`,
                                top: `${d.startY}px`,
                                width: `${distance}px`,
                                height: `${distance}px`,
                                transform: `translateY(-50%) rotate(${angle}deg)`,
                                clipPath: 'polygon(0 50%, 100% 0, 100% 100%)',
                                backgroundColor: d.color || '#f59e0b'
                            }
                        }, [
                            el('div', {
                                key: 'cone-ruler-badge',
                                className: "absolute bg-slate-950/90 backdrop-blur-sm border border-slate-800 px-2 py-0.5 rounded text-[8px] font-black tracking-wider text-amber-400 whitespace-nowrap shadow-2xl z-50 pointer-events-none select-none text-center",
                                style: {
                                    left: '60%',
                                    top: '50%',
                                    transform: `translate(-50%, -50%) rotate(${-angle}deg)`
                                }
                            }, `Cone: ${cellCount} Qdr | ${distanceFeet} ft | ${distanceMeters} m`)
                        ]);
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

                    const isSelected = selectedTokenId === t.id;
                    const canEdit = mode === 'master' || t.name === characterName || t.createdBy === characterName;
                    const isVisible = mode === 'master' || t.type === 'player' || t.createdBy === characterName;

                    return el('div', {
                        key: t.id,
                        className: `absolute group ${isDraggingThis ? 'z-50' : (isSelected ? 'z-40' : 'z-10')}`,
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
                            className: `w-full h-full rounded-full border-2 shadow-2xl overflow-hidden cursor-pointer hover:border-amber-500 hover:scale-105 transition-all duration-200 ${
                                isSelected ? 'border-amber-500 ring-4 ring-amber-500/30 scale-105 shadow-[0_0_25px_rgba(245,158,11,0.65)]' : 'border-white/20'
                            } ${isDraggingThis ? 'border-amber-500 shadow-[0_0_30px_rgba(245,158,11,0.5)]' : ''}`
                        }, [
                            renderToken.imageUrl ? 
                                el('img', { src: renderToken.imageUrl, className: "w-full h-full object-cover pointer-events-none" }) : 
                                el('div', { className: "w-full h-full bg-slate-800 flex items-center justify-center pointer-events-none" }, el('span', { className: "text-[10px] font-black uppercase text-slate-400" }, renderToken.name.substring(0,2)))
                        ]),

                        // HUD Rápido do Mestre / Proprietário (Focado em HP)
                        isSelected && isVisible && el('div', {
                            key: 'token-quick-hud',
                            className: "absolute bottom-[108%] left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 bg-slate-950/95 backdrop-blur-md border border-amber-500/40 p-2.5 rounded-2xl shadow-[0_15px_40px_rgba(0,0,0,0.8)] z-50 pointer-events-auto select-none min-w-[150px] animate-scale-in",
                            onClick: (e) => e.stopPropagation(),
                            onPointerDown: (e) => e.stopPropagation()
                        }, [
                            // Barra de Vida
                            el('div', { className: "w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mt-0.5" }, [
                                el('div', { 
                                    className: "h-full bg-gradient-to-r from-red-600 to-red-500 transition-all duration-300",
                                    style: { width: `${Math.max(0, Math.min(100, ((t.hp !== undefined ? t.hp : 100) / (t.maxHp !== undefined ? t.maxHp : 100)) * 100))}%` }
                                })
                            ]),
                            
                            // Texto HP
                            el('div', { className: "flex justify-between items-center w-full px-1 mt-1 text-[9px] font-black text-slate-300 uppercase tracking-wider" }, [
                                el('span', { className: "text-red-400 font-bold" }, "❤️ PV"),
                                el('span', { className: "font-black" }, `${t.hp !== undefined ? t.hp : 100} / ${t.maxHp !== undefined ? t.maxHp : 100}`)
                            ]),

                            // Botões Rápidos
                            canEdit && el('div', { className: "flex items-center gap-1 mt-1" }, [
                                // Botão -5
                                el('button', {
                                    onClick: (e) => {
                                        e.stopPropagation();
                                        const cur = t.hp !== undefined ? t.hp : 100;
                                        const newVal = Math.max(0, cur - 5);
                                        const newTokens = tokens.map(tok => tok.id === t.id ? { ...tok, hp: newVal } : tok);
                                        updateSessionState({ battlemap: { ...battlemapData, tokens: newTokens } });
                                    },
                                    className: "w-7 h-7 bg-red-950/40 hover:bg-red-600/20 border border-red-500/30 hover:border-red-500 text-red-400 rounded-lg text-[9px] font-black transition-all flex items-center justify-center"
                                }, "-5"),
                                // Botão -1
                                el('button', {
                                    onClick: (e) => {
                                        e.stopPropagation();
                                        const cur = t.hp !== undefined ? t.hp : 100;
                                        const newVal = Math.max(0, cur - 1);
                                        const newTokens = tokens.map(tok => tok.id === t.id ? { ...tok, hp: newVal } : tok);
                                        updateSessionState({ battlemap: { ...battlemapData, tokens: newTokens } });
                                    },
                                    className: "w-7 h-7 bg-red-950/40 hover:bg-red-600/20 border border-red-500/30 hover:border-red-500 text-red-400 rounded-lg text-[9px] font-black transition-all flex items-center justify-center"
                                }, "-1"),
                                // Botão +1
                                el('button', {
                                    onClick: (e) => {
                                        e.stopPropagation();
                                        const cur = t.hp !== undefined ? t.hp : 100;
                                        const max = t.maxHp !== undefined ? t.maxHp : 100;
                                        const newVal = Math.min(max, cur + 1);
                                        const newTokens = tokens.map(tok => tok.id === t.id ? { ...tok, hp: newVal } : tok);
                                        updateSessionState({ battlemap: { ...battlemapData, tokens: newTokens } });
                                    },
                                    className: "w-7 h-7 bg-emerald-950/40 hover:bg-emerald-600/20 border border-emerald-500/30 hover:border-emerald-500 text-emerald-400 rounded-lg text-[9px] font-black transition-all flex items-center justify-center"
                                }, "+1"),
                                // Botão +5
                                el('button', {
                                    onClick: (e) => {
                                        e.stopPropagation();
                                        const cur = t.hp !== undefined ? t.hp : 100;
                                        const max = t.maxHp !== undefined ? t.maxHp : 100;
                                        const newVal = Math.min(max, cur + 5);
                                        const newTokens = tokens.map(tok => tok.id === t.id ? { ...tok, hp: newVal } : tok);
                                        updateSessionState({ battlemap: { ...battlemapData, tokens: newTokens } });
                                    },
                                    className: "w-7 h-7 bg-emerald-950/40 hover:bg-emerald-600/20 border border-emerald-500/30 hover:border-emerald-500 text-emerald-400 rounded-lg text-[9px] font-black transition-all flex items-center justify-center"
                                }, "+5")
                            ]),

                            // Botão Dano Personalizado
                            canEdit && el('button', {
                                onClick: (e) => {
                                    e.stopPropagation();
                                    const amt = prompt("Insira a quantidade de Dano (-) ou Cura (+):");
                                    if (amt !== null && !isNaN(parseInt(amt))) {
                                        const val = parseInt(amt);
                                        const cur = t.hp !== undefined ? t.hp : 100;
                                        const max = t.maxHp !== undefined ? t.maxHp : 100;
                                        const newVal = Math.max(0, Math.min(max, cur + val));
                                        const newTokens = tokens.map(tok => tok.id === t.id ? { ...tok, hp: newVal } : tok);
                                        updateSessionState({ battlemap: { ...battlemapData, tokens: newTokens } });
                                    }
                                },
                                className: "w-full bg-slate-900/60 hover:bg-amber-600 hover:text-slate-950 border border-slate-800 text-slate-300 text-[8px] font-black uppercase py-1.5 rounded-lg transition-all text-center tracking-wider mt-1 flex items-center justify-center gap-1"
                            }, "⚡ Dano / Cura")
                        ]),

                        // Marcadores de Status
                        el('div', {
                            key: 'status-markers',
                            className: "absolute top-0 right-0 flex flex-wrap-reverse gap-0.5 justify-end pointer-events-none z-20"
                        }, (t.status || []).map(s => el('span', { 
                            key: s, 
                            className: "text-lg drop-shadow-md animate-bounce-soft",
                            style: { animationDelay: `${Math.random()}s` }
                        }, STATUS_ICONS[s] || '❓'))),

                        // Nome do Token (Abaixo do Círculo)
                        el('div', {
                            key: 'token-name-label',
                            className: "absolute top-[104%] left-1/2 -translate-x-1/2 bg-slate-950/90 backdrop-blur-sm border border-slate-800/80 px-2.5 py-0.5 rounded-md text-[8px] font-black uppercase tracking-wider text-slate-300 group-hover:text-amber-400 group-hover:border-amber-500/30 shadow-2xl pointer-events-none z-30 transition-all duration-200 select-none max-w-[130px] truncate text-center"
                        }, renderToken.name)
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
            className: `fixed inset-0 z-[500] bg-slate-950/20 backdrop-blur-[2px] ${window.innerWidth < 640 ? 'flex items-center justify-center p-4' : ''}`,
            onClick: () => setContextMenu(null),
            onContextMenu: (e) => { e.preventDefault(); setContextMenu(null); }
        }, [
            el('div', {
                className: "bg-slate-900/95 backdrop-blur-xl border border-amber-500/50 rounded-3xl p-5 md:p-6 shadow-3xl flex flex-col gap-4 w-full sm:w-80 max-h-[85vh] overflow-y-auto animate-slide-up hide-scrollbar",
                style: window.innerWidth < 640 ? {} : { 
                    position: 'absolute',
                    top: Math.min(contextMenu.y, window.innerHeight - 450), 
                    left: Math.min(contextMenu.x, window.innerWidth - 350)
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
                                    const avatar = char?.imageUrl || char?.sheetData?.info?.['Avatar'];
                                    if (avatar) {
                                        const newTokens = tokens.map(tok => tok.id === t.id ? { ...tok, imageUrl: avatar } : tok);
                                        updateSessionState({ battlemap: { ...battlemapData, tokens: newTokens } });
                                    } else {
                                        alert("Nenhum Avatar ou Imagem de Perfil encontrado na ficha deste personagem!");
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

        // --- MENU MOBILE OVERLAY ---
        isMobileMenuOpen && el('div', {
            key: 'mobile-menu-overlay',
            className: "fixed inset-0 z-[1000] bg-slate-950/95 backdrop-blur-xl p-6 flex flex-col gap-6 animate-fade-in",
            onClick: () => setIsMobileMenuOpen(false)
        }, [
            el('div', { key: 'mm-header', className: "flex justify-between items-center mb-4" }, [
                el('h3', { className: "text-2xl font-black text-white italic uppercase tracking-tighter" }, "⚙️ Opções do Mapa"),
                el('button', { onClick: () => setIsMobileMenuOpen(false), className: "text-slate-500 hover:text-white text-3xl transition-colors" }, "×")
            ]),
            
            el('div', { 
                key: 'mm-body',
                className: "flex-grow overflow-y-auto space-y-8 custom-scrollbar",
                onClick: (e) => e.stopPropagation()
            }, [
                // Combate (Master Only)
                mode === 'master' && el('div', { key: 'mm-combat', className: "space-y-3" }, [
                    el('p', { className: "text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em]" }, "🛡️ Combate"),
                    el('button', {
                        onClick: () => { handleNextTurn(); setIsMobileMenuOpen(false); },
                        className: "w-full bg-emerald-600/10 border border-emerald-500/30 p-4 rounded-2xl flex items-center gap-4 text-emerald-400 font-bold"
                    }, ["▶️", "Próximo Turno"])
                ]),

                // Mapa (Master Only)
                mode === 'master' && el('div', { key: 'mm-map', className: "space-y-3" }, [
                    el('p', { className: "text-[10px] font-black text-amber-500 uppercase tracking-[0.2em]" }, "🗺️ Configurações do Mapa"),
                    el('div', { className: "grid grid-cols-2 gap-3" }, [
                        el('button', {
                            onClick: () => { handleUpdateBackground(); setIsMobileMenuOpen(false); },
                            className: "bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col items-center gap-2 text-xs font-bold text-slate-300"
                        }, ["🖼️", "Fundo"]),
                        el('button', {
                            onClick: () => { setIsMapLibraryOpen(true); setIsMobileMenuOpen(false); },
                            className: "bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col items-center gap-2 text-xs font-bold text-slate-300"
                        }, ["📁", "Biblioteca"]),
                        el('button', {
                            onClick: () => { handleUpdateGrid(); setIsMobileMenuOpen(false); },
                            className: "bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col items-center gap-2 text-xs font-bold text-slate-300"
                        }, ["📏", "Grid"]),
                        el('button', {
                            onClick: () => { handleClearTokens(); setIsMobileMenuOpen(false); },
                            className: "bg-red-900/20 border border-red-500/30 p-4 rounded-2xl flex flex-col items-center gap-2 text-xs font-bold text-red-400"
                        }, ["🗑️", "Limpar Tokens"])
                    ])
                ]),

                // Tokens (Everyone)
                el('div', { key: 'mm-tokens', className: "space-y-3" }, [
                    el('p', { className: "text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em]" }, "🎲 Adicionar Entidades"),
                    el('div', { className: "grid grid-cols-2 gap-3" }, [
                        mode === 'master' && el('button', {
                            onClick: () => { handleAddAllPlayers(); setIsMobileMenuOpen(false); },
                            className: "bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col items-center gap-2 text-xs font-bold text-slate-300"
                        }, ["🎲", "Jogadores"]),
                        mode === 'master' && el('button', {
                            onClick: () => { handleAddMonster(); setIsMobileMenuOpen(false); },
                            className: "bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col items-center gap-2 text-xs font-bold text-slate-300"
                        }, ["👹", "Bestiário"]),
                        el('button', {
                            onClick: () => { handleAddNewToken(); setIsMobileMenuOpen(false); },
                            className: "bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col items-center gap-2 text-xs font-bold text-slate-300"
                        }, ["➕", "Novo Token"]),
                        el('button', {
                            onClick: () => { handleAddProp(); setIsMobileMenuOpen(false); },
                            className: "bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col items-center gap-2 text-xs font-bold text-slate-300"
                        }, ["📦", "Objeto/Prop"])
                    ].filter(Boolean))
                ]),

                // Desenhos (Everyone)
                el('div', { key: 'mm-draw', className: "space-y-3" }, [
                    el('p', { className: "text-[10px] font-black text-amber-500 uppercase tracking-[0.2em]" }, "📐 Desenhos"),
                    el('div', { className: "grid grid-cols-3 gap-3" }, [
                        el('button', {
                            onClick: () => { setDrawMode(drawMode === 'cone' ? null : 'cone'); setIsMobileMenuOpen(false); },
                            className: `p-4 rounded-2xl flex flex-col items-center gap-2 text-xs font-bold ${drawMode === 'cone' ? 'bg-amber-500 text-slate-900' : 'bg-slate-900 border border-slate-800 text-slate-300'}`
                        }, "📐 Cone"),
                        el('button', {
                            onClick: () => { setDrawMode(drawMode === 'line' ? null : 'line'); setIsMobileMenuOpen(false); },
                            className: `p-4 rounded-2xl flex flex-col items-center gap-2 text-xs font-bold ${drawMode === 'line' ? 'bg-amber-500 text-slate-900' : 'bg-slate-900 border border-slate-800 text-slate-300'}`
                        }, "➖ Linha"),
                        el('button', {
                            onClick: () => { setDrawMode(drawMode === 'circle' ? null : 'circle'); setIsMobileMenuOpen(false); },
                            className: `p-4 rounded-2xl flex flex-col items-center gap-2 text-xs font-bold ${drawMode === 'circle' ? 'bg-amber-500 text-slate-900' : 'bg-slate-900 border border-slate-800 text-slate-300'}`
                        }, "⭕ Círculo"),
                        mode === 'master' && el('button', {
                            onClick: () => { setDrawMode(drawMode === 'wall' ? null : 'wall'); setIsMobileMenuOpen(false); },
                            className: `p-4 rounded-2xl flex flex-col items-center gap-2 text-xs font-bold ${drawMode === 'wall' ? 'bg-blue-500 text-white' : 'bg-slate-900 border border-slate-800 text-blue-400'}`
                        }, "🧱 Parede"),
                        el('button', {
                            onClick: () => { 
                                if (drawings.length > 0) {
                                    const newDrawings = [...drawings]; newDrawings.pop();
                                    updateSessionState({ battlemap: { ...battlemapData, drawings: newDrawings } });
                                }
                                setIsMobileMenuOpen(false);
                            },
                            className: "bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col items-center gap-2 text-xs font-bold text-slate-400"
                        }, "↩️ Undo"),
                        mode === 'master' && el('button', {
                            onClick: () => { handleClearDrawings(); setIsMobileMenuOpen(false); },
                            className: "bg-red-900/20 border border-red-500/30 p-4 rounded-2xl flex flex-col items-center gap-2 text-xs font-bold text-red-400"
                        }, "🧹 Clear")
                    ].filter(Boolean))
                ]),

                // Névoa (Master Only)
                mode === 'master' && el('div', { key: 'mm-fog', className: "space-y-3" }, [
                    el('p', { className: "text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em]" }, "🌬️ Névoa"),
                    el('div', { className: "grid grid-cols-2 gap-3" }, [
                        el('button', {
                            onClick: () => { setIsFogMode(!isFogMode); setIsMobileMenuOpen(false); },
                            className: `p-4 rounded-2xl flex flex-col items-center gap-2 text-xs font-bold ${isFogMode ? 'bg-indigo-500 text-white' : 'bg-slate-900 border border-slate-800 text-indigo-400'}`
                        }, "🌬️ Ativar"),
                        isFogMode && el('button', {
                            onClick: () => { setFogBrushType(fogBrushType === 'hide' ? 'reveal' : 'hide'); },
                            className: "bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col items-center gap-2 text-xs font-bold text-slate-300"
                        }, [fogBrushType === 'hide' ? "🌑" : "👁️", fogBrushType === 'hide' ? "Pintar" : "Revelar"]),
                        el('button', {
                            onClick: () => { handleClearWalls(); setIsMobileMenuOpen(false); },
                            className: "bg-blue-900/20 border border-blue-500/30 p-4 rounded-2xl flex flex-col items-center gap-2 text-xs font-bold text-blue-400"
                        }, "🧱 Limpar")
                    ].filter(Boolean))
                ]),

                // Câmera
                el('div', { key: 'mm-camera', className: "space-y-3 pb-10" }, [
                    el('p', { className: "text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]" }, "📷 Câmera"),
                    el('div', { className: "grid grid-cols-3 gap-3" }, [
                        el('button', {
                            onClick: () => setCamera(prev => ({ ...prev, scale: Math.max(0.1, prev.scale - 0.2) })),
                            className: "bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col items-center gap-2 text-xs font-bold"
                        }, "➖ Out"),
                        el('button', {
                            onClick: () => setCamera(prev => ({ ...prev, scale: Math.min(10, prev.scale + 0.2) })),
                            className: "bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col items-center gap-2 text-xs font-bold"
                        }, "➕ In"),
                        el('button', {
                            onClick: () => { setCamera({ x: 0, y: 0, scale: 1 }); setIsMobileMenuOpen(false); },
                            className: "bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col items-center gap-2 text-xs font-bold text-amber-500"
                        }, "🎯 Centro")
                    ])
                ])
            ])
        ]),

        // --- MODAL DE BIBLIOTECA DE MAPAS ---
        isMapLibraryOpen && el('div', {
            className: "fixed inset-0 z-[600] bg-slate-950/80 backdrop-blur-xl flex items-center justify-center p-4 md:p-6",
            onClick: () => setIsMapLibraryOpen(false)
        }, [
            el('div', {
                className: "bg-slate-900 border border-slate-800 rounded-[2rem] md:rounded-[2.5rem] w-full max-w-2xl shadow-3xl overflow-hidden flex flex-col max-h-[90vh]",
                onClick: (e) => e.stopPropagation()
            }, [
                el('div', { className: "p-6 md:p-8 border-b border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-indigo-600/5" }, [
                    el('div', null, [
                        el('h2', { className: "text-xl md:text-2xl font-black text-white flex items-center gap-3" }, [
                            el('span', { className: "text-indigo-500" }, "🗺️"), "Biblioteca"
                        ]),
                        el('p', { className: "text-slate-500 text-[10px] mt-1 font-bold uppercase tracking-widest" }, "Gerencie seus cenários")
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
                        className: "w-full md:w-auto bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg active:scale-95"
                    }, "+ Novo Mapa")
                ]),
                el('div', { className: "p-4 md:p-8 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-4 flex-grow" }, maps.map(m => {
                    const isActive = m.id === activeMapId;
                    return el('div', {
                        key: m.id,
                        className: `group relative rounded-2xl md:rounded-3xl border-2 transition-all cursor-pointer overflow-hidden ${
                            isActive ? 'border-indigo-500 ring-4 ring-indigo-500/20' : 'border-slate-800 hover:border-slate-600'
                        }`,
                        onClick: () => {
                            updateSessionState({ battlemap: { ...battlemapData, activeMapId: m.id } });
                        }
                    }, [
                        el('img', { src: m.imageUrl, className: "w-full h-32 md:h-40 object-cover opacity-60 group-hover:opacity-100 transition-opacity" }),
                        el('div', { className: "absolute bottom-0 left-0 right-0 p-3 md:p-4 bg-gradient-to-t from-slate-900 to-transparent" }, [
                            el('h4', { className: "text-xs md:text-sm font-black text-white truncate" }, m.name),
                            el('span', { className: "text-[8px] md:text-[10px] text-slate-400" }, `${m.gridSize}px Grid`)
                        ]),
                        isActive && el('div', { className: "absolute top-3 right-3 md:top-4 md:right-4 bg-indigo-500 text-white text-[8px] md:text-[10px] font-black px-2 md:px-3 py-1 rounded-full" }, "ATIVO"),
                        !isActive && mode === 'master' && el('button', {
                            onClick: (e) => {
                                e.stopPropagation();
                                if (confirm(`Deseja excluir o mapa "${m.name}"?`)) {
                                    const newMaps = maps.filter(map => map.id !== m.id);
                                    updateSessionState({ battlemap: { ...battlemapData, maps: newMaps } });
                                }
                            },
                            className: "absolute top-3 right-3 md:top-4 md:right-4 bg-red-500/20 hover:bg-red-500 text-red-500 hover:text-white w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
                        }, "×")
                    ]);
                })),
                el('div', { className: "p-4 md:p-6 bg-slate-950 flex justify-end" }, [
                    el('button', {
                        onClick: () => setIsMapLibraryOpen(false),
                        className: "w-full md:w-auto bg-slate-800 hover:bg-slate-700 text-slate-400 px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all"
                    }, "Fechar")
                ])
            ]),
        ]),

        renderCreatureSelectorModal()
    ]);
}
