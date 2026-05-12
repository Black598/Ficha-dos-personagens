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

---

## 🚀 Próximas Implementações (Pendentes)

### 1. 🧙‍♂️ Assistente de Criação de Personagemz (Charactermancer)

- **Conceito:** Um menu guiado para acelerar a criação de novos personagens.
- **Features:**
  - Seleção de Classe e Raça com preenchimento automático de talentos e características na ficha.
  - Progressão travada por nível (libera habilidades conforme upa).
  - Múltipla escolha para equipamento inicial (ex: "Pacote de Explorador" ou "Espada Longa") com opção de converter em ouro.
  - Opção de mesclar habilidades baseadas em APIs/Wikis com habilidades customizadas (homebrew).

### 2. 🛒 Loja do Mestre (Trading System)
- **Conceito:** Um mercado interativo onde o mestre coloca itens à venda.
- **Features:** Vitrine do Mestre, Compra Automática (dedução de PO) e Venda de Itens.

### 3. 🌫️ Névoa de Guerra Dinâmica (Dynamic Fog of War)
- **Conceito:** Revelação automática do mapa baseada na posição e visão dos tokens.
- **Features:** Linha de visão (LoS) que respeita paredes, sombras dinâmicas e controle de raio de luz (tochas/visão no escuro).

### 🎲 4. Personalização de Dados (Dice Skins)
- **Conceito:** Menu de cosméticos para o rolador 3D.
- **Features:** Escolha de materiais (Metal, Cristal, Magma), cores customizadas e efeitos de trilha (partículas) ao rolar.

### 🕒 5. Relógio de Sessão (In-Game Time)
- **Conceito:** Rastreador de tempo cronológico dentro do mundo.
- **Features:** Botões para avançar 10m/1h/Descanso, sincronia com iluminação do mapa (dia/noite) e controle de duração de efeitos.

### 🔊 6. Soundpad dos Jogadores (Player Soundboard)
- **Conceito:** Uma interface onde os jogadores podem carregar ou linkar seus próprios efeitos sonoros.
- **Features:** Botões de som personalizados para cada jogador (ex: grito de guerra, som de magia), controle de volume individual e biblioteca de sons compartilhada.

---

**Última atualização:** 12/05/2026
**Próximo passo:** Iniciar o Sistema de **🧙‍♂️ Assistente de Criação de Personagem (Charactermancer)**.
