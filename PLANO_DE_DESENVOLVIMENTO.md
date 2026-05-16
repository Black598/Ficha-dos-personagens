# 🗺️ Plano de Desenvolvimento - Ficha RPG

Este documento organiza o progresso e as próximas funcionalidades do sistema.

---

## ✅ Concluídos

As funcionalidades abaixo já foram implementadas e estão operacionais.

### 1. 🧠 Mentor de Criação (Creation Mentor)
- **Status:** Concluído ✅
- **Features:** 
  - **Incremental Draft:** O mentor ajuda a construir a ficha passo a passo antes mesmo do herói ser criado.
  - **Rolagem de Misericórdia:** Se o jogador tiver muito azar (>4 dados < 10), o mentor concede automaticamente uma nova rolagem.
  - **Modo Guia Inteligente:** O mentor detecta se a ficha está bloqueada pelo mestre e entra em modo "Somente Leitura" para dar dicas sem alterar os dados.
  - **IA com Contexto:** Integrado ao Wikidot e ao estado atual da ficha para sugerir raças, classes e builds otimizadas.

### 2. ⚡ Automações de Ficha & Bônus Dinâmicos
- **Status:** Concluído ✅
- **Features:**
  - **Cálculo Automático:** CA, Iniciativa e Proficiência agora são calculados sozinhos com base no Nível e Atributos.
  - **Bônus de Características:** Uso da sintaxe `[TAG:VAL]` em Talentos (ex: `[+2 FOR]`) para aplicar bônus automáticos na ficha toda.
  - **Sobrescrita Manual:** Todos os campos automáticos permitem que o jogador defina um valor fixo caso necessário (Homebrew).

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

---

## 🚀 Próximas Implementações (Pendentes)

### 🧙‍♂️ 20. Assistente de Criação (Creation Mentor)
- **Status:** Concluído ✅
- **Features:**
  - ✅ **Sidebar Inteligente:** Um assistente lateral acessível diretamente da ficha.
  - ✅ **Geração de Atributos Dinâmica:** O mestre define a regra (ex: 8d20 drop 2) e o mentor executa a rolagem 3D e o descarte automático.
  - ✅ **Consulta de Regras (Wiki):** Busca rápida por classes, raças e habilidades usando o conhecimento do Wikidot via IA.
  - ✅ **Mentor Chat:** Chat direto para tirar dúvidas de "como jogar" ou "como preencher" a ficha.
  - ✅ **Distribuição Prática:** Interface visual para gerenciar os resultados das rolagens de atributos.
  - ✅ **Controle de Acesso:** A rolagem de atributos é bloqueada automaticamente para fichas antigas ou sem permissão de edição do mestre.

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

**Última atualização:** 16/05/2026
**Próximo passo:** Iniciar o Sistema de **📏 Régua de Medição e Pings no Mapa**.
