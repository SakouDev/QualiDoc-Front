// Insensible aux accents (Léa ~ Lea) et à la casse, pour un filtrage texte simple.
// \p{Mn} = "Mark, nonspacing" : les accents une fois décomposés par normalize('NFD').
export function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Mn}/gu, "")
    .toLowerCase();
}
