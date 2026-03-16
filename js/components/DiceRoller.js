export function DiceRoller({ rollDice, recentRolls, characterName, isOpen, onClose }) {
    const el = React.createElement;
    const [visibleRolls, setVisibleRolls] = React.useState([]);

    // Sempre que um novo roll é detectado, adiciona aos visíveis e programa sua remoção
    React.useEffect(() => {
        if (recentRolls && recentRolls.length > 0) {
            const latestRoll = recentRolls[0];
            setVisibleRolls(prev => {
                if (prev.find(r => r.id === latestRoll.id)) return prev;
                return [latestRoll, ...prev].slice(0, 4);
            });
            const timer = setTimeout(() => {
                setVisibleRolls(prev => prev.filter(r => r.id !== latestRoll.id));
            }, 4500);
            return () => clearTimeout(timer);
        }
    }, [recentRolls]);

    return el(React.Fragment, null, [
        // --- 1. MENU DE DADOS  ---
        isOpen && el('div', {
            className: "fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] bg-slate-900 border-2 border-amber-500/50 p-4 rounded-3xl shadow-2xl flex flex-col gap-3 animate-fade-in-up"
        }, [
            el('p', { className: "text-[9px] font-black text-amber-500 uppercase tracking-widest text-center" }, "Rolar Dados"),
            el('div', { className: "grid grid-cols-3 gap-2" },
                [20, 12, 10, 8, 6, 4].map(sides =>
                    el('button', {
                        key: sides,
                        onClick: () => { rollDice(sides); onClose(); },
                        className: "bg-slate-800 hover:bg-amber-600 text-white font-black py-2 px-4 rounded-xl transition-all border border-slate-700"
                    }, `d${sides}`)
                )
            )
        ]),

        // --- 2. BALÕES FLUTUANTES ---
        el('div', { className: "fixed bottom-24 right-6 z-50 flex flex-col-reverse gap-3 pointer-events-none" },
            visibleRolls.map((roll) =>
                el('div', {
                    key: roll.id, // Use o ID da rolagem do Firebase
                    className: "bg-slate-900/95 backdrop-blur-md border-2 border-amber-500 p-5 rounded-2xl shadow-2xl animate-bounce-in min-w-[140px]"
                }, [
                    el('div', { className: "flex items-center justify-between mb-1" }, [
                        el('span', { className: "text-[10px] font-black text-amber-500 uppercase" }, roll.playerName === characterName ? "Você" : roll.playerName),
                        el('span', { className: "text-[8px] text-slate-500 font-mono" }, `D${roll.sides}`)
                    ]),
                    el('p', { className: "text-3xl font-black text-center text-white" }, roll.result)
                ])
            )
        )
    ]);
}