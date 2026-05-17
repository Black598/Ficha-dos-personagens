// 1. IMPORTAÇÕES
import { TALENT_TREES, firebaseConfig, DEFAULT_APP_ID, iconMap } from './data.js';
import { loadCharacterSheet, loadPlayerList, getCharacterByName, updateSheetViaScript, extractSpreadsheetId, createCharacterInDrive, levelToRoman } from './utils.js'
import { SheetView } from './components/SheetView.js'
import { TreeView } from './components/TreeView.js'
import { MasterView } from './components/MasterView.js'
import { LoginView } from './components/LoginView.js'
import { DiceRoller } from './components/DiceRoller.js'
import { CreationMentor } from './components/CreationMentor.js'
import { LoadingScreen } from './components/LoadingScreen.js'
import { RawDataEditor } from './components/RawDataEditor.js'
import { TalentTooltip } from './components/TalentTooltip.js'
import { AudioManager } from './AudioManager.js'
import { LibraryView } from './components/LibraryView.js'
import { BattlemapView } from './components/BattlemapView.js'
import { BARGAIN_EFFECTS } from './data/bargainEffects.js'
import { DevilsBargain } from './components/DevilsBargain.js'
import { getRandomLoot, LOOT_RARITY } from './data/LootTables.js'
import { LootChest } from './components/LootChest.js'
import { WorldMapView } from './components/WorldMapView.js'
import { CraftingView } from './components/CraftingView.js'
import { TradingSystem } from './components/TradingSystem.js'
import { AudioSettingsModal } from './components/AudioSettingsModal.js'

import { LandingView } from './components/LandingView.js'

// 2. INICIALIZAÇÃO FIREBASE
const app = !firebase.apps.length ? firebase.initializeApp(firebaseConfig) : firebase.app()
const auth = firebase.auth()
const db = firebase.firestore()

const { useState, useEffect, useRef } = React

function App() {
  const el = React.createElement;

  // --- 1. ESTADOS ---
  const scriptWebhook = "https://script.google.com/macros/s/AKfycbyEW3GW4hV_BstFdzeuP-rMt4w67mgXza6XjYPezy1rGEnzB9u_yllzmmNHJLGVMuSTqA/exec";
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('landing');
  const [allCharacters, setAllCharacters] = useState([]);
  const [characterName, setCharacterName] = useState('');
  const [characterData, setCharacterData] = useState(null);
  const [characterSheetData, setCharacterSheetData] = useState(null);
  const [creatingCharacter, setCreatingCharacter] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isNewCharacter, setIsNewCharacter] = useState(false);
  const [rollHistory, setRollHistory] = useState([]);
  const [recentRolls, setRecentRolls] = useState([]);
  const [tooltip, setTooltip] = useState({ show: false, content: null, x: 0, y: 0 });
  const [showAudioSettings, setShowAudioSettings] = useState(false);
  const [editableSheetData, setEditableSheetData] = useState(null);
  const [isRollingModalOpen, setRollingModalOpen] = useState(false);
  const [turnState, setTurnState] = useState({ activeChar: '', round: 1 });
  const [souls, setSouls] = useState([]);
  const [geminiApiKey, setGeminiApiKey] = useState(localStorage.getItem('gemini_api_key') || '');
  const [externalRoll, setExternalRoll] = useState(null);
  const [isCraftingOpen, setIsCraftingOpen] = useState(false);
  const [isShopOpen, setIsShopOpen] = useState(false);
  const [lastGlobalSFX, setLastGlobalSFX] = useState(null);
  const [currentAppId, setCurrentAppId] = useState(localStorage.getItem('selected_rpg') || DEFAULT_APP_ID);
  const [campaigns, setCampaigns] = useState([{ id: DEFAULT_APP_ID, name: 'Dungeon Delvers (Original)' }]);
  const [sessionState, setSessionState] = useState({
    announcement: '', handout: '', environment: 'none', monsters: [],
    masterNotes: '', day: 1, library: { characters: [], books: [], bestiary: [] },
    devilsBargain: { categories: BARGAIN_EFFECTS, activeBargains: [] },
    battlemap: { activeMapId: null, maps: [], tokens: [] },
    announcementTarget: 'all', handoutTarget: 'all', groupNotes: [],
    activeLoot: null,
    attributeRule: 'Standard Array'
  });
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [isBattlemapOpen, setIsBattlemapOpen] = useState(false);
  const [isWorldMapOpen, setIsWorldMapOpen] = useState(false);
  const [isBargainOpen, setIsBargainOpen] = useState(false);
  const [lastTriggerSound, setLastTriggerSound] = useState(null);
  const [showHandout, setShowHandout] = useState(true);
  const [chatMessages, setChatMessages] = useState([]);
  const [hasNewMessage, setHasNewMessage] = useState(false);
  const [lastNotifiedNoteId, setLastNotifiedNoteId] = useState(() => localStorage.getItem(`last_note_${currentAppId}`));
  const [showLetter, setShowLetter] = useState(false);
  const [isMasterAuthenticated, setIsMasterAuthenticated] = useState(false);
  const [authenticatedCharacters, setAuthenticatedCharacters] = useState([]);
  const [isMentorOpen, setIsMentorOpen] = useState(false);
  const [creationDraft, setCreationDraft] = useState(null); // Draft para quando o mentor ajuda na criação
  
  const lastHPs = useRef({});
  const lastDayRef = useRef(1);

  // --- 2. EFEITOS (Hooks) ---

  useEffect(() => {
    const handleOpenMentor = () => setIsMentorOpen(true);
    window.addEventListener('open-mentor', handleOpenMentor);
    return () => window.removeEventListener('open-mentor', handleOpenMentor);
  }, []);

  // Auth
  useEffect(() => {
    const unsub = auth.onAuthStateChanged(u => u ? setUser(u) : auth.signInAnonymously());
    return () => unsub();
  }, []);

  // Campanhas
  useEffect(() => {
    const unsub = db.collection('artifacts').doc('global_directory').collection('public').doc('campaign_list')
      .onSnapshot(doc => {
        if (doc.exists && doc.data().list) setCampaigns(doc.data().list);
        else {
          const init = [{ id: DEFAULT_APP_ID, name: 'Dungeon Delvers (Original)' }];
          db.collection('artifacts').doc('global_directory').collection('public').doc('campaign_list').set({ list: init }, { merge: true });
          setCampaigns(init);
        }
      });
    return () => unsub();
  }, []);

  useEffect(() => { 
    localStorage.setItem('selected_rpg', currentAppId); 
    setIsMasterAuthenticated(false); 
    setAuthenticatedCharacters([]); // Reseta autenticações ao trocar de sala
  }, [currentAppId]);

  // Sincronização de Sessão (Real-time)
  useEffect(() => {
    if (!user) return;
    const unsub = db.collection('artifacts').doc(currentAppId).collection('public').doc('data').collection('global').doc('session')
      .onSnapshot(doc => {
        if (doc.exists) {
          const data = doc.data();
          setSessionState(prev => ({ ...prev, ...data }));
          if (data.triggerSound && (!lastTriggerSound || data.triggerSound.timestamp !== lastTriggerSound.timestamp)) {
            setLastTriggerSound(data.triggerSound);
            if (data.triggerSound.type && (view === 'sheet' || view === 'character' || view === 'master')) {
              AudioManager.play(data.triggerSound.type);
            }
          }
        }
      });
    return () => unsub();
  }, [user, currentAppId, view]);

  // Turnos e Almas
  useEffect(() => {
    if (!user) return;
    const unsubTurns = db.collection('artifacts').doc(currentAppId).collection('public').doc('data').collection('global').doc('turnState')
      .onSnapshot(doc => setTurnState(doc.exists ? doc.data() : { activeChar: '', round: 1 }));
    const unsubSouls = db.collection('artifacts').doc(currentAppId).collection('public').doc('data').collection('global').doc('souls')
      .onSnapshot(doc => setSouls(doc.exists ? (doc.data().list || []) : []));
    return () => { unsubTurns(); unsubSouls(); };
  }, [user, currentAppId]);

  // Música e SFX (Apenas silenciados em landing e login)
  useEffect(() => {
    if (view !== 'sheet' && view !== 'character' && view !== 'master') {
      AudioManager.stopAmbient('global');
      return;
    }
    const amb = sessionState.ambientMusic;
    if (amb && amb.url) amb.fadeOut ? AudioManager.stopAmbient('global', true) : AudioManager.playAmbient(amb.url, 'global', amb.volume || 0.5);
    else AudioManager.stopAmbient('global');
  }, [sessionState.ambientMusic, view]);

  useEffect(() => {
    if (view !== 'sheet' && view !== 'character' && view !== 'master') return;
    const sfx = sessionState.globalSFX;
    if (sfx && sfx.url && (!lastGlobalSFX || sfx.timestamp !== lastGlobalSFX.timestamp)) {
      setLastGlobalSFX(sfx);
      if (Date.now() - sfx.timestamp < 10000) {
        const settings = AudioManager.getSettings();
        if (settings.masterEnabled) {
          const isOwnSound = sfx.sender === characterName || (view === 'master' && sfx.sender === 'Mestre');
          if (isOwnSound || settings.hearOthersSoundboard) {
            try {
              const audio = new Audio(sfx.url);
              audio.volume = 0.8;
              audio.play().catch(e => console.error(e));
            } catch(e) {
              console.error(e);
            }
          }
        }
      }
    }
  }, [sessionState.globalSFX, lastGlobalSFX, view, characterName]);

  // Chat
  useEffect(() => {
    if (!user) return;
    setChatMessages([]);
    const unsub = db.collection('artifacts').doc(currentAppId).collection('public').doc('data').collection('messages')
      .orderBy('timestamp', 'asc').limitToLast(50)
      .onSnapshot(snap => {
        const msgs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setChatMessages(msgs);
        if (msgs.length > 0 && msgs[msgs.length-1].sender !== 'Mestre' && view === 'master') setHasNewMessage(true);
      });
    return () => unsub();
  }, [user, view, currentAppId]);

  // Personagens (Merge Planilha + Firebase)
  useEffect(() => {
    if (!user) return;
    setLoading(true);
    let active = true;
    const init = async () => {
      let gPlayers = [];
      try { if (currentAppId === DEFAULT_APP_ID) gPlayers = await loadPlayerList(); } catch(e){}
      if (!active) return;
      const unsub = db.collection('artifacts').doc(currentAppId).collection('public').doc('data').collection('characters')
        .onSnapshot(snap => {
          if (!active) return;
          const fbData = {}; snap.forEach(d => fbData[d.id.toLowerCase()] = d.data());
          const merged = gPlayers.map(p => {
            const id = (p.Personagem || p.name || "").toLowerCase().trim();
            return { ...p, ...(fbData[id] || {}), name: p.Personagem || p.name };
          }).filter(p => !p.deleted);
          const gIds = gPlayers.map(p => (p.Personagem || p.name || "").toLowerCase().trim());
          Object.keys(fbData).forEach(id => {
            if (!gIds.includes(id) && !['mestre','sessao','globais'].includes(id) && !fbData[id].deleted) {
              merged.push({ ...fbData[id], name: fbData[id].name || id });
            }
          });
          setAllCharacters(merged); setLoading(false);
        });
      return unsub;
    };
    let unsubSnap = null;
    init().then(u => unsubSnap = u);
    return () => { active = false; if (unsubSnap) unsubSnap(); };
  }, [user, currentAppId]);

  // Atualização local do personagem selecionado
  useEffect(() => {
    if (!characterName || allCharacters.length === 0) return;
    const char = allCharacters.find(c => (c.name || c.Personagem || "").toLowerCase() === characterName.toLowerCase());
    if (char) { setCharacterData(char); if (char.sheetData) setCharacterSheetData(char.sheetData); }
  }, [allCharacters, characterName]);

  // Rolagens
  useEffect(() => {
    if (!user) return;
    const unsub = db.collection('artifacts').doc(currentAppId).collection('public').doc('data').collection('rolls')
      .orderBy('timestamp', 'desc').limit(50)
      .onSnapshot(snap => {
        const rolls = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const isM = characterName.toLowerCase() === 'mestre';
        const filtered = isM ? rolls : rolls.filter(r => !r.secret);
        setRollHistory(filtered); setRecentRolls(filtered.slice(0, 5));
      });
    return () => unsub();
  }, [user, characterName, currentAppId]);

  // Handout Reset
  useEffect(() => { setShowHandout(true); }, [sessionState.handout]);

  // Bargain Tick (Days)
  useEffect(() => {
    if (sessionState.day > lastDayRef.current) {
      const active = sessionState.devilsBargain?.activeBargains || [];
      const updated = active.map(b => (b.unit === 'days' || b.unit === 'Dias') && b.unit !== 'permanent' ? { ...b, duration: b.duration - 1 } : b).filter(b => b.unit === 'permanent' || b.duration > 0);
      if (JSON.stringify(active) !== JSON.stringify(updated)) updateSessionState({ devilsBargain: { ...sessionState.devilsBargain, activeBargains: updated } });
    }
    lastDayRef.current = sessionState.day;
  }, [sessionState.day]);

  // Monitor de Mortes (Grimório de Almas)
  useEffect(() => {
    if (allCharacters.length === 0) return;
    
    const autoCount = sessionState.soulSettings?.autoCountDeaths ?? true;

    // Filtramos apenas personagens que realmente morreram nesta iteração
    const newDeaths = [];
    allCharacters.forEach(char => {
      if (char.name.toLowerCase() === 'mestre') return;
      const id = char.name.toLowerCase();
      const max = parseInt(char.sheetData?.recursos?.['PV Máximo']) || 10;
      const perd = parseInt(char.sheetData?.recursos?.['PV Perdido']) || 0;
      const tmp = parseInt(char.sheetData?.recursos?.['PV Temporário']) || 0;
      const curr = (max - perd) + tmp;

      // Se morreu agora e antes estava vivo
      if (curr <= 0 && lastHPs.current[id] > 0) {
        if (autoCount) newDeaths.push(char);
      }
      lastHPs.current[id] = curr;
    });

    if (newDeaths.length > 0) {
      // Usamos uma função assíncrona para buscar o estado atual e atualizar
      const processDeaths = async () => {
        const snap = await db.collection('artifacts').doc(currentAppId).collection('public').doc('data').collection('global').doc('souls').get();
        let currentSouls = snap.exists ? (snap.data().list || []) : [];
        
        newDeaths.forEach(char => {
          const id = char.name.toLowerCase();
          const exists = currentSouls.find(s => s.name.toLowerCase() === id);
          if (exists) {
            currentSouls = currentSouls.map(s => s.name.toLowerCase() === id ? { ...s, deaths: s.deaths + 1 } : s);
          } else {
            currentSouls.push({ id: Date.now(), name: char.name, className: char.sheetData?.info?.['Classe'] || 'Aventureiro', deaths: 1 });
          }
        });
        
        await updateSouls(currentSouls);
      };
      processDeaths();
    }
  }, [allCharacters]); // Removemos 'souls' da dependência para evitar loop

  // --- 3. FUNÇÕES DE LÓGICA ---

  const updateSessionState = async (updates) => {
    try { await db.collection('artifacts').doc(currentAppId).collection('public').doc('data').collection('global').doc('session').set(updates, { merge: true }); }
    catch (e) { console.error(e); }
  };

  const onEnterRoom = async (roomId) => {
    const campaign = campaigns.find(c => c.id === roomId);
    if (!campaign) return;
    if (campaign.hasPassword) {
        const snap = await db.collection('artifacts').doc(roomId).collection('public').doc('data').collection('global').doc('session').get();
        const correct = snap.data()?.roomPassword;
        if (correct && prompt("Senha da Sala:") !== correct) return alert("Senha Incorreta!");
    }
    setCurrentAppId(roomId); setView('login');
  };

  const createNewCampaign = async (name, password = '') => {
    const id = 'rpg-' + name.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const doc = await db.collection('artifacts').doc('global_directory').collection('public').doc('campaign_list').get();
    let list = doc.exists ? (doc.data().list || []) : [];
    if (list.some(c => c.id === id)) return setCurrentAppId(id);
    list.push({ id, name, hasPassword: !!password });
    await db.collection('artifacts').doc('global_directory').collection('public').doc('campaign_list').set({ list }, { merge: true });
    if (password) await db.collection('artifacts').doc(id).collection('public').doc('data').collection('global').doc('session').set({ roomPassword: password }, { merge: true });
    setCurrentAppId(id); setView('login');
  };

  const importCampaign = async (campaignId) => {
    if (!campaignId.startsWith('rpg-')) return alert("ID inválido. Deve começar com 'rpg-'");
    const doc = await db.collection('artifacts').doc('global_directory').collection('public').doc('campaign_list').get();
    let list = doc.exists ? (doc.data().list || []) : [];
    if (list.some(c => c.id === campaignId)) { alert("Já está na lista."); return setCurrentAppId(campaignId); }
    const charSnap = await db.collection('artifacts').doc(campaignId).collection('public').doc('data').collection('characters').limit(1).get();
    if (charSnap.empty && !confirm("Nenhum personagem encontrado. Importar mesmo assim?")) return;
    const newList = [...list, { id: campaignId, name: campaignId.replace('rpg-', '').toUpperCase() }];
    await db.collection('artifacts').doc('global_directory').collection('public').doc('campaign_list').set({ list: newList }, { merge: true });
    setCurrentAppId(campaignId); setView('login'); alert("Importada!");
  };

  const deleteCampaign = async (id) => {
    if (id === DEFAULT_APP_ID) return alert("A sala padrão não pode ser excluída.");
    
    const snap = await db.collection('artifacts').doc(id).collection('public').doc('data').collection('global').doc('session').get();
    const correct = snap.data()?.roomPassword;
    const campaign = campaigns.find(c => c.id === id);
    const campaignName = campaign ? campaign.name : id;

    if (correct) {
      if (prompt(`CUIDADO! Para apagar a sala "${campaignName}", digite a SENHA DA SALA:`) !== correct) {
        return alert("Senha incorreta. Operação cancelada.");
      }
    } else {
      if (prompt(`CUIDADO! Esta sala não tem senha. Para apagar tudo permanentemente, digite "CONFIRMAR":`) !== "CONFIRMAR") {
        return alert("Confirmação inválida. Operação cancelada.");
      }
    }

    if (!confirm(`TEM CERTEZA? Isso apagará todos os personagens, mensagens e dados da sala "${campaignName}" para SEMPRE.`)) return;

    const batch = db.batch();
    const chars = await db.collection('artifacts').doc(id).collection('public').doc('data').collection('characters').get();
    chars.forEach(d => batch.delete(d.ref));
    batch.delete(db.collection('artifacts').doc(id).collection('public').doc('data').collection('global').doc('session'));
    // Também apaga o vault se existir
    batch.delete(db.collection('artifacts').doc(id).collection('public').doc('data').collection('global').doc('vault'));
    
    await batch.commit();
    const newList = campaigns.filter(c => c.id !== id);
    await db.collection('artifacts').doc('global_directory').collection('public').doc('campaign_list').set({ list: newList }, { merge: true });
    if (currentAppId === id) { setCurrentAppId(DEFAULT_APP_ID); setView('landing'); }
    alert("Sala excluída com sucesso.");
  };

  const selectCharacter = async (name) => {
    if (name.toLowerCase() === 'mestre') {
      if (isMasterAuthenticated) {
        setCharacterName('Mestre'); setView('master'); return;
      }

      const vaultSnap = await db.collection('artifacts').doc(currentAppId).collection('public').doc('data').collection('global').doc('vault').get();
      const masterPass = vaultSnap.data()?.password;
      
      let passCorrect = false;
      if (masterPass) {
        if (prompt("Senha do Mestre:") === masterPass) passCorrect = true;
        else return alert("Senha Incorreta!");
      } else {
        const sessionSnap = await db.collection('artifacts').doc(currentAppId).collection('public').doc('data').collection('global').doc('session').get();
        const roomPass = sessionSnap.data()?.roomPassword;
        if (!roomPass || prompt("Senha do Mestre (Senha da Sala):") === roomPass) passCorrect = true;
        else return alert("Senha Incorreta!");
      }
      
      if (passCorrect) {
        setIsMasterAuthenticated(true);
        setCharacterName('Mestre'); setView('master'); 
      }
      return;
    }

    const char = allCharacters.find(c => (c.name || c.Personagem || "").toLowerCase() === name.toLowerCase());
    if (!char) return;

    // Se NÃO for o mestre autenticado e o personagem NÃO estiver autenticado nesta sessão, exige o PIN
    if (!isMasterAuthenticated && !authenticatedCharacters.includes(name) && char.pin) {
      if (prompt(`PIN de ${char.name}:`) === char.pin) {
        setAuthenticatedCharacters(prev => [...prev, name]);
      } else {
        return alert("PIN Incorreto!");
      }
    }

    setCharacterName(name);
    if (char.sheetData) { setCharacterData(char); setCharacterSheetData(char.sheetData); setView('sheet'); }
    else {
      const url = char.url || char.URL;
      if (url) {
        const data = await loadCharacterSheet(url);
        if (data) { saveCharacter(name, { ...char, name, sheetData: data }); setCharacterData({ ...char, sheetData: data }); setCharacterSheetData(data); setView('sheet'); }
      }
    }
  };

  const createNewCharacter = async (name) => {
    if (name === null) {
      // Inicia um draft vazio para o mentor poder ajudar
      setCreationDraft({ allowEditing: true, info: { 'Nome do Personagem': '', Classe: '---', XP: '0', Nivel: '1' }, atributos: {FOR:'10',DES:'10',CON:'10',INT:'10',SAB:'10',CAR:'10'}, recursos: {CA:'10',Iniciativa:'0','PV Máximo':'10','PV Atual':'10','PV Temporário':'0','PV Perdido':'0'}, outros: {Talentos:[], PO:'0'} });
      return setCreatingCharacter(true);
    }
    if (name === false) { setCreationDraft(null); return setCreatingCharacter(false); }
    setIsCreating(true);
    const hero = { name, isFirebaseOnly: true, deleted: false, sheetData: creationDraft || { allowEditing: true, info: { 'Nome do Personagem': name, Classe: '---', XP: '0', Nivel: '1' }, atributos: {FOR:'10',DES:'10',CON:'10',INT:'10',SAB:'10',CAR:'10'}, recursos: {CA:'10',Iniciativa:'0','PV Máximo':'10','PV Atual':'10','PV Temporário':'0','PV Perdido':'0'}, outros: {Talentos:[], PO:'0'} } };
    if (hero.sheetData.info) hero.sheetData.info['Nome do Personagem'] = name;
    // Garante que o allowEditing esteja no final do objeto se vier do draft
    hero.sheetData.allowEditing = true;
    await saveCharacter(name, hero);
    setIsNewCharacter(true); setCharacterName(name); setCharacterData(hero); setCharacterSheetData(hero.sheetData); setCreationDraft(null); setView('sheet'); setIsCreating(false); setCreatingCharacter(false);
  };

  const saveCharacter = async (name, data) => {
    await db.collection('artifacts').doc(currentAppId).collection('public').doc('data').collection('characters').doc(name.toLowerCase()).set(data, { merge: true });
    const url = data.url || data.sheetUrl || data.sheetData?.url;
    const sid = extractSpreadsheetId(url);
    if (sid) updateSheetViaScript(scriptWebhook, sid, data.sheetData || data);
  };

  const onUpdateSheet = async (newData) => {
    setCharacterSheetData(newData);
    await db.collection('artifacts').doc(currentAppId).collection('public').doc('data').collection('characters').doc(characterName.toLowerCase()).set({ sheetData: newData }, { merge: true });
    const list = await loadPlayerList();
    const p = list.find(x => Object.values(x).some(v => String(v).toLowerCase() === characterName.toLowerCase()));
    const url = p ? p[Object.keys(p).find(k => k.toLowerCase().includes('url'))] : null;
    const sid = extractSpreadsheetId(url);
    if (sid) updateSheetViaScript(scriptWebhook, sid, newData);
  };

  const updateSheetField = (sec, field, val) => {
    // Se estiver em modo de criação (LoginView), atualiza o draft
    if (view === 'login' || creatingCharacter) {
      setCreationDraft(prev => {
        let next = { ...(prev || {}) };
        if (field === null) next[sec] = val; else next[sec] = { ...next[sec], [field]: val };
        return next;
      });
      return;
    }

    if (!characterSheetData) return;
    let next = { ...characterSheetData };
    if (field === null) next[sec] = val; else next[sec] = { ...next[sec], [field]: val };
    setCharacterSheetData(next);
    const full = { ...characterData, sheetData: next };
    setCharacterData(full);
    saveCharacter(characterName, full);
  };

  const rollDice = async (sides, force = null, label = '', secret = false) => {
    const res = force !== null ? force : Math.floor(Math.random() * sides) + 1;
    await db.collection('artifacts').doc(currentAppId).collection('public').doc('data').collection('rolls').add({ playerName: characterName || "Anônimo", sides, result: res, label, secret, timestamp: firebase.firestore.FieldValue.serverTimestamp() });
  };

  const upgradeTalent = (tid, lv) => {
    const cur = characterData?.unlocked || {};
    const nextU = { ...cur };
    if (lv === (cur[tid] || 0) + 1) nextU[tid] = lv; else if (lv === cur[tid]) nextU[tid] = lv - 1;
    if (nextU[tid] <= 0) delete nextU[tid];
    const full = { ...characterData, unlocked: nextU };
    setCharacterData(full);
    saveCharacter(characterName, full);
  };

  const advanceTurn = async (target) => {
    const ref = db.collection('artifacts').doc(currentAppId).collection('public').doc('data').collection('global').doc('turnState');
    if (!target || turnState?.activeChar === target) return await ref.set({ activeChar: null, lastUpdate: Date.now() }, { merge: true });
    await ref.set({ activeChar: target, lastUpdate: Date.now() }, { merge: true });
    const snap = await db.collection('artifacts').doc(currentAppId).collection('public').doc('data').collection('characters').doc(target.toLowerCase()).get();
    if (snap.exists) {
      const d = snap.data(); let conds = JSON.parse(d.sheetData?.info?.['Condicoes'] || '[]');
      if (conds.length > 0) {
        const nextC = conds.map(c => ({ ...c, turns: parseInt(c.turns) - 1 })).filter(c => c.turns > 0);
        if (JSON.stringify(conds) !== JSON.stringify(nextC)) updateCharacterConditions(target, nextC);
      }
    }
    const bargains = sessionState.devilsBargain?.activeBargains || [];
    const nextB = bargains.map(b => b.player === target && b.unit === 'rounds' ? { ...b, duration: b.duration - 1 } : b).filter(b => b.unit === 'permanent' || b.duration > 0);
    if (JSON.stringify(bargains) !== JSON.stringify(nextB)) updateSessionState({ devilsBargain: { ...sessionState.devilsBargain, activeBargains: nextB } });
  };

  const updateCharacterHP = async (name, delta) => {
    const c = allCharacters.find(x => x.name.toLowerCase() === name.toLowerCase());
    if (!c) return;
    const next = JSON.parse(JSON.stringify(c));
    if (!next.sheetData) next.sheetData = { recursos: {} };
    let perd = parseInt(next.sheetData.recursos['PV Perdido']) || 0;
    let tmp = parseInt(next.sheetData.recursos['PV Temporário']) || 0;
    const max = parseInt(next.sheetData.recursos['PV Máximo']) || 10;
    if (delta > 0) perd = Math.max(0, perd - delta);
    else { const d = Math.abs(delta); if (tmp >= d) tmp -= d; else { perd += (d - tmp); tmp = 0; } }
    next.sheetData.recursos['PV Perdido'] = perd; next.sheetData.recursos['PV Temporário'] = tmp;
    next.sheetData.recursos['PV Atual'] = (max - perd) + tmp;
    await saveCharacter(name, next);
  };

  const updateInitiative = async (order) => { await db.collection('artifacts').doc(currentAppId).collection('public').doc('data').collection('global').doc('turnState').set({ ...turnState, initiativeOrder: order }, { merge: true }); };
  const updateSouls = async (list) => { await db.collection('artifacts').doc(currentAppId).collection('public').doc('data').collection('global').doc('souls').set({ list }, { merge: true }); };
  const updateEditPermission = async (name, allow) => { await db.collection('artifacts').doc(currentAppId).collection('public').doc('data').collection('characters').doc(name.toLowerCase()).set({ sheetData: { allowEditing: allow } }, { merge: true }); };
  const triggerExternalRoll = (sides, secret=false, modifier=0, mode='normal', quantity=1) => setExternalRoll({ sides, secret, modifier, mode, quantity, timestamp: Date.now() });
  const sendChatMessage = (text, sender, recipient = null) => db.collection('artifacts').doc(currentAppId).collection('public').doc('data').collection('messages').add({ text, sender, recipient, timestamp: firebase.firestore.FieldValue.serverTimestamp() });
  const shareNote = async (text, sender) => { const n = { id: Date.now(), text, sender, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }; const notes = [...(sessionState.groupNotes || []), n]; await updateSessionState({ groupNotes: notes }); AudioManager.play('page'); };
  const deleteNote = async (id) => updateSessionState({ groupNotes: (sessionState.groupNotes || []).filter(n => n.id !== id) });
  const generateLoot = (lv) => updateSessionState({ activeLoot: { ...getRandomLoot(lv), approved: false } });
  const approveLoot = () => { if (sessionState.activeLoot) { updateSessionState({ activeLoot: { ...sessionState.activeLoot, approved: true } }); AudioManager.play('chest_open'); } };
  const clearLoot = () => updateSessionState({ activeLoot: null });
  const claimLootItem = async (item) => {
    const cur = characterSheetData.outros?.Equipamento || "";
    const next = cur ? `${cur}, ${item.name}` : item.name;
    const sheet = { ...characterSheetData, outros: { ...characterSheetData.outros, Equipamento: next } };
    setCharacterSheetData(sheet); saveCharacter(characterName, { ...characterData, sheetData: sheet });
    updateSessionState({ activeLoot: { ...sessionState.activeLoot, items: sessionState.activeLoot.items.filter(i => i.id !== item.id) } });
    AudioManager.play('coins');
  };
  const claimLootGold = async (amt) => {
    const nextG = (parseInt(characterSheetData.outros?.PO || '0') + amt).toString();
    const sheet = { ...characterSheetData, outros: { ...characterSheetData.outros, PO: nextG } };
    setCharacterSheetData(sheet); saveCharacter(characterName, { ...characterData, sheetData: sheet });
    updateSessionState({ activeLoot: { ...sessionState.activeLoot, gold: Math.max(0, sessionState.activeLoot.gold - amt) } });
    AudioManager.play('coins');
  };

  const askGemini = async (prompt) => {
    if (!geminiApiKey) throw new Error("Key faltante");
    const sys = "Você é um mestre de RPG 5e brasileiro.";
    const models = ['gemini-2.5-flash', 'gemini-flash-latest', 'gemini-2.5-pro', 'gemini-pro-latest'];
    for (const m of models) {
      try {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${geminiApiKey}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ system_instruction: { parts: [{ text: sys }] }, contents: [{ role: 'user', parts: [{ text: prompt }] }] }) });
        const data = await res.json();
        if (data.candidates?.[0]?.content) return data.candidates[0].content.parts[0].text;
      } catch(e){}
    }
    throw new Error("Falha no oráculo");
  };

  const generateNPC = async (theme) => {
    const p = `Gere um NPC de ${theme} em JSON: {name, race, class, appearance, personality, secret, stats: {HP, CA, Atributos: {FOR, DES, CON, INT, SAB, CAR}}}`;
    const res = await askGemini(p);
    return JSON.parse(res.replace(/```json|```/g, '').trim());
  };

  const deleteCharacter = async (name) => { await db.collection('artifacts').doc(currentAppId).collection('public').doc('data').collection('characters').doc(name.toLowerCase()).set({ deleted: true }, { merge: true }); };
  const updateCharacterConditions = async (name, conds) => {
    const ref = db.collection('artifacts').doc(currentAppId).collection('public').doc('data').collection('characters').doc(name.toLowerCase());
    const snap = await ref.get();
    if (snap.exists) {
      const d = snap.data(); d.sheetData.info['Condicoes'] = JSON.stringify(conds);
      await ref.set(d);
      const sid = extractSpreadsheetId(d.url || d.sheetUrl || d.sheetData?.url);
      if (sid) updateSheetViaScript(scriptWebhook, sid, d.sheetData);
    }
  };

  const updateCharacterXP = async (name, xp) => {
    const c = allCharacters.find(x => x.name.toLowerCase() === name.toLowerCase());
    if (!c) return;
    const next = JSON.parse(JSON.stringify(c));
    next.sheetData.info['XP'] = xp;
    await saveCharacter(name, next);
  };

  // --- 4. RENDERIZAÇÃO ---

  if (loading) return el(LoadingScreen);

  const activeEnvs = Array.isArray(sessionState.environment)
    ? sessionState.environment
    : (sessionState.environment && sessionState.environment !== 'none'
        ? [sessionState.environment]
        : []);

  const WeatherOverlay = (() => {
    if (view === 'master') return null;
    const parts = [];

    activeEnvs.forEach(env => {
      if (env === 'rain') {
        for(let i=0; i<40; i++) {
          parts.push(el('div', { key: `rain-${i}`, className: "drop", style: { left: `${Math.random()*100}%`, top: `-${Math.random()*100}px`, '--duration': `${0.5 + Math.random()*0.5}s` } }));
        }
      } else if (env === 'storm') {
        for(let i=0; i<50; i++) {
          parts.push(el('div', { key: `storm-${i}`, className: "drop", style: { left: `${Math.random()*100}%`, top: `-${Math.random()*100}px`, '--duration': `${0.4 + Math.random()*0.4}s` } }));
        }
        parts.push(el('div', { key: 'lightning', className: "lightning-effect" }));
      } else if (env === 'snow') {
        for(let i=0; i<30; i++) {
          parts.push(el('div', { key: `snow-${i}`, className: "snowflake", style: { left: `${Math.random()*100}%`, '--duration': `${3 + Math.random()*5}s` } }, '❄'));
        }
      } else if (env === 'fog') {
        for(let i=0; i<4; i++) {
          parts.push(el('div', { key: `fog-${i}`, className: "mist", style: { top: `${Math.random()*60}%`, opacity: 0.12 + Math.random()*0.08, animationDelay: `${i * 3.5}s` } }));
        }
      } else if (env === 'fire') {
        for(let i=0; i<20; i++) {
          parts.push(el('div', { key: `fire-${i}`, className: "ember", style: { left: `${Math.random()*100}%`, '--duration': `${2 + Math.random()*3}s`, '--drift': `${-60 + Math.random()*120}px` } }));
        }
      } else if (env === 'sandstorm') {
        for(let i=0; i<25; i++) {
          parts.push(el('div', { key: `sand-${i}`, className: "sand", style: { top: `${Math.random()*100}%`, '--y': `${Math.random()*100}px`, '--duration': `${0.8 + Math.random()*1.2}s` } }));
        }
      } else if (env === 'petals') {
        for(let i=0; i<15; i++) {
          parts.push(el('div', { key: `petal-${i}`, className: "petal", style: { left: `${Math.random()*100}%`, '--duration': `${4 + Math.random()*6}s` } }));
        }
      } else if (env === 'poison') {
        for(let i=0; i<20; i++) {
          const size = 6 + Math.random()*8;
          parts.push(el('div', { 
            key: `poison-${i}`, 
            className: "poison-spore", 
            style: { 
              left: `${Math.random()*100}%`, 
              width: `${size}px`, 
              height: `${size}px`, 
              '--duration': `${3 + Math.random()*4}s`, 
              '--drift': `${-80 + Math.random()*160}px` 
            } 
          }));
        }
      }
    });

    return el('div', { key: 'env', className: "environment-overlay" }, parts);
  })();

  const CelestialOverlay = (() => {
    if (view !== 'sheet' && view !== 'character') return null;
    const isNight = activeEnvs.includes('night');
    const isBloodMoon = activeEnvs.includes('blood-moon');
    if (!isNight && !isBloodMoon) return null;

    const timeMinutes = sessionState.timeMinutes !== undefined ? sessionState.timeMinutes : 480;
    const isVisibleTime = (timeMinutes >= 1050 || timeMinutes <= 360);
    if (!isVisibleTime) return null;

    const elapsed = timeMinutes >= 1050 ? (timeMinutes - 1050) : (390 + timeMinutes);
    const progress = elapsed / 750;

    const leftPercent = -15 + (progress * 130);
    const topPercent = 15 + 4 * (progress - 0.5) * (progress - 0.5) * 60;

    const bg = isBloodMoon
      ? 'radial-gradient(circle, #ff4444 15%, #ef4444 60%, #7f1d1d 100%)'
      : 'radial-gradient(circle, #ffffff 15%, #f8fafc 60%, #cbd5e1 100%)';
    const shadow = isBloodMoon
      ? '0 0 60px rgba(239, 68, 68, 0.95), 0 0 120px rgba(239, 68, 68, 0.65), inset 0 0 15px rgba(255, 255, 255, 0.4)'
      : '0 0 60px rgba(255, 255, 255, 0.95), 0 0 120px rgba(255, 255, 255, 0.65), inset 0 0 15px rgba(255, 255, 255, 0.8)';

    return el('div', {
      key: 'celestial-bg',
      className: "fixed inset-0 pointer-events-none overflow-hidden",
      style: { zIndex: 1 } // Mantém atrás de todos os cards da ficha (que possuem z-10)
    }, [
      el('div', {
        key: 'celestial-body',
        className: "absolute rounded-full pointer-events-none opacity-100 animate-pulse-soft",
        style: {
          left: `${leftPercent}%`,
          top: `${topPercent}vh`,
          width: '120px',
          height: '120px',
          transform: 'translate(-50%, -50%)',
          background: bg,
          boxShadow: shadow,
          transition: 'left 1s linear, top 1s linear'
        }
      })
    ]);
  })();

  const envClass = (view !== 'master') ? activeEnvs.map(env => {
    if (env === 'night') return 'env-night';
    if (env === 'blood-moon') return 'env-blood-moon';
    if (env === 'poison') return 'env-poison';
    if (env === 'sandstorm') return 'env-sandstorm';
    return '';
  }).filter(Boolean).join(' ') : '';

  const LibraryOverlay = isLibraryOpen && el(LibraryView, { key: 'lib', mode: view === 'master' ? 'master' : 'player', libraryData: sessionState.library || {}, updateSessionState, onBack: () => setIsLibraryOpen(false) });
  const BattlemapOverlay = isBattlemapOpen && el(BattlemapView, { key: 'map', mode: view === 'master' ? 'master' : 'player', battlemapData: sessionState.battlemap || {}, monsters: sessionState.monsters || [], libraryData: sessionState.library || {}, allCharacters, characterName, turnState, advanceTurn, updateSessionState, onBack: () => setIsBattlemapOpen(false) });
  const BargainOverlay = isBargainOpen && el(DevilsBargain, { key: 'barg', mode: view === 'master' ? 'master' : 'player', bargainData: sessionState.devilsBargain || { categories: BARGAIN_EFFECTS, activeBargains: [] }, updateSessionState, onBack: () => setIsBargainOpen(false), allPlayers: allCharacters.filter(c => c.name.toLowerCase() !== 'mestre').map(c => c.name), characterName });
  const LetterOverlay = showLetter && el('div', { key: 'let', onClick: () => setShowLetter(false), className: "fixed top-24 right-8 z-[500] cursor-pointer animate-bounce-in" }, el('div', { className: "bg-[#fdf6e3] p-5 rounded-2xl shadow-2xl border-4 border-[#d35400]" }, "✉️ Nova Carta"));
  const LootOverlay = (sessionState.activeLoot?.approved && (sessionState.activeLoot.target === 'all' || sessionState.activeLoot.target === characterName)) && el(LootChest, { key: 'loot', loot: sessionState.activeLoot, characterName, onClaimItem: claimLootItem, onClaimGold: claimLootGold, onClose: clearLoot });
  const WorldMapOverlay = isWorldMapOpen && el(WorldMapView, { key: 'wmap', mode: view === 'master' ? 'master' : 'player', worldMapData: sessionState.worldMap || {}, updateSessionState, onBack: () => setIsWorldMapOpen(false), battlemaps: sessionState.battlemap?.maps || [], onOpenBattlemap: (mid) => { updateSessionState({ battlemap: { ...sessionState.battlemap, activeMapId: mid } }); setIsWorldMapOpen(false); setIsBattlemapOpen(true); } });
  const CraftingOverlay = isCraftingOpen && el(CraftingView, { key: 'craft', sheetData: characterSheetData, onUpdateSheet: (d) => Object.keys(d).forEach(k => updateSheetField(k, null, d[k])), onBack: () => setIsCraftingOpen(false), askGemini, isMaster: view === 'master' });
  const ShopOverlay = isShopOpen && (view === 'master' || sessionState.isShopEnabled) && el(TradingSystem, { key: 'shop', sheetData: characterSheetData, sessionState, updateSessionState, onUpdateSheet: (d) => Object.keys(d).forEach(k => updateSheetField(k, null, d[k])), onBack: () => setIsShopOpen(false), isMaster: view === 'master', characterName, askGemini });
  const DiceOverlay = (view === 'sheet' || view === 'character' || view === 'master') && el(DiceRoller, { key: 'dice', rollDice, recentRolls, characterName: view === 'master' ? 'Mestre' : characterName, view, isRollingModalOpen, setRollingModalOpen, tabletopMode: true, externalRoll, isBattlemapOpen });
  
  const ClockOverlay = (view === 'sheet' || view === 'character' || view === 'master') && (() => {
    const day = sessionState.day || 1; const time = sessionState.timeMinutes || 480;
    const h = Math.floor(time/60).toString().padStart(2,'0'); const m = (time%60).toString().padStart(2,'0');
    const night = (time < 360 || time >= 1080);
    return el('div', { key: 'clock', className: `fixed bottom-8 left-8 z-[100] p-2 rounded-2xl backdrop-blur-md border-2 ${night ? 'bg-indigo-950/60 border-indigo-500 text-indigo-200' : 'bg-sky-900/40 border-sky-400 text-sky-100'}` }, [
      el('span', { key: 'icon' }, night ? "🌙 " : "☀️ "),
      el('span', { key: 'day' }, `Dia ${day} - ${h}:${m}`)
    ]);
  })();

  const AnnouncementOverlay = (sessionState.announcement && (sessionState.announcementTarget === 'all' || sessionState.announcementTarget === characterName || view === 'master')) && el('div', { key: 'ann', className: "fixed top-0 left-0 right-0 z-[200] bg-indigo-800 text-white p-2 text-center" }, sessionState.announcement);
  const HandoutOverlay = (sessionState.handout && showHandout && (sessionState.handoutTarget === 'all' || sessionState.handoutTarget === characterName || view === 'master')) && el('div', { key: 'hand', className: "fixed inset-0 z-[250] bg-black/90 flex items-center justify-center p-10" }, [
    el('img', { src: sessionState.handout, className: "max-h-full object-contain" }),
    el('button', { onClick: () => setShowHandout(false), className: "absolute top-4 right-4 text-white text-4xl" }, "×")
  ]);
  const CutsceneOverlay = sessionState.cutscene?.url && el('div', { key: 'cut', className: "fixed inset-0 z-[2000] bg-black flex items-center justify-center" }, [
    el('img', { src: sessionState.cutscene.url, className: "w-full h-full object-contain animate-slow-zoom" }),
    view === 'master' && el('button', { onClick: () => updateSessionState({ cutscene: null }), className: "absolute top-4 right-4 text-white text-4xl" }, "×")
  ]);

  const MentorOverlay = isMentorOpen && el(CreationMentor, { 
    key: 'mentor', 
    sessionState, 
    characterSheetData: characterSheetData || creationDraft, 
    onUpdateField: updateSheetField, 
    askGemini, 
    rollDice, 
    recentRolls, 
    onClose: () => setIsMentorOpen(false),
    canEdit: view === 'login' || creatingCharacter || characterSheetData?.allowEditing || view === 'master'
  });

  const AudioSettingsOverlay = showAudioSettings && el(AudioSettingsModal, {
    key: 'audio-settings',
    onClose: () => setShowAudioSettings(false)
  });

  const AllOverlays = el(React.Fragment, null, ClockOverlay, AnnouncementOverlay, HandoutOverlay, LibraryOverlay, BargainOverlay, LetterOverlay, LootOverlay, CelestialOverlay, WeatherOverlay, BattlemapOverlay, WorldMapOverlay, CraftingOverlay, ShopOverlay, CutsceneOverlay, DiceOverlay, MentorOverlay, AudioSettingsOverlay);

  if (view === 'landing') return el('div', { key: 'lw-base', className: envClass }, el(LandingView, { campaigns, currentAppId, setCurrentAppId, createNewCampaign, importCampaign, onEnterRoom, onSync: () => window.location.reload() }), AllOverlays);
  if (view === 'master') return el('div', { key: 'mw', className: envClass }, el(MasterView, { allCharacters, rollHistory, onBack: () => setView('login'), updateCharacterXP, updateCharacterConditions, updateCharacterHP, advanceTurn, turnState, geminiApiKey, setGeminiApiKey: (k) => { setGeminiApiKey(k); localStorage.setItem('gemini_api_key', k); }, askGemini, updateInitiative, souls, updateSouls, updateEditPermission, onViewSheet: (c) => { setCharacterSheetData(c.sheetData); setCharacterName(c.name); setView('sheet'); }, saveCharacter, rollDice, triggerExternalRoll, deleteCharacter, sessionState, updateSessionState, currentAppId, deleteCampaign, onOpenShop: () => setIsShopOpen(true), generateLoot, approveLoot, clearLoot, generateNPC, updateMasterPassword: (p) => db.collection('artifacts').doc(currentAppId).collection('public').doc('data').collection('global').doc('vault').set({ password: p }, { merge: true }), setIsLibraryOpen, setIsBattlemapOpen, setIsWorldMapOpen, setIsBargainOpen, allPlayers: allCharacters.filter(c => c.name.toLowerCase() !== 'mestre').map(c => c.name), chatMessages, sendChatMessage, clearRollHistory: async () => { if (confirm("Limpar?")) { const snap = await db.collection('artifacts').doc(currentAppId).collection('public').doc('data').collection('rolls').get(); const b = db.batch(); snap.forEach(d => b.delete(d.ref)); await b.commit(); } }, hasNewMessage, setHasNewMessage, onOpenAudioSettings: () => setShowAudioSettings(true) }), AllOverlays);
  if (view === 'sheet' && characterSheetData) return el('div', { key: 'sw', className: envClass }, el(SheetView, { characterName, characterSheetData, characterImageUrl: characterData?.imageUrl, onUpdateImage: (u) => saveCharacter(characterName, { ...characterData, imageUrl: u }), onBack: () => { setIsNewCharacter(false); setView('login'); }, groupNotes: sessionState.groupNotes || [], shareNote, deleteNote, onOpenCrafting: () => setIsCraftingOpen(true), onRequestDelete: async () => { if(confirm('Excluir?')) { await saveCharacter(characterName, { ...characterData, pendingDeletion: true }); setView('login'); } }, onToggleTree: () => setView('character'), rollDice, iconMap, updateSheetField, onUpdateSheet, turnState, sessionState, updateSessionState, handleDescansoLongo: async () => { if (confirm("Descanso?")) { const n = JSON.parse(JSON.stringify(characterSheetData)); n.recursos['PV Perdido'] = 0; n.recursos['PV Temporário'] = 0; if (n.magias?.slots) Object.keys(n.magias.slots).forEach(c => n.magias.slots[c].used = 0); n.recursos['PV Atual'] = parseInt(n.recursos['PV Máximo']) || 0; await onUpdateSheet(n); AudioManager.play('rest'); } }, isRollingModalOpen, setRollingModalOpen, setEditableSheetData, triggerExternalRoll, recentRolls, isNewCharacter, setIsLibraryOpen, setIsBattlemapOpen, setIsWorldMapOpen, setIsBargainOpen, onOpenShop: () => setIsShopOpen(true), sendChatMessage, chatMessages: chatMessages.filter(m => m.sender === characterName || (m.sender === 'Mestre' && (m.recipient === characterName || !m.recipient))), onUpdatePIN: (pin) => saveCharacter(characterName, { ...characterData, pin }), onOpenMentor: () => setIsMentorOpen(true), onOpenAudioSettings: () => setShowAudioSettings(true) }), editableSheetData && el(RawDataEditor, { key: 'editor', data: editableSheetData, onSave: onUpdateSheet, onClose: () => setEditableSheetData(null) }), AllOverlays);
  if (view === 'character') return el('div', { key: 'cw', className: envClass }, el(TreeView, { TALENT_TREES, characterData, characterName, characterSheetData, onBack: () => setView('login'), onToggleSheet: () => setView('sheet'), iconMap, upgradeTalent, saveCharacter, showTooltip: (e, n, l) => e ? setTooltip({ show: true, content: { talentName: n, ...l }, x: e.clientX, y: e.clientY, above: (window.innerHeight - e.clientY) < 250 }) : setTooltip({ show: false }) }), el(TalentTooltip, { key: 'tt', tooltip: tooltip }), AllOverlays);

  return el('div', { key: 'lw-wrap', className: envClass }, el(LoginView, { allCharacters, onSelectCharacter: selectCharacter, onCreateCharacter: createNewCharacter, creatingCharacter, isCreating, TALENT_TREES, iconMap, campaigns, currentAppId, setCurrentAppId, createNewCampaign, importCampaign, onBackToLanding: () => setView('landing'), onOpenMentor: () => setIsMentorOpen(true) }), AllOverlays);
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(React.createElement(App));
