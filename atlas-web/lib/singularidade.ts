export const PHI = 1.6180339887;
export const PHI3 = Math.pow(PHI, 3);

export const SILVER = 1 + Math.sqrt(2);
export const EULER = Math.E;
export const PI = Math.PI;

export function singularidadeValue(price: number) {

  const core = (PHI3 + SILVER + EULER) / 3;

  const noiseFilter = PI - 3;

  const result = price * (core - noiseFilter);

  return result;
}

export function singularidadeScore(price: number, lastPrice: number) {

  const ve = singularidadeValue(price);

  const diff = (price - lastPrice) / lastPrice;

  let score = 70;

  if (price < ve) score += 10;
  if (diff > 0) score += 8;
  if (price > lastPrice) score += 6;

  return Math.min(99, Math.max(50, score));
}
