const DEBUG = true;

// Helper para parse seguro de JSON (evita quebra por double-stringification ou dados corrompidos)
export const safeParseJSON = (str, fallback = []) => {
  if (!str) return fallback;
  try {
    let parsed = typeof str === 'string' ? JSON.parse(str) : str;
    // Se ainda for string, tenta parsear recursivamente (corrige double-stringify)
    while (typeof parsed === 'string') {
      parsed = JSON.parse(parsed);
    }
    return Array.isArray(parsed) ? parsed : fallback;
  } catch (e) {
    console.warn("Erro ao parsear JSON:", e);
    return fallback;
  }
};

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

export function parseImageUrl(url) {
    if (!url || typeof url !== 'string' || url.trim() === '') return '';
    let finalUrl = url.trim();
    const driveMatch = finalUrl.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (driveMatch) {
        return `https://lh3.googleusercontent.com/u/0/d/${driveMatch[1]}`;
    } else if (!finalUrl.startsWith('http') && finalUrl.length > 20 && !finalUrl.includes(' ')) {
        return `https://lh3.googleusercontent.com/u/0/d/${finalUrl}`;
    }
    return finalUrl;
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

  // --- CONFIGURAÇÃO DE MAGIAS E DESCRIÇÕES (BUSCA DINÂMICA INTELIGENTE) ---
  const listaNiveisInfo = [
    { nivel: "Infusões", anchor: "Infusão", header: "Infusão" },
    { nivel: "Círculo 0 (Truques)", anchor: "NV0", header: "Truque" },
    { nivel: "Círculo 1", anchor: "NV1", header: "Magia" },
    { nivel: "Círculo 2", anchor: "NV2", header: "Magia" },
    { nivel: "Círculo 3", anchor: "NV3", header: "Magia" },
    { nivel: "Círculo 4", anchor: "NV4", header: "Magia" },
    { nivel: "Círculo 5", anchor: "NV5", header: "Magia" },
    { nivel: "Círculo 6", anchor: "NV6", header: "Magia" },
    { nivel: "Círculo 7", anchor: "NV7", header: "Magia" },
    { nivel: "Círculo 8", anchor: "NV8", header: "Magia" },
    { nivel: "Círculo 9", anchor: "NV9", header: "Magia" }
  ];

  const descricoesMagias = {};
  const magiasData = {};

  listaNiveisInfo.forEach(({ nivel, anchor, header }) => {
     let anchorR = -1;
     let anchorC = -1;
     const nomesNivel = [];

     // 1. Procurar Onde o "NVX" está na planilha
     for (let r = 0; r < rows.length; r++) {
       const idx = rows[r].findIndex(c => c && typeof c === 'string' && c.trim().toLowerCase() === anchor.toLowerCase());
       if (idx !== -1) {
         anchorR = r;
         anchorC = idx;
         break;
       }
     }

     if (anchorR !== -1) {
        // 2. Procurar na "vizinhança de baixo" pela real coluna da palavra 'Magia', 'Truque' ou 'Infusão'
        let headerR = -1;
        let nameCol = anchorC; // fallback
        
        for (let offsetR = 1; offsetR <= 5; offsetR++) {
           const rowTest = rows[anchorR + offsetR];
           if (!rowTest) continue;
           
           for (let offsetC = -4; offsetC <= 6; offsetC++) {
               const testCol = anchorC + offsetC;
               if (testCol >= 0 && rowTest[testCol] && typeof rowTest[testCol] === 'string') {
                   const cellText = rowTest[testCol].trim().toLowerCase();
                   if (cellText === header.toLowerCase()) {
                       headerR = anchorR + offsetR;
                       nameCol = testCol;
                       break;
                   }
               }
           }
           if (headerR !== -1) break;
        }

        if (headerR !== -1) {
            // 3. Varrer as mágicas nos espaços corretos debaixo do Sub-titulo!
            let count = 0;
            // Limita a ler no maximo 10 linhas seguidas apos o sub-titulo para nao invadir a proxima tabela
            for (let r = headerR + 1; r <= headerR + 10; r++) {
                const rowSpell = rows[r];
                if (!rowSpell) break;
                
                const spellName = rowSpell[nameCol]?.trim() || "";
                
                // Quebrar a roda de busca se ele achar um próximo NVX logo em baixo (ex: espaço vazio entre NVs)
                if (spellName && ["nv0", "nv1", "nv1", "nv2", "nv3", "nv4", "nv5", "nv6", "nv7", "nv8", "nv9", "infusão", "nível"].includes(spellName.toLowerCase())) {
                   break;
                }

                if (spellName === "-" || spellName === "") {
                   nomesNivel.push("");
                   descricoesMagias[`spell_desc_${nivel}_${count}`] = "";
                } 
                else if (spellName.toLowerCase() !== "magia" && spellName.toLowerCase() !== "truque" && spellName.toLowerCase() !== "infusão") {
                   // Achar a descrição (varrendo +8 colunas pra direita do nome)
                   let desc = "";
                   for (let cOffset = 1; cOffset <= 8; cOffset++) {
                       if (rowSpell[nameCol + cOffset] && rowSpell[nameCol + cOffset].trim() && rowSpell[nameCol + cOffset].trim() !== "-") {
                           desc = rowSpell[nameCol + cOffset].trim();
                           break;
                       }
                   }
                   nomesNivel.push(spellName);
                   descricoesMagias[`spell_desc_${nivel}_${count}`] = desc;
                }
                count++;
            }
        }
     }
     
     // Garantir que devolva vazio no react pra nao dar crash
     while (nomesNivel.length < 4) nomesNivel.push("");
     magiasData[nivel] = nomesNivel;
  });

  // Captura de Talentos (Coluna B, linha 115+)
  const descricoesExtras = {};
  for (let i = 0; i < 8; i++) {
    const rowIndex = 114 + i;
    const colunasLimpas = rows[rowIndex]?.filter(c => c.trim() !== "") || [];
    descricoesExtras[`desc_talento_${i}`] = colunasLimpas[1] || "";
  }

    // Busca Dinâmica de Perícias
    // Como a planilha tem posições customizadas, procuramos o nome da perícia em toda a grade
    // Encontrando ela (ex: "Acrobacia" na col J), pegamos o MOD na col (J-1) e PRO na col (J-2)
    const nomesPericias = [
      'Acrobacia', 'Arcanismo', 'Atletismo', 'Atuação', 'Enganação', 'Furtividade',
      'História', 'Intimidação', 'Intuição', 'Investigação', 'Lidar com Animais',
      'Medicina', 'Natureza', 'Percepção', 'Persuasão', 'Prestidigitação', 'Religião', 'Sobrevivência'
    ];
    const periciasDinamicas = {};
    
    nomesPericias.forEach(nomePericia => {
      // Inicia com valores padrão caso não encontre
      periciasDinamicas[nomePericia] = { val: '+0', prof: false };
      
      for (let r = 0; r < rows.length; r++) {
        const row = rows[r];
        if (!row) continue;
        
        // Procura a coluna que textualmente bate com o nome da perícia ("Acrobacia")
        const cIndex = row.findIndex(cell => cell && typeof cell === 'string' && cell.trim().toLowerCase() === nomePericia.toLowerCase());
        
        if (cIndex !== -1 && cIndex >= 2) {
          // Achou a perícia! O MOD tá do lado esquerdo (-1) e a PRO (proficiência) duas casas pra esquerda (-2)
          const modStr = row[cIndex - 1]?.trim() || '+0';
          const proStr = row[cIndex - 2]?.trim()?.toLowerCase() || '';

          periciasDinamicas[nomePericia] = {
            val: modStr,
            prof: proStr === 'true' || proStr === 'o' || proStr === 'x'
          };
          break; // Já achou essa perícia, vai pra próxima
        }
      }
    });
    // --- BUSCA DINÂMICA DE INFORMAÇÕES (Evitando quebra por linhas novas) ---
    // Encontra informações acima do seu rótulo
    const findInfoAboveLabel = (labelStr) => {
      for (let r = 1; r < rows.length; r++) {
        const cIndex = rows[r].findIndex(c => c && typeof c === 'string' && c.trim() === labelStr);
        if (cIndex !== -1) {
           for(let offset = 1; r - offset >= 0 && offset <= 4; offset++) {
              const val = rows[r - offset]?.[cIndex]?.trim();
              if (val) return val;
           }
        }
      }
      return undefined;
    };

    // Acha Atributos
    const getAtributo = (label, isScore) => {
      for (let r = 0; r < rows.length; r++) {
         if (rows[r][0] && typeof rows[r][0] === 'string' && rows[r][0].trim() === label) {
             return isScore ? rows[r+4]?.[0] : rows[r+1]?.[0];
         }
      }
      return undefined;
    };

    // Acha moedas "PO", "PP", "PC"
    const findMoney = (coinLabel) => {
      for (let r = 0; r < rows.length; r++) {
        if (rows[r][0] && typeof rows[r][0] === 'string' && rows[r][0].trim() === coinLabel) {
           return rows[r][1]?.replace(/[^0-9]/g, '') || '0';
        }
      }
      return '0';
    };

    // Acha Talentos (procura CARACTERÍSTICAS E TALENTOS e pega o texto da linha seguinte)
    let talentosStr = "";
    for (let r = 0; r < rows.length; r++) {
        const cIndex = rows[r].findIndex(c => c && typeof c === 'string' && c.includes('CARACTERÍSTICAS E TALENTOS'));
        if (cIndex !== -1 && rows[r+1]) {
            let offset = 1;
            while(rows[r+offset] && (!rows[r+offset][cIndex] || rows[r+offset][cIndex].trim()==="")) {
               offset++;
               if (offset > 10) break; // Limite de sanidade
            }
            talentosStr = rows[r+offset]?.[cIndex] || rows[25]?.[13] || "";
            break;
        }
    }
    const talentosArray = talentosStr.split('/').filter(t => t.trim() !== "");

    // Acha Equipamento (procurando INVENTÁRIO ou SABEDORIA PASSIVA)
    let inventarioIndexStart = -1;
    let inventarioIndexEnd = rows.length;

    for (let r = 0; r < rows.length; r++) {
      if (rows[r].some(cell => cell && typeof cell === 'string' && 
         (cell.includes('SABEDORIA PASSIVA') || 
          cell.toLowerCase().includes('percepção passiva') || 
          cell.toLowerCase() === 'inventário'))) {
        inventarioIndexStart = r + 1;
      }
      if (inventarioIndexStart !== -1 && r > inventarioIndexStart) {
         if (rows[r].some(cell => cell && typeof cell === 'string' && (cell.includes('ROLAGEM') || cell.includes('Moedas') || cell.includes('Background')))) {
           inventarioIndexEnd = r;
           break;
         }
      }
    }

    const equipamentoItems = [];
    if (inventarioIndexStart !== -1) {
      for (let r = inventarioIndexStart; r < inventarioIndexEnd; r++) {
         const item = rows[r][0];
         // Aceita itens não vazios e ignora o próprio cabeçalho se ele se repetir
         if (item && typeof item === 'string' && item.trim() !== '' && item.trim() !== '-' && item.trim().toLowerCase() !== 'inventário') {
           equipamentoItems.push(item.trim());
         }
      }
    }
    const equipamentoStr = equipamentoItems.join(', ');

  return {
    isBase: rows[1]?.[0]?.toLowerCase() === 'base',
    info: {
      'Nome do Personagem': findInfoAboveLabel('NOME DO PERSONAGEM') || rows[1]?.[0] || '---',
      'Classe': findInfoAboveLabel('CLASSE') || rows[0]?.[4] || '---',
      'Antecedente': findInfoAboveLabel('ANTECEDENTE') || rows[0]?.[8] || '---',
      'Jogador': findInfoAboveLabel('NOME DO JOGADOR') || rows[0]?.[13] || '---',
      'Raça': findInfoAboveLabel('RAÇA') || rows[2]?.[4] || '---',
      'XP': findInfoAboveLabel('PONTOS DE EXPERIÊNCIA') || rows[2]?.[13] || '0',
      'Nivel': findInfoAboveLabel('NIVEL') || rows[0]?.[16] || '0',
      'Alinhamento': findInfoAboveLabel('ALINHAMENTO') || rows[2]?.[8] || '---'
    },
    atributos: { 
        'FOR': getAtributo('FORÇA', true) || rows[8]?.[0] || '10', 
        'DES': getAtributo('DESTREZA', true) || rows[13]?.[0] || '10', 
        'CON': getAtributo('CONSTITUIÇÃO', true) || rows[18]?.[0] || '10', 
        'INT': getAtributo('INTELIGÊNCIA', true) || rows[23]?.[0] || '10', 
        'SAB': getAtributo('SABEDORIA', true) || rows[28]?.[0] || '10', 
        'CAR': getAtributo('CARISMA', true) || rows[33]?.[0] || '10' 
    },
    modificadores: { 
        'FOR': getAtributo('FORÇA', false) || rows[5]?.[0] || '0', 
        'DES': getAtributo('DESTREZA', false) || rows[10]?.[0] || '0', 
        'CON': getAtributo('CONSTITUIÇÃO', false) || rows[15]?.[0] || '0', 
        'INT': getAtributo('INTELIGÊNCIA', false) || rows[20]?.[0] || '0', 
        'SAB': getAtributo('SABEDORIA', false) || rows[25]?.[0] || '0', 
        'CAR': getAtributo('CARISMA', false) || rows[30]?.[0] || '0' 
    },
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
      'Talentos': talentosArray.length > 0 ? talentosArray : (rows[25]?.[13]?.split('/') || []),
      ...descricoesExtras,
      ...descricoesMagias,
      'Equipamento': equipamentoStr || rows[37]?.[0] || "",
      'PO': findMoney('PO'), 'PP': findMoney('PP'), 'PC': findMoney('PC'),
    },
    pericias: periciasDinamicas,
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
  let data = await loadSheetViaCSV(spreadsheetId);
  if (!data || Object.keys(data).length === 0) {
    data = await loadSheetViaAPI(spreadsheetId);
  }
  return data;
}

export async function loadPlayerList() {
  const spreadsheetId = '1vS2Z6_qsuHaGqT4_rmUzdnW_wVI524x7rMloOYcXvL8';
  const csvUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv&gid=0`;

  try {
    const response = await fetch(csvUrl);
    const csvText = await response.text();

    const lines = csvText.split(/\r?\n/).filter(line => line.trim() !== "");
    if (lines.length === 0) return [];

    // Log dos cabeçalhos reais que o Google enviou
    const headers = lines[0].split(',').map(h => h.trim());

    const data = lines.slice(1).map((line, lineIdx) => {
      const values = line.split(',');
      const rowObject = {};
      headers.forEach((header, i) => {
        rowObject[header] = values[i]?.trim() || "";
      });
      return rowObject;
    });

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
    const payload = {
      action: 'UPDATE',
      spreadsheetId: spreadsheetId,
      data: data
    };

    const response = await fetch(scriptUrl, {
      method: 'POST',
      mode: 'no-cors', // Necessário para Scripts do Google
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return true;
  } catch (error) {
    console.error('❌ Erro ao atualizar via script:', error);
    return false;
  }
}

export async function createCharacterInDrive(scriptUrl, charName, playerName) {
  if (!scriptUrl) {
    console.error("Criação abortada: Webhook ausente.");
    return null;
  }

  try {
    // Usamos GET para evitar erros de CORS ao ler a resposta do Google Script
    const url = new URL(scriptUrl);
    url.searchParams.append('action', 'CREATE');
    url.searchParams.append('charName', charName);
    url.searchParams.append('player', playerName);

    const response = await fetch(url.toString(), {
      method: 'GET',
      redirect: 'follow'
    });

    const result = await response.json();
    return result; 
  } catch (error) {
    console.error('❌ Erro ao criar no Drive:', error);
    return null;
  }
}
