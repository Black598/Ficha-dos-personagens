// js/data.js

// --- CONFIGURAÇÃO FIREBASE ---
export const firebaseConfig = {
    apiKey: "AIzaSyCzR5bU-ou_Cz_yxugkA2eXd_3zf86ojgw",
    authDomain: "rpg-talenttree.firebaseapp.com",
    projectId: "rpg-talenttree",
    storageBucket: "rpg-talenttree.firebasestorage.app",
    messagingSenderId: "981095423243",
    appId: "1:981095423243:web:77d651b1715e08b3d4960e",
    measurementId: "G-EEE5ZB2K8Q"
}

// --- ID DO APP PARA O FIRESTORE ---
export const DEFAULT_APP_ID = 'rpg-mega-trees-v7';

// --- SISTEMA DE ÍCONES ---
const makeIcon = label => props => React.createElement('span', props, label);
export const iconMap = {
    Shield: makeIcon('🛡️'),
    Sword: makeIcon('⚔️'),
    Wand2: makeIcon('🧙🏾‍♂️'),
    Scroll: makeIcon('📜'),
    User: makeIcon('👤'),
    Lock: makeIcon('🔒'),
    CheckCircle2: makeIcon('✅'),
    AlertTriangle: makeIcon('⚠️'),
    ChevronRight: makeIcon('▶️'),
    Info: makeIcon('ℹ️'),
    Users: makeIcon('👥'),
    Star: makeIcon('⭐'),
    Zap: makeIcon('⚡'),
    Hammer: makeIcon('🔨'),
    FlaskConical: makeIcon('⚗️'),
    Ghost: makeIcon('👻'),
    MessageSquare: makeIcon('💬'),
    Crown: makeIcon('👑'),
    Flame: makeIcon('🔥'),
    Wind: makeIcon('🌬️'),
    Target: makeIcon('🎯'),
    ShieldAlert: makeIcon('🛡️⚠️'),
    Dna: makeIcon('🧬'),
    Ear: makeIcon('👂'),
    Sun: makeIcon('☀️'),
    Moon: makeIcon('🌙'),
    Footprints: makeIcon('👣'),
    Brain: makeIcon('🧠'),
    Eye: makeIcon('👁️'),
    Crosshair: makeIcon('🎯'),
    HeartPulse: makeIcon('💓'),
    Sparkles: makeIcon('✨')
};

// --- DADOS DAS ÁRVORES DE TALENTOS ---
export const TALENT_TREES = {
    marcial: {
        title: "Senda do Guerreiro",
        icon: 'Sword',
        color: "bg-red-900",
        border: "border-red-500",
        description: "Domínio físico e tático. Ideal para combatentes de linha de frente.",
        talents: [
            {
                id: 'm1', name: "Robustez", icon: 'ShieldAlert', levels: [
                    { lv: 1, req: "Sofrer 100 de dano", effect: "+1 PV por nível.", desc: "Sua pele engrossa após cicatrizes." },
                    { lv: 2, req: "Robustez I + 300 dano", effect: "+2 PV por nível.", desc: "Seu corpo ignora ferimentos superficiais." },
                    { lv: 3, req: "Robustez II + Sobreviver com 1 PV", effect: "+3 PV/Lv e +1 CA.", desc: "Uma lenda que se recusa a cair." }
                ]
            },
            {
                id: 'm2', name: "Ataque Oportunista", icon: 'Target', levels: [
                    { lv: 1, req: "20 reações de ataque", effect: "Vantagem em ataques de oportunidade.", desc: "Reflexos sintonizados com a falha alheia." },
                    { lv: 2, req: "Oportunista I + 10 abates", effect: "Inimigo atingido tem deslocamento 0.", desc: "Ninguém escapa do seu alcance." },
                    { lv: 3, req: "Oportunista II + 50 reações", effect: "Pode fazer 2 reações por rodada.", desc: "Um turbilhão defensivo intransponível." }
                ]
            },
            {
                id: 'm3', name: "Fúria", icon: 'Flame', levels: [
                    { lv: 1, req: "HP < 50% em 5 lutas", effect: "+2 dano enquanto ferido.", desc: "A dor alimenta sua raiva." },
                    { lv: 2, req: "Fúria I + 30 abates", effect: "Crítico agora é 19-20.", desc: "Golpes buscam pontos vitais." },
                    { lv: 3, req: "Fúria II + Abater Chefe", effect: "Resistência a dano físico.", desc: "Sua raiva é uma armadura." }
                ]
            },
            {
                id: 'm4', name: "Comandante", icon: 'Crown', levels: [
                    { lv: 1, req: "Dar 10 comandos táticos", effect: "Aliado ganha +1 no ataque contra seu alvo.", desc: "Sua voz guia o aço aliado." },
                    { lv: 2, req: "Comandante I + Flanquear 20x", effect: "Pode usar ajuda como ação bônus.", desc: "Mestre da coordenação de campo." },
                    { lv: 3, req: "Comandante II + Vitória Crítica", effect: "Sua iniciativa é passada para um aliado.", desc: "Estrategista brilhante." }
                ]
            }
        ]
    },
    arcano: {
        title: "Caminho do Saber",
        icon: 'Wand2',
        color: "bg-blue-900",
        border: "border-blue-500",
        description: "Manipulação da Trama e segredos arcanos do cosmos.",
        talents: [
            {
                id: 'a1', name: "Mente Clara", icon: 'Zap', levels: [
                    { lv: 1, req: "10 sucessos em concentração", effect: "Não perde concentração com dano < 10.", desc: "Mente inabalável." },
                    { lv: 2, req: "Mente I + 50 magias", effect: "Vantagem em testes de resistência de INT.", desc: "Psique labiríntica." },
                    { lv: 3, req: "Mente II + Meditar em plano", effect: "Pode manter 2 concentrações.", desc: "Dualidade mental." }
                ]
            },
            {
                id: 'a2', name: "Tecelão", icon: 'Wind', levels: [
                    { lv: 1, req: "Gastar 30 slots lv 1+", effect: "Recupera 1 slot lv 1 em descanso curto.", desc: "Reciclagem de energia." },
                    { lv: 2, req: "Tecelão I + Aprender 5 magias", effect: "Pode trocar uma magia preparada.", desc: "Versatilidade mágica." },
                    { lv: 3, req: "Tecelão II + Slot lv 5", effect: "Conjura lv 1 sem slot 3x/dia.", desc: "A magia flui livremente." }
                ]
            },
            {
                id: 'a3', name: "Potência", icon: 'Flame', levels: [
                    { lv: 1, req: "200 dano mágico", effect: "Rola 1s no dano novamente.", desc: "Máximo impacto mágico." },
                    { lv: 2, req: "Potência I + 50 abates", effect: "Ignora resistências elementais.", desc: "O fogo queima até o fogo." },
                    { lv: 3, req: "Potência II + Crítico", effect: "+1 dado de dano em magias.", desc: "Destruição absoluta." }
                ]
            },
            {
                id: 'a4', name: "Metamagia", icon: 'Sparkles', levels: [
                    { lv: 1, req: "Modificar 10 magias", effect: "Pode dobrar o alcance de uma magia (3x/dia).", desc: "Sua vontade estica a trama." },
                    { lv: 2, req: "Metamagia I + Usar 3 elementos", effect: "Magias de alvo único atingem 2 alvos próximos.", desc: "Magia duplicada." },
                    { lv: 3, req: "Metamagia II + Desvendar selo", effect: "Remove componentes verbais de qualquer magia.", desc: "Conjunção silenciosa." }
                ]
            }
        ]
    },
    divino: {
        title: "Senda Divina",
        icon: 'Sun',
        color: "bg-amber-900",
        border: "border-amber-400",
        description: "Conexão com deuses e luz sagrada. Cura e punição divina.",
        talents: [
            {
                id: 'd1', name: "Cura Sagrada", icon: 'HeartPulse', levels: [
                    { lv: 1, req: "Curar 200 PV", effect: "Dados de cura rolam +1.", desc: "Suas mãos brilham com calor divino." },
                    { lv: 2, req: "Cura I + Estabilizar 10 aliados", effect: "Curas removem a condição 'Cego' ou 'Surdo'.", desc: "Milagre restaurador." },
                    { lv: 3, req: "Cura II + Ressuscitar alguém", effect: "Sempre cura o valor máximo em aliados com < 50% HP.", desc: "O ápice da benevolência." }
                ]
            },
            {
                id: 'd2', name: "Escudo da Fé", icon: 'Shield', levels: [
                    { lv: 1, req: "Bloquear dano para aliado", effect: "Aliados a 3m ganham +1 CA.", desc: "Sua fé é um domo protetor." },
                    { lv: 2, req: "Escudo I + Resistir a 20 feitiços", effect: "Resistência a dano Necrótico.", desc: "A luz repele a morte." },
                    { lv: 3, req: "Escudo II + Banir demônio", effect: "Dano recebido por aliados próximos é dividido com você.", desc: "Mártir sagrado." }
                ]
            },
            {
                id: 'd3', name: "Luz Punidora", icon: 'Zap', levels: [
                    { lv: 1, req: "Abater 10 mortos-vivos", effect: "+1d6 dano Radiante em ataques mágicos.", desc: "A escuridão foge de você." },
                    { lv: 2, req: "Luz I + Cegar 5 inimigos", effect: "Alvos atingidos ficam impedidos de usar reações.", desc: "Clarão paralisante." },
                    { lv: 3, req: "Luz II + Purificar solo", effect: "Crítico contra profanos causa explosão de luz.", desc: "Julgamento final." }
                ]
            },
            {
                id: 'd4', name: "Intercessão", icon: 'MessageSquare', levels: [
                    { lv: 1, req: "Rezar por 30 turnos", effect: "Pode gastar reação para dar vantagem em teste de resistência.", desc: "Ouvido por forças maiores." },
                    { lv: 2, req: "Intercessão I + 10 milagres", effect: "O deuso responde 1 pergunta por dia (Sim/Não).", desc: "Comunhão direta." },
                    { lv: 3, req: "Intercessão II + Salvar Vila", effect: "Pode invocar um Avatar por 1 turno (1x/mês).", desc: "Voz do panteão." }
                ]
            }
        ]
    },
    sombras: {
        title: "Senda das Sombras",
        icon: 'Moon',
        color: "bg-slate-900",
        border: "border-indigo-500",
        description: "Infiltração, assassinato e manipulação do breu.",
        talents: [
            {
                id: 'sh1', name: "Lâmina Tóxica", icon: 'FlaskConical', levels: [
                    { lv: 1, req: "Envenenar 10 alvos", effect: "Armas causam +1d4 veneno (1min após aplicar).", desc: "O aço que arde." },
                    { lv: 2, req: "Lâmina I + Extrair veneno", effect: "O veneno agora causa a condição 'Lento'.", desc: "Toxina debilitante." },
                    { lv: 3, req: "Lâmina II + Matar Rei", effect: "Ignora imunidade a veneno de criaturas vivas.", desc: "Veneno da viúva negra." }
                ]
            },
            {
                id: 'sh2', name: "Furtividade Ativa", icon: 'Ghost', levels: [
                    { lv: 1, req: "Passar despercebido 20x", effect: "Inimigos têm -5 na Percepção Passiva contra você.", desc: "Um borrão na visão." },
                    { lv: 2, req: "Furtividade I + Roubar joia", effect: "Pode se esconder mesmo sob observação leve.", desc: "Mimetismo sombrio." },
                    { lv: 3, req: "Furtividade II + Invadir Plano", effect: "Fica invisível por 1 turno após matar um alvo.", desc: "O espectro da morte." }
                ]
            },
            {
                id: 'sh3', name: "Ataque Brutal", icon: 'Crosshair', levels: [
                    { lv: 1, req: "15 ataques com vantagem", effect: "Ataque surpresa dá +2d6 dano.", desc: "Onde dói mais." },
                    { lv: 2, req: "Brutal I + 10 críticos", effect: "Se o alvo estiver com 100% HP, o ataque é crítico automático.", desc: "Primeiro e último golpe." },
                    { lv: 3, req: "Brutal II + Abate silencioso", effect: "Triplica o dano em ataques contra alvos surpresos.", desc: "Execução perfeita." }
                ]
            },
            {
                id: 'sh4', name: "Agilidade Oculta", icon: 'Footprints', levels: [
                    { lv: 1, req: "Esquivar de 30 ataques", effect: "Desengajar é ação livre.", desc: "Enguia humana." },
                    { lv: 2, req: "Agilidade I + Saltar 50m", effect: "Pode escalar qualquer superfície sem teste.", desc: "Passos de aranha." },
                    { lv: 3, req: "Agilidade II + Cair de 20m", effect: "Recebe 0 dano de queda (até 30m).", desc: "Pouso de folha." }
                ]
            }
        ]
    },
    sobrevivencia: {
        title: "Instinto Selvagem",
        icon: 'Shield',
        color: "bg-emerald-900",
        border: "border-emerald-500",
        description: "Resiliência da natureza e adaptação extrema.",
        talents: [
            {
                id: 's1', name: "Pele de Carvalho", icon: 'Dna', levels: [
                    { lv: 1, req: "Cair para 0 PV 3x", effect: "Mod. Con na CA (sem armadura).", desc: "Corpo moldado pela dor." },
                    { lv: 2, req: "Pele I + Comer monstro", effect: "Resistência a Veneno.", desc: "Sangue antídoto." },
                    { lv: 3, req: "Pele II + Sobreviver queda", effect: "RD 3 contra concussão.", desc: "Ossos de ferro." }
                ]
            },
            {
                id: 's2', name: "Rastreador", icon: 'Target', levels: [
                    { lv: 1, req: "Achar 10 pistas", effect: "Vantagem em Sobrevivência.", desc: "O chão conta histórias." },
                    { lv: 2, req: "Rastreador I + Noite selva", effect: "Visão Escuro +18m.", desc: "Olhos de lobo." },
                    { lv: 3, req: "Rastreador II + Direção", effect: "Sempre sabe onde está água e o norte.", desc: "Bússola biológica." }
                ]
            },
            {
                id: 's3', name: "Adaptação", icon: 'Zap', levels: [
                    { lv: 1, req: "Dano elemental", effect: "Reduz dano Fogo/Gelo em 2.", desc: "Ajuste térmico." },
                    { lv: 2, req: "Adaptação I + 5 resists", effect: "Respira sob água por 1h.", desc: "Pulmões anfíbios." },
                    { lv: 3, req: "Adaptação II + Viagem", effect: "Resistência elemental trocável em descanso longo.", desc: "Mimetismo total." }
                ]
            },
            {
                id: 's4', name: "Mestre das Feras", icon: 'Ear', levels: [
                    { lv: 1, req: "Domar 3 animais", effect: "Pode entender emoções de animais.", desc: "Empatia selvagem." },
                    { lv: 2, req: "Feras I + Combate com pet", effect: "Pode usar os sentidos do seu animal (100m).", desc: "Olhos da águia." },
                    { lv: 3, req: "Feras II + Salvar espécie", effect: "Pode invocar um enxame para ajudar (1x/dia).", desc: "Chamado da matilha." }
                ]
            }
        ]
    },
    utilidade: {
        title: "Mestre de Ofícios",
        icon: 'Scroll',
        color: "bg-amber-800",
        border: "border-amber-500",
        description: "Conhecimento técnico, suporte e criação.",
        talents: [
            {
                id: 'u1', name: "Alquimia", icon: 'FlaskConical', levels: [
                    { lv: 1, req: "20 ervas", effect: "Cria 2 poções cura/dia.", desc: "Misturas básicas." },
                    { lv: 2, req: "Alquimia I + 10 poções", effect: "Poções curam valor máximo.", desc: "Pureza absoluta." },
                    { lv: 3, req: "Alquimia II + Veneno", effect: "Cria antídotos universais.", desc: "Apotecário lendário." }
                ]
            },
            {
                id: 'u2', name: "Ferraria", icon: 'Hammer', levels: [
                    { lv: 1, req: "30 itens reparados", effect: "Armas aliadas +1 dano.", desc: "Manutenção de mestre." },
                    { lv: 2, req: "Ferraria I + Forjar aço", effect: "Reforça armadura (+1 CA tempo).", desc: "Forja de campo." },
                    { lv: 3, req: "Ferraria II + Forja lend", effect: "Equipamento não quebra.", desc: "Aço eterno." }
                ]
            },
            {
                id: 'u3', name: "Ladinagem", icon: 'Ghost', levels: [
                    { lv: 1, req: "15 trancas", effect: "Dobro de proficiência Gazuas.", desc: "Mãos leves." },
                    { lv: 2, req: "Ladinagem I + Furtar", effect: "Esconde-se como bônus.", desc: "Fantasma." },
                    { lv: 3, req: "Ladinagem II + Invadir", effect: "Não ativa armadilhas mecânicas.", desc: "Sombra." }
                ]
            },
            {
                id: 'u4', name: "Liderança", icon: 'Crown', levels: [
                    { lv: 1, req: "30 ajudas", effect: "Ação ajudar dá +1d6.", desc: "Incentivo tático." },
                    { lv: 2, req: "Liderança I + Vitória", effect: "Aliados +3m deslocamento.", desc: "Comandante nato." },
                    { lv: 3, req: "Liderança II + 100 ajudas", effect: "Vantagem em saves para aliados próximos.", desc: "Farol de esperança." }
                ]
            }
        ]
    },
    primal: {
        title: "Senda Primal",
        icon: 'Flame',
        color: "bg-orange-950",
        border: "border-orange-500",
        description: "Conexão elemental bruta e instintos ancestrais de destruição.",
        talents: [
            {
                id: 'p1', name: "Mimetismo Terra", icon: 'Shield', levels: [
                    { lv: 1, req: "Enterrado vivo", effect: "Ganha 5 PV temporários ao tocar o solo.", desc: "Pés firmes na terra." },
                    { lv: 2, req: "Terra I + 10 abates pedra", effect: "Não pode ser derrubado (prone).", desc: "Estabilidade de montanha." },
                    { lv: 3, req: "Terra II + Escavar túnel", effect: "Corpo de pedra: RD 5 contra físico.", desc: "Monólito vivo." }
                ]
            },
            {
                id: 'p2', name: "Sopro de Fogo", icon: 'Flame', levels: [
                    { lv: 1, req: "Sobreviver fogo", effect: "Ataques causam +1 fogo.", desc: "Brasas nas veias." },
                    { lv: 2, req: "Fogo I + 50 dano chamas", effect: "Resistência a Fogo.", desc: "Pele de salamandra." },
                    { lv: 3, req: "Fogo II + Queimar floresta", effect: "Pode lançar Mãos Flamejantes 3x/dia.", desc: "Dragão em forma humana." }
                ]
            },
            {
                id: 'p3', name: "Velocidade Vento", icon: 'Wind', levels: [
                    { lv: 1, req: "Correr 1km em combate", effect: "+1.5m deslocamento.", desc: "Leve como a brisa." },
                    { lv: 2, req: "Vento I + Esquivar flecha", effect: "Ataques à distância contra você têm desvantagem.", desc: "Desvio aerodinâmico." },
                    { lv: 3, req: "Vento II + Cair de nuvem", effect: "Pode levitar por 1 minuto (1x/dia).", desc: "Filho do vendaval." }
                ]
            },
            {
                id: 'p4', name: "Chamado Mar", icon: 'Zap', levels: [
                    { lv: 1, req: "Nadar 500m", effect: "Deslocamento de natação igual ao normal.", desc: "Fluidez aquática." },
                    { lv: 2, req: "Mar I + Pescar monstro", effect: "Ataques causam +1d4 raio na água.", desc: "Corrente elétrica." },
                    { lv: 3, req: "Mar II + Sobreviver abismo", effect: "Pode respirar água e falar com peixes.", desc: "Avatar das profundezas." }
                ]
            }
        ]
    },
    mental: {
        title: "Senda Mental",
        icon: 'Brain',
        color: "bg-purple-950",
        border: "border-purple-400",
        description: "Poderes psíquicos e manipulação da consciência.",
        talents: [
            {
                id: 'ps1', name: "Telecinese", icon: 'Zap', levels: [
                    { lv: 1, req: "Mover 50 objetos", effect: "Mãos Mágicas invisíveis permanentes.", desc: "Mente sobre matéria." },
                    { lv: 2, req: "Ps1 + Empurrar gigante", effect: "Pode empurrar inimigo 3m com ação bônus.", desc: "Pulso cinético." },
                    { lv: 3, req: "Ps2 + Levitar casa", effect: "Pode paralisar um alvo por 1 turno (1x/descanso).", desc: "Prisão mental." }
                ]
            },
            {
                id: 'ps2', name: "Leitura Mental", icon: 'Eye', levels: [
                    { lv: 1, req: "Vencer 20 testes Intuição", effect: "Pode sentir a presença de mentes a 9m.", desc: "Sussurros de pensamentos." },
                    { lv: 2, req: "Ps1 + Detectar mentira", effect: "Vantagem em testes contra ilusões.", desc: "Visão além do véu." },
                    { lv: 3, req: "Ps2 + Dominar mente", effect: "Pode lançar 'Sugestão' 1x por descanso longo.", desc: "Manipulador de sonhos." }
                ]
            },
            {
                id: 'ps3', name: "Escudo Psíquico", icon: 'Shield', levels: [
                    { lv: 1, req: "Dano Psíquico sofrido", effect: "Resistência a dano Psíquico.", desc: "Muralha cerebral." },
                    { lv: 2, req: "Ps1 + Bloquear controle", effect: "Imunidade a ser Enfeitiçado (Charmed).", desc: "Vontade de ferro." },
                    { lv: 3, req: "Ps2 + Refletir dor", effect: "Dano mental sofrido é refletido ao atacante.", desc: "Espelho cognitivo." }
                ]
            },
            {
                id: 'ps4', name: "Salto Espacial", icon: 'Footprints', levels: [
                    { lv: 1, req: "Caminhar 100km", effect: "Pode se teleportar 1.5m em vez de andar.", desc: "Passo dimensional." },
                    { lv: 2, req: "Ps1 + Teleporte cego", effect: "Pode usar 'Passo Misterioso' 1x/descanso.", desc: "Fenda na realidade." },
                    { lv: 3, req: "Ps2 + Viajar planos", effect: "Pode trocar de lugar com um aliado (action bonus).", desc: "Troca quântica." }
                ]
            }
        ]
    }
};