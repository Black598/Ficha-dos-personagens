console.log("🚀 O arquivo app.js foi lido pelo navegador!");

// 1. IMPORTAÇÕES
import { TALENT_TREES, firebaseConfig, appId, iconMap } from './data.js';
import { loadCharacterSheet, loadPlayerList, getCharacterByName, updateSheetViaScript, extractSpreadsheetId } from './utils.js';
import { SheetView } from './components/SheetView.js';
import { TreeView } from './components/TreeView.js';
import { MasterView } from './components/MasterView.js';
import { LoginView } from './components/LoginView.js';
import { DiceRoller } from './components/DiceRoller.js';

// 2. INICIALIZAÇÃO FIREBASE
const app = !firebase.apps.length ? firebase.initializeApp(firebaseConfig) : firebase.app();
const auth = firebase.auth();
const db = firebase.firestore();

const { useState, useEffect } = React;

function App() {
  // --- ESTADOS ---
  const scriptWebhook = "https://script.google.com/macros/s/AKfycbypT8eJMlWk_kMhCSdMD5BqV756fPgmDj7_yLYh9Rx-wZpzAK-fZoTvZXBnfnKDGY8eDA/exec";
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

  // --- 1. EFEITO DE AUTENTICAÇÃO ---
  useEffect(() => {
    const unsubAuth = auth.onAuthStateChanged((user) => {
      if (user) {
        console.log("👤 Usuário logado:", user.uid);
        setUser(user);
      } else {
        auth.signInAnonymously();
      }
    });
    return () => unsubAuth();
  }, []);

  // --- 2. CARREGAMENTO DE DADOS (PLANILHA + FIREBASE) ---
  useEffect(() => {
    if (!user) return;

    const initAppData = async () => {
      console.log("Iniciando carregamento de dados...");
      let googlePlayers = [];
      try {
        googlePlayers = await loadPlayerList();
      } catch (e) { console.error("Erro planilha:", e); }

      const unsub = db.collection('artifacts').doc(appId)
        .collection('public').doc('data')
        .collection('characters')
        .onSnapshot((snap) => {
          const firebaseData = {};
          snap.forEach(doc => firebaseData[doc.id] = doc.data());

          const mergedList = googlePlayers.map(p => {
            const id = (p.name || "").toLowerCase();
            return { ...p, ...(firebaseData[id] || {}), name: p.name };
          });

          snap.forEach(doc => {
            if (!mergedList.some(m => (m.name || "").toLowerCase() === doc.id)) {
              mergedList.push({ ...doc.data(), name: doc.data().name || doc.id });
            }
          });

          setAllCharacters(mergedList);
          setLoading(false);
        });

      return () => unsub();
    };

    initAppData();
  }, [user]);

  // --- 3. CARREGAMENTO DE DADOS (FIREBASE) ---
  useEffect(() => {
    if (!characterName || allCharacters.length === 0) return;
    
    // Procura a versão mais fresca do personagem na lista global
    const updatedChar = allCharacters.find(c => 
        (c.name || c.Personagem || "").toLowerCase() === characterName.toLowerCase()
    );
    
    if (updatedChar) {
        console.log("🔄 Sincronizando dados do Firebase para:", characterName);
        setCharacterData(updatedChar);
    }
}, [allCharacters, characterName]);


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
  }, [user]);

  // --- FUNÇÕES DE AÇÃO ---

  // --- 1. ATUALIZA A FICHA ---
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

      console.log("🔍 Diagnóstico de Busca:");
      console.log("- Nome buscado:", characterName);
      console.log("- Linha encontrada na planilha:", playerFromSheet);
      console.log("- URL extraída:", sheetUrl);
      console.log("- ID Final:", idPlanilha);

      if (idPlanilha && scriptWebhook) {
        console.log(`📡 Enviando para Google Script: ${idPlanilha}`);
        await updateSheetViaScript(scriptWebhook, idPlanilha, newData);
        console.log("✅ Sincronização enviada!");
      } else {
        console.error("❌ Erro: ID da planilha não encontrado para este herói.");
      }
    } catch (error) {
      console.error("❌ Erro na sincronização:", error);
    }
  };
  const rollDice = async (sides) => {
    const result = Math.floor(Math.random() * sides) + 1;
    await db.collection('artifacts').doc(appId).collection('public').doc('data')
      .collection('rolls').add({
        playerName: characterName || "Anônimo",
        sides: sides, result: result,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
      });
  };

  const saveCharacter = async (name, data) => {
    await db.collection('artifacts').doc(appId).collection('public').doc('data')
      .collection('characters').doc(name.toLowerCase()).set(data);
  };

  const upgradeTalent = (talentId, level) => {
    const currentUnlocked = characterData?.unlocked || {};
    const currentLv = currentUnlocked[talentId] || 0;
    let updatedUnlocked = { ...currentUnlocked };

    if (level === currentLv + 1) updatedUnlocked[talentId] = level;
    else if (level === currentLv) updatedUnlocked[talentId] = level - 1;

    const updatedData = { ...characterData, unlocked: updatedUnlocked };
    saveCharacter(characterName, updatedData);
  };

const selectCharacter = async (charName) => {
    if (charName.toLowerCase() === 'mestre') {
      setCharacterName('Mestre');
      setView('master');
      return;
    }

    setCharacterName(charName);

    // 1. Busca o personagem na lista (Firebase + Planilha Mestre)
    const char = allCharacters.find(c => {
      const n = c.name || c.Personagem || c.personagem || "";
      return n.toLowerCase() === charName.toLowerCase();
    });

    // 2. LINHA ESSENCIAL PARA A ÁRVORE: Salva os dados do herói (talentos, árvore selecionada)
    // Se não fizermos isso, a TreeView não saberá quem é o player.
    setCharacterData(char);

    const sheetUrl = char?.url || char?.URL || char?.Ficha;

    try {
      if (sheetUrl) {
        console.log("Tentando carregar planilha:", sheetUrl);
        const data = await loadCharacterSheet(sheetUrl);
        
        if (data) {
          // 3. MESCLAGEM SEGURA: Prioriza o que vem da planilha, mas mantém o que está no Firebase
          const finalSheet = { 
            ...data, 
            info: { ...data.info, ...char?.sheetData?.info },
            recursos: { ...data.recursos, ...char?.sheetData?.recursos },
            outros: { ...data.outros, ...char?.sheetData?.outros }
          };

          finalSheet.info['Nome do Personagem'] = charName;
          setCharacterSheetData(finalSheet);
          setView('sheet');
          return;
        }
      }

      // Caso não tenha planilha, tenta carregar apenas os dados salvos anteriormente
      if (char?.sheetData) {
        setCharacterSheetData(char.sheetData);
        setView('sheet');
      } else {
        // Se for um personagem novo sem nada, vai direto para a Árvore
        setView('character');
      }
    } catch (e) {
      console.error("Erro ao abrir personagem:", e);
      setView('character');
    }
  };

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
  };

  const updateCharacterXP = async (name, newXP) => {
    const charRef = db.collection('artifacts').doc(appId).collection('public').doc('data').collection('characters').doc(name.toLowerCase());
    const snap = await charRef.get();
    if (snap.exists) {
      const data = snap.data();
      if (!data.sheetData) data.sheetData = { info: {} };
      data.sheetData.info['XP'] = newXP.toString();
      await charRef.set(data);
    }
  };

  // --- RENDERIZAÇÃO ---

  if (loading) return React.createElement('div', { className: "min-h-screen bg-slate-950 flex items-center justify-center text-amber-500 font-mono" }, "CARREGANDO REINO...");

  if (view === 'master') {
    return React.createElement(MasterView, {
      allCharacters, rollHistory, onBack: () => setView('login'),
      updateCharacterXP,
      onViewSheet: (char) => { setCharacterSheetData(char.sheetData); setCharacterName(char.name); setView('sheet'); }
    });
  }

  if (view === 'sheet' && characterSheetData) {
    return React.createElement(SheetView, {
      characterName,
      characterSheetData,
      onBack: () => setView('login'),
      onToggleTree: () => setView('character'),
      rollDice,
      // Usamos a função definida na linha 86, sem redeclará-la aqui
      onUpdateSheet: onUpdateSheet,
      handleDescansoLongo: async () => {
        if (!confirm("Realizar Descanso Longo? Isso zerará o dano acumulado.")) return;
        const newData = JSON.parse(JSON.stringify(characterSheetData));
        newData.recursos['PV Perdido'] = 0;
        newData.recursos['PV Temporário'] = 0;
        // Chama a função de sincronização principal
        await onUpdateSheet(newData);
        alert("🌙 Descanso sincronizado!");
      },
      setEditableSheetData
    });
  }

  if (view === 'character') {
    return React.createElement(React.Fragment, null,
      React.createElement(TreeView, {
        TALENT_TREES, characterData, characterName,
        onBack: () => setView('login'), onToggleSheet: () => setView('sheet'),
        iconMap, upgradeTalent, saveCharacter,
        showTooltip: (e, n, l) => setTooltip({ show: !!e, content: { talentName: n, ...l }, x: e?.clientX, y: e?.clientY })
      }),
      React.createElement(DiceRoller, { rollDice, recentRolls, characterName, view })
    );
  }

  return React.createElement(LoginView, {
    allCharacters, onSelectCharacter: selectCharacter,
    creatingCharacter, setCreatingCharacter,
    newCharacterName, setNewCharacterName,
    onCreateCharacter: createNewCharacter,
    TALENT_TREES, iconMap
  });
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(React.createElement(App));