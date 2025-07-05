export function getLastFriday(date: Date = new Date()): string {
  const day = date.getDay();
  // Friday is day 5. Calculate days to subtract to get to the most recent Friday
  // Sunday=0, Monday=1, Tuesday=2, Wednesday=3, Thursday=4, Friday=5, Saturday=6
  let daysToSubtract = 0;
  if (day === 5) {
    // If today is Friday, return today
    daysToSubtract = 0;
  } else if (day === 6) {
    // If today is Saturday, return yesterday (Friday)
    daysToSubtract = 1;
  } else if (day === 0) {
    // If today is Sunday, return 2 days ago (Friday)
    daysToSubtract = 2;
  } else {
    // For Monday-Thursday, find the previous Friday
    daysToSubtract = day + 2;
  }
  
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

export function generateDateColumns(existingDates: string[]): string[] {
  if (existingDates.length === 0) {
    // If no dates exist, return today's Friday
    const today = new Date();
    const targetDate = today.getDay() === 5 ? today : new Date(getLastFriday(today));
    return [targetDate.toISOString().split('T')[0]!];
  }
  
  // Start with all existing dates
  const allDates = [...existingDates];
  
  // Get the last date in the database
  const lastDate = existingDates[existingDates.length - 1];
  const lastDateObj = new Date(lastDate);
  
  // Get the current Friday (today if it's Friday, otherwise the most recent Friday)
  const today = new Date();
  const currentFriday = today.getDay() === 5 ? today : new Date(getLastFriday(today));
  
  // Add any missing Fridays between the last date and today
  if (lastDateObj < currentFriday) {
    const nextDay = new Date(lastDateObj);
    nextDay.setDate(nextDay.getDate() + 1);
    
    const missingFridays = getAllFridaysBetween(
      nextDay.toISOString().split('T')[0]!,
      currentFriday.toISOString().split('T')[0]!
    );
    
    allDates.push(...missingFridays);
  }
  
  return allDates;
}