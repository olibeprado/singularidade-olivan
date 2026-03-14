export function atlasScore(
  price: number,
  prevPrice: number,
  volume: number,
  prevVolume: number
) {

  const phi = 1.618
  const prata = 2.414
  const euler = 2.718
  const pi = Math.PI

  const growth = price / prevPrice

  const Φ = growth * phi

  const δs = (price - prevPrice) * prata

  const e = Math.abs(price - prevPrice) * euler

  const π = Math.sin(price) * pi

  const λ = volume / (prevVolume + 1)

  const τ = 1 / (Math.abs(price - prevPrice) + 0.0001)

  const raw =
    Φ +
    δs +
    e -
    π +
    λ +
    τ

  const score = Math.max(0, Math.min(100, raw * 10))

  return Math.round(score)
}
