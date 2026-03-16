// js/components/LoadingScreen.js
const el = React.createElement;

export function LoadingScreen() {
    return el('div', { 
        className: "min-h-screen bg-slate-950 flex flex-col items-center justify-center text-amber-500 font-mono space-y-4" 
    }, [
        el('div', { key: 'spinner', className: "w-16 h-16 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin" }),
        el('p', { key: 'text', className: "tracking-[0.3em] font-black uppercase animate-pulse" }, "CARREGANDO REINO...")
    ]);
}
