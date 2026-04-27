// 1. IMPORTAÇÕES
import { TALENT_TREES, firebaseConfig, appId, iconMap } from './data.js';
import { loadCharacterSheet, loadPlayerList, getCharacterByName, updateSheetViaScript, extractSpreadsheetId, createCharacterInDrive } from './utils.js'
import { SheetView } from './components/SheetView.js'
import { TreeView } from './components/TreeView.js'
import { MasterView } from './components/MasterView.js'
import { LoginView } from './components/LoginView.js'
import { DiceRoller } from './components/DiceRoller.js'
import { LoadingScreen } from './components/LoadingScreen.js'
import { RawDataEditor } from './components/RawDataEditor.js'
import { TalentTooltip } from './components/TalentTooltip.js'
import { AudioManager } from './AudioManager.js'
import { LibraryView } from './components/LibraryView.js'
import { BARGAIN_EFFECTS } from './data/bargainEffects.js'
import { DevilsBargain } from './components/DevilsBargain.js'

// 2. INICIALIZAÇÃO FIREBASE
const app = !firebase.apps.length ? firebase.initializeApp(firebaseConfig) : firebase.app()
const auth = firebase.auth()
const db = firebase.firestore()

const { useState, useEffect, useRef } = React

function App() {
  const el = React.createElement;
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
  const [isCreating, setIsCreating] = useState(false);
  const [isNewCharacter, setIsNewCharacter] = useState(false); // Abre setup ao criar
  const [rollHistory, setRollHistory] = useState([]);
  const [recentRolls, setRecentRolls] = useState([]);
  const [tooltip, setTooltip] = useState({ show: false, content: null, x: 0, y: 0 });
  const [editableSheetData, setEditableSheetData] = useState(null);
  const [isRollingModalOpen, setRollingModalOpen] = useState(false);
  const [turnState, setTurnState] = useState({ activeChar: '', round: 1 });
  const [souls, setSouls] = useState([]); // Grimório de Almas
  const [geminiApiKey, setGeminiApiKey] = useState(localStorage.getItem('gemini_api_key') || '');
  const [externalRoll, setExternalRoll] = useState(null); // Gatilho para rolagens 3D sem modal

  const lastHPs = useRef({}); // Rastreador de HP para mortes automáticas (Ref evita re-renders)
  
  // --- NOVOS ESTADOS GLOBAIS (SALA DO MESTRE) ---
  const [sessionState, setSessionState] = useState({
    announcement: '',
    handout: '',
    environment: 'none',
    monsters: [],
    masterNotes: '',
    day: 1,
    library: {
      characters: [],
      books: [],
      bestiary: []
    },
    devilsBargain: {
      categories: BARGAIN_EFFECTS,
      activeBargains: []
    },
    announcementTarget: 'all',
    handoutTarget: 'all'
  });
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [isBargainOpen, setIsBargainOpen] = useState(false);
  const [lastTriggerSound, setLastTriggerSound] = useState(null);
  const [showHandout, setShowHandout] = useState(true);
  const [chatMessages, setChatMessages] = useState([]);
  const [hasNewMessage, setHasNewMessage] = useState(false);

  // --- FUNÇÕES AUXILIARES ---
  const updateSessionState = async (updates) => {
    try {
      await db.collection('artifacts').doc(appId)
        .collection('public').doc('data').collection('global').doc('session')
        .set(updates, { merge: true });
    } catch (e) { console.error("Erro ao atualizar sessão:", e); }
  };

  const sendChatMessage = (text, sender, recipient = null) => {
    db.collection('artifacts').doc(appId)
      .collection('public').doc('data').collection('messages')
      .add({
        text,
        sender,
        recipient,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
      });
  };

  // Reset showHandout local state when handout URL changes in session
  useEffect(() => {
    setShowHandout(true);
  }, [sessionState.handout]);

  // --- ESCUTA DE DIAS PARA BARGANHAS ---
  const lastDayRef = useRef(sessionState.day);
  useEffect(() => {
    if (sessionState.day > lastDayRef.current) {
        console.log("Dia avançou! Ticking down bargains (Days)...");
        const active = sessionState.devilsBargain?.activeBargains || [];
        if (active.length > 0) {
            const updated = active.map(b => b.unit === 'Dias' || b.unit === 'days' ? { ...b, duration: b.duration - 1 } : b)
                                 .filter(b => b.duration > 0);
            if (JSON.stringify(active) !== JSON.stringify(updated)) {
                updateSessionState({
                    devilsBargain: {
                        ...sessionState.devilsBargain,
                        activeBargains: updated
                    }
                });
            }
        }
    }
    lastDayRef.current = sessionState.day;
  }, [sessionState.day]);

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

  // --- 1.2 ESCUTA GRIMÓRIO DE ALMAS ---
  useEffect(() => {
    if (!user) return;
    const unsubSouls = db.collection('artifacts').doc(appId)
      .collection('public').doc('data').collection('global').doc('souls')
      .onSnapshot((doc) => {
        if (doc.exists) setSouls(doc.data().list || []);
      });
    return () => unsubSouls();
  }, [user]);
  
  // --- 1.3 ESCUTA ESTADO DA SESSÃO ---
  useEffect(() => {
    if (!user) return;
    const unsubSession = db.collection('artifacts').doc(appId)
      .collection('public').doc('data').collection('global').doc('session')
      .onSnapshot((doc) => {
        if (doc.exists) {
            const data = doc.data();
            setSessionState(prev => ({ ...prev, ...data }));
            
            // Gatilho de Som (Shared Soundboard)
            if (data.triggerSound && data.triggerSound.timestamp !== lastTriggerSound?.timestamp) {
                setLastTriggerSound(data.triggerSound);
                if (data.triggerSound.type) {
                    AudioManager.play(data.triggerSound.type);
                }
            }
        }
      });
    return () => unsubSession();
  }, [user, lastTriggerSound]);

  // --- 1.4 ESCUTA CHAT (MENSAGENS PRIVADAS) ---
  useEffect(() => {
    if (!user) return;
    const unsubChat = db.collection('artifacts').doc(appId)
      .collection('public').doc('data').collection('messages')
      .orderBy('timestamp', 'asc')
      .limitToLast(50)
      .onSnapshot(snap => {
        const msgs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setChatMessages(msgs);
        
        // Notifica o mestre se houver nova mensagem de jogador
        if (msgs.length > 0) {
            const lastMsg = msgs[msgs.length - 1];
            if (lastMsg.sender !== 'Mestre' && view === 'master') {
                setHasNewMessage(true);
            }
        }
      });
    return () => unsubChat();
  }, [user, view]);

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
          const mergedList = googlePlayers
            .map(p => {
              const id = (p.Personagem || p.name || "").toLowerCase().trim();
              const fData = firebaseData[id] || {};
              return {
                ...p,
                ...fData,
                name: p.Personagem || p.name
              };
            })
            .filter(p => !p.deleted); // Oculta personagens marcados como excluídos

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
        // Filtro para jogadores normais: não vêem rolagens marcadas como secretas
        const isMaster = characterName.toLowerCase() === 'mestre';
        const filteredRolls = isMaster ? rolls : rolls.filter(r => !r.secret);
        
        setRollHistory(filteredRolls);
        setRecentRolls(filteredRolls.slice(0, 5));
      });
    return () => unsubRolls();
  }, [user, characterName])

  // --- 1.4 MONITOR DE MORTES AUTOMÁTICO ---
  useEffect(() => {
    if (allCharacters.length === 0) return;

    allCharacters.forEach(char => {
      // Ignora o Mestre
      if (char.name.toLowerCase() === 'mestre') return;

      const charId = char.name.toLowerCase();
      const maxPV = parseInt(char.sheetData?.recursos?.['PV Máximo']) || 10;
      const perdido = parseInt(char.sheetData?.recursos?.['PV Perdido']) || 0;
      const temp = parseInt(char.sheetData?.recursos?.['PV Temporário']) || 0;
      const atualPV = (maxPV - perdido) + temp;
      
      const prevHP = lastHPs.current[charId];
      
      // Se o HP atual for 0 e antes era maior que 0
      if (atualPV <= 0 && (prevHP !== undefined && prevHP > 0)) {
        handleAutoSoulDeath(char);
      }
      
      lastHPs.current[charId] = atualPV;
    });
  }, [allCharacters, souls]);

  const handleAutoSoulDeath = async (char) => {
    const charName = char.name;
    const charClass = char.sheetData?.info?.['Classe'] || 'Aventureiro';
    
    const exists = souls.find(s => s.name.toLowerCase() === charName.toLowerCase());
    let newList;
    if (exists) {
        newList = souls.map(s => s.name.toLowerCase() === charName.toLowerCase() ? { ...s, deaths: s.deaths + 1 } : s);
    } else {
        newList = [...souls, { id: Date.now(), name: charName, className: charClass, deaths: 1 }];
    }
    await updateSouls(newList);
  };

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
  const rollDice = async (sides, forcedResult = null, extraLabel = '', isSecret = false) => {
    const result = forcedResult !== null ? forcedResult : Math.floor(Math.random() * sides) + 1;
    await db.collection('artifacts').doc(appId).collection('public').doc('data')
      .collection('rolls').add({
        playerName: characterName || "Anônimo",
        sides: sides, 
        result: result,
        label: extraLabel,
        secret: isSecret, // Nova flag de segredo
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
           loadCharacterSheet(sheetUrl).then(async dataFromSheet => {
             if (dataFromSheet) {
                // 1. Pega a versão MAIS FRESCA do Firebase para evitar sobrescrever edições recentes (Race Condition)
                const charRef = db.collection('artifacts').doc(appId).collection('public')
                                  .doc('data').collection('characters').doc(charName.toLowerCase());
                const freshSnap = await charRef.get();
                const freshData = freshSnap.exists ? freshSnap.data() : charFromFirebase;
                
                const fbDataStr = JSON.stringify(freshData.sheetData);
                const shDataStr = JSON.stringify(dataFromSheet);

                if (fbDataStr !== shDataStr) {
                    // 2. Mescla Inteligente:
                    // A planilha serve como base de fallback, mas TUDO que houver no Firebase 
                    // (estado atual e em tempo real do jogo) tem prioridade absoluta.
                    // Isso evita que o cache da planilha (que pode demorar até 5 min)
                    // desfaça edições recentes como tomada de dano, uso de poções e moedas.
                    const mergedSheetData = {
                        ...dataFromSheet, 
                        ...freshData.sheetData, // Firebase domina, preservando campos avulsos

                        // Mesclagem profunda para garantir que novos campos da planilha não
                        // apaguem os dados salvos previamente no Firebase
                        info: {
                            ...(dataFromSheet.info || {}),
                            ...(freshData.sheetData?.info || {})
                        },
                        atributos: {
                            ...(dataFromSheet.atributos || {}),
                            ...(freshData.sheetData?.atributos || {})
                        },
                        recursos: {
                            ...(dataFromSheet.recursos || {}),
                            ...(freshData.sheetData?.recursos || {})
                        },
                        outros: {
                            ...(dataFromSheet.outros || {}),
                            ...(freshData.sheetData?.outros || {})
                        },
                        magias: {
                            ...(dataFromSheet.magias || {}),
                            ...(freshData.sheetData?.magias || {})
                        },
                        pericias: {
                            ...(dataFromSheet.pericias || {}),
                            ...(freshData.sheetData?.pericias || {})
                        },
                        statsMagia: {
                            ...(dataFromSheet.statsMagia || {}),
                            ...(freshData.sheetData?.statsMagia || {})
                        },
                        ataques: freshData.sheetData?.ataques || dataFromSheet.ataques || []
                    };

                    const mergedData = { ...freshData, sheetData: mergedSheetData };
                    
                    // 3. Atualiza Local e Firebase
                    setCharacterData(mergedData);
                    setCharacterSheetData(mergedSheetData);
                    
                    await charRef.set(mergedData, { merge: true });
                    console.log(`✅ Sincronização em segundo plano concluída para ${charName}.`);
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
  const createNewCharacter = async (name) => {
    if (name === null) {
      setCreatingCharacter(true);
      return;
    }
    if (name === false) {
      setCreatingCharacter(false);
      return;
    }

    setIsCreating(true);
    try {
      // 1. Cria no Google Drive
      const driveResult = await createCharacterInDrive(scriptWebhook, name, user.displayName || 'Jogador');
      
      if (!driveResult || driveResult.status !== 'success') {
         throw new Error("Falha na criação do arquivo no Drive.");
      }

      // 2. Prepara o objeto para o Firebase
      const newHero = {
        name: name,
        selectedTree: null,
        unlocked: {},
        sheetData: null,
        url: driveResult.url // Link oficial gerado pelo Drive
      };

      // 3. Salva no Firebase
      await saveCharacter(name, newHero);
      
      setCreatingCharacter(false);
      setIsCreating(false);
      alert('✨ Herói criado e sincronizado com o Drive!');
      
      // 4. Seleciona o personagem automaticamente (com flag de novo)
      setIsNewCharacter(true);
      selectCharacter(name);
      
    } catch (e) { 
      console.error(e);
      alert('Erro ao criar herói: ' + e.message); 
      setIsCreating(false);
    }
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

      // 3. Decrementa barganhas (Rounds)
      if (sessionState.devilsBargain?.activeBargains?.length > 0) {
        const updatedBargains = sessionState.devilsBargain.activeBargains.map(b => {
            if (b.player === targetCharName && b.unit === 'rounds') {
                return { ...b, duration: b.duration - 1 };
            }
            return b;
        }).filter(b => b.duration > 0);

        if (JSON.stringify(sessionState.devilsBargain.activeBargains) !== JSON.stringify(updatedBargains)) {
            await updateSessionState({
                devilsBargain: {
                    ...sessionState.devilsBargain,
                    activeBargains: updatedBargains
                }
            });
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

  if (loading) return React.createElement(LoadingScreen);

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

  // --- 8.5 GRIMÓRIO DE ALMAS ---
  const updateSouls = async (newList) => {
    try {
      await db.collection('artifacts').doc(appId)
        .collection('public').doc('data').collection('global').doc('souls')
        .set({ list: newList }, { merge: true });
    } catch (e) { console.error("Erro ao salvar almas:", e); }
  };

  // --- 8.6 PERMISSÃO DE EDIÇÃO ---
  const updateEditPermission = async (targetCharName, allow) => {
    try {
      const charId = targetCharName.toLowerCase();
      const charRef = db.collection('artifacts').doc(appId).collection('public').doc('data').collection('characters').doc(charId);
      await charRef.set({
        sheetData: { allowEditing: allow }
      }, { merge: true });
    } catch (e) { console.error("Erro ao atualizar permissão:", e); }
  };

  // --- 8.7 DISPARAR ROLAGEM EXTERNA (MESA) ---
  const triggerExternalRoll = (sides, secret = false, modifier = 0, mode = 'normal') => {
    setExternalRoll({ sides, secret, modifier, mode, timestamp: Date.now() });
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

  // --- DELETE PERSONAGEM ---
  const deleteCharacter = async (name) => {
    try {
      // Marca como excluído no Firebase (não remove o doc, apenas oculta)
      await db.collection('artifacts').doc(appId)
        .collection('public').doc('data')
        .collection('characters').doc(name.toLowerCase())
        .set({ deleted: true }, { merge: true });
      console.log(`Personagem "${name}" marcado como excluído.`);
    } catch (e) {
      console.error('Erro ao excluir personagem:', e);
      alert('Erro ao excluir: ' + e.message);
    }
  };



  // --- COMPONENTE DE BIBLIOTECA (OVERLAY GLOBAL) ---
  const LibraryOverlay = isLibraryOpen && el(LibraryView, {
    key: 'library-overlay-global',
    mode: view === 'master' ? 'master' : 'player',
    libraryData: sessionState.library || {},
    updateSessionState,
    onBack: () => setIsLibraryOpen(false)
  });

  const BargainOverlay = isBargainOpen && el(DevilsBargain, {
    key: 'bargain-overlay-global',
    mode: view === 'master' ? 'master' : 'player',
    bargainData: sessionState.devilsBargain || { categories: BARGAIN_EFFECTS, activeBargains: [] },
    updateSessionState,
    onBack: () => setIsBargainOpen(false),
    allPlayers: allCharacters.filter(c => c.name.toLowerCase() !== 'mestre').map(c => c.name)
  });

  // --- MURAL E HANDOUTS GLOBAIS ---
  const AnnouncementOverlay = (sessionState.announcement && (sessionState.announcementTarget === 'all' || sessionState.announcementTarget === characterName || view === 'master')) && el('div', {
    key: 'announcement-overlay',
    className: "fixed top-0 left-0 right-0 z-[200] bg-gradient-to-r from-purple-700 to-indigo-800 text-white p-4 text-center shadow-[0_4px_30px_rgba(0,0,0,0.5)] border-b border-purple-500/30 animate-slide-down flex items-center justify-center gap-4"
  }, [
    el('span', { key: 'icon', className: "text-lg" }, "📢"),
    el('p', { key: 'text', className: "text-[11px] font-bold uppercase tracking-[0.2em] drop-shadow-md" }, sessionState.announcement)
  ]);

  const HandoutOverlay = (sessionState.handout && showHandout && (sessionState.handoutTarget === 'all' || sessionState.handoutTarget === characterName || view === 'master')) && el('div', {
    key: 'handout-overlay',
    className: "fixed inset-0 z-[250] bg-black/90 backdrop-blur-md flex items-center justify-center p-8 md:p-20 transition-all animate-fade-in"
  }, [
    el('div', { key: 'image-container', className: "relative max-w-7xl max-h-full group" }, [
        el('img', { 
            key: 'handout-img',
            src: sessionState.handout, 
            className: "max-w-full max-h-[85vh] rounded-[2rem] shadow-[0_0_80px_rgba(0,0,0,0.8)] border-4 border-white/5 object-contain" 
        }),
        el('button', {
            key: 'close-handout',
            onClick: () => setShowHandout(false),
            className: "absolute -top-6 -right-6 w-14 h-14 bg-white text-slate-900 rounded-2xl flex items-center justify-center text-4xl font-light hover:bg-red-500 hover:text-white transition-all shadow-2xl active:scale-90"
        }, "×")
    ])
  ]);

  // Se estivermos na visão do mestre, renderizamos a MasterView
  if (view === 'master') {
    return React.createElement(React.Fragment, null, [
      el(MasterView, {
        key: 'master-view-node',
        allCharacters, rollHistory, onBack: () => setView('login'),
        updateCharacterXP,
        updateCharacterConditions,
        advanceTurn,
        turnState,
        geminiApiKey,
        setGeminiApiKey: (key) => { setGeminiApiKey(key); localStorage.setItem('gemini_api_key', key); },
        askGemini,
        updateInitiative,
        souls,
        updateSouls,
        updateEditPermission,
        onViewSheet: (char) => { setCharacterSheetData(char.sheetData); setCharacterName(char.name); setView('sheet'); },
        rollDice,
        triggerExternalRoll,
        deleteCharacter,
        sessionState,
        updateSessionState,
        setIsLibraryOpen,
        setIsBargainOpen,
        allPlayers: allCharacters.filter(c => c.name.toLowerCase() !== 'mestre').map(c => c.name),
        chatMessages,
        sendChatMessage,
        hasNewMessage,
        setHasNewMessage
      }),
      el(DiceRoller, {
        key: 'dice-roller-master',
        rollDice,
        recentRolls,
        characterName,
        view,
        isRollingModalOpen,
        setRollingModalOpen,
        tabletopMode: true,
        externalRoll
      }),
      LibraryOverlay,
      BargainOverlay,
      AnnouncementOverlay,
      HandoutOverlay
    ]);
  }
  // Se estivermos na visão da ficha e tivermos os dados da ficha, renderizamos a SheetView
  if (view === 'sheet' && characterSheetData) {
    return React.createElement(React.Fragment, null, [
      // 1. A Ficha de Personagem
      el(SheetView, {
        key: 'sheet-view',
        characterName,
        characterSheetData,
        onBack: () => { setIsNewCharacter(false); setView('login'); },

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

          // Zera os slots de magia usados
          if (newData.magias && newData.magias.slots) {
            Object.keys(newData.magias.slots).forEach(circle => {
              newData.magias.slots[circle].used = 0;
            });
          }

          const max = parseInt(newData.recursos['PV Máximo']) || 0;
          newData.recursos['PV Atual'] = max;

          await onUpdateSheet(newData);
          AudioManager.play('rest');

          alert("🌙Foi uma noite tranquila. Descanso realizado!");
        },
        isRollingModalOpen,
        setRollingModalOpen,
        setEditableSheetData,
        triggerExternalRoll,
        recentRolls,
        isNewCharacter,
        sessionState,
        setIsLibraryOpen,
        setIsBargainOpen,
        sendChatMessage,
        chatMessages: chatMessages.filter(m => 
          m.sender === characterName || 
          (m.sender === 'Mestre' && (m.recipient === characterName || !m.recipient))
        )
      }),


      // 2. Editor de Dados Brutos (Lápis) - EXTRAÍDO
      editableSheetData && el(RawDataEditor, {
        key: 'raw-data-editor',
        data: editableSheetData,
        onSave: onUpdateSheet,
        onClose: () => setEditableSheetData(null)
      }),

      // 3. O Rolo de Dados (Tabletop Player)
      el(DiceRoller, {
        key: 'dice-roller-sheet',
        rollDice,
        recentRolls,
        characterName,
        view,
        isRollingModalOpen,
        setRollingModalOpen,
        tabletopMode: true,
        externalRoll
      }),
      LibraryOverlay,
      BargainOverlay,
      AnnouncementOverlay,
      HandoutOverlay
    ]);
  }

  // Se estivermos na visão da árvore de talentos, renderizamos a TreeView
  if (view === 'character') {
    return React.createElement(React.Fragment, null,
      // 1. Árvore de Talentos
      el(TreeView, {
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
      el(DiceRoller, { key: 'dice-roller-character', rollDice, recentRolls, characterName, view }),

      // 3. O TOOLTIP COM POSICIONAMENTO INTELIGENTE - EXTRAÍDO
      el(TalentTooltip, { key: 'talent-tooltip', tooltip }),

      LibraryOverlay,
      BargainOverlay,
      AnnouncementOverlay,
      HandoutOverlay
    );
  }

  return el(React.Fragment, null, [
    el(LoginView, {
      key: 'login-view',
      allCharacters, 
      onSelectCharacter: selectCharacter,
      onCreateCharacter: createNewCharacter,
      creatingCharacter: creatingCharacter,
      isCreating: isCreating,
      TALENT_TREES, 
      iconMap
    }),
    LibraryOverlay,
    BargainOverlay,
    AnnouncementOverlay,
    HandoutOverlay
  ]);
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(React.createElement(App));