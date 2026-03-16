// 1. IMPORTAÇÕES
import { TALENT_TREES, firebaseConfig, appId, iconMap } from './data.js';
import { loadCharacterSheet, loadPlayerList, getCharacterByName, updateSheetViaScript, extractSpreadsheetId } from './utils.js'
import { SheetView } from './components/SheetView.js'
import { TreeView } from './components/TreeView.js'
import { MasterView } from './components/MasterView.js'
import { LoginView } from './components/LoginView.js'
import { DiceRoller } from './components/DiceRoller.js'

// 2. INICIALIZAÇÃO FIREBASE
const app = !firebase.apps.length ? firebase.initializeApp(firebaseConfig) : firebase.app()
const auth = firebase.auth()
const db = firebase.firestore()

const { useState, useEffect } = React

function App() {
  // --- ESTADOS ---
  const scriptWebhook = "https://script.google.com/macros/s/AKfycbyEW3GW4hV_BstFdzeuP-rMt4w67mgXza6XjYPezy1rGEnzB9u_yllzmmNHJLGVMuSTqA/exec";
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('login');
  const [allCharacters, setAllCharacters] = useState([]);
  const [characterName, setCharacterName] = useState('');
  const [characterData, setCharacterData] = useState(null);
  const [characterSheetData, setCharacterSheetData] = useState(null);
  const [creatingCharacter, setCreatingCharacter] = useState(false);
  const [newCharacterName, setNewCharacterName] = useState('');
  const [rollHistory, setRollHistory] = useState([]);
  const [recentRolls, setRecentRolls] = useState([]);
  const [tooltip, setTooltip] = useState({ show: false, content: null, x: 0, y: 0 });
  const [editableSheetData, setEditableSheetData] = useState(null);
  const [isRollingModalOpen, setRollingModalOpen] = useState(false);
  const [turnState, setTurnState] = useState({ activeChar: '', round: 1 });
  const [geminiApiKey, setGeminiApiKey] = useState(localStorage.getItem('gemini_api_key') || '');

  // --- 1. EFEITO DE AUTENTICAÇÃO ---
  useEffect(() => {
    const unsubAuth = auth.onAuthStateChanged((user) => {
      if (user) {
        setUser(user);
      } else {
        auth.signInAnonymously();
      }
    });
    return () => unsubAuth();
  }, [])

  // --- 1.1 ESCUTA ESTADO DE TURNOS ---
  useEffect(() => {
    if (!user) return;
    const unsubTurns = db.collection('artifacts').doc(appId)
      .collection('public').doc('data').collection('global').doc('turnState')
      .onSnapshot((doc) => {
        if (doc.exists) setTurnState(doc.data());
      });
    return () => unsubTurns();
  }, [user]);

  // --- 2. CARREGAMENTO DE DADOS (PLANILHA + FIREBASE) ---
  useEffect(() => {
    if (!user) return;

    const initAppData = async () => {
      let googlePlayers = [];
      try {
        googlePlayers = await loadPlayerList(); // Pega a lista da Planilha Mestre
      } catch (e) { console.error("Erro planilha:", e); }

      const unsub = db.collection('artifacts').doc(appId)
        .collection('public').doc('data')
        .collection('characters')
        .onSnapshot((snap) => {
          const firebaseData = {};
          snap.forEach(doc => {
            // Guardamos os dados do Firebase usando o ID em minúsculo
            firebaseData[doc.id.toLowerCase()] = doc.data();
          });

          // MESCLAGEM REAL:
          // Criamos a lista final garantindo que os dados do Firebase existam
          const mergedList = googlePlayers.map(p => {
            const id = (p.Personagem || p.name || "").toLowerCase().trim();
            const fData = firebaseData[id] || {};

            // Retornamos um objeto que tem TUDO da planilha + TUDO do Firebase
            return {
              ...p,       // Jogador, Personagem, url (da planilha)
              ...fData,   // selectedTree, unlocked, name (do Firebase)
              name: p.Personagem || p.name // Garante um nome padrão
            };
          });

          setAllCharacters(mergedList);
          setLoading(false);
        });

      return () => unsub();
    };

    initAppData();
  }, [user])

  // --- 3. CARREGAMENTO DE DADOS (FIREBASE) ---
  useEffect(() => {
    if (!characterName || allCharacters.length === 0) return;

    // Procura a versão mais fresca do personagem na lista global
    const updatedChar = allCharacters.find(c =>
      (c.name || c.Personagem || "").toLowerCase() === characterName.toLowerCase()
    );

    if (updatedChar) {
      setCharacterData(updatedChar);
      if (updatedChar.sheetData) {
        setCharacterSheetData(updatedChar.sheetData);
      }
    }
  }, [allCharacters, characterName])

  // --- ESCUTA DE ROLAGENS ---
  useEffect(() => {
    if (!user) return;
    const unsubRolls = db.collection('artifacts').doc(appId)
      .collection('public').doc('data').collection('rolls')
      .orderBy('timestamp', 'desc').limit(50)
      .onSnapshot(snap => {
        const rolls = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setRollHistory(rolls);
        setRecentRolls(rolls.slice(0, 5));
      });
    return () => unsubRolls();
  }, [user])

  // --- FUNÇÕES DE AÇÃO ---


  // --- 2. ATUALIZA A FICHA (COMPLETA) ---
  const onUpdateSheet = async (newData) => {
    try {
      // 1. Atualiza a tela imediatamente
      setCharacterSheetData(newData);

      // 2. Salva no Firebase
      await db.collection('artifacts').doc(appId)
        .collection('public').doc('data')
        .collection('characters')
        .doc(characterName.toLowerCase())
        .set({ sheetData: newData }, { merge: true });

      // 3. BUSCA SEGURA DA URL (Baseada na imagem da sua planilha)
      // Recarregamos a lista da planilha mestre para garantir o link atualizado
      const googlePlayers = await loadPlayerList();

      // Procuramos o herói testando todas as chaves possíveis de nome
      const playerFromSheet = googlePlayers.find(p => {
        // Pegamos todos os valores de cada linha e transformamos em minúsculo para comparar
        const valoresDaLinha = Object.values(p).map(v => String(v).toLowerCase().trim());
        return valoresDaLinha.includes(characterName.toLowerCase().trim());
      });

      // Se encontrou o player, tentamos pegar a URL de qualquer coluna que se pareça com "url"
      let sheetUrl = null;
      if (playerFromSheet) {
        // Procura uma chave que contenha a palavra 'url' ou 'ficha' ou 'link'
        const keyUrl = Object.keys(playerFromSheet).find(k =>
          k.toLowerCase().includes('url') ||
          k.toLowerCase().includes('ficha') ||
          k.toLowerCase().includes('link')
        );
        sheetUrl = playerFromSheet[keyUrl];
      }

      const idPlanilha = extractSpreadsheetId(sheetUrl);

      if (idPlanilha && scriptWebhook) {
        await updateSheetViaScript(scriptWebhook, idPlanilha, newData);
      } else {
        console.error("❌ Erro: ID da planilha não encontrado para este herói.");
      }
    } catch (error) {
      console.error("❌ Erro na sincronização:", error);
    }
  }
  // --- 3. ROLAR DADOS ---
  // A função de rolar dados agora salva a rolagem no Firebase, que por sua vez é ouvida em tempo real para atualizar o feed de rolagens
  const rollDice = async (sides, forcedResult = null, extraLabel = '') => {
    const result = forcedResult !== null ? forcedResult : Math.floor(Math.random() * sides) + 1;
    await db.collection('artifacts').doc(appId).collection('public').doc('data')
      .collection('rolls').add({
        playerName: characterName || "Anônimo",
        sides: sides, result: result,
        label: extraLabel,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
      });
  }

  // --- 4. SELECIONAR PERSONAGEM ---
  // A função de selecionar personagem agora salva o personagem no Firebase, que por sua vez é ouvida em tempo real para atualizar o feed de personagens
  const saveCharacter = async (name, data) => {
    try {
      // 1. Salva no Firebase
      await db.collection('artifacts').doc(appId)
        .collection('public').doc('data')
        .collection('characters').doc(name.toLowerCase())
        .set(data, { merge: true });

      // 2. Sincroniza com a Planilha via Apps Script
      // Tentamos pegar a URL de qualquer lugar possível no objeto data
      const urlOriginal = data.url || data.sheetUrl || (data.sheetData && data.sheetData.url);

      if (urlOriginal && scriptWebhook) {
        const idPlanilha = extractSpreadsheetId(urlOriginal);
        if (idPlanilha) {
          await updateSheetViaScript(scriptWebhook, idPlanilha, data.sheetData || data);
        }
      }
    } catch (e) {
      console.error("Erro na sincronização:", e);
    }
  }

  // --- 5. ATUALIZAR TALENTOS ---
  // A função de atualizar talento agora salva o talento no Firebase, que por sua vez é ouvida em tempo real para atualizar o feed de talentos
  const upgradeTalent = (talentId, level) => {
    const currentUnlocked = characterData?.unlocked || {};
    const currentLv = currentUnlocked[talentId] || 0;
    let updatedUnlocked = { ...currentUnlocked };

    if (level === currentLv + 1) updatedUnlocked[talentId] = level;
    else if (level === currentLv) updatedUnlocked[talentId] = level - 1;

    const updatedData = { ...characterData, unlocked: updatedUnlocked };
    saveCharacter(characterName, updatedData);
  }

  // --- 6. SELECIONAR ÁRVORE DE TALENTOS ---
  //  A função de selecionar árvore agora salva a árvore no Firebase, que por sua vez é ouvida em tempo real para atualizar o feed de árvores
  const selectCharacter = async (charName) => {
    if (charName.toLowerCase() === 'mestre') {
      setCharacterName('Mestre');
      setView('master');
      return;
    }

    setCharacterName(charName);

    // 1. Busca o personagem na lista carregada (que já veio do Firebase no useEffect)
    const charFromFirebase = allCharacters.find(c => {
      const n = c.name || c.Personagem || "";
      return n.toLowerCase().trim() === charName.toLowerCase().trim();
    });

    try {
      // ESTRATÉGIA: Usar Firebase se os dados da ficha já existirem lá
      if (charFromFirebase && charFromFirebase.sheetData) {
        setCharacterData(charFromFirebase);
        setCharacterSheetData(charFromFirebase.sheetData);
        setView('sheet');

        // VERIFICAÇÃO BACKGROUND (Silenciosa)
        const sheetUrl = charFromFirebase?.url || charFromFirebase?.URL;
        if (sheetUrl) {
           loadCharacterSheet(sheetUrl).then(dataFromSheet => {
             if (dataFromSheet) {
                const fbDataStr = JSON.stringify(charFromFirebase.sheetData);
                const shDataStr = JSON.stringify(dataFromSheet);
                if (fbDataStr !== shDataStr) {
                    const mergedData = { ...charFromFirebase, sheetData: dataFromSheet };
                    setCharacterData(mergedData);
                    setCharacterSheetData(dataFromSheet);
                    
                    // Salva no banco de dados (ignorando o appscript webhook pq a fonte JÁ foi a planilha)
                    db.collection('artifacts').doc(appId)
                       .collection('public').doc('data')
                       .collection('characters').doc(charName.toLowerCase())
                       .set(mergedData, { merge: true });
                }
             }
           }).catch(console.error);
        }
        return;
      }

    

      // 2. Se não tem no Firebase, busca na Planilha (Primeira vez do herói)
      const sheetUrl = charFromFirebase?.url || charFromFirebase?.URL;
      if (sheetUrl) {
        const dataFromSheet = await loadCharacterSheet(sheetUrl);

        if (dataFromSheet) {
          const mergedData = {
            ...charFromFirebase,
            name: charName,
            sheetData: dataFromSheet
          };

          // 3. Salva no Firebase para que no próximo F5 não precise ler a planilha
          await saveCharacter(charName, mergedData);

          setCharacterData(mergedData);
          setCharacterSheetData(dataFromSheet);
          setView('sheet');
        }
      }
    } catch (e) {
      console.error("❌ Erro ao carregar personagem:", e);
      setView('character');
    }
  };

  // --- 7. CRIAR NOVO HERÓI ---
  // A criação de heróis agora salva o herói no Firebase, que por sua vez é ouvida em tempo real para atualizar o feed de heróis
  const createNewCharacter = async () => {
    if (!newCharacterName.trim()) return;
    try {
      const newHero = {
        name: newCharacterName.trim(),
        selectedTree: null,
        unlocked: {},
        sheetData: null
      };
      await saveCharacter(newHero.name, newHero);
      setCreatingCharacter(false);
      setNewCharacterName('');
      alert('✨ Herói criado!');
    } catch (e) { alert('Erro ao salvar herói.'); }
  }
  // --- 8. ATUALIZAR XP DO PERSONAGEM ---
  // A função de atualizar XP agora salva o XP no Firebase, que por sua vez é ouvida em tempo real para atualizar a ficha do personagem
  const updateCharacterXP = async (name, newXP) => {
    try {
      const charRef = db.collection('artifacts').doc(appId).collection('public').doc('data').collection('characters').doc(name.toLowerCase());
      const snap = await charRef.get();
      if (snap.exists) {
        const data = snap.data();
        if (!data.sheetData) return;
        if (!data.sheetData.info) data.sheetData.info = {};
        
        data.sheetData.info['XP'] = newXP.toString();
        
        // 1. Salvar no Firebase
        await charRef.set(data);

        // 2. Tentar Sincronizar na Planilha Google
        const sheetUrl = data.url || data.sheetUrl || (data.sheetData && data.sheetData.url);
        const idPlanilha = extractSpreadsheetId(sheetUrl);
        if (idPlanilha && typeof scriptWebhook !== 'undefined') {
          updateSheetViaScript(scriptWebhook, idPlanilha, data.sheetData);
        }
      }
    } catch(e) {
      console.error("Erro ao atualizar XP:", e);
    }
  }

  // --- 8.1 ATUALIZAR CONDIÇÕES DO PERSONAGEM ---
  const updateCharacterConditions = async (name, conditionsArray) => {
    try {
      const charRef = db.collection('artifacts').doc(appId).collection('public').doc('data').collection('characters').doc(name.toLowerCase());
      const snap = await charRef.get();
      if (snap.exists) {
        const data = snap.data();
        if (!data.sheetData) return;
        if (!data.sheetData.info) data.sheetData.info = {};
        
        // Salvamos as condições ativas na aba info como JSON string pra manter os objetos
        data.sheetData.info['Condicoes'] = JSON.stringify(conditionsArray);
        
        await charRef.set(data);

        const sheetUrl = data.url || data.sheetUrl || (data.sheetData && data.sheetData.url);
        const idPlanilha = extractSpreadsheetId(sheetUrl);
        if (idPlanilha && typeof scriptWebhook !== 'undefined') {
          updateSheetViaScript(scriptWebhook, idPlanilha, data.sheetData);
        }
      }
    } catch(e) {
      console.error("Erro ao atualizar Condições:", e);
    }
  }

  // --- 8.2 AVANÇAR TURNO / GERENCIAR RODADA ---
  const advanceTurn = async (targetCharName) => {
    try {
      const turnRef = db.collection('artifacts').doc(appId).collection('public').doc('data').collection('global').doc('turnState');
      
      // Se clicar no personagem que já tem a vez, remove a vez dele (Limpa o estado)
      // Ou se passar null (botão Limpar Turnos)
      if (!targetCharName || turnState?.activeChar === targetCharName) {
        await turnRef.set({
          activeChar: null,
          lastUpdate: Date.now()
        }, { merge: true });
        return;
      }

      // 1. Atualiza quem é o personagem ativo
      await turnRef.set({
        activeChar: targetCharName,
        lastUpdate: Date.now()
      }, { merge: true });

      // 2. Decrementa turnos das condições do personagem que acabou de começar o turno
      const charId = targetCharName.toLowerCase();
      const charRef = db.collection('artifacts').doc(appId).collection('public').doc('data').collection('characters').doc(charId);
      const snap = await charRef.get();
      
      if (snap.exists) {
        const data = snap.data();
        let conds = [];
        try {
          conds = JSON.parse(data.sheetData?.info?.['Condicoes'] || '[]');
        } catch(e) { conds = []; }

        if (conds.length > 0) {
          // Decrementa e remove quem chegou a 0
          const updatedConds = conds.map(c => ({ ...c, turns: parseInt(c.turns) - 1 }))
                                   .filter(c => c.turns > 0);
          
          if (JSON.stringify(conds) !== JSON.stringify(updatedConds)) {
            await updateCharacterConditions(targetCharName, updatedConds);
          }
        }
      }
    } catch(e) {
      console.error("Erro ao avançar turno:", e);
    }
  }

  // --- 9. ATUALIZAR CAMPO DA FICHA ---
  // Esta função é chamada toda vez que um campo da ficha é editado
  const updateSheetField = (section, field, value) => {
    // 1. Cópia profunda dos dados atuais
    let updatedSheetData = { ...characterSheetData };

    if (field === null) {
      // Se 'field' for null, significa que estamos substituindo a seção INTEIRA
      // (Útil para apagar círculos de magia ou resetar blocos)
      updatedSheetData[section] = value;
    } else {
      // Caso contrário, atualiza apenas o campo específico dentro da seção
      updatedSheetData[section] = {
        ...characterSheetData[section],
        [field]: value
      };
    }

    // 2. Atualiza o estado visual (React)
    setCharacterSheetData(updatedSheetData);

    const updatedFullData = {
      ...characterData,
      sheetData: updatedSheetData
    };
    setCharacterData(updatedFullData);

    // 3. Salva no Firebase (Fonte de verdade do App)
    saveCharacter(characterName, updatedFullData);

    // 4. Sincroniza com a Planilha Google
    const sheetId = extractSpreadsheetId(characterData.url || characterData.URL);

    if (sheetId && typeof scriptWebhook !== 'undefined') {
      // Enviamos a ação de UPDATE para o Apps Script processar
      // Passamos o objeto completo para que a planilha reflita o estado atual
      updateSheetViaScript(scriptWebhook, sheetId, updatedSheetData);
    } else {
      console.warn("⚠️ Sincronização pendente: scriptWebhook ou sheetId não encontrados.");
    }
  };

  // --- RENDERIZAÇÃO ---

  // Se estivermos na visão da árvore de talentos, renderizamos a TreeView
  // Se estivermos na visão da ficha e tivermos os dados da ficha, renderizamos a SheetView
  // Se estivermos na visão de login, renderizamos a LoginView
  // A ordem de prioridade é: MasterView > SheetView > TreeView > LoginView

  if (loading) return React.createElement('div', { className: "min-h-screen bg-slate-950 flex items-center justify-center text-amber-500 font-mono" }, "CARREGANDO REINO...");

  // --- 8.4 INICIATIVA ---
  const updateInitiative = async (newOrder) => {
    try {
      await db.collection('artifacts').doc(appId)
        .collection('public').doc('data').collection('global').doc('turnState')
        .set({ 
          ...turnState,
          initiativeOrder: newOrder 
        }, { merge: true });
    } catch (e) { console.error("Erro ao salvar iniciativa:", e); }
  };

  // --- 8.3 INTEGRAÇÃO GEMINI ---
  const askGemini = async (prompt) => {
    if (!geminiApiKey) throw new Error("API Key do Gemini não configurada!");

    const systemInstruction = "Você é um mestre de RPG baseado em todos os livros de dungeon and dragons, principalmente na edição 5e. Responda de forma útil, mística e em português brasileiro.";
    
    // Lista de modelos atualizada conforme diagnóstico de 2026
    const MODELS_TO_TRY = [
      'gemini-2.5-flash',
      'gemini-flash-latest',
      'gemini-2.5-pro',
      'gemini-pro-latest'
    ];

    let lastError = null;

    for (const modelId of MODELS_TO_TRY) {
      try {
        console.log(`Tentando Gemini com modelo: ${modelId}...`);
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${geminiApiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            system_instruction: { parts: [{ text: systemInstruction }] },
            contents: [{ role: 'user', parts: [{ text: prompt }] }]
          })
        });

        const data = await response.json();
        
        if (data.error) {
           console.warn(`Modelo ${modelId} falhou:`, data.error.message);
           lastError = data.error.message;
           continue; // Tenta o próximo
        }
        
        if (data.candidates && data.candidates[0].content) {
          return data.candidates[0].content.parts[0].text;
        }
      } catch (e) {
        console.warn(`Erro na tentativa com ${modelId}:`, e.message);
        lastError = e.message;
      }
    }

    throw new Error(`O Oráculo está silenciando... (Nenhum modelo compatível encontrado. Último erro: ${lastError})`);
  };

  // Se estivermos na visão do mestre, renderizamos a MasterView
  if (view === 'master') {
    return React.createElement(MasterView, {
      allCharacters, rollHistory, onBack: () => setView('login'),
      updateCharacterXP,
      updateCharacterConditions,
      advanceTurn,
      turnState,
      geminiApiKey,
      setGeminiApiKey: (key) => { setGeminiApiKey(key); localStorage.setItem('gemini_api_key', key); },
      askGemini,
      updateInitiative,
      onViewSheet: (char) => { setCharacterSheetData(char.sheetData); setCharacterName(char.name); setView('sheet'); }
    })
  }
  // Se estivermos na visão da ficha e tivermos os dados da ficha, renderizamos a SheetView
  if (view === 'sheet' && characterSheetData) {
    return React.createElement(React.Fragment, null, [
      // 1. A Ficha de Personagem
      React.createElement(SheetView, {
        key: 'sheet-view',
        characterName,
        characterSheetData,
        onBack: () => setView('login'),
        onToggleTree: () => setView('character'),
        rollDice,
        iconMap,
        updateSheetField: updateSheetField,
        onUpdateSheet: onUpdateSheet,
        turnState,
        handleDescansoLongo: async () => {
          if (!confirm("Realizar Descanso Longo? Isso zerará o dano acumulado e escudos.")) return;

          const newData = JSON.parse(JSON.stringify(characterSheetData));

          newData.recursos['PV Perdido'] = 0;
          newData.recursos['PV Temporário'] = 0;

          const max = parseInt(newData.recursos['PV Máximo']) || 0;
          newData.recursos['PV Atual'] = max;

          await onUpdateSheet(newData);
          AudioManager.play('rest');

          alert("🌙Foi uma noite tranquila. Descanso realizado!");
        },
        setEditableSheetData,
        isRollingModalOpen,
        setRollingModalOpen
      }),

      // 2. Rolagem de Dados
      React.createElement(DiceRoller, {
        key: 'dice-roller-sheet',
        rollDice,
        recentRolls,
        characterName,
        view,
        isRollingModalOpen,
        setRollingModalOpen
      })

    ]);
  }

  // Se estivermos na visão da árvore de talentos, renderizamos a TreeView
  if (view === 'character') {
    return React.createElement(React.Fragment, null,
      // 1. Árvore de Talentos
      React.createElement(TreeView, {
        TALENT_TREES, characterData, characterName, characterSheetData,
        onBack: () => setView('login'), onToggleSheet: () => setView('sheet'),
        iconMap, upgradeTalent, saveCharacter,
        showTooltip: (e, n, l) => {
          if (!e) {
            setTooltip({ show: false, content: null, x: 0, y: 0 });
            return;
          }
          // Calcula se o mouse está muito baixo na tela (menos de 250px do fundo)
          const shouldShowAbove = (window.innerHeight - e.clientY) < 250;
          setTooltip({
            show: true,
            content: { talentName: n, ...l },
            x: e.clientX,
            y: e.clientY,
            above: shouldShowAbove
          });
        }
      }),

      // 2. O Rolo de Dados
      React.createElement(DiceRoller, { rollDice, recentRolls, characterName, view }),

      // 3. O TOOLTIP COM POSICIONAMENTO INTELIGENTE
      tooltip.show && React.createElement('div', {
        className: "fixed z-[9999] pointer-events-none bg-slate-900 border-2 border-amber-500/50 p-5 rounded-3xl shadow-2xl w-72 animate-fade-in",
        style: {
          left: Math.min(tooltip.x + 20, window.innerWidth - 300),
          // Se 'above' for true, subtraímos a altura do balão para ele subir. 
          // Caso contrário, usamos a posição normal abaixo do mouse.
          top: tooltip.above
            ? tooltip.y - 240
            : Math.min(tooltip.y + 20, window.innerHeight - 200),
        }
      }, [
        React.createElement('div', { className: "flex items-center gap-2 mb-2", key: 't-header' }, [
          React.createElement('span', { key: 't-star' }, "⭐"),
          React.createElement('p', { className: "text-amber-500 font-black uppercase text-xs tracking-tighter", key: 't-title' },
            `${tooltip.content?.talentName} - NV ${tooltip.content?.lv}`
          )
        ]),
        React.createElement('p', { className: "text-[11px] text-slate-300 italic mb-4 leading-relaxed", key: 't-desc' },
          `"${tooltip.content?.desc}"`
        ),
        React.createElement('div', { className: "space-y-2 border-t border-slate-800 pt-3", key: 't-footer' }, [
          React.createElement('div', { className: "bg-red-950/30 p-2 rounded-xl border border-red-900/30", key: 't-req-box' }, [
            React.createElement('p', { className: "text-[9px] font-black text-red-500 uppercase mb-1", key: 't-req-lab' }, "Requisito:"),
            React.createElement('p', { className: "text-red-200 text-[10px] font-bold", key: 't-req-val' }, tooltip.content?.req)
          ]),
          React.createElement('div', { className: "bg-green-950/30 p-2 rounded-xl border border-green-900/30", key: 't-eff-box' }, [
            React.createElement('p', { className: "text-[9px] font-black text-green-500 uppercase mb-1", key: 't-eff-lab' }, "Efeito:"),
            React.createElement('p', { className: "text-green-200 text-[10px] font-black", key: 't-eff-val' }, tooltip.content?.effect)
          ])
        ])
      ])
    );
  }

  return React.createElement(LoginView, {
    allCharacters, onSelectCharacter: selectCharacter,
    creatingCharacter, setCreatingCharacter,
    newCharacterName, setNewCharacterName,
    onCreateCharacter: createNewCharacter,
    TALENT_TREES, iconMap
  })
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(React.createElement(App));