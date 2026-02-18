export type CategoryInput = { items: { amount: number }[] };

export function calculateZakat(input: { calendarType: 'ISLAMIC' | 'GREGORIAN'; assets: CategoryInput[]; liabilities: CategoryInput[] }) {
  const totalAssets = input.assets.flatMap((c) => c.items).reduce((a, item) => a + (item.amount || 0), 0);
  const totalDeductions = input.liabilities.flatMap((c) => c.items).reduce((a, item) => a + (item.amount || 0), 0);
  const netZakatable = totalAssets - totalDeductions;
  const zakatRate = input.calendarType === 'ISLAMIC' ? 0.025 : 0.0258;
  const zakatPayable = Math.max(netZakatable, 0) * zakatRate;
  return { totalAssets, totalDeductions, netZakatable, zakatRate, zakatPayable };
}
