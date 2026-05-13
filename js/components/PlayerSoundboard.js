import { AudioManager } from '../AudioManager.js';

const { useState, useEffect } = React;

export function PlayerSoundboard({ characterSheetData, onUpdateSheet, sessionState, updateSessionState, isMaster, characterName }) {
    const el = React.createElement;
    const [isAdding, setIsAdding] = useState(false);
    const [newSound, setNewSound] = useState({ name: '', url: '', icon: '🔊' });
    const [previewAudio, setPreviewAudio] = useState(null);

    // O soundboard fica salvo na ficha do personagem ou no estado global por personagem
    const soundboard = characterSheetData?.soundboard || [];

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 2 * 1024 * 1024) { // Limite de 2MB para base64 razoável
            alert("Arquivo muito grande! Tente um arquivo menor que 2MB.");
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            const base64 = event.target.result;
            // Verificar duração (estimativa simples)
            const audio = new Audio(base64);
            audio.onloadedmetadata = () => {
                if (audio.duration > 21) { // 20s + margem
                    alert("O som deve ter no máximo 20 segundos!");
                    return;
                }
                setNewSound({ ...newSound, url: base64, name: file.name.split('.')[0] });
            };
        };
        reader.readAsDataURL(file);
    };

    const handleAddSound = async () => {
        if (!newSound.name || !newSound.url) {
            alert("Preencha o nome e o som (link ou arquivo)!");
            return;
        }

        const updatedSoundboard = [...soundboard, { ...newSound, id: Date.now() }];
        await onUpdateSheet({ soundboard: updatedSoundboard });
        setNewSound({ name: '', url: '', icon: '🔊' });
        setIsAdding(false);
        AudioManager.play('click');
    };

    const handleRemoveSound = async (id) => {
        const updatedSoundboard = soundboard.filter(s => s.id !== id);
        await onUpdateSheet({ soundboard: updatedSoundboard });
    };

    const playSound = async (sound) => {
        // Para que todos ouçam, enviamos para o sessionState
        // O app.js deve observar sessionState.globalSFX e tocar
        await updateSessionState({ 
            globalSFX: { 
                url: sound.url, 
                sender: characterName, 
                timestamp: Date.now(),
                label: sound.name 
            } 
        });
    };

    return el('div', { className: "p-6 bg-slate-900/40 rounded-[2.5rem] border border-slate-800 space-y-6" }, [
        el('div', { className: "flex justify-between items-center" }, [
            el('div', {}, [
                el('h3', { className: "text-amber-500 font-black uppercase text-[10px] tracking-widest" }, "🔊 Seu Soundpad"),
                el('p', { className: "text-[9px] text-slate-500 italic" }, "Sons de até 20s ouvidos por todos")
            ]),
            el('button', {
                onClick: () => setIsAdding(!isAdding),
                className: `w-10 h-10 rounded-full flex items-center justify-center transition-all ${isAdding ? 'bg-red-500 text-white rotate-45' : 'bg-amber-600 text-slate-900 hover:scale-110'}`
            }, "+")
        ]),

        isAdding && el('div', { className: "bg-slate-950/80 p-6 rounded-3xl border border-amber-500/20 space-y-4 animate-in slide-in-from-top-4" }, [
            el('div', { className: "grid grid-cols-1 md:grid-cols-2 gap-4" }, [
                el('div', { className: "space-y-2" }, [
                    el('p', { className: "text-[8px] font-black text-slate-500 uppercase px-2" }, "Nome do Grito/Som"),
                    el('input', {
                        placeholder: "Ex: Grito de Guerra",
                        value: newSound.name,
                        onChange: e => setNewSound({ ...newSound, name: e.target.value }),
                        className: "w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-amber-500/50"
                    })
                ]),
                el('div', { className: "space-y-2" }, [
                    el('p', { className: "text-[8px] font-black text-slate-500 uppercase px-2" }, "Ícone (Emoji)"),
                    el('input', {
                        placeholder: "⚔️",
                        value: newSound.icon,
                        onChange: e => setNewSound({ ...newSound, icon: e.target.value }),
                        className: "w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-amber-500/50 text-center"
                    })
                ])
            ]),
            el('div', { className: "space-y-2" }, [
                el('p', { className: "text-[8px] font-black text-slate-500 uppercase px-2" }, "Link MP3 ou Subir Arquivo"),
                el('div', { className: "flex gap-2" }, [
                    el('input', {
                        placeholder: "https://...audio.mp3",
                        value: newSound.url.startsWith('data:') ? 'Arquivo Carregado ✓' : newSound.url,
                        disabled: newSound.url.startsWith('data:'),
                        onChange: e => setNewSound({ ...newSound, url: e.target.value }),
                        className: "flex-grow bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-amber-500/50"
                    }),
                    el('label', { className: "bg-slate-800 hover:bg-slate-700 px-4 flex items-center justify-center rounded-xl cursor-pointer text-xl" }, [
                        "📁",
                        el('input', { type: 'file', accept: 'audio/*', onChange: handleFileUpload, className: "hidden" })
                    ])
                ])
            ]),
            el('button', {
                onClick: handleAddSound,
                className: "w-full bg-amber-600 hover:bg-amber-500 text-slate-900 font-black py-4 rounded-2xl uppercase text-[10px] tracking-widest transition-all shadow-lg active:scale-95"
            }, "Adicionar ao Soundpad")
        ]),

        el('div', { className: "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4" }, 
            soundboard.length === 0 ? 
            el('div', { className: "col-span-full py-8 text-center text-slate-700 text-[10px] uppercase tracking-widest border border-dashed border-slate-800 rounded-3xl" }, "Nenhum som customizado...") :
            soundboard.map(sound => el('div', { key: sound.id, className: "group relative" }, [
                el('button', {
                    onClick: () => playSound(sound),
                    className: "w-full bg-slate-800/50 hover:bg-amber-600/20 border border-slate-800 hover:border-amber-500/50 p-4 rounded-2xl flex flex-col items-center gap-2 transition-all active:scale-95 shadow-lg"
                }, [
                    el('span', { className: "text-2xl" }, sound.icon),
                    el('span', { className: "text-[9px] font-black uppercase text-slate-300 group-hover:text-amber-500 truncate w-full text-center" }, sound.name)
                ]),
                el('button', {
                    onClick: (e) => { e.stopPropagation(); handleRemoveSound(sound.id); },
                    className: "absolute -top-1 -right-1 w-5 h-5 bg-red-600 text-white rounded-full text-[8px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                }, "×")
            ]))
        )
    ]);
}
