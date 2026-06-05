export const CHECKLIST_ITEMS = [
  "Segui o plano pré-mercado",
  "Respeitei o stop em todas",
  "Não fiz overtrading",
  "Operei só meus setups A+",
  "Parei ao atingir a meta/limite",
];

export function parseChecklist(json: string | null): boolean[] {
  if (!json) return CHECKLIST_ITEMS.map(() => false);
  try {
    const arr = JSON.parse(json);
    if (Array.isArray(arr)) {
      return CHECKLIST_ITEMS.map((_, i) => Boolean(arr[i]));
    }
  } catch {}
  return CHECKLIST_ITEMS.map(() => false);
}
