import { isThisWeek, isToday, isYesterday } from 'date-fns';

export type TimeGroup = 'today' | 'yesterday' | 'thisWeek' | 'earlier';

const GROUP_ORDER: readonly TimeGroup[] = [
  'today',
  'yesterday',
  'thisWeek',
  'earlier',
];

export function getTimeGroup(date: Date): TimeGroup {
  if (isToday(date)) return 'today';
  if (isYesterday(date)) return 'yesterday';
  if (isThisWeek(date, { weekStartsOn: 1 })) return 'thisWeek';
  return 'earlier';
}

export function groupByTime<T>(
  items: readonly T[],
  getDate: (item: T) => Date
): { group: TimeGroup; items: T[] }[] {
  const groups = new Map<TimeGroup, T[]>();

  for (const item of items) {
    const group = getTimeGroup(getDate(item));
    const list = groups.get(group);
    if (list) {
      list.push(item);
    } else {
      groups.set(group, [item]);
    }
  }

  return GROUP_ORDER.filter(g => groups.has(g)).map(g => ({
    group: g,
    items: groups.get(g)!,
  }));
}
