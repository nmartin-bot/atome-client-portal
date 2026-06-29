export const BRIEF_SECTIONS = [
  'Type de projet',
  'Activité client',
  "Utilisateurs de l'outil",
  'Flux / Parcours',
  'Acteurs et rôles',
  'Règles métier',
  'Sortie attendue',
  'Intégrations',
  'Domaine',
  'Deadline',
  'Référence',
  'Points à clarifier',
] as const

// Retire les tirets de liste ("- ", "— ") et les tirets isolés que le modèle
// ajoute parfois malgré la consigne, sans toucher aux mots composés (ex: "sur-mesure")
export function stripDashes(text: string) {
  return text
    .split('\n')
    .map(line => line.replace(/^\s*[-—*]\s+/, ''))
    .join('\n')
    .replace(/\s+[-—]\s+/g, ', ')
}
