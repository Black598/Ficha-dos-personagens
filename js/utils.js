
const DEBUG = true;

// --- FUNÇÕES DE BUSCA E FILTRO ---
export function getCharacterByName(players, name) {
  const possibleKeys = ['Nome', 'Player', 'Personagem', 'Name'];
  for (const key of possibleKeys) {
    const player = players.find(p => p[key]?.toLowerCase() === name.toLowerCase());
    if (player) return player;
  }
  return null;
}

// --- CÁLCULOS DE ATRIBUTOS E MAGIA ---
export function calcularStatsMagia(proficienciaStr, atributoValor) {
  const prof = parseInt(proficienciaStr.replace('+', '')) || 0;
  const attr = parseInt(atributoValor) || 10;
  const mod = Math.floor((attr - 10) / 2);

  return {
    'Modificador': mod >= 0 ? `+${mod}` : `${mod}`,
    'Salvaguarda': (8 + prof + mod).toString(),
    'Bônus de Ataque': (prof + mod) >= 0 ? `+${prof + mod}` : `${prof + mod}`
  };
}

// --- PROCESSAMENTO DE PLANILHAS (CSV/API) ---
export function extractSpreadsheetId(url) {
  if (!url || typeof url !== 'string') return null;
  const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
  return match ? match[1] : null;
}
// A função parseCSV é complexa porque precisa lidar com a estrutura específica da planilha de personagem, que tem dados organizados em linhas e colunas fixas. Ela extrai informações como atributos, magias, ataques, etc., com base na posição dos dados na planilha.
export function parseCSV(csvText) {
  const splitRow = (row) => {
    const re = /,(?=(?:[^\"]*\"[^\"]*\")*[^\"]*$)/;
    return row.split(re).map(c => c.trim().replace(/^"|"$/g, '').replace(/""/g, '"'));
  };

  const rows = csvText.split(/\r?\n/).map(splitRow);

  const getVerticalList = (startRow, col, count) => {
    const list = [];
    for (let i = 0; i < count; i++) {
      const val = rows[startRow + i]?.[col];
      if (val && val.trim() && val !== '-') list.push(val.trim());
    }
    return list;
  };

  // --- CONFIGURAÇÃO DE MAGIAS E DESCRIÇÕES ---
  const listaNiveis = ["Infusões", "Círculo 0 (Truques)", "Círculo 1", "Círculo 2", "Círculo 3", "Círculo 4", "Círculo 5", "Círculo 6", "Círculo 7", "Círculo 8", "Círculo 9"];

  // Mapeamento de colunas para descrições (D=3, F=5, H=7, J=9)
  const mapaColunasDesc = {
    "Infusões": 3, "Círculo 0 (Truques)": 5, "Círculo 1": 7, "Círculo 2": 9,
    "Círculo 3": 3, "Círculo 4": 5, "Círculo 5": 7, "Círculo 6": 9,
    "Círculo 7": 3, "Círculo 8": 5, "Círculo 9": 7
  };

  const magiasData = { temMagia: false };
  const descricoesMagias = {};

  listaNiveis.forEach(nivel => {
    // 1. Pega os nomes (pode vir de colunas fixas se existirem ou ser preenchido pelo Firebase dps)
    // Aqui um exemplo de leitura genérica de nomes na coluna A (índice 0) a partir da 115
    const nomesNivel = [];
    for (let i = 0; i < 4; i++) {
      const rowIndex = 114 + i;
      const nome = rows[rowIndex]?.[0] || ""; // Nome na coluna A
      const colDesc = mapaColunasDesc[nivel];
      const desc = rows[rowIndex]?.[colDesc] || ""; // Descrição na coluna mapeada

      if (nome) {
        nomesNivel.push(nome);
        magiasData.temMagia = true;
      }
      descricoesMagias[`spell_desc_${nivel}_${i}`] = desc;
    }
    magiasData[nivel] = nomesNivel;
  });

  // Captura de Talentos (Coluna B, linha 115+)
  const descricoesExtras = {};
  for (let i = 0; i < 8; i++) {
    const rowIndex = 114 + i;
    const colunasLimpas = rows[rowIndex]?.filter(c => c.trim() !== "") || [];
    descricoesExtras[`desc_talento_${i}`] = colunasLimpas[1] || "";
  }

  return {
    isBase: rows[1]?.[0]?.toLowerCase() === 'base',
    info: {
      'Nome do Personagem': rows[1]?.[0] || '---',
      'Classe': rows[0]?.[4] || '---',
      'Antecedente': rows[0]?.[8] || '---',
      'Jogador': rows[0]?.[13] || '---',
      'Raça': rows[2]?.[4] || '---',
      'XP': rows[2]?.[13] || '0',
      'Nivel': rows[0]?.[16] || '0',
      'Alinhamento': rows[2]?.[8] || '---'
    },
    atributos: { 'FOR': rows[8]?.[0] || '10', 'DES': rows[13]?.[0] || '10', 'CON': rows[18]?.[0] || '10', 'INT': rows[23]?.[0] || '10', 'SAB': rows[28]?.[0] || '10', 'CAR': rows[33]?.[0] || '10' },
    modificadores: { 'FOR': rows[5]?.[0] || '0', 'DES': rows[10]?.[0] || '0', 'CON': rows[15]?.[0] || '0', 'INT': rows[20]?.[0] || '0', 'SAB': rows[25]?.[0] || '0', 'CAR': rows[30]?.[0] || '0' },
    recursos: {
      'CA': (rows[6]?.[6] || '10').replace(/[^0-9]/g, ''),
      'Iniciativa': (rows[6]?.[8] || '0').replace(/[^0-9\-]/g, ''),
      'Deslocamento': rows[6]?.[10] || '9m',
      'PV Máximo': (rows[9]?.[7] || '0').replace(/[^0-9]/g, ''),
      'PV Atual': (rows[10]?.[6] || '0').replace(/[^0-9]/g, ''),
      'PV Temporário': (rows[13]?.[6] || '0').replace(/[^0-9]/g, ''),
      'PV Perdido': (rows[15]?.[7] || '0').replace(/[^0-9]/g, '')
    },
    magias: magiasData,
    statsMagia: {
      'Modificador': rows[0]?.[20] || '0',
      'Salvaguarda': rows[0]?.[25] || '8',
      'Bônus de Ataque': rows[0]?.[30] || '0',
    },
    outros: {
      'Talentos': rows[25]?.[13]?.split('/') || [],
      ...descricoesExtras,
      ...descricoesMagias,
      'Equipamento': rows[37]?.[0] || "",
      'PO': rows[50]?.[1] || '0', 'PP': rows[51]?.[1] || '0', 'PC': rows[52]?.[1] || '0',
    },
    personalidade: { 'Traços': rows[5]?.[13] || '', 'Ideais': rows[10]?.[13] || '', 'Vínculos': rows[15]?.[13] || '', 'Defeitos': rows[20]?.[13] || '' },
    ataques: [
      { nome: rows[26]?.[6] || '', bonus: rows[26]?.[8] || '', dano: rows[26]?.[10] || '', tipo: rows[26]?.[11] || '' },
      { nome: rows[27]?.[6] || '', bonus: rows[27]?.[8] || '', dano: rows[27]?.[10] || '', tipo: rows[27]?.[11] || '' }
    ].filter(atk => atk.nome && atk.nome.trim() !== '' && atk.nome.trim() !== '-')
  };
}

export async function loadSheetViaCSV(spreadsheetId) {
  const csvUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv`;
  const resp = await fetch(csvUrl);
  const text = await resp.text();
  return parseCSV(text);
}
export async function loadCharacterSheet(url) {

  const spreadsheetId = extractSpreadsheetId(url);

  if (!spreadsheetId) {
    console.error("Não foi possível extrair o ID da URL:", url);
    return null;
  }
  if (DEBUG) console.log('Tentando carregar via CSV:', spreadsheetId);
  let data = await loadSheetViaCSV(spreadsheetId);
  if (!data || Object.keys(data).length === 0) {
    if (DEBUG) console.log('CSV não trouxe nada, tentando API');
    data = await loadSheetViaAPI(spreadsheetId);
  }
  return data;
}

export async function loadPlayerList() {
  const spreadsheetId = '1vS2Z6_qsuHaGqT4_rmUzdnW_wVI524x7rMloOYcXvL8';
  const csvUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv&gid=0`;

  try {
    console.log("📡 Buscando Planilha Mestre...");
    const response = await fetch(csvUrl);
    const csvText = await response.text();

    const lines = csvText.split(/\r?\n/).filter(line => line.trim() !== "");
    if (lines.length === 0) return [];

    // Log dos cabeçalhos reais que o Google enviou
    const headers = lines[0].split(',').map(h => h.trim());
    console.log("📊 Cabeçalhos detectados na planilha:", headers);

    const data = lines.slice(1).map((line, lineIdx) => {
      const values = line.split(',');
      const rowObject = {};
      headers.forEach((header, i) => {
        rowObject[header] = values[i]?.trim() || "";
      });
      return rowObject;
    });

    console.log("✅ Lista de Jogadores processada:", data);
    return data;
  } catch (error) {
    console.error('❌ Erro ao carregar planilha mestre:', error);
    return [];
  }
}
export async function firebaseCreateHero(db, appId, heroData) {
  const newId = heroData.name.toLowerCase();

  // Referência do documento
  const charRef = db.collection('artifacts').doc(appId)
    .collection('public').doc('data')
    .collection('characters').doc(newId);

  await charRef.set(heroData);
  return true;
}
export async function updateSheetViaScript(scriptUrl, spreadsheetId, data) {
  if (!scriptUrl || !spreadsheetId) {
    console.error("Sincronização abortada: Webhook ou ID da planilha ausente.");
    return false;
  }

  try {
    const response = await fetch(scriptUrl, {
      method: 'POST',
      mode: 'no-cors', // Necessário para Scripts do Google
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'UPDATE',
        spreadsheetId: spreadsheetId,
        data: data
      })
    });
    console.log('✅ Sincronização enviada para a planilha:', spreadsheetId);
    return true;
  } catch (error) {
    console.error('❌ Erro ao atualizar via script:', error);
    return false;
  }
}