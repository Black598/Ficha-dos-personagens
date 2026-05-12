# 🗺️ Plano de Desenvolvimento - Ficha RPG

Este documento organiza o progresso e as próximas funcionalidades do sistema.

---

## ✅ Concluídos
As funcionalidades abaixo já foram implementadas e estão operacionais.

### 1. 📖 Player Journal (Compartilhável)
*   **Status:** Concluído
*   **Conceito:** Diário social com notificações de "Carta" e abas estilo Minecraft.

### 2. 🎒 Inventário Visual (Grid/Slots) & Equipamentos
*   **Status:** Concluído
*   **Conceito:** Organização visual estilo RPG clássico (Diablo/Resident Evil).
*   **Features:**
    *   Grid de 24 slots com detecção automática de ícones/emojis.
    *   Sistema de personalização de ícones por item.
    *   **Sistema de Equipamento:** Jogadores podem equipar/desequipar itens.
    *   **Bônus Automáticos:** Itens equipados podem somar bônus em CA, Atributos, Iniciativa e Perícias diretamente na ficha.

### 3. 💰 Sistema de Loot Automático
*   **Status:** Concluído
*   **Conceito:** Agilizar a distribuição de recompensas.
*   **Features:**
    *   Gerador Aleatório por nível.
    *   Distribuição interativa (Jogadores pegam o que querem).
    *   Integração com IA (Gemini) para criação de itens únicos.

### 4. 👹 Barganha do Diabo
*   **Status:** Concluído (Refinado)
*   **Features:**
    *   Sorteio de efeitos por intensidade.
    *   Gerenciamento de dívidas ativas.
    *   Suporte a **Duração Permanente** e correção de bugs de sumiço.

---

## 🚀 Próximas Implementações (Pendentes)
Prioridade definida conforme discussão.

### 1. 🛒 Loja do Mestre (Trading System)
*   **Conceito:** Um mercado interativo onde o mestre coloca itens à venda.
*   **Features:**
    *   **Vitrine do Mestre:** O mestre define itens disponíveis e preço em PO.
    *   **Compra Automática:** Sistema verifica ouro, deduz valor e adiciona item instantaneamente.
    *   **Venda de Itens:** Jogadores podem vender itens de volta para o mestre.

### 2. 🐾 Glossário Animal (Bestiário)
*   **Conceito:** Uma enciclopédia de criaturas integrada à Biblioteca.
*   **Features:**
    *   **Estilo Biblioteca:** Cards com arte e descrição.
    *   **Dados de Criatura:** HP, CA e habilidades rápidas para consulta.

### 3. 🔊 Soundboard Imersivo
*   **Conceito:** Áudio sincronizado em tempo real.
*   **Features:**
    *   **Ambientes:** Loops de Taverna, Floresta, Combate.
    *   **Sincronização:** Quando o mestre aperta o play, toca para todos.

### 4. 🗺️ Mapa do Mundo Interativo
*   **Conceito:** Visão global com zoom e marcadores.
*   **Features:**
    *   **Upload de Mapas:** Mestre importa qualquer imagem de mapa.
    *   **Pins:** Nomes de locais e pontos de interesse dinâmicos.

---

**Última atualização:** 12/05/2026
**Próximo passo sugerido:** Iniciar a **Loja do Mestre** ou o **Glossário Animal**.
