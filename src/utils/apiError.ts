// Les erreurs métier (ex: "créneau déjà pris") arrivent sous
// messages.error, mais les erreurs de validation CodeIgniter arrivent sous
// messages.<nom_du_champ> (ex: messages.nom pour un nom en doublon) — donc
// lire uniquement messages.error loupe systématiquement les erreurs de
// validation et affiche un message générique à la place. On prend le
// premier message disponible, quelle que soit sa clé.
export function apiErrorMessage(e: any): string {
  const messages = e.response?.data?.messages;
  const first = messages ? Object.values(messages)[0] : null;
  return typeof first === 'string' ? first : 'Une erreur est survenue.';
}
