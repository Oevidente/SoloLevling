import { InventoryItem } from '../types/hunter';

export interface LootReward {
  item: Omit<InventoryItem, 'id' | 'acquiredAt'>;
  dropWeight: number; // Probabilidade relativa
}

export const LOOT_POOL: LootReward[] = [
  // --- PERGAMINHOS DE DESCANSO E NEUROCIÊNCIA ---
  {
    dropWeight: 18,
    item: {
      name: 'Pergaminho de Descanso Sem Culpa (30 min)',
      type: 'pergaminho',
      rarity: 'raro',
      description: 'Autorização formal emitida pelo Sistema para 30 minutos de lazer total e sem cobrança interna.',
      effect: 'Libera o Caçador para relaxar, jogar ou pausar com a consciência limpa.',
    },
  },
  {
    dropWeight: 14,
    item: {
      name: 'Pergaminho de Desconexão Sagrada (Detox Digital)',
      type: 'pergaminho',
      rarity: 'comum',
      description: 'Prescrição do Sistema para 40 minutos longe de telas e redes sociais para recarregar o córtex pré-frontal.',
      effect: 'Restaura a clareza mental e previne a fadiga dopaminérgica.',
    },
  },
  {
    dropWeight: 10,
    item: {
      name: 'Decreto de Reinício Imediato (Quebra de Inércia)',
      type: 'pergaminho',
      rarity: 'epico',
      description: 'Invoca a regra dos 2 minutos: basta tocar na tarefa sem cobrança de finalização.',
      effect: 'Dissipa o bloqueio de início e engata o fluxo de trabalho natural.',
    },
  },

  // --- RELÍQUIAS E PROTEÇÕES ---
  {
    dropWeight: 14,
    item: {
      name: 'Escudo das Sombras (Proteção de Streak)',
      type: 'relic',
      rarity: 'epico',
      description: 'Uma barreira mágica que protege seu histórico de dias mesmo se houver um dia atípico ou de exaustão.',
      effect: 'Preserva a chama da consistência sem punição por imprevistos da vida real.',
    },
  },
  {
    dropWeight: 10,
    item: {
      name: 'Ampulheta da Dopamina Estável',
      type: 'relic',
      rarity: 'epico',
      description: 'Artefato antigo que regula os níveis de satisfação interna por micro-vitórias concluídas.',
      effect: 'Amplifica a sensação de dever cumprido ao fechar tarefas do dia.',
    },
  },
  {
    dropWeight: 6,
    item: {
      name: 'Amuleto da Tríade Perfeita',
      type: 'relic',
      rarity: 'lendario',
      description: 'Relíquia forjada pelos Monarcas da Harmonia quando Corpo, Mente e Espírito se alinham.',
      effect: 'Otorga bênção suprema de equilíbrio e clareza de propósito.',
    },
  },
  {
    dropWeight: 12,
    item: {
      name: 'Anel do Foco Profundo',
      type: 'relic',
      rarity: 'raro',
      description: 'Anel de obsidiana polida que blinda a atenção contra ruídos e impulsos dispersivos.',
      effect: 'Aumenta a precisão de execução durante blocos de hiperfoco.',
    },
  },

  // --- BUFFS E POÇÕES DE XP / ENERGIA ---
  {
    dropWeight: 20,
    item: {
      name: 'Elixir de Ímpeto Mental (+50 XP)',
      type: 'buff',
      rarity: 'comum',
      description: 'Uma poção cintilante de mana pura condensada.',
      effect: 'Concede instantaneamente +50 XP ao seu nível de Caçador.',
    },
  },
  {
    dropWeight: 15,
    item: {
      name: 'Poção de Foco do Monarca (+75 XP)',
      type: 'buff',
      rarity: 'raro',
      description: 'Extrato cristalino destilado de essência de hiperfoco.',
      effect: 'Concede +75 XP imediatos e revigora os pontos de mana.',
    },
  },
  {
    dropWeight: 12,
    item: {
      name: 'Néctar da Serenidade Espiritual (+100 XP)',
      type: 'buff',
      rarity: 'raro',
      description: 'Gotas de orvalho de um santuário silencioso.',
      effect: 'Concede +100 XP imediatos e reconecta seu estado de espírito à paz.',
    },
  },
  {
    dropWeight: 8,
    item: {
      name: 'Chave da Dungeon de Ouro (+150 XP)',
      type: 'relic',
      rarity: 'epico',
      description: 'Chave reluzente forjada pelos monarcas antigos.',
      effect: 'Concede +150 XP imediatos ao perfil do Caçador.',
    },
  },
  {
    dropWeight: 10,
    item: {
      name: 'Pedra Rúnica de Autocompaixão',
      type: 'buff',
      rarity: 'epico',
      description: 'Inscrição rúnica antiga que dissipa a auto-crítica e pensamentos de insuficiência.',
      effect: 'Lembra que consistência imperfeita vale 100x mais do que perfeição abandonada.',
    },
  },

  // --- TÍTULOS DE PRESTÍGIO ---
  {
    dropWeight: 6,
    item: {
      name: 'Título: O Desperto Inabalável',
      type: 'titulo',
      rarity: 'lendario',
      description: 'Título honorário supremo reconhecido pela guilda dos Caçadores.',
      effect: 'Desbloqueia e equipa o título honorário de prestígio supremo.',
    },
  },
  {
    dropWeight: 8,
    item: {
      name: 'Título: Arquiteto da Disciplina',
      type: 'titulo',
      rarity: 'epico',
      description: 'Honraria concedida a quem constrói rotinas sólidas tijolo por tijolo.',
      effect: 'Desbloqueia o título de prestígio "Arquiteto da Disciplina" no seu perfil.',
    },
  },
  {
    dropWeight: 5,
    item: {
      name: 'Título: Guardião dos Três Pilares',
      type: 'titulo',
      rarity: 'lendario',
      description: 'Distintivo místico daqueles que honram Corpo, Mente e Espírito simultaneamente.',
      effect: 'Desbloqueia o prestigiado título "Guardião dos Três Pilares".',
    },
  },
  {
    dropWeight: 12,
    item: {
      name: 'Título: Caçador Focado',
      type: 'titulo',
      rarity: 'comum',
      description: 'Título clássico de quem domina os fundamentos da atenção.',
      effect: 'Desbloqueia o título "Caçador Focado" para personalizar seu cartão.',
    },
  },
];

export function getRandomLoot(): Omit<InventoryItem, 'id' | 'acquiredAt'> {
  const totalWeight = LOOT_POOL.reduce((sum, item) => sum + item.dropWeight, 0);
  let random = Math.random() * totalWeight;

  for (const reward of LOOT_POOL) {
    if (random < reward.dropWeight) {
      return reward.item;
    }
    random -= reward.dropWeight;
  }

  return LOOT_POOL[0].item;
}
