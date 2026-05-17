// js/components/PlayerTutorialPopup.js
const { useState, useEffect } = React;
const el = React.createElement;

export const PLAYER_TUTORIAL_VERSION = '3.1';

export function PlayerTutorialPopup({ onClose }) {
    const [activeTab, setActiveTab] = useState('novidades'); // Abre direto nas novidades quando há update

    useEffect(() => {
        localStorage.setItem('has_seen_player_tutorial', PLAYER_TUTORIAL_VERSION);
    }, []);

    const tabs = [
        { id: 'novidades', label: '🔥 Novidades', icon: '⭐' },
        { id: 'mentor', label: '🧠 Mentor IA', icon: '🧠' },
        { id: 'geral', label: '📖 Guia da Ficha', icon: '🛡️' },
        { id: 'vtt', label: '🗺️ Mapa/VTT', icon: '📍' },
        { id: 'alquimia', label: '🧪 Alquimia', icon: '⚗️' },
        { id: 'combate', label: '⚔️ Combate', icon: '🎲' }
    ];

    const renderContent = () => {
        switch (activeTab) {
            case 'novidades':
                return el('div', { className: "space-y-6 text-slate-300 text-sm leading-relaxed" }, [
                    el('p', { className: "text-amber-400 font-bold" }, "✨ Versão 3.1 - Rola-Magias do Grimório, Iniciativa 3D e Atributos de Classe Automáticos"),
                    
                    el('div', { className: "bg-blue-900/20 border border-blue-500/30 p-4 rounded-xl shadow-lg" }, [
                        el('h4', { className: "text-blue-400 font-bold mb-2 flex items-center gap-2" }, "🪄 Grimório Arcano & Hotbar Automatizados"),
                        el('p', { className: "text-xs" }, "Chega de rolar magias na mão! Suas magias ganharam campos para bônus de Casting e fórmula de Dano/Efeito (como 8d6 ou 2d10), com rolagens físicas 3D na mesa! Pressione o botão 📌 para fixar magias na Hotbar e assista ao sistema conjurar a magia e rolar o dano sequencialmente com stagger cinematográfico!")
                    ]),

                    el('div', { className: "bg-purple-900/20 border border-purple-500/30 p-4 rounded-xl shadow-lg" }, [
                        el('h4', { className: "text-purple-400 font-bold mb-2 flex items-center gap-2" }, "🔮 Atributos Mágicos Automáticos por Classe"),
                        el('p', { className: "text-xs" }, "Seus stats de magia (Salvaguarda, Modificador e Bônus de Ataque) agora são automáticos! O sistema identifica sua classe (INT para Magos/Artífices, SAB para Clérigos/Druidas/Rangers, CAR para Bruxos/Bardos/Feiticeiros) e aplica as regras oficiais do D&D 5e de forma dinâmica no cabeçalho.")
                    ]),

                    el('div', { className: "bg-amber-900/20 border border-amber-500/30 p-4 rounded-xl shadow-lg" }, [
                        el('h4', { className: "text-amber-400 font-bold mb-2 flex items-center gap-2" }, "🎲 Rolagem de Iniciativa 3D Direta"),
                        el('p', { className: "text-xs" }, "Seu card de iniciativa agora tem um botão neon 🎲. Ao clicar, o D20 3D é lançado, soma seus modificadores e envia seu resultado direto para a fila de turnos de combate em tempo real!")
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
                return el('div', { className: "space-y-6 text-slate-300 text-sm leading-relaxed max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar" }, [
                    el('p', null, "Bem-vindo à sua ", el('strong', { className: "text-amber-400" }, "Ficha de Personagem Premium"), "! Este guia detalha o funcionamento de cada módulo e sistema integrado para facilitar sua jogabilidade:"),
                    
                    el('div', { className: "bg-slate-900/60 p-4 rounded-2xl border border-slate-800" }, [
                        el('h4', { className: "text-amber-400 font-bold mb-2 flex items-center gap-2 text-xs" }, "🎭 1. Atributos e Perícias (Dados 3D)"),
                        el('p', { className: "text-xs mb-2" }, "Seus atributos (FOR, DES, CON, INT, SAB, CAR) e perícias associadas são totalmente interativos:"),
                        el('ul', { className: "list-disc pl-5 text-xs space-y-1" }, [
                            el('li', null, "Clique diretamente em qualquer valor ou nome de atributo/perícia para disparar automaticamente um teste D20 em 3D com física real na mesa!"),
                            el('li', null, "O sistema lê seus modificadores, bônus de talentos e itens equipados para somar tudo no valor final rolado.")
                        ])
                    ]),

                    el('div', { className: "bg-slate-900/60 p-4 rounded-2xl border border-slate-800" }, [
                        el('h4', { className: "text-emerald-400 font-bold mb-2 flex items-center gap-2 text-xs" }, "❤️ 2. Vitalidade, Recursos & CA"),
                        el('ul', { className: "list-disc pl-5 text-xs space-y-2" }, [
                            el('li', null, [el('strong', null, "Calculadora de PV rápida:"), " Use o painel esquerdo para inserir valores e clicar em Dano, Cura ou Escudo. Pontos de Vida Temporários (Escudo/PV Temp) absorvem o dano primeiro de forma automática!"]),
                            el('li', null, [el('strong', null, "Classe de Armadura (CA) & Deslocamento:"), " Calculados automaticamente com base no seu modificador de Destreza e bônus de itens equipados."]),
                            el('li', null, [el('strong', null, "Iniciativa 🎲:"), " Clique no dado neon piscante no card de iniciativa para rolar seu D20 e enviar seu valor ordenado instantaneamente para a fila do combate global do Mestre."])
                        ])
                    ]),

                    el('div', { className: "bg-slate-900/60 p-4 rounded-2xl border border-slate-800" }, [
                        el('h4', { className: "text-blue-400 font-bold mb-2 flex items-center gap-2 text-xs" }, "🎒 3. Inventário Visual e Equipamento"),
                        el('ul', { className: "list-disc pl-5 text-xs space-y-2" }, [
                            el('li', null, [el('strong', null, "Mochila Visual:"), " Clique no ícone de mochila no menu inferior. Arraste e solte itens para organizá-los."]),
                            el('li', null, [el('strong', null, "Equipar Itens {E}:"), " Itens com a tag '{E}' no nome dão bônus mágicos e de atributos automaticamente! Exemplo: uma 'Espada Longa {E} (FOR:+2)' dará +2 em Força quando equipada."])
                        ])
                    ]),

                    el('div', { className: "bg-slate-900/60 p-4 rounded-2xl border border-slate-800" }, [
                        el('h4', { className: "text-blue-400 font-bold mb-2 flex items-center gap-2 text-xs" }, "🪄 4. Grimório Arcano e Magias"),
                        el('ul', { className: "list-disc pl-5 text-xs space-y-2" }, [
                            el('li', null, [el('strong', null, "Cálculo Automático por Classe 🔮:"), " Seus stats de Salvaguarda (CD), Bônus de Ataque Mágico e Modificador são calculados automaticamente usando o atributo mental correto da sua classe (INT, SAB ou CAR)."]),
                            el('li', null, [el('strong', null, "Rolagens Rápidas 🎲💥:"), " Cada magia possui campos para bônus de Casting e fórmula de dano (ex: 8d6). Clique nos botões para rolar dados 3D na mesa!"]),
                            el('li', null, [el('strong', null, "Atalhos Rápidos na Hotbar 📌:"), " Fixe magias na sua barra inferior. Clicar nelas dispara a conjuração no chat, o som de magia e as rolagens de acerto e dano em sequência cinematográfica!"])
                        ])
                    ]),

                    el('div', { className: "bg-slate-900/60 p-4 rounded-2xl border border-slate-800" }, [
                        el('h4', { className: "text-amber-500 font-bold mb-2 flex items-center gap-2 text-xs" }, "🌟 5. Características & Talentos (Bônus Passivos)"),
                        el('p', { className: "text-xs mb-2" }, "Você e o mestre podem configurar talentos e características especiais que dão bônus passivos automáticos em qualquer atributo ou perícia da sua ficha!"),
                        el('p', { className: "text-[11px] mb-2 text-slate-400" }, "Basta escrever o bônus no nome ou descrição do talento utilizando o formato de tags colchetes ", el('code', { className: "text-amber-400 bg-slate-950 px-1 py-0.5 rounded font-mono" }, "[TAG:VALOR]"), ":"),
                        el('ul', { className: "list-disc pl-5 text-[11px] space-y-1 text-slate-300" }, [
                            el('li', null, [el('strong', null, "Atributos Básicos:"), " Use tags como ", el('code', { className: "text-white bg-slate-950 px-1 rounded font-mono" }, "[FOR:+2]"), ", ", el('code', { className: "text-white bg-slate-950 px-1 rounded font-mono" }, "[DES:-1]"), ", ", el('code', { className: "text-white bg-slate-950 px-1 rounded font-mono" }, "[CON:+1]"), ", ", el('code', { className: "text-white bg-slate-950 px-1 rounded font-mono" }, "[INT:+2]"), ", ", el('code', { className: "text-white bg-slate-950 px-1 rounded font-mono" }, "[SAB:+2]"), ", ", el('code', { className: "text-white bg-slate-950 px-1 rounded font-mono" }, "[CAR:+1]"), "."]),
                            el('li', null, [el('strong', null, "Status Globais:"), " Use ", el('code', { className: "text-white bg-slate-950 px-1 rounded font-mono" }, "[CA:+1]"), " para Classe de Armadura, ", el('code', { className: "text-white bg-slate-950 px-1 rounded font-mono" }, "[Iniciativa:+2]"), " para bônus de iniciativa, ou ", el('code', { className: "text-white bg-slate-950 px-1 rounded font-mono" }, "[Deslocamento:+5]"), " para velocidade."]),
                            el('li', null, [el('strong', null, "Perícias Específicas:"), " Use o nome exato da perícia em maiúsculo ou minúsculo. Exemplo: ", el('code', { className: "text-white bg-slate-950 px-1 rounded font-mono" }, "[Acrobacia:+3]"), ", ", el('code', { className: "text-white bg-slate-950 px-1 rounded font-mono" }, "[Furtividade:+5]"), ", ", el('code', { className: "text-white bg-slate-950 px-1 rounded font-mono" }, "[Percepcao:+2]"), "."]),
                            el('li', null, "O sistema identificará essas marcas automaticamente, somará os valores e atualizará suas estatísticas na interface em tempo real!")
                        ])
                    ]),

                    el('div', { className: "bg-slate-900/60 p-4 rounded-2xl border border-slate-800" }, [
                        el('h4', { className: "text-indigo-400 font-bold mb-2 flex items-center gap-2 text-xs" }, "📖 6. Diário de Bordo & Notas Compartilhadas"),
                        el('ul', { className: "list-disc pl-5 text-xs space-y-1" }, [
                            el('li', null, "Use a aba Notas Privadas para escrever seus segredos e progresso."),
                            el('li', null, "Crie Notas Compartilhadas para enviar envelopes e cartas físicas na tela de outros jogadores e do Mestre!")
                        ])
                    ]),

                    el('div', { className: "bg-slate-900/60 p-4 rounded-2xl border border-slate-800" }, [
                        el('h4', { className: "text-purple-400 font-bold mb-2 flex items-center gap-2 text-xs" }, "⚙️ 7. Configurações Individuais de Sons"),
                        el('p', { className: "text-xs" }, "Clique no ícone de engrenagem no menu ou no rodapé para acessar suas preferências individuais de áudio. Mude os links ou ative/desative efeitos sonoros e controle se deseja escutar o soundpad de outros de forma 100% autônoma!")
                    ])
                ]);
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
