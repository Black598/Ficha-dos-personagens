// js/components/MasterTutorialPopup.js
const { useState, useEffect } = React;
const el = React.createElement;

export const MASTER_TUTORIAL_VERSION = '2.3';

export function MasterTutorialPopup({ onClose }) {
    const [activeTab, setActiveTab] = useState('novidades');

    useEffect(() => {
        localStorage.setItem('has_seen_master_tutorial', MASTER_TUTORIAL_VERSION);
    }, []);

    const tabs = [
        { id: 'novidades', label: '🔥 Novidades', icon: '⭐' },
        { id: 'geral', label: '📖 Geral', icon: '👑' },
        { id: 'vtt', label: '🗺️ VTT & Mapas', icon: '📍' },
        { id: 'soundboard', label: '🔊 Som & Clima', icon: '🎼' },
        { id: 'herois', label: '🏰 Heróis', icon: '🛡️' },
        { id: 'monstros', label: '🐉 Monstros', icon: '🐙' },
        { id: 'gemini', label: '🤖 Oráculo (Gemini)', icon: '✨' }
    ];

    const renderContent = () => {
        switch (activeTab) {
            case 'novidades':
                return el('div', { className: "space-y-6 text-slate-300 text-sm leading-relaxed" }, [
                    el('p', { className: "text-purple-400 font-bold" }, "✨ Versão 2.3 - Invocador de Criaturas & Crachás de Tokens"),
                    
                    el('div', { className: "bg-amber-900/20 border border-amber-500/30 p-4 rounded-xl shadow-lg" }, [
                        el('h4', { className: "text-amber-400 font-bold mb-2 flex items-center gap-2" }, "👹 Invocador Visual de Criaturas"),
                        el('p', { className: "text-xs" }, "Chega de prompts de texto! Agora você pode invocar criaturas (Monstros do Bestiário, NPCs/Personagens e Animais) clicando em abas organizadas no VTT. O token é inserido instantaneamente no centro da tela e alinhado no grid!")
                    ]),

                    el('div', { className: "bg-indigo-900/20 border border-indigo-500/30 p-4 rounded-xl" }, [
                        el('h4', { className: "text-indigo-400 font-bold mb-2 flex items-center gap-2" }, "📛 Crachás nos Tokens"),
                        el('p', { className: "text-xs" }, "Todos os tokens circulares agora exibem seus nomes centralizados logo abaixo em lindas pílulas acrílicas translúcidas que brilham em dourado ao passar o mouse, facilitando a identificação imediata.")
                    ]),

                    el('div', { className: "bg-purple-900/20 border border-purple-500/30 p-4 rounded-xl" }, [
                        el('h4', { className: "text-purple-400 font-bold mb-2 flex items-center gap-2" }, "🎨 Editor de GUI Arraste-e-Solte"),
                        el('p', { className: "text-xs" }, "Ative o modo de Edição de GUI nas Configurações (⚙️) e arraste qualquer bloco (Mural, Monstros, Loot, Histórico, etc.) para a Esquerda, Direita ou Rodapé para montar seu próprio layout de tela de Mestre!")
                    ])
                ]);
            case 'geral':
                return el('div', { className: "space-y-4 text-slate-300 text-sm leading-relaxed" },
                    el('p', null, "Bem-vindo à ", el('strong', { className: "text-purple-400" }, "Sala do Mestre"), "! Este é o seu painel de controle absoluto para a campanha."),
                    el('p', null, "Aqui você pode monitorar heróis, controlar turnos, gerenciar o VTT, trocar atmosferas sonoras e utilizar a IA para enriquecer sua narrativa."),
                    el('div', { className: "bg-amber-900/30 border border-amber-500/50 p-4 rounded-xl mt-4" },
                        el('h4', { className: "text-amber-400 font-bold mb-2 flex items-center gap-2" }, "📌 Botões do Topo"),
                        el('ul', { className: "list-disc pl-5 space-y-1" },
                            el('li', null, el('strong', { className: "text-white" }, "⚙️ Configurações:"), " API Keys e configurações globais."),
                            el('li', null, el('strong', { className: "text-white" }, "📚 Biblioteca:"), " Consulte ou crie NPCs, anotações e regras."),
                            el('li', null, el('strong', { className: "text-white" }, "👺 Barganha:"), " Ofereça pactos diabólicos aos jogadores."),
                            el('li', null, el('strong', { className: "text-white" }, "💬 Mensagens:"), " Chat e avisos globais.")
                        )
                    )
                );
            case 'vtt':
                return el('div', { className: "space-y-4 text-slate-300 text-sm leading-relaxed" },
                    el('p', null, "O sistema de ", el('strong', { className: "text-blue-400" }, "Virtual Tabletop (VTT)"), " permite gerenciar o combate visual."),
                    el('ul', { className: "list-disc pl-5 space-y-3" },
                        el('li', null, el('strong', { className: "text-white" }, "Mapas:"), " Use o painel de Mapas para carregar cenários. O sistema suporta zoom e pan sincronizado."),
                        el('li', null, el('strong', { className: "text-white" }, "Tokens:"), " Arraste monstros do seu gerenciador diretamente para o mapa. Clique duas vezes no token para editar PV e Aura."),
                        el('li', null, el('strong', { className: "text-white" }, "Névoa:"), " Você tem controle total sobre o que os jogadores veem. Revele áreas conforme eles exploram.")
                    )
                );
            case 'soundboard':
                return el('div', { className: "space-y-4 text-slate-300 text-sm leading-relaxed" },
                    el('p', null, "Controle a imersão com o ", el('strong', { className: "text-emerald-400" }, "Soundboard Sincronizado"), "."),
                    el('ul', { className: "list-disc pl-5 space-y-3" },
                        el('li', null, el('strong', { className: "text-white" }, "Atmosferas:"), " Clique em um ambiente (Chuva, Taverna) para ativar o som e o efeito visual simultaneamente para todos."),
                        el('li', null, el('strong', { className: "text-white" }, "YouTube:"), " Adicione links de qualquer música do YouTube para tocar em loop como trilha sonora."),
                        el('li', null, el('strong', { className: "text-white" }, "SFX:"), " Use o menu lateral (hambúrguer) para disparar efeitos sonoros rápidos (espadas, feitiços, rugidos).")
                    )
                );
            case 'herois':
                return el('div', { className: "space-y-4 text-slate-300 text-sm leading-relaxed" },
                    el('p', null, "No painel ", el('strong', { className: "text-purple-400" }, "Heróis no Reino"), ", você vê todos os jogadores conectados."),
                    el('ul', { className: "list-disc pl-5 space-y-3" },
                        el('li', null, el('strong', { className: "text-amber-400" }, "Iniciativa:"), " Arraste os nomes na lista lateral para mudar a ordem de combate."),
                        el('li', null, el('strong', { className: "text-emerald-400" }, "Ações em Massa:"), " Selecione vários jogadores e aplique Dano, Cura ou XP de uma só vez."),
                        el('li', null, el('strong', { className: "text-red-400" }, "Condições:"), " Adicione status que expiram automaticamente com o passar dos turnos.")
                    )
                );
            case 'monstros':
                return el('div', { className: "space-y-4 text-slate-300 text-sm leading-relaxed" },
                    el('p', null, "O ", el('strong', { className: "text-red-400" }, "Gerenciador de Ameaças"), " permite criar monstros de forma ágil."),
                    el('p', null, "Use o botão ", el('strong', { className: "text-amber-400" }, "✨ IA"), " para descrever um monstro e deixar o Gemini gerar todos os status (PV, CA, Habilidades) automaticamente."),
                    el('p', { className: "text-xs text-slate-500 italic mt-2" }, "Dica: Monstros criados aparecem no Grimório de Almas e podem ser arrastados para o mapa de batalha.")
                );
            case 'gemini':
                return el('div', { className: "space-y-4 text-slate-300 text-sm leading-relaxed" },
                    el('p', null, "O ", el('strong', { className: "text-amber-400" }, "Oráculo (Gemini AI)"), " é o seu assistente. Use-o para gerar nomes, criar regras de combate ou descrever cenários."),
                    el('div', { className: "bg-slate-900 border border-slate-700 p-4 rounded-xl mt-4" },
                        el('h4', { className: "text-white font-bold mb-2" }, "Configuração:"),
                        el('p', { className: "text-xs text-slate-400" }, "Insira sua API Key nas Configurações (⚙️). A chave fica salva localmente no seu navegador.")
                    )
                );
            default:
                return null;
        }
    };

    return el('div', { className: "fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-md animate-fade-in" },
        el('div', { className: "bg-slate-900/80 backdrop-blur-md border border-purple-500/30 rounded-3xl w-full max-w-4xl shadow-[0_0_50px_rgba(168,85,247,0.15)] flex flex-col overflow-hidden max-h-[90vh] animate-slide-up" },
            
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
