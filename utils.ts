export function getLastFriday(date: Date = new Date()): string {
  const day = date.getDay();
  // Friday is day 5. Calculate days to subtract to get to the most recent Friday
  const daysToSubtract = day >= 5 ? day - 5 : day + 2;
  const friday = new Date(date);
  friday.setDate(date.getDate() - daysToSubtract);
  return friday.toISOString().split('T')[0]!;
}

export function getAllFridaysBetween(startDate: string, endDate: string): string[] {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const fridays: string[] = [];
  
  let current = new Date(start);
  while (current <= end) {
    const dayOfWeek = current.getDay();
    if (dayOfWeek === 5) {
      fridays.push(current.toISOString().split('T')[0]!);
    }
    current.setDate(current.getDate() + 1);
  }
  
  return fridays;
}

export function generateDateColumns(firstEntryDate: string | null): string[] {
  const today = new Date();
  const targetDate = today.getDay() === 5 ? today : new Date(getLastFriday(today));
  
  if (!firstEntryDate) {
    return [targetDate.toISOString().split('T')[0]!];
  }
  
  const allFridays = getAllFridaysBetween(firstEntryDate, targetDate.toISOString().split('T')[0]!);
  return allFridays.length > 0 ? allFridays : [targetDate.toISOString().split('T')[0]!];
}