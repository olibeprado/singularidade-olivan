export const PHI = 1.6180339887
export const PHI3 = Math.pow(PHI,3)

export const SILVER = 1 + Math.sqrt(2)
export const EULER = Math.E
export const PI = Math.PI

export function singularidadeValue(price:number){

 const core = (PHI3 + SILVER + EULER)/3
 const noise = PI - 3

 return price * (core - noise)

}

export function singularidadeScore(price:number,prev:number){

 const ve = singularidadeValue(price)

 const momentum = (price-prev)/prev

 let score = 70

 if(price < ve) score += 10
 if(momentum > 0) score += 8
 if(price > prev) score += 6

 return Math.max(50,Math.min(99,score))

}
