// js/data/LootTables.js

export const LOOT_RARITY = {
    COMMON: { label: 'Comum', color: '#94a3b8', chance: 0.6 },
    UNCOMMON: { label: 'Incomum', color: '#22c55e', chance: 0.25 },
    RARE: { label: 'Raro', color: '#3b82f6', chance: 0.1 },
    EPIC: { label: 'Épico', color: '#a855f7', chance: 0.04 },
    LEGENDARY: { label: 'Lendário', color: '#eab308', chance: 0.01 }
};

export const BASE_ITEMS = [
    { name: 'Poção de Cura Menor', rarity: 'COMMON', type: 'Consumível', effect: 'Cura 1d4+1 PV' },
    { name: 'Antídoto Simples', rarity: 'COMMON', type: 'Consumível', effect: 'Remove venenos fracos' },
    { name: 'Pedra de Amolar', rarity: 'COMMON', type: 'Utilitário', effect: '+1 de dano no próximo ataque' },
    { name: 'Pergaminho em Branco', rarity: 'COMMON', type: 'Material', effect: 'Usado para escrita mágica' },
    
    { name: 'Poção de Cura', rarity: 'UNCOMMON', type: 'Consumível', effect: 'Cura 2d4+2 PV' },
    { name: 'Óleo de Precisão', rarity: 'UNCOMMON', type: 'Consumível', effect: 'Vantagem no próximo ataque' },
    { name: 'Elixir de Agilidade', rarity: 'UNCOMMON', type: 'Consumível', effect: '+2 DES por 1 hora' },
    
    { name: 'Anel de Proteção +1', rarity: 'RARE', type: 'Acessório', effect: '+1 na CA' },
    { name: 'Capa de Invisibilidade (Carga)', rarity: 'RARE', type: 'Acessório', effect: 'Invisível por 1 turno (1/dia)' },
    { name: 'Espada de Aço Damasceno', rarity: 'RARE', type: 'Arma', effect: 'Ignora resistência a dano físico' },

    { name: 'Cajado do Arquimago', rarity: 'EPIC', type: 'Cajado', effect: '+2 em testes de Magia e Dano Mágico' },
    { name: 'Armadura de Placas do Sol', rarity: 'EPIC', type: 'Armadura', effect: 'Imunidade a dano de fogo' },

    { name: 'Lâmina do Destino', rarity: 'LEGENDARY', type: 'Arma', effect: 'Crítico em 18-20. Dano dobrado contra demônios.' },
    { name: 'Cálice da Vida Eterna', rarity: 'LEGENDARY', type: 'Relíquia', effect: 'Restaura todos os PV se o portador cair a 0 (1/semana)' }
];

export const getRandomLoot = (level = 'medium') => {
    const goldMultipliers = { low: 10, medium: 50, high: 200, epic: 1000 };
    const itemsCount = { low: 1, medium: 2, high: 3, epic: 5 };
    
    const gold = Math.floor(Math.random() * goldMultipliers[level]) + (goldMultipliers[level] / 2);
    const lootItems = [];
    
    for (let i = 0; i < itemsCount[level]; i++) {
        const rand = Math.random();
        let selectedRarity = 'COMMON';
        
        if (rand < 0.02) selectedRarity = 'LEGENDARY';
        else if (rand < 0.08) selectedRarity = 'EPIC';
        else if (rand < 0.20) selectedRarity = 'RARE';
        else if (rand < 0.45) selectedRarity = 'UNCOMMON';
        
        const possibleItems = BASE_ITEMS.filter(item => item.rarity === selectedRarity);
        if (possibleItems.length > 0) {
            const item = possibleItems[Math.floor(Math.random() * possibleItems.length)];
            lootItems.push({ ...item, id: Date.now() + i });
        } else {
            // Fallback para comum se não houver itens da raridade
            lootItems.push({ ...BASE_ITEMS[0], id: Date.now() + i });
        }
    }
    
    return {
        gold,
        items: lootItems,
        timestamp: Date.now()
    };
};
