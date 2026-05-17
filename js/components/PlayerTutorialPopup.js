// js/components/PlayerTutorialPopup.js
const { useState, useEffect } = React;
const el = React.createElement;

export const PLAYER_TUTORIAL_VERSION = '2.6';

export function PlayerTutorialPopup({ onClose }) {
    const [activeTab, setActiveTab] = useState('novidades'); // Abre direto nas novidades quando há update

    useEffect(() => {
        localStorage.setItem('has_seen_player_tutorial', PLAYER_TUTORIAL_VERSION);
    }, []);

    const tabs = [
        { id: 'novidades', label: '🔥 Novidades', icon: '⭐' },
        { id: 'mentor', label: '🧠 Mentor IA', icon: '🧠' },
        { id: 'geral', label: '📖 Geral', icon: '🛡️' },
        { id: 'vtt', label: '🗺️ Mapa/VTT', icon: '📍' },
        { id: 'alquimia', label: '🧪 Alquimia', icon: '⚗️' },
        { id: 'combate', label: '⚔️ Combate', icon: '🎲' }
    ];

    const renderContent = () => {
        switch (activeTab) {
            case 'novidades':
                return el('div', { className: "space-y-6 text-slate-300 text-sm leading-relaxed" }, [
                    el('p', { className: "text-amber-400 font-bold" }, "✨ Versão 2.6 - Régua Dinâmica, Pings Sincronizados & HUD de HP"),
                    
                    el('div', { className: "bg-amber-900/20 border border-amber-500/30 p-4 rounded-xl shadow-lg" }, [
                        el('h4', { className: "text-amber-400 font-bold mb-2 flex items-center gap-2" }, "📐 Régua de Medição Tática"),
                        el('p', { className: "text-xs" }, "As ferramentas de Linha, Cone e Círculo agora calculam a distância e quantidade de Quadrados exatos em tempo real. O indicador visual de metros (m) e pés (ft) rotaciona automaticamente para ficar sempre horizontal e 100% legível!")
                    ]),

                    el('div', { className: "bg-blue-900/20 border border-blue-500/30 p-4 rounded-xl shadow-lg" }, [
                        el('h4', { className: "text-blue-400 font-bold mb-2 flex items-center gap-2" }, "🔔 Sinalização / Pings no Mapa"),
                        el('p', { className: "text-xs" }, "Precisa indicar um caminho ou perigo? Clique com o botão do meio (mouse wheel) ou dê duplo clique no fundo do mapa para gerar uma animação de ping luminosa que aparece em tempo real para todos na mesa!")
                    ]),

                    el('div', { className: "bg-indigo-900/20 border border-indigo-500/30 p-4 rounded-xl" }, [
                        el('h4', { className: "text-indigo-400 font-bold mb-2 flex items-center gap-2" }, "❤️ HUD Flutuante de HP & Seleção"),
                        el('p', { className: "text-xs" }, "Ao clicar no seu token, um anel dourado neon de seleção é ativado e um painel de status flutua sobre o personagem exibindo sua barra de vida em tempo real e controles rápidos para gerenciar seu HP com extrema facilidade!")
                    ])
                ]);
            case 'mentor':
                return el('div', { className: "space-y-4 text-slate-300 text-sm leading-relaxed" }, [
                    el('p', null, "O ", el('strong', { className: "text-indigo-400" }, "Mentor de Criação"), " é seu guia místico no mundo do RPG."),
                    el('ul', { className: "list-disc pl-5 space-y-3" },
                        el('li', null, el('strong', { className: "text-white" }, "Rolar Atributos:"), " Disponível apenas para fichas novas ou quando o mestre libera o cadeado 🔓."),
                        el('li', null, el('strong', { className: "text-white" }, "Drag & Drop:"), " Arraste os valores rolados diretamente para os atributos da ficha."),
                        el('li', null, el('strong', { className: "text-white" }, "Wiki e Dicas:"), " Peça dicas de build ou pesquise detalhes técnicos de raças e classes via IA.")
                    )
                ]);
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
            case 'vtt':
                return el('div', { className: "space-y-4 text-slate-300 text-sm leading-relaxed" },
                    el('p', null, "O sistema conta com um ", el('strong', { className: "text-blue-400" }, "Mapa de Batalha (VTT)"), " completo e tático."),
                    el('ul', { className: "list-disc pl-5 space-y-3" },
                        el('li', null, el('strong', { className: "text-white" }, "Navegação:"), " Você pode dar Zoom (scroll do mouse ou botões de lupa) e arrastar o mapa (segurando com o botão direito do mouse)."),
                        el('li', null, el('strong', { className: "text-white" }, "Seu Token:"), " Mova o seu personagem arrastando-o (o snap-to-grid posiciona perfeitamente). Clicar no token abre o HUD flutuante de HP, e clique direito exibe as auras e configurações."),
                        el('li', null, el('strong', { className: "text-amber-400" }, "Sinalizações e Pings:"), " Dê um clique com o botão do meio (roda do mouse) ou duplo clique no fundo do cenário para emitir um sinal visual no mapa para todo o grupo."),
                        el('li', null, el('strong', { className: "text-emerald-400" }, "Medir Distâncias:"), " Use a ferramenta de Linha/Régua para medir o deslocamento preciso ou utilize os moldes de Cone e Círculo para posicionar magias de área com indicação exata de quadrados, pés e metros.")
                    )
                );
            case 'alquimia':
                return el('div', { className: "space-y-4 text-slate-300 text-sm leading-relaxed" },
                    el('p', null, "O laboratório de ", el('strong', { className: "text-emerald-400" }, "Alquimia e Crafting"), " permite criar itens poderosos."),
                    el('ul', { className: "list-disc pl-5 space-y-3" },
                        el('li', null, el('strong', { className: "text-white" }, "Acesso:"), " Clique no ícone de caldeirão (⚗️) no menu inferior."),
                        el('li', null, el('strong', { className: "text-white" }, "Criação:"), " Arraste ingredientes da mochila para os slots e tente descobrir novas receitas."),
                        el('li', null, el('strong', { className: "text-purple-400" }, "✨ O Guia:"), " Em dúvida? Use o botão da IA para pedir sugestões místicas do que criar com seus materiais.")
                    )
                );
            case 'combate':
                return el('div', { className: "space-y-4 text-slate-300 text-sm leading-relaxed" },
                    el('p', null, "O sistema possui um ", el('strong', { className: "text-purple-400" }, "Rolador de Dados 3D"), " integrado."),
                    el('ul', { className: "list-disc pl-5 space-y-3" },
                        el('li', null, el('strong', { className: "text-amber-400" }, "Testar Atributos/Perícias:"), " Basta clicar no valor de qualquer atributo ou perícia para rolar um D20 automaticamente."),
                        el('li', null, el('strong', { className: "text-emerald-400" }, "Vantagem e Desvantagem:"), " Clique no ícone de dado no topo para abrir o painel completo e escolher o modo de rolagem.")
                    )
                );
            case 'social':
                return el('div', { className: "space-y-4 text-slate-300 text-sm leading-relaxed" },
                    el('p', null, "Comunicação e Narrativa:"),
                    el('ul', { className: "list-disc pl-5 space-y-3" },
                        el('li', null, el('strong', { className: "text-white" }, "Jornal:"), " Use o caderno (📖) para suas notas privadas ou para compartilhar descobertas com o grupo."),
                        el('li', null, el('strong', { className: "text-white" }, "Som e Clima:"), " Fique atento! O som ambiente e os efeitos visuais (chuva, neve) mudam conforme a narrativa do Mestre."),
                        el('li', null, el('strong', { className: "text-white" }, "Cartas:"), " Notas compartilhadas aparecem como envelopes na sua tela. Clique para ler!")
                    )
                );
            default:
                return null;
        }
    };

    return el('div', { className: "fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-md animate-fade-in" },
        el('div', { className: "bg-slate-900/80 backdrop-blur-md border border-amber-500/30 rounded-3xl w-full max-w-4xl shadow-[0_0_50px_rgba(245,158,11,0.15)] flex flex-col overflow-hidden max-h-[90vh] animate-slide-up" },
            
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
