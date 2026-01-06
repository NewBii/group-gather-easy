// French Public Holidays (Jours Fériés) Calculator
// Handles fixed and variable holidays including Easter-based calculations

interface Holiday {
  date: Date;
  name: string;
  nameFr: string;
}

// Calculate Easter Sunday using the Anonymous Gregorian algorithm
function calculateEaster(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  
  return new Date(year, month - 1, day);
}

// Add days to a date
function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

// Get all French public holidays for a given year
export function getFrenchHolidays(year: number): Holiday[] {
  const easter = calculateEaster(year);
  
  const holidays: Holiday[] = [
    // Fixed holidays
    { date: new Date(year, 0, 1), name: "New Year's Day", nameFr: "Jour de l'an" },
    { date: new Date(year, 4, 1), name: "Labour Day", nameFr: "Fête du Travail" },
    { date: new Date(year, 4, 8), name: "Victory in Europe Day", nameFr: "Victoire 1945" },
    { date: new Date(year, 6, 14), name: "Bastille Day", nameFr: "Fête nationale" },
    { date: new Date(year, 7, 15), name: "Assumption of Mary", nameFr: "Assomption" },
    { date: new Date(year, 10, 1), name: "All Saints' Day", nameFr: "Toussaint" },
    { date: new Date(year, 10, 11), name: "Armistice Day", nameFr: "Armistice 1918" },
    { date: new Date(year, 11, 25), name: "Christmas Day", nameFr: "Noël" },
    
    // Variable holidays (Easter-based)
    { date: addDays(easter, 1), name: "Easter Monday", nameFr: "Lundi de Pâques" },
    { date: addDays(easter, 39), name: "Ascension Day", nameFr: "Ascension" },
    { date: addDays(easter, 50), name: "Whit Monday", nameFr: "Lundi de Pentecôte" },
  ];
  
  return holidays.sort((a, b) => a.date.getTime() - b.date.getTime());
}

// Check if a date is a French public holiday
export function isHoliday(date: Date): Holiday | null {
  const holidays = getFrenchHolidays(date.getFullYear());
  
  for (const holiday of holidays) {
    if (
      holiday.date.getFullYear() === date.getFullYear() &&
      holiday.date.getMonth() === date.getMonth() &&
      holiday.date.getDate() === date.getDate()
    ) {
      return holiday;
    }
  }
  
  return null;
}

// Check if a weekend (Saturday-Sunday) is a long weekend due to adjacent holiday
export function isLongWeekend(saturdayDate: Date): { isLong: boolean; holiday: Holiday | null } {
  // Ensure we're working with a Saturday
  const saturday = new Date(saturdayDate);
  if (saturday.getDay() !== 6) {
    // Adjust to the Saturday of this week
    saturday.setDate(saturday.getDate() - saturday.getDay() + 6);
  }
  
  const sunday = addDays(saturday, 1);
  const friday = addDays(saturday, -1);
  const monday = addDays(saturday, 2);
  
  // Check if Friday before or Monday after is a holiday
  const fridayHoliday = isHoliday(friday);
  const mondayHoliday = isHoliday(monday);
  const saturdayHoliday = isHoliday(saturday);
  const sundayHoliday = isHoliday(sunday);
  
  if (fridayHoliday) {
    return { isLong: true, holiday: fridayHoliday };
  }
  if (mondayHoliday) {
    return { isLong: true, holiday: mondayHoliday };
  }
  if (saturdayHoliday) {
    return { isLong: true, holiday: saturdayHoliday };
  }
  if (sundayHoliday) {
    return { isLong: true, holiday: sundayHoliday };
  }
  
  return { isLong: false, holiday: null };
}

// Parse season/period mentions into date ranges
export function parseSeasonToDateRange(text: string, referenceYear?: number): { start: Date; end: Date } | null {
  const year = referenceYear || new Date().getFullYear();
  const lowerText = text.toLowerCase();
  
  // Season mappings (Northern Hemisphere, France)
  const seasons: Record<string, { start: [number, number]; end: [number, number] }> = {
    // English
    'spring': { start: [2, 21], end: [5, 20] }, // March 21 - June 20
    'summer': { start: [5, 21], end: [8, 22] }, // June 21 - Sept 22
    'autumn': { start: [8, 23], end: [11, 20] }, // Sept 23 - Dec 20
    'fall': { start: [8, 23], end: [11, 20] },
    'winter': { start: [11, 21], end: [2, 20] }, // Dec 21 - March 20
    // French
    'printemps': { start: [2, 21], end: [5, 20] },
    'été': { start: [5, 21], end: [8, 22] },
    'ete': { start: [5, 21], end: [8, 22] },
    'automne': { start: [8, 23], end: [11, 20] },
    'hiver': { start: [11, 21], end: [2, 20] },
  };
  
  // Month mappings
  const months: Record<string, number> = {
    'january': 0, 'janvier': 0, 'jan': 0,
    'february': 1, 'février': 1, 'fevrier': 1, 'feb': 1, 'fév': 1,
    'march': 2, 'mars': 2, 'mar': 2,
    'april': 3, 'avril': 3, 'apr': 3, 'avr': 3,
    'may': 4, 'mai': 4,
    'june': 5, 'juin': 5, 'jun': 5,
    'july': 6, 'juillet': 6, 'jul': 6,
    'august': 7, 'août': 7, 'aout': 7, 'aug': 7,
    'september': 8, 'septembre': 8, 'sept': 8, 'sep': 8,
    'october': 9, 'octobre': 9, 'oct': 9,
    'november': 10, 'novembre': 10, 'nov': 10,
    'december': 11, 'décembre': 11, 'decembre': 11, 'dec': 11, 'déc': 11,
  };
  
  // Check for season mentions
  for (const [season, range] of Object.entries(seasons)) {
    if (lowerText.includes(season)) {
      let startYear = year;
      let endYear = year;
      
      // Handle winter spanning two years
      if (season === 'winter' || season === 'hiver') {
        if (new Date().getMonth() < 3) {
          startYear = year - 1;
        } else {
          endYear = year + 1;
        }
      }
      
      return {
        start: new Date(startYear, range.start[0], range.start[1]),
        end: new Date(endYear, range.end[0], range.end[1]),
      };
    }
  }
  
  // Check for month mentions
  for (const [monthName, monthIndex] of Object.entries(months)) {
    if (lowerText.includes(monthName)) {
      const targetYear = monthIndex < new Date().getMonth() ? year + 1 : year;
      return {
        start: new Date(targetYear, monthIndex, 1),
        end: new Date(targetYear, monthIndex + 1, 0), // Last day of month
      };
    }
  }
  
  return null;
}

// Get the best weekend dates within a date range, prioritizing long weekends
export function getBestWeekends(
  startDate: Date,
  endDate: Date,
  count: number = 3
): { date: Date; isLongWeekend: boolean; holidayName: string | null; holidayNameFr: string | null }[] {
  const weekends: { 
    date: Date; 
    isLongWeekend: boolean; 
    holidayName: string | null;
    holidayNameFr: string | null;
    score: number 
  }[] = [];
  
  const current = new Date(startDate);
  
  // Move to first Saturday
  while (current.getDay() !== 6) {
    current.setDate(current.getDate() + 1);
  }
  
  // Collect all weekends in range
  while (current <= endDate) {
    const longWeekendInfo = isLongWeekend(current);
    weekends.push({
      date: new Date(current),
      isLongWeekend: longWeekendInfo.isLong,
      holidayName: longWeekendInfo.holiday?.name || null,
      holidayNameFr: longWeekendInfo.holiday?.nameFr || null,
      // Score: long weekends get priority, then prefer dates further from now for more planning time
      score: longWeekendInfo.isLong ? 1000 + current.getTime() : current.getTime(),
    });
    
    // Move to next Saturday
    current.setDate(current.getDate() + 7);
  }
  
  // Sort by score (long weekends first, then by date)
  weekends.sort((a, b) => b.score - a.score);
  
  // Take top N, but ensure variety - don't cluster all picks together
  const selected: typeof weekends = [];
  const minDaysBetween = 14; // At least 2 weeks between picks
  
  for (const weekend of weekends) {
    if (selected.length >= count) break;
    
    const tooClose = selected.some(
      s => Math.abs(s.date.getTime() - weekend.date.getTime()) < minDaysBetween * 24 * 60 * 60 * 1000
    );
    
    if (!tooClose) {
      selected.push(weekend);
    }
  }
  
  // If we don't have enough, add more without the spacing constraint
  if (selected.length < count) {
    for (const weekend of weekends) {
      if (selected.length >= count) break;
      if (!selected.includes(weekend)) {
        selected.push(weekend);
      }
    }
  }
  
  // Sort selected by date for presentation
  selected.sort((a, b) => a.date.getTime() - b.date.getTime());
  
  return selected.map(w => ({
    date: w.date,
    isLongWeekend: w.isLongWeekend,
    holidayName: w.holidayName,
    holidayNameFr: w.holidayNameFr,
  }));
}

// Format date as ISO string (YYYY-MM-DD)
export function formatDateISO(date: Date): string {
  return date.toISOString().split('T')[0];
}
