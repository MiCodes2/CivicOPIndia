export const DEFAULT_ACTIVITY_TYPES = Object.freeze([
  'Drive',
  'Meetings',
  'Campaigns',
  'Protests',
  'Plantation',
  'News',
  'Other',
]);

export function mergeActivityTypes(types: string[] | undefined | null): string[] {
  const merged = new Set<string>([
    ...(Array.isArray(types) ? types : []),
    ...DEFAULT_ACTIVITY_TYPES,
  ]);
  return Array.from(merged).sort((a, b) => a.localeCompare(b));
}
