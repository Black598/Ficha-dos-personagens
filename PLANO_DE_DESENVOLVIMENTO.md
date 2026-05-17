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

## 🚀 Próximas Implementações (Pendentes)

### 2. 📏 Praticidade Tática e HUD no Mapa

- **Conceito:** Melhorias na interação direta no Campo de Batalha.
- **Features:**
  - **Régua de Medição:** Ferramenta de drag-and-drop para medir distâncias exatas.
  - **Ping Sincronizado:** Clique central/longo para gerar animações de sinalização no mapa.
  - **HUD Rápido do Mestre:** Controles de HP (+ e -) integrados ao clicar em um token.

### 3. 🎙️ Narrador Inteligente (Gemini)

- **Conceito:** A Inteligência Artificial reagindo em tempo real ao destino dos dados (Críticos e Falhas).

### 4. 🐺 Pets, Familiares e Montarias

- **Conceito:** Aba dedicada na ficha para Pets com tokens independentes no mapa.

### 5. 👓 Imersão Visual no Mapa (Filtros e Clima v2)

- **Features:** Filtros de Visão no Escuro (P&B) e partículas climáticas vinculadas ao Rastreador de Ambiente.

### 🃏 6. Deck de Cartas Sincronizado

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

**Última atualização:** 17/05/2026
**Próximo passo:** Iniciar o Sistema de **📏 Régua de Medição e Pings no Mapa**.
