// js/components/MasterVault.js
const { useState, useEffect } = React;
const el = React.createElement;

export function MasterVault({ onClose, geminiApiKey, setGeminiApiKey, currentAppId }) {
    const [loading, setLoading] = useState(true);
    const [isFirstTime, setIsFirstTime] = useState(false);
    const [unlocked, setUnlocked] = useState(false);
    
    // Auth inputs
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    
    // Vault Data
    const [vaultUser, setVaultUser] = useState('');
    const [vaultPass, setVaultPass] = useState('');
    const [secretNotes, setSecretNotes] = useState('');
    
    const [errorMsg, setErrorMsg] = useState('');
    const db = firebase.firestore();
    const vaultRef = db.collection('artifacts').doc(currentAppId).collection('public').doc('data').collection('global').doc('vault');

    useEffect(() => {
        vaultRef.get().then(doc => {
            if (doc.exists) {
                const data = doc.data();
                if (!data.username || !data.password) {
                    setIsFirstTime(true);
                } else {
                    setVaultUser(data.username);
                    setVaultPass(data.password);
                    setSecretNotes(data.secretNotes || '');
                    // We don't auto-unlock, they must type it.
                }
            } else {
                setIsFirstTime(true);
            }
            setLoading(false);
        }).catch(e => {
            console.error(e);
            setErrorMsg("Erro ao conectar com o Cofre.");
            setLoading(false);
        });
    }, []);

    const handleLogin = async (e) => {
        e.preventDefault();
        if (isFirstTime) {
            if (!username || !password) {
                setErrorMsg("Preencha ambos os campos para criar o cofre.");
                return;
            }
            setLoading(true);
            const newData = {
                username,
                password,
                secretNotes: '',
                geminiApiKey: geminiApiKey || ''
            };
            await vaultRef.set(newData);
            setVaultUser(username);
            setVaultPass(password);
            setIsFirstTime(false);
            setUnlocked(true);
            setLoading(false);
        } else {
            if (username === vaultUser && password === vaultPass) {
                setUnlocked(true);
                setErrorMsg('');
                // Fetch the actual data now that we unlocked it
                const doc = await vaultRef.get();
                if (doc.exists) {
                    const data = doc.data();
                    setSecretNotes(data.secretNotes || '');
                    if (data.geminiApiKey && data.geminiApiKey !== geminiApiKey) {
                        setGeminiApiKey(data.geminiApiKey);
                    }
                }
            } else {
                setErrorMsg("Credenciais Incorretas!");
            }
        }
    };

    const handleSaveVault = async () => {
        setLoading(true);
        await vaultRef.set({
            username: vaultUser,
            password: vaultPass,
            secretNotes,
            geminiApiKey
        }, { merge: true });
        setLoading(false);
        onClose();
    };

    if (loading) {
        return el('div', { className: "fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm" },
            el('div', { className: "text-amber-500 text-2xl animate-spin" }, "⚙️")
        );
    }

    return el('div', { className: "fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in" },
        el('div', { className: "bg-slate-950 border-2 border-amber-500/30 rounded-[2rem] w-full max-w-md shadow-[0_0_50px_rgba(245,158,11,0.15)] flex flex-col overflow-hidden relative" },
            
            // Header
            el('div', { className: "bg-slate-900/80 p-6 border-b border-slate-800 flex justify-between items-center" },
                el('h2', { className: "text-xl md:text-2xl font-black text-amber-500 uppercase italic tracking-tighter flex items-center gap-3" },
                    el('span', { className: "text-2xl" }, unlocked ? "🔓" : "🔒"),
                    "O Cofre do Mestre"
                ),
                el('button', {
                    onClick: onClose,
                    className: "text-slate-400 hover:text-red-400 transition-colors text-xl font-black"
                }, "✕")
            ),

            // Content
            el('div', { className: "p-8 flex flex-col gap-6" },
                !unlocked ? 
                    // TELA DE LOGIN / SETUP
                    el('form', { onSubmit: handleLogin, className: "flex flex-col gap-4" },
                        isFirstTime && el('p', { className: "text-sm text-emerald-400 font-bold mb-2 text-center" }, 
                            "Bem-vindo! Crie seu Usuário e Senha para trancar este Cofre pela primeira vez."
                        ),
                        !isFirstTime && el('p', { className: "text-sm text-slate-400 text-center" }, 
                            "Digite suas credenciais para acessar os segredos da campanha."
                        ),
                        el('div', { className: "flex flex-col gap-1" },
                            el('label', { className: "text-[10px] font-black uppercase text-slate-500 tracking-widest" }, "Usuário"),
                            el('input', {
                                type: "text",
                                value: username,
                                onChange: e => setUsername(e.target.value),
                                className: "bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:border-amber-500 outline-none",
                                required: true
                            })
                        ),
                        el('div', { className: "flex flex-col gap-1" },
                            el('label', { className: "text-[10px] font-black uppercase text-slate-500 tracking-widest" }, "Senha"),
                            el('input', {
                                type: "password",
                                value: password,
                                onChange: e => setPassword(e.target.value),
                                className: "bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:border-amber-500 outline-none",
                                required: true
                            })
                        ),
                        errorMsg && el('p', { className: "text-red-500 text-xs font-bold text-center animate-pulse" }, errorMsg),
                        el('button', {
                            type: "submit",
                            className: "mt-4 bg-amber-600 hover:bg-amber-500 text-white font-black uppercase tracking-widest p-4 rounded-xl shadow-lg transition-all"
                        }, isFirstTime ? "Trancar Cofre" : "Destrancar")
                    )
                :
                    // TELA DO COFRE DESTRANCADO
                    el('div', { className: "flex flex-col gap-6 animate-fade-in" },
                        el('div', { className: "flex flex-col gap-2" },
                            el('label', { className: "text-[10px] font-black uppercase text-amber-500 tracking-widest flex items-center gap-2" }, "🤖 Chave API do Gemini"),
                            el('input', {
                                type: "password",
                                value: geminiApiKey,
                                onChange: e => setGeminiApiKey(e.target.value),
                                placeholder: "AIzaSy...",
                                className: "bg-slate-900 border border-amber-900 rounded-xl p-3 text-emerald-400 font-mono text-xs focus:border-amber-500 outline-none"
                            }),
                            el('p', { className: "text-[9px] text-slate-500" }, "Esta chave será carregada automaticamente nas suas sessões ao destrancar o cofre.")
                        ),
                        el('div', { className: "flex flex-col gap-2 flex-1" },
                            el('label', { className: "text-[10px] font-black uppercase text-amber-500 tracking-widest flex items-center gap-2" }, "📜 Segredos e Anotações"),
                            el('textarea', {
                                value: secretNotes,
                                onChange: e => setSecretNotes(e.target.value),
                                placeholder: "Anotações ultrassecretas que ninguém pode ver...",
                                className: "bg-slate-900 border border-slate-700 rounded-xl p-4 text-slate-300 focus:border-amber-500 outline-none min-h-[150px] text-sm resize-none"
                            })
                        ),
                        el('button', {
                            onClick: handleSaveVault,
                            className: "w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase tracking-widest p-4 rounded-xl shadow-lg transition-all"
                        }, "Salvar Alterações e Fechar")
                    )
            )
        )
    );
}
