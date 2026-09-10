export function statutColor(statut: string) {
  if (statut === "confirme") return "success";
  if (statut === "annule") return "error";
  if (statut === "honore") return "info";
  return "neutral";
}

export function statutLabel(statut: string) {
  if (statut === "confirme") return "Confirmé";
  if (statut === "annule") return "Annulé";
  if (statut === "honore") return "Honoré";
  return statut;
}
