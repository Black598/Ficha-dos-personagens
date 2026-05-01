// js/components/PlayerTutorialPopup.js
const { useState, useEffect } = React;
const el = React.createElement;

export function PlayerTutorialPopup({ onClose }) {
    const [activeTab, setActiveTab] = useState('geral');

    // Marca no localStorage que já viu o tutorial
    useEffect(() => {
        localStorage.setItem('has_seen_player_tutorial', 'true');
    }, []);

    const tabs = [
        { id: 'geral', label: '📖 Geral', icon: '🛡️' },
        { id: 'combate', label: '⚔️ Combate', icon: '🎲' },
        { id: 'evolucao', label: '🌟 Evolução', icon: '✨' },
        { id: 'social', label: '💬 Social', icon: '📜' },
        { id: 'novidades', label: '🔥 Novidades', icon: '⭐' }
    ];

    const renderContent = () => {
        switch (activeTab) {
            case 'geral':
                return el('div', { className: "space-y-4 text-slate-300 text-sm leading-relaxed" },
                    el('p', null, "Bem-vindo à sua ", el('strong', { className: "text-amber-400" }, "Ficha de Personagem"), "! Este é o seu portal para o mundo do RPG."),
                    el('p', null, "Tudo o que você alterar aqui é salvo em tempo real. Seu Mestre também pode ver sua ficha e ajudá-lo a gerenciar seus recursos."),
                    el('div', { className: "bg-amber-900/30 border border-amber-500/50 p-4 rounded-xl mt-4" },
                        el('h4', { className: "text-amber-400 font-bold mb-2 flex items-center gap-2" }, "📌 Dicas Rápidas"),
                        el('ul', { className: "list-disc pl-5 space-y-1" },
                            el('li', null, el('strong', { className: "text-white" }, "PV (Pontos de Vida):"), " Clique nos campos de PV para adicionar dano (-) ou cura (+)."),
                            el('li', null, el('strong', { className: "text-white" }, "Recursos:"), " Use os campos de PO/PP/PC para gerenciar seu ouro."),
                            el('li', null, el('strong', { className: "text-white" }, "Inventário:"), " Clique no ícone de mochila para abrir seus itens e equipamentos.")
                        )
                    )
                );
            case 'combate':
                return el('div', { className: "space-y-4 text-slate-300 text-sm leading-relaxed" },
                    el('p', null, "O sistema possui um ", el('strong', { className: "text-purple-400" }, "Rolador de Dados 3D"), " integrado."),
                    el('ul', { className: "list-disc pl-5 space-y-3" },
                        el('li', null, el('strong', { className: "text-amber-400" }, "Testar Atributos/Perícias:"), " Basta clicar no valor de qualquer atributo ou perícia para rolar um D20 automaticamente com os seus bônus."),
                        el('li', null, el('strong', { className: "text-emerald-400" }, "Vantagem e Desvantagem:"), " Clique no ícone de dado no topo para abrir o painel completo e escolher o modo de rolagem."),
                        el('li', null, el('strong', { className: "text-purple-400" }, "Ataques:"), " Na aba de equipamentos, seus ataques também podem ser rolados com um clique.")
                    )
                );
            case 'evolucao':
                return el('div', { className: "space-y-4 text-slate-300 text-sm leading-relaxed" },
                    el('p', null, "Ao ganhar XP e subir de nível, você poderá desbloquear ", el('strong', { className: "text-emerald-400" }, "Talentos"), "."),
                    el('p', null, "Clique no botão '⭐ Talentos' para abrir sua árvore de habilidades. Cada talento desbloqueado pode conceder bônus passivos ou novas habilidades ativas."),
                    el('p', { className: "text-xs text-slate-500 italic" }, "Nota: Algumas mudanças de nível podem exigir que o Mestre aprove ou edite dados específicos da sua ficha.")
                );
            case 'social':
                return el('div', { className: "space-y-4 text-slate-300 text-sm leading-relaxed" },
                    el('p', null, "Comunicação e Narrativa:"),
                    el('ul', { className: "list-disc pl-5 space-y-3" },
                        el('li', null, el('strong', { className: "text-white" }, "Chat:"), " Use o chat lateral para falar com o grupo ou enviar mensagens privadas ao Mestre."),
                        el('li', null, el('strong', { className: "text-white" }, "Mural:"), " Fique atento aos banners e handouts (imagens) que o Mestre pode enviar para a sua tela."),
                        el('li', null, el('strong', { className: "text-white" }, "Biblioteca:"), " Acesse a biblioteca compartilhada para ler anotações do mundo ou regras da campanha.")
                    )
                );
            case 'novidades':
                return el('div', { className: "space-y-4 text-slate-300 text-sm leading-relaxed" },
                    el('p', null, "Novos recursos para jogadores:"),
                    el('div', { className: "bg-purple-900/20 border border-purple-500/30 p-4 rounded-xl mt-4" }, [
                        el('h4', { className: "text-purple-400 font-bold mb-1" }, "🖼️ Personalize seu Avatar"),
                        el('p', null, "Agora você mesmo pode definir sua foto!"),
                        el('ul', { className: "list-disc pl-5 text-xs space-y-2 mt-2" }, [
                            el('li', null, "Clique no ícone de usuário (ou na sua foto atual) no cabeçalho da ficha."),
                            el('li', null, "Cole o link de 'Compartilhar' de uma imagem do seu Google Drive ou qualquer link da internet."),
                            el('li', null, "Sua foto atualizará instantaneamente para você e para o Mestre!")
                        ])
                    ])
                );
            default:
                return null;
        }
    };

    return el('div', { className: "fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in" },
        el('div', { className: "bg-slate-950 border border-amber-500/30 rounded-3xl w-full max-w-4xl shadow-[0_0_50px_rgba(245,158,11,0.15)] flex flex-col overflow-hidden max-h-[90vh] animate-slide-up" },
            
            // Header
            el('div', { className: "bg-slate-900/80 p-6 border-b border-slate-800 flex justify-between items-center" },
                el('h2', { className: "text-2xl md:text-3xl font-black text-white uppercase italic tracking-tighter flex items-center gap-3" },
                    el('span', { className: "text-amber-500" }, "🛡️"),
                    "Guia de Aventureiro"
                ),
                el('button', {
                    onClick: onClose,
                    className: "w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:bg-red-500/20 hover:text-red-400 transition-colors"
                }, "✕")
            ),

            // Content Area (Tabs + Text)
            el('div', { className: "flex flex-col md:flex-row overflow-hidden flex-1 min-h-[400px]" },
                // Tabs Sidebar
                el('div', { className: "w-full md:w-64 bg-slate-900/40 p-4 border-r border-slate-800 flex flex-row md:flex-col gap-2 overflow-x-auto md:overflow-y-auto" },
                    tabs.map(tab => 
                        el('button', {
                            key: tab.id,
                            onClick: () => setActiveTab(tab.id),
                            className: `flex items-center gap-3 w-full text-left px-4 py-3 rounded-xl transition-all font-bold uppercase tracking-widest text-xs whitespace-nowrap ${activeTab === tab.id ? 'bg-amber-600 text-white shadow-lg' : 'bg-slate-800/50 text-slate-400 hover:bg-slate-800 hover:text-white'}`
                        }, 
                        el('span', { className: "text-lg" }, tab.icon),
                        tab.label
                        )
                    )
                ),

                // Main Content
                el('div', { className: "flex-1 p-6 md:p-10 overflow-y-auto bg-gradient-to-br from-slate-900 to-slate-950" },
                    renderContent()
                )
            ),

            // Footer
            el('div', { className: "bg-slate-900/80 p-4 border-t border-slate-800 flex justify-end" },
                el('button', {
                    onClick: onClose,
                    className: "px-8 py-3 bg-amber-600 text-white font-black uppercase tracking-widest text-xs rounded-xl hover:bg-amber-500 transition-all shadow-[0_0_20px_rgba(245,158,11,0.3)]"
                }, "Entendi, vamos à aventura!")
            )
        )
    );
}
