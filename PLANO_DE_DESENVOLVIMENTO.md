# 🗺️ Plano de Desenvolvimento - Ficha RPG

Este documento organiza o progresso e as próximas funcionalidades do sistema.

---

## ✅ Concluídos

As funcionalidades abaixo já foram implementadas e estão operacionais.

### 1. 🎒 Inventário Visual (Grid/Slots) & Equipamentos

- **Status:** Concluído (Refinado)
- **Features:** Grid 24 slots, ícones automáticos, sistema de equipar, bônus dinâmicos e **Adição Direta de Itens** (sem texto).

### 2. ⚔️ Combate Avançado & Iniciativa

- **Status:** Concluído
- **Features:**
  - **Iniciativa Drag & Drop:** Reordene combatentes arrastando.
  - **Edição Direta:** Altere valores na lista.
  - **Ações em Massa:** Selecione múltiplos heróis para aplicar Dano, Cura ou XP de uma vez.
  - **Adição Rápida:** Botão para carregar todos os jogadores na iniciativa.
  - ✅ **Tutoriais Integrados:** Guias atualizados para Mestre e Jogadores cobrindo VTT, Som e Alquimia.

### 3. ⛈️ Clima e Imersão Atmosférica

- **Status:** Concluído (Expandido)
- **Features:** 10 efeitos sincronizados — Chuva, Neve, Fogo, **Tempestade** ⚡ (relâmpagos), **Tempestade de Areia**, **Pétalas** 🌸, Névoa, Lua de Sangue, Veneno e Noite. Invisíveis para o Mestre.

### 4. 👤 Gerador de NPCs (IA)

- **Status:** Concluído
- **Features:** Integração com Gemini para gerar NPCs completos (Nome, Background, Segredos e Stats) com um clique.

### 5. 🏰 Gestão de Campanhas & Importação

- **Status:** Concluído
- **Features:** Criação de salas, exclusão atômica de dados e importação via ID para recuperação de salas.

### 6. 💰 Loot, Barganhas e Biblioteca

- **Status:** Concluído
- _Sistemas base de exploração e interação._

### 7. 🐾 Glossário Animal & Bestiário

- **Status:** Concluído
- **Features:**
  - **Monstros** 👹: Aba exclusiva do Mestre com CR, PV, CA, Tipo e Habilidades.
  - **Glossário Animal** 🐾: Aberto para todos os jogadores registrarem animais descobertos na campanha.
  - Modal de detalhe com stats completos; deleção exclusiva do Mestre.

### 8. 🔊 Soundboard Sincronizado

- **Status:** Concluído
- **Features:**
  - ✅ **Atmosferas:** Músicas de fundo em loop (Taverna, Floresta, Combate, etc.) com suporte a **YouTube**.
  - ✅ **Sincronização:** Quando o mestre toca uma música, ela toca para todos em tempo real.
  - ✅ **Sincronização Audiovisual:** Ao mudar o clima visual (Chuva, Neve), o áudio correspondente toca automaticamente.
  - ✅ **Criação Dinâmica:** Botão (+) para o mestre adicionar suas próprias atmosferas personalizadas.
  - ✅ **Menu Hambúrguer SFX:** Biblioteca expandida de efeitos sonoros categorizados (Combate, Criaturas, Ambiente).
  - ✅ **Controle de Volume:** Slider para ajustar o volume da música ambiente globalmente.
  - ✅ **Instant SFX:** Sons rápidos para feedback imediato.

### 9. 🗺️ Mapa de Batalha (VTT) Integrado

- **Status:** Concluído
- **Features:**
  - ✅ **Fase 1:** Pan, Zoom e renderização de Grid e Fundo em alta resolução.
  - ✅ **Fase 2:** Sistema de Tokens Drag & Drop, sincronização em tempo real e Snap-to-grid.
  - ✅ **Fase 3:** Sistema de Auras em tokens, efeitos de ataques no mapa e marcadores visuais.
  - ✅ **Fase 4:** Gestão Multi-Mapas, Fog of War (Névoa de Guerra) e Sistema de Props.
  - ✅ **Fase 5:** Visão Dinâmica (Tokens de jogadores revelam névoa ao redor).
  - ✅ **Fase 6:** Sistema de Dados 3D persistente integrado na UI do mapa.

### 10. 🗺️ Mapa do Mundo Interativo (Atlas)

- **Status:** Concluído
- **Features:**
  - ✅ **Fase 1:** Renderização de Mapa Mundi com Pan/Zoom independente.
  - ✅ **Fase 2:** Sistema de Pins de Localidade com descrição e notas de lore.
  - ✅ **Fase 3:** Sistema de "Fast Travel" (clicar no pin abre o mapa de batalha daquela região).
  - ✅ **Fase 4:** Integração com Google Drive para mapas de alta definição.

### 11. 🧪 Alquimia e Crafting

- **Status:** Concluído
- **Features:**
  - ✅ **Dois Modos:** Caldeirão (Alquimia) e Bigorna (Forja).
  - ✅ **Sistema de Receitas:** Combinações lógicas de itens (ex: Erva + Água = Poção).
  - ✅ **Guia IA (Gemini):** Botão para perguntar ao oráculo o que pode ser criado com os itens selecionados.
  - ✅ **Integração de Inventário:** Itens são consumidos e o resultado é adicionado automaticamente.
  - ✅ **Feedback Visual:** Animações e cores específicas para cada modo de criação.

### 12. 🛒 Loja do Mestre (Trading System)

- **Status:** Concluído (Avançado)
- **Features:**
  - ✅ **Vitrine do Mestre:** Interface para colocar itens à venda com nome, ícone e descrição.
  - ✅ **Geração por IA (Gemini):** Botão ✨ para gerar itens únicos baseados no contexto da loja.
  - ✅ **Especialização de Vendedores:** Categorias como Armeiro, Alquimista, Joalheiro, etc.
  - ✅ **Economia Dinâmica:** Modificadores de preço e contexto narrativo (inflação, escassez, descontos).
  - ✅ **Sistema de Raridades:** Cores e categorias (Comum a Lendário) integradas.
  - ✅ **Atributos Secretos:** Status técnicos visíveis apenas para o mestre antes da compra.
  - ✅ **Compra Automática:** Dedução de PO e adição ao inventário com revelação automática de status.
  - ✅ **Controle Master:** Botão de cadeado 🔓/🔒 para abrir/fechar a loja para jogadores em tempo real.

### 13. 🔊 Soundpad dos Jogadores (Player Soundboard)

- **Status:** Concluído
- **Features:**
  - Interface customizável para os jogadores carregarem áudios de até 20 segundos.
  - Suporte para upload de arquivo (MP3/WAV) ou links.
  - Áudios disparados por um jogador são sincronizados e tocados para **todos** na sala em tempo real.
  - O soundpad é salvo individualmente na ficha de cada personagem.

### 🎲 14. Personalização de Dados (Dice Skins)

- **Status:** Concluído
- **Features:**
  - ✅ **Skins:** Escolha de materiais (Metal, Cristal Magico, Magma) integrados com materiais avançados de ThreeJS.
  - ✅ **Customização:** Color picker livre para customizar a cor dos dados rolando em tempo real.
  - ✅ **Trilha Visual:** Efeitos de partículas e brilho (rastro) durante a rolagem para skins mágicas.
  - ✅ **Persistência:** Dados salvos localmente (`localStorage`) para uso contínuo.
  - ✅ **Interface In-Game:** Botão "Dados" na ficha que abre o Modal de customização diretamente do personagem.

### 🕒 15. Relógio de Sessão (In-Game Time)

- **Status:** Concluído
- **Features:**
  - ✅ **Controle de Tempo:** Interface para o Mestre avançar blocos de 10 minutos, 1 hora ou 8 horas (Descanso).
  - ✅ **Sincronia Global:** Um relógio persistente na tela de todos os jogadores (sobreposição visual global) sincronizado com o Firebase.
  - ✅ **Iluminação Dinâmica:** O ambiente transita automaticamente de "Normal" para "Noite" (ou vice-versa) ao passar das 06:00 ou das 18:00.

### 🌫️ 16. Névoa de Guerra Dinâmica (Dynamic Fog of War)

- **Status:** Concluído
- **Features:**
  - ✅ **Ferramenta de Parede:** O mestre pode traçar linhas estruturais no mapa que interagem com o sistema de visão global.
  - ✅ **Linha de Visão (LoS):** Cálculo dinâmico que impede que as áreas reveladas pelos jogadores atravessem paredes/obstáculos.
  - ✅ **Raio de Visão Pessoal:** A neblina é dinamicamente removida em tempo real nas posições dos tokens baseada no atributo 'Visão (sqr)' de cada um.

### 📱 17. Otimização Mobile-First & UX

- **Status:** Concluído ✅
- **Features:**
  - ✅ **Menus Responsivos (☰):** Implementação de menus hambúrguer em todas as visualizações (Ficha, Mapa e Atlas) para evitar overflow e scroll horizontal.
  - ✅ **Layout de Relógio e Chat:** Reposicionamento dinâmico do relógio e do chat no celular, liberando espaço para a jogabilidade.
  - ✅ **Configuração de Tokens Mobile:** Menu de contexto (long press) agora centralizado e rolável no mobile para fácil acesso a todas as opções.
  - ✅ **Controles de Mapa Mobile:** Todas as ferramentas de desenho e mestre movidas para o menu hambúrguer no VTT.
  - ✅ **Ajuste de Precisão:** Fim do desalinhamento de tokens e marcadores em telas de alta densidade de pixels.
  - ✅ **Sincronização de Loja:** Toggle de habilitar/desabilitar loja integrado no menu hambúrguer do Mestre.

### 🎬 18. Apresentação Cinematográfica (Modo "Cutscene")

- **Status:** Concluído ✅
- **Features:**
  - ✅ **Revelação Dramática:** O mestre pode escurecer a tela de todos, exibir imagens centralizadas e tocar áudios de impacto simultaneamente.
  - ✅ **Transição de Áudio:** Suporte a Fade Out e Playlist automática.

### 🔒 19. Camada de Segurança e Multi-Campanha (Portão & PIN)

- **Status:** Concluído ✅
- **Features:**
  - ✅ **Landing Page:** Nova porta de entrada para seleção de campanhas, evitando carregamento direto da última sala.
  - ✅ **Senhas Dual-Layer:** Diferenciação entre **Senha da Sala** (acesso global) e **Senha de Mestre** (acesso administrativo).
  - ✅ **Autenticação Persistente:** Mestre e Jogadores só precisam digitar suas senhas/PINs uma vez por sessão.
  - ✅ **PIN de Personagem:** Trava individual de 4 dígitos para cada ficha.
  - ✅ **Bypass de Mestre:** O Mestre pode entrar em qualquer ficha sem PIN após se autenticar.
  - ✅ **Exclusão Segura:** Proteção contra exclusão acidental de salas exigindo senha ou confirmação textual.

### 🧙‍♂️ 20. Assistente de Criação (Creation Mentor)

- **Status:** Concluído ✅
- **Features:**
  - ✅ **Sidebar Inteligente:** Um assistente lateral acessível diretamente da ficha.
  - ✅ **Geração de Atributos Dinâmica:** O mestre define a regra (ex: 8d20 drop 2) e o mentor executa a rolagem 3D e o descarte automático.
  - ✅ **Consulta de Regras (Wiki):** Busca rápida por classes, raças e habilidades usando o conhecimento do Wikidot via IA.
  - ✅ **Mentor Chat:** Chat direto para tirar dúvidas de "como jogar" ou "como preencher" a ficha.
  - ✅ **Distribuição Prática:** Interface visual para gerenciar os resultados das rolagens de atributos.

### 🎒 21. Interface de Abas Estilo Minecraft & Painéis Separados
- **Status:** Concluído ✅
- **Features:**
  - ✅ **Abas Temáticas:** Menu hambúrguer substituído por um menu superior com abas inspiradas no inventário do Minecraft (Inventário, VTT, Customização, Devils Bargain, Grimório/FAQ, Biblioteca, Configurações).
  - ✅ **Sem Sobreposição:** O menu de ações flutuantes e itens fixos foram reorganizados em paralelo/abaixo para garantir que nunca se sobreponham.
  - ✅ **PIN Seguro:** O botão "Setar PIN" foi removido do menu de ações e realocado exclusivamente dentro do menu de Configurações, melhorando a UX.

### 👑 22. Nova Dashboard do Mestre com Abas Minecraft
- **Status:** Concluído ✅
- **Features:**
  - ✅ **Consistência Visual:** O antigo painel hambúrguer do mestre foi substituído pela mesma interface ultra-premium de abas horizontais do jogador, unificando a experiência.

### 💀 23. Grimório de Almas Avançado com IA & Regras Customizadas
- **Status:** Concluído ✅
- **Features:**
  - ✅ **Regras Flexíveis:** Permite que o mestre configure o preço das almas e altere as regras de contagem (se conta automaticamente quando o HP zera ou se segue outra regra).
  - ✅ **Sugestões por IA (Gemini):** Botão para solicitar sugestões e efeitos temáticos para as almas, recebendo respostas ricas em contexto com base no lore.

### ⏰ 24. Ajuste Manual do Relógio de Sessão
- **Status:** Concluído ✅
- **Features:**
  - ✅ **Precisão de Tempo:** O mestre pode clicar ou dar duplo clique diretamente no relógio de sessão na tela para inserir manualmente o horário/minutos da campanha sem depender apenas de botões de avanço.

### 🎨 25. Editor de GUI Arraste-e-Solte Dinâmico (Mestre)
- **Status:** Concluído ✅
- **Features:**
  - ✅ **Mural Editável:** Modo de edição de interface ativável via engrenagem nas Configurações.
  - ✅ **Arrastar e Soltar:** O mestre pode reposicionar blocos (Mural do Oráculo, Gerador de Monstros, Loot, Histórico, Iniciativa, etc.) entre a coluna Esquerda, Direita ou uma nova linha de Rodapé, com persistência atômica no Firestore em tempo real.
  - ✅ **Visibilidade Seletiva:** Painel de controle no menu de configurações para marcar/desmarcar quais blocos o mestre quer exibir ou ocultar na tela, com nomes 100% sincronizados.
  - ✅ **Visual Premium (Glassmorphism):** Substituição de todos os fundos de modais (Configurações, Chat, Guia do Mestre, Guia do Aventureiro, Cofre, Condições) por overlays e cartões acrílicos translúcidos com desfoque de fundo em tempo real.
  - ✅ **Segurança e Fim de Piscadas:** Bloqueio de auto-preenchimento intempestivo de senhas nos modais administrativos, garantindo transições 100% limpas.

### 🎨 26. Melhoria Premium do Menu de Ações (Mestre e Jogadores) & VTT Scrollbar Fix

- **Status:** Concluído ✅
- **Features:**
  - ✅ **Visual Premium (Unified Glass VTT):** Substituição de todos os botões e layouts de abas (Minecraft Style) por uma barra de comandos translúcida em acrílico com transparência HSL sutil.
  - ✅ **Micro-Animações e Indicadores:** Ao passar o mouse sobre os itens do dropdown, é exibida uma barra lateral brilhante com a cor do tema da categoria (Verde para exploração, roxo para mecânicas, rosa para estética e âmbar para sabedoria/mercado) que desliza com efeito suave.
  - ✅ **Resolução de Scrollbar no VTT:** Correção global do estilo `.hide-scrollbar` para ocultar com 100% de precisão o horizontal scrollbar da barra de ferramentas no VTT no desktop (eliminando a barra branca padrão do Windows).

### 👑 27. Painel de Controle do Mestre em Abas/Menus (MasterControls)

- **Status:** Concluído ✅
- **Features:**
  - ✅ **Abas Temáticas Acrílicas:** Reestruturação completa do bloco de controles administrativos do mestre (`MasterControls.js`) em abas compactas e fluidas: **Som & Áudio (🔊)**, **Tempo & Relógio (🕒)**, **Cenas & Clima (⛅)** e **Notas Privadas (📝)**, reduzindo drasticamente o uso de espaço vertical e alinhando com a usabilidade das fichas dos jogadores.
  - ✅ **Visual Premium e Micro-Animações:** Efeitos acrílicos HSL glow de seleção ativos para cada aba temática, transições de fade-in ultra-responsivas (`animate-fade-in-fast`), e botões e layouts unificados.
  - ✅ **Header do Mestre Premium Unificado:** Redesenho completo do cabeçalho da Sala do Mestre (`MasterView.js`) para ser sticky (fixado no topo), translúcido com backdrop desfoque e em largura total (`max-w-7xl`), alinhado exatamente ao layout das fichas dos jogadores.

### 👹 28. Invocador Visual de Criaturas & Crachás de Tokens

- **Status:** Concluído ✅
- **Features:**
  - ✅ **Invocador de Criaturas em Abas:** Nova interface visual para o mestre puxar monstros do Bestiário (`bestiary`), NPCs (`characters`) e animais (`animals`) em abas compactas e dinâmicas com filtragem rápida.
  - ✅ **Informações Rápidas e Visual Premium:** Cards de criaturas com foto do perfil, tipo de criatura e badges de status cruciais como desafio (**CR**), vida (**PV**) e armadura (**CA**).
  - ✅ **Spawn Inteligente na Câmera (Smart-Spawn):** Tokens spawnados são encaixados de forma inteligente e precisa no grid de células diretamente no centro do foco atual da câmera do mestre.
  - ✅ **Crachás de Identificação nos Tokens:** Pílulas de nomes em acrílico translúcido com desfoque de fundo centralizadas abaixo de cada token no VTT, com efeitos de realce dourado neon ao passar o mouse.

### 29. 📏 Praticidade Tática, Régua de Medição, Pings & HUD de Tokens
- **Status:** Concluído ✅
- **Features:**
  - ✅ **Régua de Medição Dinâmica:** As ferramentas de linha/régua, cone e círculo agora exibem badges em acrílico translúcido calculando a distância exata em tempo real (número de Quadrados, Pés/ft e Metros/m). A pílula de texto de medição rotaciona de forma inteligente na direção oposta ao ângulo do desenho para permanecer 100% horizontal e legível!
  - ✅ **Ping Sincronizado Expandido:** Disparo de sinalizações animadas no mapa usando o botão do meio do mouse (Middle-click) ou duplo clique no fundo do cenário, com propagação e auto-limpeza em tempo real para todos os jogadores.
  - ✅ **HUD de HP Rápido e Seleção:** Clicar em um token agora o seleciona ativando um anel de brilho neon dourado e revelando um painel flutuante de HP (barra de progresso de vida, leitura de PV atual/máximo, botões de atalho rápidos `-5`, `-1`, `+1`, `+5` e controle de alteração livre). Visível apenas para o mestre e proprietário do personagem.
### 30. 👓 Imersão Visual Premium, Filtros Atmosféricos & Climas Realistas (Clima v2)
- **Status:** Concluído ✅
- **Features:**
  - ✅ **Filtro de Noite & Lua de Sangue Realistas:** Substituição dos antigos filtros de matiz (`hue-rotate(200deg)` e `hue-rotate(40deg)`) que distorciam as cores de avatares, moedas e componentes de UI. O novo filtro de noite preserva matizes originais, ajustando apenas brilho, contraste e saturação com um leve tom azulado extremamente cinematográfico!
  - ✅ **Filtro de Veneno Não Distorcido:** O ambiente de veneno agora aplica um filtro sutil e doentio sem transformar os avatares em monstros verdes neon, mantendo o design do jogo intacto e limpo!
  - ✅ **Partículas Globais Expandidas (VTT & Ficha):** A sobreposição climática global (`WeatherOverlay`) agora renderiza partículas animadas complexas para **todos** os 10 climas integrados:
    * 🌧️ **Chuva**: Gotas fluidas caindo.
    * 🌩️ **Tempestade**: Chuva torrencial pesada acoplada a efeitos de relâmpagos estroboscópicos e flashes de luz rápidos!
    * ❄️ **Neve**: Flocos geométricos suaves girando em queda livre.
    * 🌫️ **Névoa**: Nuvens de fumaça e névoa densa com opacidade flutuante.
    * 🔥 **Fogo**: Fagulhas e cinzas incandescentes subindo com vento lateral.
    * 🏜️ **Tempestade de Areia**: Grãos de poeira e areia fina cortando a tela horizontalmente em alta velocidade.
    * 🌸 **Pétalas**: Pétalas de cerejeira cor-de-rosa caindo e girando suavemente.
    * ☣️ **Veneno**: Esporos tóxicos verdes e bolhas radioativas flutuando de baixo para cima com desfoque de lente!
  - ✅ **Lua de Sangue Celestial em Órbita Parabólica:** Quando o clima de *Lua de Sangue* está ativo, a partir das **17:30** do relógio do jogo, um corpo celeste em formato de esfera carmesim e halo brilhante surge na extrema esquerda (horizonte leste), sobe até o topo do céu (meio-céu) às 23:45 e desce em um arco geométrico perfeito até se pôr na extrema direita (horizonte oeste) às **06:00** da manhã seguinte! A posição da lua atualiza-se de forma sincronizada com os minutos reais de jogo.
  - ✅ **Lua Prateada Celestial e Camada por Trás da Ficha:** Adicionamos o mesmo trajeto orbital parabólico cinematográfico para a **Lua Normal** (uma belíssima esfera 3D prateada/brilhante) no clima de noite comum. Para garantir que nenhuma lua interfira na legibilidade ou bloqueie informações, o corpo celeste é renderizado com `z-index: 1` enquanto o container principal das fichas tem `z-index: 10`, fazendo com que os astros fiquem elegantemente posicionados **por trás** dos cards do personagem, visíveis apenas nos fundos e margens da interface.
  - ✅ **Sistema Multiclimal Sincronizado (Multi-Environments):** O Rastreador de Ambiente agora suporta a **seleção de múltiplos climas simultâneos** através de arrays reativos no Firebase. O mestre pode combinar a Noite com Chuva, Tempestade com Névoa, ou até Lua de Sangue com Fuligem de Fogo! O processador de partículas e os filtros de tintura da tela sobrepõem e integram os efeitos de forma otimizada e automática para todos os jogadores em tempo real!

### 🔊 31. Configurações de Som Customizáveis e Praticidades de Áudio (QoL)
- **Status:** Concluído ✅
- **Features:**
  - ✅ **Chave Geral de Silenciamento**: Controle mestre para ligar ou desligar completamente todos os efeitos sonoros de interface.
  - ✅ **Sons por Ação Configuráveis**: Caixa de configurações premium que permite ativar/desativar ou definir qualquer link customizado (MP3/WAV/YouTube) para ações específicas como *Abrir Ficha*, *Dados*, *Moedas/Inventário*, *Cura*, *Dano*, *Descanso Longo*, *Subir de Nível*, *Impacto Crítico* e *Magias*.
  - ✅ **Filtro de Soundpad de Outros Jogadores**: Interruptor de privacidade para que o jogador decida se deseja escutar as faixas do Soundpad tocadas por terceiros.
  - ✅ **Mute Total nos Lobbies**: Silenciamento total de músicas ambientes, dados 3D, efeitos climáticos ou sonoros durante as telas de lobby/seleção.
  - ✅ **Persistência Local**: Configurações salvas de forma persistente e independente em `localStorage`, dando autonomia total a cada participante da mesa.
  - ✅ **Rolagem Direta de Iniciativa com Dado 🎲**: O campo de iniciativa do jogador e o criador de criaturas do mestre ganharam um botão de dado `🎲`. Ao clicar, rola-se o D20 em 3D, soma-se o modificador e o valor final é enviado instantaneamente para a ordem de turnos de combate.
  - ✅ **Rola-Dados de Conjuração e Dano de Magias 🪄💥**: Cada slot de magia do Grimório Arcano agora conta com dois campos e botões interativos idênticos aos de ataques: **Casting** (adiciona bônus ao teste D20 3D) e **Dano/Efeito** (suporta fórmulas de dados como `8d6` ou `2d10`, rolando os dados físicos em 3D). A Hotbar também executa ambos sequencialmente com stagger cinematográfico de 1.2s!
  - ✅ **Atributos de Magia e Salvaguarda Automáticos por Classe 🔮**: Integramos as regras oficiais do D&D 5e de forma reativa. O sistema detecta a classe do personagem (ex: Inteligência para Mago/Artífice, Sabedoria para Clérigo/Druida/Ranger, Carisma para Bardo/Sorcerer/Paladino/Warlock) e calcula instantaneamente a **CD de Salvaguarda**, **Modificador de Conjuração** e **Bônus de Ataque Mágico** no cabeçalho do Grimório. Slots de magia usam esse bônus de classe calculado como padrão automático se o campo específico de Casting estiver vazio!

## 🚀 Próximas Implementações (Pendentes)

### 3. 🎙️ Narrador Inteligente (Gemini)

- **Conceito:** A Inteligência Artificial reagindo em tempo real ao destino dos dados (Críticos e Falhas).

### 4. 🐺 Pets, Familiares e Montarias

- **Conceito:** Aba dedicada na ficha para Pets com tokens independentes no mapa.

### 🃏 5. Deck de Cartas Sincronizado

- **Conceito:** Baralhos customizáveis (ex: Tarô, Encontros) com animação 3D de revelação global.

### ☣️ 7. Zonas de Perigo Automáticas (Hazards)

- **Conceito:** Áreas de dano contínuo (lava, gás) que aplicam efeitos automaticamente ao entrar.

### 🛡️ 8. Automação Tática de Condições

- **Conceito:** Pulo automático de turnos para personagens paralisados e dano contínuo (sangramento/fogo) automatizado.

### 🩸 9. Cicatrizes de Batalha (Efeitos Persistentes)

- **Conceito:** Marcas de magias (crateras, queimaduras) que permanecem no mapa.

### 💬 10. Tinta Mágica (Laser Pointer)

- **Conceito:** Desenhos temporários que desaparecem após 3 segundos para indicar táticas.

### 👁️ 11. Mini-Ficha Rápida (Tooltip de Monstro)

- **Conceito:** Resumo de status ao passar o mouse sobre tokens para o Mestre.

---

## 🛠️ Recursos de Praticidade e Qualidade de Vida (QoL)

### 👑 Para Facilitação do Mestre (DM QoL)
* **⚡ Distribuidor de Dano/Cura em Massa (Mass Damage/Heal Broadcaster):**
  * **Conceito:** Um controle central onde o mestre pode digitar um valor, selecionar múltiplos jogadores (ou monstros) e aplicar dano/cura ou condições a todos simultaneamente com um único clique (excelente para efeitos de área como bolas de fogo ou cura em massa!).
* **🎲 Rolagem Expressa de Iniciativa (NPC Fast Initiative):**
  * **Conceito:** Rolagem automática de iniciativa para todos os NPCs e monstros ativos no combate baseada em suas fichas do bestiário, organizando e iniciando a ordem de turnos instantaneamente.
* **📌 Marcador Tático Espacial (DM Focus & Ping):**
  * **Conceito:** O mestre segura `Shift` e clica em qualquer ponto do Battlemap para gerar um ping brilhante e mover a câmera de todos os jogadores ativos diretamente para aquele local de foco.
* **🎭 Improvisador Instantâneo de NPCs (Insta-NPC Generator):**
  * **Conceito:** Um gerador rápido alimentado pela IA Gemini que cria um nome, traço de personalidade marcante, segredo oculto e um boato que o NPC conhece em 2 segundos para auxiliar na improvisação em tavernas ou cidades.

### ⚔️ Para Facilitação dos Jogadores (Player QoL)
* **🗡️ HUD Flutuante de Ações Rápidas (Quick Action HUD):**
  * **Conceito:** Uma pequena barra colapsável no canto da tela que abriga atalhos das 3 principais armas/magias do jogador, permitindo realizar ataques e rolar dano com 1 clique sem abrir a aba de combate ou rolar a ficha.
* **🏥 Gestor Rápido de Descanso Curto (Short Rest Recovery):**
  * **Conceito:** Uma interface limpa que permite rolar e gastar Dados de Vida (`Hit Dice`) nas pausas, somando o bônus de Constituição e recuperando a vida do personagem de forma automatizada e segura.
* **🧪 Calculadora e Automação de Condições (Auto-Modifiers):**
  * **Conceito:** O sistema lê as condições ativas na ficha (ex: *Envenenado* ou *Caído*) e aplica desvantagem ou vantagem automaticamente nos testes de dados pertinentes, poupando cálculo manual.
* **🎯 Retícula de Marcação de Alvo (Target Lock Reticle):**
  * **Conceito:** O jogador clica no token de um monstro para marcá-lo como "Alvo Ativo". Suas rolagens subsequentes de ataque no chat exibirão automaticamente se atingiram ou falharam contra a CA secreta do alvo!

---

**Última atualização:** 17/05/2026
**Próximo passo:** Iniciar o Desenvolvimento do **🎙️ Narrador Inteligente (Gemini)**.
