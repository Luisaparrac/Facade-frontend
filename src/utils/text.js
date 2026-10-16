/** Lowercases and strips accents so "Penicilina" matches "penicilína". */
export function normalizeText(text = '') {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}

export function findAllergyConflict(medicationName, allergies = []) {
  const name = normalizeText(medicationName);
  if (!name) return null;
  return allergies.find((allergy) => {
    const normalized = normalizeText(allergy);
    return normalized && name.includes(normalized);
  }) ?? null;
}

export function humanizeCode(code = '') {
  const text = code.replace(/_/g, ' ').toLowerCase();
  return text.charAt(0).toUpperCase() + text.slice(1);
}
