# 🛡️ Ficha RPG & Virtual Tabletop (VTT)

Uma plataforma completa, imersiva e automatizada para mestrar e jogar RPG de mesa diretamente no navegador. Focada em design premium, facilidade de uso e recursos avançados de IA.

---

## 🚀 Principais Funcionalidades

### 🎮 Para Jogadores
- **Ficha Automatizada:** Gestão de atributos, perícias, talentos e PV com cálculos em tempo real.
- **Inventário Visual:** Sistema de grid (estilo RPGs modernos) com slots de equipamento e bônus automáticos.
- **Segurança Individual:** Fichas protegidas por PIN de 4 dígitos (personalizável).
- **Alquimia & Crafting:** Sistema de criação de itens e poções com receitas lógicas e guia por IA.
- **Dice Roller 3D:** Rolagem de dados imersiva com skins customizáveis (Metal, Magma, Cristal) e cores personalizadas.
- **Soundpad Pessoal:** Carregue e dispare efeitos sonoros sincronizados para todo o grupo.

### 👑 Para o Mestre
- **Painel de Controle Central:** Gerencie múltiplos heróis, controle a iniciativa e aplique ações em massa (Dano/Cura/XP).
- **VTT Integrado:** Mapas de batalha com Zoom, Pan, Tokens Drag & Drop e **Névoa de Guerra Dinâmica** (Line of Sight).
- **Gerador de NPCs (Gemini IA):** Crie personagens completos com história e atributos usando Inteligência Artificial.
- **Sistema de Som & Atmosfera:** Trilha sonora via YouTube e efeitos climáticos (Chuva, Neve, Tempestade) sincronizados.
- **Modo Cinematográfico:** Faça revelações dramáticas com imagens em tela cheia e sons de impacto.
- **Loja do Mestre:** Vitrine de itens para jogadores comprarem, com geração de itens mágicos por IA.

### 🏰 Gestão de Campanhas
- **Multi-Salas:** Crie, importe e gerencie diferentes campanhas a partir da Landing Page.
- **Segurança Dual-Layer:** Senhas separadas para entrada na sala e acesso administrativo ao painel.

---

## 🛠️ Tecnologias Utilizadas

- **Frontend:** React (CDN), HTML5, Tailwind CSS.
- **Backend/Database:** Firebase (Firestore & Authentication).
- **Inteligência Artificial:** Google Gemini API (para NPCs, Lore e Itens).
- **Gráficos 3D:** Three.js (para rolagens de dados).
- **Integração:** Google Apps Script (sincronização opcional com planilhas).

---

## ⚙️ Configuração e Instalação

1.  **Clonar o Repositório:**
    ```bash
    git clone https://github.com/seu-usuario/ficha-rpg.git
    ```

2.  **Configurar Firebase:**
    - Crie um projeto no [Firebase Console](https://console.firebase.google.com/).
    - Ative o **Firestore Database** e **Anonymous Authentication**.
    - Copie as credenciais e substitua no arquivo `js/data.js` (ou onde estiver a constante `firebaseConfig`).

3.  **Executar:**
    - Como o projeto utiliza React via CDN e Firebase nativo, basta abrir o `index.html` em um servidor local (ex: Live Server do VS Code).

---

## 🗺️ Roadmap de Desenvolvimento

O progresso detalhado e as próximas funcionalidades podem ser conferidos no arquivo:
👉 [PLANO_DE_DESENVOLVIMENTO.md](./PLANO_DE_DESENVOLVIMENTO.md)

---

## 📜 Licença

Este projeto é destinado ao uso pessoal e sessões de RPG. Sinta-se à vontade para expandir e customizar para a sua mesa!

---
*Desenvolvido com ❤️ para a comunidade de RPG.*
