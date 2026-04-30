// js/components/MasterTutorialPopup.js
const { useState, useEffect } = React;
const el = React.createElement;

export function MasterTutorialPopup({ onClose }) {
    const [activeTab, setActiveTab] = useState('geral');

    // Marca no localStorage que já viu o tutorial
    useEffect(() => {
        localStorage.setItem('has_seen_master_tutorial', 'true');
    }, []);

    const tabs = [
        { id: 'geral', label: '📖 Geral', icon: '👑' },
        { id: 'herois', label: '🏰 Heróis', icon: '🛡️' },
        { id: 'monstros', label: '🐉 Monstros', icon: '🐙' },
        { id: 'sessao', label: '🎭 Sessão', icon: '📜' },
        { id: 'gemini', label: '🤖 Oráculo (Gemini)', icon: '✨' }
    ];

    const renderContent = () => {
        switch (activeTab) {
            case 'geral':
                return el('div', { className: "space-y-4 text-slate-300 text-sm leading-relaxed" },
                    el('p', null, "Bem-vindo à ", el('strong', { className: "text-purple-400" }, "Sala do Mestre"), "! Este é o seu painel de controle absoluto para a campanha."),
                    el('p', null, "Aqui você pode monitorar e editar todos os heróis da sessão, controlar turnos de combate em tempo real, gerenciar condições e PV, enviar mensagens globais e utilizar a biblioteca de regras."),
                    el('p', null, "A sala sincroniza em tempo real com todos os jogadores. O que você alterar aqui refletirá imediatamente nas fichas deles."),
                    el('div', { className: "bg-amber-900/30 border border-amber-500/50 p-4 rounded-xl mt-4" },
                        el('h4', { className: "text-amber-400 font-bold mb-2 flex items-center gap-2" }, "📌 Botões do Topo"),
                        el('ul', { className: "list-disc pl-5 space-y-1" },
                            el('li', null, el('strong', { className: "text-white" }, "⚙️ Configurações:"), " Para alterar API Keys e outras configurações globais."),
                            el('li', null, el('strong', { className: "text-white" }, "📚 Biblioteca:"), " Permite criar ou consultar NPCs, anotações e regras."),
                            el('li', null, el('strong', { className: "text-white" }, "👺 Barganha:"), " Permite oferecer barganhas diabólicas que afetam permanentemente os jogadores."),
                            el('li', null, el('strong', { className: "text-white" }, "💬 Mensagens:"), " Chat exclusivo entre o Mestre e jogadores (ou global).")
                        )
                    )
                );
            case 'herois':
                return el('div', { className: "space-y-4 text-slate-300 text-sm leading-relaxed" },
                    el('p', null, "No painel ", el('strong', { className: "text-purple-400" }, "Heróis no Reino"), ", você vê todos os jogadores conectados na campanha."),
                    el('ul', { className: "list-disc pl-5 space-y-3" },
                        el('li', null, el('strong', { className: "text-amber-400" }, "Controle de Turnos:"), " Clique em 'Dar Vez' para que o painel do jogador pisque e ele saiba que é a vez dele de agir."),
                        el('li', null, el('strong', { className: "text-emerald-400" }, "Cadeado (🔒):"), " Você pode travar a ficha de um jogador para impedir que ele altere os próprios PVs e status sem a sua permissão."),
                        el('li', null, el('strong', { className: "text-purple-400" }, "Acesso Direto (📜):"), " Abre a ficha completa do jogador para edições ou conferências."),
                        el('li', null, el('strong', { className: "text-red-400" }, "Condições:"), " Adicione status (Envenenado, Caído, etc) que contam os turnos automaticamente."),
                        el('li', null, el('strong', { className: "text-blue-400" }, "XP e PV:"), " Ajuste diretamente do painel sem precisar abrir a ficha inteira.")
                    )
                );
            case 'monstros':
                return el('div', { className: "space-y-4 text-slate-300 text-sm leading-relaxed" },
                    el('p', null, "O ", el('strong', { className: "text-red-400" }, "Gerenciador de Ameaças"), " permite criar monstros e NPCs combatentes de forma ágil."),
                    el('p', null, "Ao criar um monstro, você define nome, PV, Classe de Armadura e Rolagens (Ataques ou Magias)."),
                    el('div', { className: "bg-red-900/20 border border-red-500/30 p-4 rounded-xl mt-4" },
                        el('h4', { className: "text-red-400 font-bold mb-2 flex items-center gap-2" }, "⚔️ Rolagem Automática"),
                        el('p', null, "Quando você clica no botão de ataque do monstro, a rolagem é feita ", el('strong', { className: "text-white" }, "secretamente"), " e não aparece no histórico dos jogadores, apenas no seu painel de rolagens! Ideal para surpresas e jogadas narrativas.")
                    )
                );
            case 'sessao':
                return el('div', { className: "space-y-4 text-slate-300 text-sm leading-relaxed" },
                    el('p', null, "No painel de ", el('strong', { className: "text-emerald-400" }, "Controles de Sessão"), ", você afeta o ambiente de todos os jogadores:"),
                    el('ul', { className: "list-disc pl-5 space-y-3" },
                        el('li', null, el('strong', { className: "text-white" }, "Anúncio Global:"), " Escreva algo aqui e um banner gigante e brilhante aparecerá na tela de todos os jogadores simultaneamente. Excelente para narrativas dramáticas."),
                        el('li', null, el('strong', { className: "text-white" }, "Handout (Imagem):"), " Cole uma URL de imagem para exibir um mapa, um enigma ou um retrato de NPC diretamente na tela dos jogadores."),
                        el('li', null, el('strong', { className: "text-white" }, "Música / Ambiente:"), " Troque a música de fundo. A música tocará automaticamente para os jogadores que tiverem habilitado o áudio na ficha deles."),
                        el('li', null, el('strong', { className: "text-white" }, "Passagem de Tempo:"), " Clicar em 'Avançar Dia' reduz a contagem de barganhas diabólicas e outras condições diárias ativas.")
                    )
                );
            case 'gemini':
                return el('div', { className: "space-y-4 text-slate-300 text-sm leading-relaxed" },
                    el('p', null, "O ", el('strong', { className: "text-amber-400" }, "Oráculo (Gemini AI)"), " é o seu assistente de inteligência artificial integrado. Você pode usá-lo para gerar nomes de NPCs, criar regras de combate, descrever cenários ou arbitrar regras do seu RPG."),
                    el('div', { className: "bg-slate-900 border border-slate-700 p-4 rounded-xl mt-4" },
                        el('h4', { className: "text-white font-bold mb-2" }, "Como configurar a API do Google Gemini:"),
                        el('ol', { className: "list-decimal pl-5 space-y-2 text-slate-400" },
                            el('li', null, "Acesse o portal do Google AI Studio em: ", el('a', { href: "https://aistudio.google.com/app/apikey", target: "_blank", className: "text-blue-400 hover:underline" }, "aistudio.google.com")),
                            el('li', null, "Faça login com a sua conta do Google."),
                            el('li', null, "Clique no botão ", el('strong', { className: "text-white" }, "Create API key"), " (Criar Chave de API)."),
                            el('li', null, "Selecione um projeto (ou crie um novo se o Google pedir) e clique para gerar a chave."),
                            el('li', null, "Copie a chave de texto longa que será gerada (começa com 'AIza...')."),
                            el('li', null, "Volte aqui na Sala do Mestre, clique em ", el('strong', { className: "text-white" }, "⚙️ Configurações"), " no topo da tela."),
                            el('li', null, "Cole a chave no campo do Gemini e clique em Salvar.")
                        )
                    ),
                    el('p', { className: "text-xs text-amber-500/80 italic mt-2" }, "Nota: A chave fica salva apenas no seu navegador local, garantindo sua privacidade.")
                );
            default:
                return null;
        }
    };

    return el('div', { className: "fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in" },
        el('div', { className: "bg-slate-950 border border-purple-500/30 rounded-3xl w-full max-w-4xl shadow-[0_0_50px_rgba(168,85,247,0.15)] flex flex-col overflow-hidden max-h-[90vh] animate-slide-up" },
            
            // Header
            el('div', { className: "bg-slate-900/80 p-6 border-b border-slate-800 flex justify-between items-center" },
                el('h2', { className: "text-2xl md:text-3xl font-black text-white uppercase italic tracking-tighter flex items-center gap-3" },
                    el('span', { className: "text-purple-500" }, "👑"),
                    "Guia Definitivo do Mestre"
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
                            className: `flex items-center gap-3 w-full text-left px-4 py-3 rounded-xl transition-all font-bold uppercase tracking-widest text-xs whitespace-nowrap ${activeTab === tab.id ? 'bg-purple-600 text-white shadow-lg' : 'bg-slate-800/50 text-slate-400 hover:bg-slate-800 hover:text-white'}`
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
                    className: "px-8 py-3 bg-purple-600 text-white font-black uppercase tracking-widest text-xs rounded-xl hover:bg-purple-500 transition-all shadow-[0_0_20px_rgba(168,85,247,0.3)]"
                }, "Entendi, vamos jogar!")
            )
        )
    );
}
