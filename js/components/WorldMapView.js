const { useState, useRef, useEffect } = React;
const el = React.createElement;
import { parseImageUrl } from '../utils.js';

export function WorldMapView({ mode, worldMapData, updateSessionState, onBack, battlemaps = [], onOpenBattlemap }) {
    // Estado da Câmera (Pan & Zoom)
    const [camera, setCamera] = useState({ x: 0, y: 0, scale: 1 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    
    // Estado dos Pins
    const [selectedPin, setSelectedPin] = useState(null);
    const [isAddingPin, setIsAddingPin] = useState(false);

    const containerRef = useRef(null);
    const mapRef = useRef(null);

    const pins = worldMapData?.pins || [];
    const mapImageUrl = worldMapData?.imageUrl || 'https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&q=80&w=2000'; // Placeholder Atlas

    // --- ZOOM ---
    const handleWheel = (e) => {
        e.preventDefault();
        const zoomSpeed = 0.001;
        const delta = -e.deltaY;
        const newScale = Math.min(Math.max(camera.scale + delta * zoomSpeed, 0.1), 5);
        setCamera(prev => ({ ...prev, scale: newScale }));
    };

    // --- PAN ---
    const handlePointerDown = (e) => {
        const isTouch = e.pointerType === 'touch';
        if (e.button === 1 || e.button === 2 || ((e.button === 0 || isTouch) && !isAddingPin)) {
            setIsDragging(true);
            setDragStart({ x: e.clientX, y: e.clientY });
        } else if (e.button === 0 && isAddingPin) {
            // Adicionar novo Pin
            const rect = mapRef.current.getBoundingClientRect();
            const worldX = (e.clientX - rect.left) / camera.scale;
            const worldY = (e.clientY - rect.top) / camera.scale;
            
            const name = prompt("Nome do Local:");
            if (!name) {
                setIsAddingPin(false);
                return;
            }
            
            const newPin = {
                id: `pin_${Date.now()}`,
                name,
                description: prompt("Descrição/Lore:"),
                x: worldX,
                y: worldY,
                icon: '📍',
                linkedBattlemapId: null
            };
            
            updateSessionState({ 
                worldMap: { ...worldMapData, pins: [...pins, newPin] } 
            });
            setIsAddingPin(false);
        }
    };

    const handlePointerMove = (e) => {
        if (isDragging) {
            const dx = e.clientX - dragStart.x;
            const dy = e.clientY - dragStart.y;
            setCamera(prev => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
            setDragStart({ x: e.clientX, y: e.clientY });
        }
    };

    const handlePointerUp = () => setIsDragging(false);

    return el('div', { 
        className: "fixed inset-0 z-[400] bg-[#1a1410] flex flex-col overflow-hidden select-none font-serif touch-none",
        onWheel: handleWheel,
        onPointerMove: handlePointerMove,
        onPointerUp: handlePointerUp,
        onContextMenu: (e) => e.preventDefault()
    }, [
        // --- TOOLBAR ---
        el('div', { className: "absolute top-6 left-6 right-6 z-[410] flex justify-between items-center pointer-events-none" }, [
            el('div', { className: "flex gap-3 pointer-events-auto" }, [
                el('button', {
                    onClick: onBack,
                    className: "bg-orange-950/80 backdrop-blur-md text-orange-200 p-4 rounded-2xl border border-orange-500/30 hover:bg-orange-900 transition-all shadow-xl group"
                }, [
                    el('span', { className: "text-xl group-hover:-translate-x-1 inline-block transition-transform" }, "←"),
                    el('span', { className: "ml-2 font-black uppercase text-xs tracking-widest" }, "Voltar")
                ]),
                mode === 'master' && el('button', {
                    onClick: () => {
                        const url = prompt("URL da Imagem do Mapa Mundi:", mapImageUrl);
                        if (url) updateSessionState({ worldMap: { ...worldMapData, imageUrl: parseImageUrl(url) } });
                    },
                    className: "bg-orange-950/80 backdrop-blur-md text-orange-200 px-6 rounded-2xl border border-orange-500/30 hover:bg-orange-900 font-black text-xs uppercase tracking-widest"
                }, "🖼️ Trocar Mapa")
            ]),

            el('div', { className: "bg-orange-950/90 backdrop-blur-md px-8 py-3 rounded-3xl border border-orange-500/40 shadow-2xl flex items-center gap-6 pointer-events-auto" }, [
                el('button', { onClick: () => setCamera(prev => ({ ...prev, scale: Math.max(0.1, prev.scale - 0.2) })), className: "text-orange-500 hover:text-orange-200 text-lg font-black", title: "Afastar (-)" }, "➖"),
                el('h1', { className: "text-orange-200 text-xl font-black uppercase tracking-[0.4em] drop-shadow-lg hidden sm:block" }, "Atlas"),
                el('button', { onClick: () => setCamera(prev => ({ ...prev, scale: Math.min(5, prev.scale + 0.2) })), className: "text-orange-500 hover:text-orange-200 text-lg font-black", title: "Aproximar (+)" }, "➕")
            ]),

            el('div', { className: "flex gap-3 pointer-events-auto" }, [
                mode === 'master' && el('button', {
                    onClick: () => setIsAddingPin(!isAddingPin),
                    className: `px-6 rounded-2xl border font-black text-xs uppercase tracking-widest transition-all ${
                        isAddingPin ? 'bg-orange-500 text-white border-orange-400 animate-pulse' : 'bg-orange-950/80 text-orange-200 border-orange-500/30 hover:bg-orange-900'
                    }`
                }, isAddingPin ? "Clique no Mapa..." : "📍 Adicionar Ponto")
            ])
        ]),

        // --- MAP CANVAS ---
        el('div', { 
            ref: containerRef,
            className: "flex-1 relative cursor-grab active:cursor-grabbing overflow-hidden",
            onPointerDown: handlePointerDown
        }, [
            el('div', {
                ref: mapRef,
                className: "absolute origin-top-left transition-transform duration-75 ease-out",
                style: {
                    transform: `translate(${camera.x}px, ${camera.y}px) scale(${camera.scale})`,
                }
            }, [
                // Imagem do Mapa
                el('img', { 
                    src: mapImageUrl,
                    // max-w-none e width-auto são essenciais para evitar que o mobile encolha a imagem via CSS
                    className: "max-w-none shadow-[0_0_100px_rgba(0,0,0,0.5)] border-4 border-orange-900/50",
                    style: { width: 'auto', height: 'auto' },
                    onLoad: (e) => {
                        // Centralizar mapa inicialmente usando dimensões NATURAIS
                        const img = e.target;
                        setCamera({ 
                            x: (window.innerWidth - img.naturalWidth) / 2, 
                            y: (window.innerHeight - img.naturalHeight) / 2, 
                            scale: 0.8 
                        });
                    }
                }),

                // Pins (Marcadores)
                pins.map(pin => el('div', {
                    key: pin.id,
                    className: "absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer group",
                    style: { left: `${pin.x}px`, top: `${pin.y}px` },
                    onClick: (e) => { e.stopPropagation(); setSelectedPin(pin); }
                }, [
                    // Visual do Pin
                    el('div', { className: "relative" }, [
                        el('div', { className: "text-3xl drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)] group-hover:scale-125 transition-transform" }, pin.icon || '📍'),
                        el('div', { className: "absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-orange-950/90 text-orange-100 text-[10px] font-black uppercase px-2 py-1 rounded border border-orange-500/30 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity" }, pin.name)
                    ])
                ]))
            ])
        ]),

        // --- PIN DETAILS OVERLAY ---
        selectedPin && el('div', {
            className: "fixed inset-0 z-[500] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6",
            onClick: () => setSelectedPin(null)
        }, [
            el('div', {
                className: "bg-[#2a1e16] border-2 border-orange-500/40 rounded-[2.5rem] w-full max-w-lg shadow-[0_0_100px_rgba(0,0,0,0.8)] overflow-hidden animate-slide-up",
                onClick: (e) => e.stopPropagation()
            }, [
                el('div', { className: "p-10" }, [
                    el('div', { className: "flex items-start justify-between mb-6" }, [
                        el('div', null, [
                            el('span', { className: "text-4xl" }, selectedPin.icon || '📍'),
                            el('h2', { className: "text-3xl font-black text-orange-200 mt-2 tracking-tight" }, selectedPin.name)
                        ]),
                        el('button', { 
                            onClick: () => setSelectedPin(null),
                            className: "text-orange-500/50 hover:text-orange-200 text-2xl transition-colors"
                        }, "×")
                    ]),
                    
                    el('div', { className: "space-y-6" }, [
                        el('div', null, [
                            el('p', { className: "text-xs font-black text-orange-500 uppercase tracking-widest mb-2" }, "📖 Descrição & Lore"),
                            el('div', { className: "bg-black/20 p-5 rounded-2xl border border-orange-900/30 text-orange-100/80 leading-relaxed italic" }, 
                                selectedPin.description || "Nenhuma informação disponível sobre este local ainda."
                            )
                        ]),

                        el('div', { className: "flex gap-3" }, [
                            selectedPin.linkedBattlemapId && el('button', {
                                onClick: () => {
                                    onOpenBattlemap(selectedPin.linkedBattlemapId);
                                    setSelectedPin(null);
                                },
                                className: "flex-1 bg-orange-600 hover:bg-orange-500 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg active:scale-95"
                            }, "⚔️ Viajar para Local"),
                            
                            mode === 'master' && el('button', {
                                onClick: () => {
                                    const mapId = prompt("ID do Mapa de Batalha para linkar (ou deixe vazio):", selectedPin.linkedBattlemapId || '');
                                    const newPins = pins.map(p => p.id === selectedPin.id ? { ...p, linkedBattlemapId: mapId } : p);
                                    updateSessionState({ worldMap: { ...worldMapData, pins: newPins } });
                                    setSelectedPin({ ...selectedPin, linkedBattlemapId: mapId });
                                },
                                className: "flex-1 bg-orange-950 hover:bg-orange-900 text-orange-200 py-4 rounded-2xl border border-orange-500/30 font-black text-xs uppercase tracking-widest transition-all"
                            }, "🔗 Vincular VTT"),

                            mode === 'master' && el('button', {
                                onClick: () => {
                                    if(confirm("Excluir este ponto do mapa?")) {
                                        const newPins = pins.filter(p => p.id !== selectedPin.id);
                                        updateSessionState({ worldMap: { ...worldMapData, pins: newPins } });
                                        setSelectedPin(null);
                                    }
                                },
                                className: "w-16 bg-red-900/20 hover:bg-red-600 text-red-500 hover:text-white py-4 rounded-2xl border border-red-500/30 transition-all flex items-center justify-center"
                            }, "🗑️")
                        ])
                    ])
                ])
            ])
        ]),

        // --- FOOTER INFO ---
        el('div', { className: "absolute bottom-6 left-6 text-orange-500/40 text-[10px] font-black uppercase tracking-[0.2em]" }, [
            "Sistema de Navegação Atlas v1.0 • Role para Zoom • Arraste para Mover"
        ])
    ]);
}
