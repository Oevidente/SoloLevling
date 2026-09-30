/**
 * Normaliza e arredonda a quantidade de EXP para uma missão dentro da escala de 10 a 500 (em múltiplos de 5: 10, 15, 20...).
 * Se for inserido um número como 12, arredonda para o mais próximo da escala (10).
 * Garante que os limites sejam sempre respeitados (mínimo 10, máximo 500).
 */
export const normalizeQuestExp = (val: number | string | undefined | null): number => {
  const num = typeof val === 'number' ? val : Number(val);
  if (isNaN(num) || num < 10) return 10;
  if (num > 500) return 500;
  
  const nearest = Math.round(num / 5) * 5;
  return Math.min(500, Math.max(10, nearest));
};

export const QUEST_EXP_PRESETS = [10, 25, 50, 100, 250, 500] as const;
