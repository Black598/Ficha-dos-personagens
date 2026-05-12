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

---

## 🚀 Próximas Implementações (Pendentes)

### 1. 🧙‍♂️ Assistente de Criação de Personagem (Charactermancer)

- **Conceito:** Um menu guiado para acelerar a criação de novos personagens.
- **Features:**
  - Seleção de Classe e Raça com preenchimento automático de talentos e características na ficha.
  - Progressão travada por nível (libera habilidades conforme upa).
  - Múltipla escolha para equipamento inicial (ex: "Pacote de Explorador" ou "Espada Longa") com opção de converter em ouro.
  - Opção de mesclar habilidades baseadas em APIs/Wikis com habilidades customizadas (homebrew).

### 2. 🛒 Loja do Mestre (Trading System)

- **Conceito:** Um mercado interativo onde o mestre coloca itens à venda.
- **Features:** Vitrine do Mestre, Compra Automática (dedução de PO) e Venda de Itens.

### 3. 🔊 Soundboard Sincronizado

- **Conceito:** Controle refinado de áudio ambiente e efeitos sonoros para todos os jogadores.

### 4. 🧪 Alquimia e Crafting

- **Conceito:** Sistema de combinação de itens para criar poções e upgrades.

### 5. 🗺️ Mapa de Batalha (VTT) Integrado [CONCLUÍDO]

- **Conceito:** Um Virtual Tabletop completo estilo Roll20.
- **Features:**
  - ✅ **Fase 1:** Pan, Zoom e renderização de Grid e Fundo em alta resolução.
  - ✅ **Fase 2:** Sistema de Tokens Drag & Drop, sincronização em tempo real e Snap-to-grid.
  - ✅ **Fase 3:** Sistema de Auras em tokens, efeitos de ataques no mapa e marcadores visuais.
  - ✅ **Fase 4:** Gestão Multi-Mapas, Fog of War (Névoa de Guerra) e Sistema de Props.
  - ✅ **Fase 5:** Visão Dinâmica (Tokens de jogadores revelam névoa ao redor).
  - ✅ **Fase 6:** Sistema de Dados 3D persistente integrado na UI do mapa.

### 6. 🗺️ Mapa do Mundo Interativo (Atlas) [CONCLUÍDO]

- **Conceito:** Visão global com marcadores e pins de interesse para navegação macro.
- **Features:**
  - ✅ **Fase 1:** Renderização de Mapa Mundi com Pan/Zoom independente.
  - ✅ **Fase 2:** Sistema de Pins de Localidade com descrição e notas de lore.
  - ✅ **Fase 3:** Sistema de "Fast Travel" (clicar no pin abre o mapa de batalha daquela região).
  - ✅ **Fase 4:** Integração com Google Drive para mapas de alta definição.

---

**Última atualização:** 12/05/2026
**Próximo passo:** Iniciar o Sistema de **🧪 Alquimia e Crafting**.
