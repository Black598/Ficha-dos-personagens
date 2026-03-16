// js/components/TalentTooltip.js
const el = React.createElement;

export function TalentTooltip({ tooltip }) {
    if (!tooltip.show) return null;

    return el('div', {
        className: "fixed z-[9999] pointer-events-none bg-slate-900 border-2 border-amber-500/50 p-5 rounded-3xl shadow-2xl w-72 animate-fade-in",
        style: {
            left: Math.min(tooltip.x + 20, window.innerWidth - 300),
            top: tooltip.above
                ? tooltip.y - 240
                : Math.min(tooltip.y + 20, window.innerHeight - 200),
        }
    }, [
        el('div', { className: "flex items-center gap-2 mb-2", key: 't-header' }, [
            el('span', { key: 't-star' }, "⭐"),
            el('p', { className: "text-amber-500 font-black uppercase text-xs tracking-tighter", key: 't-title' },
                `${tooltip.content?.talentName} - NV ${tooltip.content?.lv}`
            )
        ]),
        el('p', { className: "text-[11px] text-slate-300 italic mb-4 leading-relaxed", key: 't-desc' },
            `"${tooltip.content?.desc}"`
        ),
        el('div', { className: "space-y-2 border-t border-slate-800 pt-3", key: 't-footer' }, [
            el('div', { className: "bg-red-950/30 p-2 rounded-xl border border-red-900/30", key: 't-req-box' }, [
                el('p', { className: "text-[9px] font-black text-red-500 uppercase mb-1", key: 't-req-lab' }, "Requisito:"),
                el('p', { className: "text-red-200 text-[10px] font-bold", key: 't-req-val' }, tooltip.content?.req)
            ]),
            el('div', { className: "bg-green-950/30 p-2 rounded-xl border border-green-900/30", key: 't-eff-box' }, [
                el('p', { className: "text-[9px] font-black text-green-500 uppercase mb-1", key: 't-eff-lab' }, "Efeito:"),
                el('p', { className: "text-green-200 text-[10px] font-black", key: 't-eff-val' }, tooltip.content?.effect)
            ])
        ])
    ]);
}
