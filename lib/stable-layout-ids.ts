type CategoryInput = {
  stableId?: string | null;
  nameEn: string;
  nameUr: string;
  type: 'ASSET' | 'LIABILITY';
};

type ItemInput = {
  stableId?: string | null;
  description: string;
};

function normalizeStableId(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function slugify(value: string) {
  const slug = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
  return slug || 'x';
}

export function ensureCategoryStableId(category: CategoryInput, index: number) {
  return (
    normalizeStableId(category.stableId) ||
    `custom-cat-${category.type.toLowerCase()}-${slugify(category.nameEn || category.nameUr)}-${index + 1}`
  );
}

export function ensureItemStableId(item: ItemInput, categoryStableId: string, index: number) {
  return normalizeStableId(item.stableId) || `custom-item-${categoryStableId}-${slugify(item.description)}-${index + 1}`;
}
