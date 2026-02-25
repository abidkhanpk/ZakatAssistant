import {
  defaultCategoryTemplates,
  findTemplateCategoryByNames,
  findTemplateItemByDescription,
  getTemplateItem
} from '@/lib/default-categories';

type SourceItem = {
  stableId?: string | null;
  description: string;
  amount: number;
};

type SourceCategory = {
  stableId?: string | null;
  nameEn: string;
  nameUr: string;
  type: 'ASSET' | 'LIABILITY';
  items: SourceItem[];
};

type InitialItem = {
  stableId: string;
  description: string;
  amount: number;
};

type InitialCategory = {
  stableId: string;
  nameEn: string;
  nameUr: string;
  type: 'ASSET' | 'LIABILITY';
  items: InitialItem[];
};

function createCustomStableId(prefix: 'cat' | 'item', seed: string) {
  return `custom-${prefix}-${seed}`;
}

function isTemplateCategoryKey(stableId?: string | null) {
  return Boolean(stableId && defaultCategoryTemplates.some((template) => template.key === stableId));
}

export function remapImportedCategoriesToCurrentLayout(sourceCategories: SourceCategory[]): InitialCategory[] {
  const mappedCategories: InitialCategory[] = defaultCategoryTemplates.map((template) => ({
    stableId: template.key,
    nameEn: template.nameEn,
    nameUr: template.nameUr,
    type: template.type,
    items: template.items.map((item) => ({ stableId: item.key, description: item.description, amount: 0 }))
  }));

  const mappedByCategoryKey = new Map(mappedCategories.map((category) => [category.stableId, category] as const));
  const customCategories: InitialCategory[] = [];

  sourceCategories.forEach((sourceCategory, categoryIndex) => {
    const templateCategoryKey = isTemplateCategoryKey(sourceCategory.stableId)
      ? String(sourceCategory.stableId)
      : findTemplateCategoryByNames(sourceCategory.type, sourceCategory.nameEn, sourceCategory.nameUr)?.key;

    if (!templateCategoryKey) {
      customCategories.push({
        stableId: sourceCategory.stableId || createCustomStableId('cat', `${categoryIndex}`),
        nameEn: sourceCategory.nameEn,
        nameUr: sourceCategory.nameUr,
        type: sourceCategory.type,
        items: sourceCategory.items.map((item, itemIndex) => ({
          stableId: item.stableId || createCustomStableId('item', `${categoryIndex}-${itemIndex}`),
          description: item.description,
          amount: Number(item.amount) || 0
        }))
      });
      return;
    }

    const targetCategory = mappedByCategoryKey.get(templateCategoryKey);
    if (!targetCategory) return;

    sourceCategory.items.forEach((item, itemIndex) => {
      const sourceItemKey = item.stableId;
      const mappedTemplateItemKey = sourceItemKey && getTemplateItem(sourceItemKey)
        ? sourceItemKey
        : findTemplateItemByDescription(templateCategoryKey, item.description)?.key;

      if (mappedTemplateItemKey) {
        const targetItem = targetCategory.items.find((entry) => entry.stableId === mappedTemplateItemKey);
        if (targetItem) {
          targetItem.amount += Number(item.amount) || 0;
          return;
        }
      }

      const fallbackCategoryStableId = createCustomStableId('cat', `unmapped-${categoryIndex}`);
      let fallbackCategory = customCategories.find((entry) => entry.stableId === fallbackCategoryStableId);
      if (!fallbackCategory) {
        fallbackCategory = {
          stableId: fallbackCategoryStableId,
          nameEn: `Imported (${sourceCategory.nameEn})`,
          nameUr: `امپورٹ شدہ (${sourceCategory.nameUr})`,
          type: sourceCategory.type,
          items: []
        };
        customCategories.push(fallbackCategory);
      }

      fallbackCategory.items.push({
        stableId: item.stableId || createCustomStableId('item', `unmapped-${categoryIndex}-${itemIndex}`),
        description: item.description,
        amount: Number(item.amount) || 0
      });
    });
  });

  return [...mappedCategories, ...customCategories];
}
