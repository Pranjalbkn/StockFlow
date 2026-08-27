function normalizeWord(word: string) {
  if (word.endsWith("ies") && word.length > 3) return `${word.slice(0, -3)}y`;
  if (word.endsWith("s") && !word.endsWith("ss") && word.length > 3) return word.slice(0, -1);
  return word;
}

export function normalizeCatalogName(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .map(normalizeWord)
    .join(" ");
}

export function findUniqueCatalogMatch<T extends { id: number; name: string; sku?: string }>(
  spokenName: string,
  catalog: T[],
) {
  const target = normalizeCatalogName(spokenName);
  const matches = catalog.filter((item) => {
    return normalizeCatalogName(item.name) === target
      || (item.sku ? normalizeCatalogName(item.sku) === target : false);
  });

  return matches.length === 1 ? matches[0] : null;
}
