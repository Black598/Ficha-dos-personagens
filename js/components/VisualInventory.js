// js/components/VisualInventory.js
import { AudioManager } from '../AudioManager.js';

const { useState } = React;
const el = React.createElement;

export function VisualInventory({ itemsString, onUpdate, onToggleClassic }) {
    const [selectedItem, setSelectedItem] = useState(null);

    // Converte a string de equipamentos em um array limpo
    const items = itemsString ? itemsString.split(',').map(s => s.trim()).filter(s => s && s !== '-') : [];
    
    // Grid fixo de 24 slots (4x6)
    const totalSlots = 24;
    const slots = Array.from({ length: totalSlots });

    const handleRemoveItem = (indexToRemove) => {
        if (!confirm("Deseja descartar este item?")) return;
        const newItems = items.filter((_, idx) => idx !== indexToRemove);
        onUpdate(newItems.join(', '));
        setSelectedItem(null);
        AudioManager.play('click');
    };

    const handleToggleEquip = (index, currentName) => {
        let newName = currentName;
        if (newName.includes('{E}')) {
            newName = newName.replace(/\s*\{E\}\s*/g, ' ').trim();
        } else {
            newName = `${newName} {E}`;
        }

        const newItems = [...items];
        newItems[index] = newName;
        onUpdate(newItems.join(', '));
        setSelectedItem({ ...selectedItem, name: newName });
        AudioManager.play('armor');
    };

    const handleSetBonus = (index, currentName) => {
        const bonusStr = prompt("Defina os bônus do item (Ex: CA:+2, FOR:+1, Atletismo:+3):");
        if (bonusStr === null) return;

        // Limpa bônus anteriores (...)
        let cleanName = currentName.replace(/\s*\(.*?\)\s*/g, ' ').trim();
        
        // Formata os novos bônus
        const formattedBonus = bonusStr.split(',').map(b => {
            const parts = b.split(':');
            if (parts.length !== 2) return null;
            return `(${parts[0].trim()}:${parts[1].trim()})`;
        }).filter(Boolean).join(' ');

        const newName = formattedBonus ? `${cleanName} ${formattedBonus}` : cleanName;

        const newItems = [...items];
        newItems[index] = newName;
        onUpdate(newItems.join(', '));
        setSelectedItem({ ...selectedItem, name: newName });
        AudioManager.play('sparkle');
    };

    const parseItem = (fullName) => {
        const isEquipped = fullName.includes('{E}');
        // Remove metadados do nome de exibição
        let name = fullName.replace(/\s*\[.*?\]\s*/g, ' ')
                           .replace(/\s*\{E\}\s*/g, ' ')
                           .replace(/\s*\(.*?\)\s*/g, ' ')
                           .trim();
        
        const emojiMatch = fullName.match(/\[(.*?)\]/);
        const bonusMatch = [...fullName.matchAll(/\((.*?):(.*?)\)/g)].map(m => ({ key: m[1], val: m[2] }));

        return { 
            displayName: name, 
            customIcon: emojiMatch ? emojiMatch[1] : null,
            isEquipped,
            bonuses: bonusMatch
        };
    };

    const getItemIcon = (fullName) => {
        const { customIcon, displayName: name } = parseItem(fullName);
        if (customIcon) return customIcon;

        const n = name.toLowerCase();
        // (rest of the icon logic stays the same)
        if (n.includes('espada') || n.includes('cimitarra') || n.includes('rapière') || n.includes('lâmina') || n.includes('katana')) return '⚔️';
        if (n.includes('machado') || n.includes('alabarda')) return '🪓';
        if (n.includes('arco') || n.includes('besta') || n.includes('flecha') || n.includes('aljava')) return '🏹';
        if (n.includes('daga') || n.includes('punhal') || n.includes('faca')) return '🗡️';
        if (n.includes('martelo') || n.includes('maça') || n.includes('mangual')) return '🔨';
        if (n.includes('cajado') || n.includes('cetro') || n.includes('varinha')) return '🪄';
        if (n.includes('escudo')) return '🛡️';
        if (n.includes('armadura') || n.includes('cota') || n.includes('couraça') || n.includes('placas')) return '🛡️';
        if (n.includes('túnica') || n.includes('manto') || n.includes('capa') || n.includes('veste')) return '🧥';
        if (n.includes('bota') || n.includes('sapato') || n.includes('sandália')) return '🥾';
        if (n.includes('luva') || n.includes('manopla')) return '🧤';
        if (n.includes('elmo') || n.includes('capacete') || n.includes('tiara') || n.includes('coroa')) return '🪖';
        if (n.includes('poção') || n.includes('elixir') || n.includes('frasco') || n.includes('tônico') || n.includes('soro')) return '🧪';
        if (n.includes('veneno') || n.includes('ácido') || n.includes('óleo')) return '🧴';
        if (n.includes('comida') || n.includes('ração') || n.includes('pão') || n.includes('fruta') || n.includes('carne')) return '🍖';
        if (n.includes('vinho') || n.includes('cerveja') || n.includes('água') || n.includes('bebida')) return '🍺';
        if (n.includes('erva') || n.includes('flor') || n.includes('raiz')) return '🌿';
        if (n.includes('anel')) return '💍';
        if (n.includes('amuleto') || n.includes('colar') || n.includes('medalhão') || n.includes('pingente')) return '📿';
        if (n.includes('ouro') || n.includes('moeda') || n.includes('po') || n.includes('pepita')) return '💰';
        if (n.includes('joia') || n.includes('gema') || n.includes('diamante') || n.includes('rubi') || n.includes('esmeralda')) return '💎';
        if (n.includes('chave')) return '🔑';
        if (n.includes('baú') || n.includes('caixa')) return '📦';
        if (n.includes('pergaminho') || n.includes('papiro')) return '📜';
        if (n.includes('livro') || n.includes('grimório') || n.includes('tomo') || n.includes('diário')) return '📖';
        if (n.includes('mapa') || n.includes('carta')) return '🗺️';
        if (n.includes('pena') || n.includes('tinteiro')) return '✒️';
        if (n.includes('tocha') || n.includes('lanterna') || n.includes('vela')) return '🔦';
        if (n.includes('corda') || n.includes('algemas')) return '🪢';
        if (n.includes('ferramenta') || n.includes('kit') || n.includes('gazua')) return '🛠️';
        if (n.includes('instrumento') || n.includes('lira') || n.includes('flauta') || n.includes('tambor')) return '🪕';
        if (n.includes('mochila') || n.includes('bolsa') || n.includes('saco')) return '🎒';
        if (n.includes('baralho') || n.includes('dado') || n.includes('jogo')) return '🎲';
        return '📦';
    };

    return el('div', { className: "flex flex-col gap-6" }, [
        // Grid de Slots
        el('div', { className: "grid grid-cols-4 md:grid-cols-6 gap-3" }, 
            slots.map((_, idx) => {
                const item = items[idx];
                const isEmpty = !item;
                const { displayName, isEquipped } = parseItem(item || "");

                return el('div', {
                    key: `slot-${idx}`,
                    onClick: () => !isEmpty && setSelectedItem({ name: item, index: idx }),
                    className: `
                        aspect-square rounded-2xl border-2 flex items-center justify-center relative transition-all group
                        ${isEmpty ? 'border-slate-800/50 bg-slate-950/20' : 'border-amber-500/30 bg-slate-900 shadow-lg cursor-pointer hover:border-amber-500 hover:scale-105'}
                        ${selectedItem?.index === idx ? 'ring-2 ring-amber-500 border-amber-500 bg-amber-500/10' : ''}
                        ${isEquipped ? 'border-amber-500 ring-2 ring-amber-500/20' : ''}
                    `
                }, [
                    !isEmpty && el('span', { className: "text-2xl drop-shadow-md" }, getItemIcon(item)),
                    isEquipped && el('div', { className: "absolute top-1 right-1 w-2 h-2 bg-amber-500 rounded-full animate-pulse" }),
                    
                    // Tooltip
                    !isEmpty && el('div', { 
                        className: "absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-black px-2 py-1 rounded border border-slate-700 pointer-events-none opacity-0 group-hover:opacity-100 whitespace-nowrap z-50 transition-opacity uppercase" 
                    }, displayName)
                ]);
            })
        ),

        // Painel de Detalhes
        selectedItem && (() => {
            const { displayName, isEquipped, bonuses } = parseItem(selectedItem.name);
            return el('div', { className: "bg-slate-950/60 border border-amber-500/30 p-5 rounded-[2rem] animate-slide-up space-y-4 shadow-2xl" }, [
                el('div', { className: "flex justify-between items-start" }, [
                    el('div', { className: "flex items-center gap-4" }, [
                        el('button', {
                            onClick: () => handleSetCustomIcon(selectedItem.index, selectedItem.name),
                            className: "w-14 h-14 bg-amber-500/10 hover:bg-amber-500/20 rounded-2xl flex items-center justify-center text-3xl border border-amber-500/20 transition-all group/icon relative",
                            title: "Mudar ícone"
                        }, [
                            getItemIcon(selectedItem.name),
                            el('span', { className: "absolute -bottom-1 -right-1 text-[10px] opacity-0 group-hover/icon:opacity-100 transition-opacity" }, "✏️")
                        ]),
                        el('div', null, [
                            el('p', { className: "text-amber-500 font-black uppercase text-[8px] tracking-[0.2em]" }, isEquipped ? "🛡️ Equipado" : "🎒 Na Mochila"),
                            el('h5', { className: "text-white font-black text-lg tracking-tight" }, displayName)
                        ])
                    ]),
                    el('button', {
                        onClick: () => setSelectedItem(null),
                        className: "text-slate-600 hover:text-white transition-colors"
                    }, "✕")
                ]),

                // Lista de Bônus Ativos
                bonuses.length > 0 && el('div', { className: "flex flex-wrap gap-2" }, 
                    bonuses.map((b, i) => el('span', { key: i, className: "bg-amber-500/10 text-amber-500 text-[8px] font-black px-2 py-1 rounded-lg border border-amber-500/20 uppercase" }, 
                        `${b.key}: ${b.val}`
                    ))
                ),

                // Ações
                el('div', { className: "grid grid-cols-2 md:grid-cols-4 gap-2 pt-2 border-t border-slate-800/50" }, [
                    el('button', {
                        onClick: () => handleToggleEquip(selectedItem.index, selectedItem.name),
                        className: `px-4 py-3 rounded-xl text-[9px] font-black uppercase transition-all border ${isEquipped ? 'bg-amber-600 text-slate-950 border-amber-400' : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'}`
                    }, isEquipped ? "Desequipar" : "Equipar"),
                    
                    el('button', {
                        onClick: () => handleSetBonus(selectedItem.index, selectedItem.name),
                        className: "bg-slate-800 hover:bg-slate-700 text-slate-400 px-4 py-3 rounded-xl border border-slate-700 text-[9px] font-black uppercase transition-all"
                    }, "Definir Bônus"),

                    el('button', {
                        onClick: () => handleRemoveItem(selectedItem.index),
                        className: "bg-red-900/20 hover:bg-red-600 text-red-500 hover:text-white px-4 py-3 rounded-xl border border-red-500/30 text-[9px] font-black uppercase transition-all"
                    }, "Descartar"),

                    el('button', {
                        onClick: () => setSelectedItem(null),
                        className: "hidden md:block bg-slate-900 hover:bg-slate-800 text-slate-500 px-4 py-3 rounded-xl text-[9px] font-black uppercase transition-all"
                    }, "Fechar")
                ])
            ]);
        })(),


        // Rodapé com Troca de Visão
        el('div', { className: "flex justify-between items-center mt-2 border-t border-slate-800/50 pt-4" }, [
            el('p', { className: "text-[9px] text-slate-500 font-bold uppercase tracking-widest" }, 
                `Ocupado: ${items.length} / ${totalSlots} slots`
            ),
            el('button', {
                onClick: onToggleClassic,
                className: "text-amber-500/50 hover:text-amber-500 text-[9px] font-black uppercase tracking-widest flex items-center gap-2 transition-all"
            }, [el('span', null, "⌨️"), "Editar como Texto"])
        ])
    ]);
}
