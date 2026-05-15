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

---

## 🚀 Próximas Implementações (Pendentes)

### 1. 🧙‍♂️ Assistente de Criação de Personagem (Charactermancer)

- **Conceito:** Um menu guiado para acelerar a criação de novos personagens.
- **Features:**
  - Seleção de Classe e Raça com preenchimento automático de talentos e características na ficha.
  - Progressão travada por nível (libera habilidades conforme upa).
  - Múltipla escolha para equipamento inicial (ex: "Pacote de Explorador" ou "Espada Longa") com opção de converter em ouro.
  - Opção de mesclar habilidades baseadas em APIs/Wikis com habilidades customizadas (homebrew).

### 2. 📏 Praticidade Tática e HUD no Mapa
- **Conceito:** Melhorias na interação direta no Campo de Batalha.
- **Features:**
  - **Régua de Medição:** Ferramenta de drag-and-drop para medir distâncias exatas (em quadrados ou metros).
  - **Ping Sincronizado:** Clique central/longo para gerar animações de sinalização no mapa para todo o grupo.
  - **HUD Rápido do Mestre:** Controles de HP (+ e -) integrados ao clicar em um token no mapa, sem abrir a aba lateral.
  - **Auras e Status Visuais:** Indicadores coloridos sob os tokens para condições (fogo, veneno) e barras miniatura de HP.

### 3. 🎙️ Narrador Inteligente (Gemini)
- **Conceito:** A Inteligência Artificial reagindo em tempo real ao destino dos dados.
- **Features:** 
  - Geração automática de uma frase narrativa épica ou cômica sempre que houver um acerto crítico (20) ou falha crítico (1).

### 4. ⚡ Qualidade de Vida (QoL)
- **Conceito:** Agilizar os turnos e acesso a recursos rápidos.
- **Features:**
  - **Hotbar (Barra de Atalhos):** Uma barra na base da tela dos jogadores onde eles podem fixar suas principais magias/ataques para rolagem em 1 clique.
  - **Playlist/Transição de Áudio:** Suporte a múltiplas músicas e fade-in/fade-out na transição de cenas pelo Mestre.

### 5. 🐺 Pets, Familiares e Montarias
- **Conceito:** Gestão avançada de companheiros animais.
- **Features:** Aba dedicada na ficha para Pets. Ganham tokens próprios no mapa, com status independentes e inventário atrelado, podendo ser movimentados pelo respectivo jogador ou Mestre.

### 6. 👓 Imersão Visual no Mapa (Filtros e Clima)
- **Conceito:** Alterar o visual do grid de acordo com o ambiente e as capacidades visuais.
- **Features:**
  - **Filtro de Visão no Escuro:** Máscara visual preto-e-branco e sombria na revelação da neblina para personagens com visão no escuro, colorindo apenas áreas iluminadas por tochas.
  - **Partículas Climáticas:** Animações sobrepostas de chuva, neve ou tempestade de areia (CSS Particles) vinculadas diretamente ao Rastreador de Ambiente atual.

### 7. 🃏 Deck de Cartas Sincronizado
- **Conceito:** Elemento de aleatoriedade visual diferente dos dados.
- **Features:** Baralhos customizáveis (ex: Tarô, Encontros de Viagem). O mestre puxa uma carta e ela é revelada com uma animação 3D (flip) global no centro da tela de todos os jogadores.

### 8. ☣️ Zonas de Perigo Automáticas (Hazards) no Mapa
- **Conceito:** Armadilhas e terrenos perigosos interativos.
- **Features:** O mestre demarca uma área de dano contínuo (lava, gás venenoso). Ao soltar um token dentro dessa área, o sistema aplica um aviso/dano pré-configurado automaticamente.

### 9. 🛡️ Automação Tática de Condições
- **Conceito:** O sistema impõe regras mecânicas rígidas com base nas condições do combate.
- **Features:** Pulo automático de turnos de personagens Atordoados/Paralisados no rastreador de iniciativa, ou dano contínuo automatizado no início do turno (ex: Envenenado, Em Chamas).

### 10. 🎬 Apresentação Cinematográfica (Modo "Cutscene")
- **Conceito:** Revelação dramática de cenários e chefes.
- **Features:** O mestre pode escurecer a tela de todos os jogadores, tocar um efeito sonoro de impacto e exibir uma imagem em tela cheia centralizada temporariamente para máxima imersão.

### 11. 🩸 Cicatrizes de Batalha (Efeitos Persistentes)
- **Conceito:** O cenário reage e guarda marcas da batalha.
- **Features:** Magias de área (como bolas de fogo ou ácido) deixam manchas semitransparentes (crateras/queimaduras) no grid do mapa de forma permanente até o combate acabar.

### 12. 💬 Tinta Mágica (Desenho de Estratégia Efêmero)
- **Conceito:** Ferramenta de comunicação visual temporária para táticas.
- **Features:** Uma "caneta laser" que desenha traços brilhantes sobre o mapa e que desaparecem gradualmente sozinhos após 3 segundos.

### 13. 👁️ Mini-Ficha Rápida no Mapa (Tooltip de Monstro)
- **Conceito:** Acesso instantâneo a status vitais sem sair da tela do mapa.
- **Features:** Ao passar o mouse (ou duplo clique) sobre o token de um monstro, o Mestre vê um pequeno balão com HP, CA e Resumo de Ataques para narrar rapidamente o combate.

---

**Última atualização:** 15/05/2026
**Próximo passo:** Iniciar o Sistema de **🎬 Apresentação Cinematográfica (Modo "Cutscene")**.
