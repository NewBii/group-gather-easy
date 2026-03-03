export const generateBookingUrl = (
  location: string,
  checkIn: string,
  checkOut: string,
  adults: number = 10,
  children: number = 0
): string => {
  const baseUrl = 'https://www.booking.com/searchresults.html';
  const params = new URLSearchParams({
    ss: location,
    checkin: checkIn,
    checkout: checkOut,
    group_adults: adults.toString(),
    group_children: children.toString(),
    no_rooms: Math.ceil((adults + children) / 4).toString(),
  });
  return `${baseUrl}?${params.toString()}`;
};

export const generateAirbnbUrl = (
  location: string,
  checkIn: string,
  checkOut: string,
  adults: number = 10,
  children: number = 0
): string => {
  const baseUrl = 'https://www.airbnb.com/s/' + encodeURIComponent(location) + '/homes';
  const params = new URLSearchParams({
    checkin: checkIn,
    checkout: checkOut,
    adults: adults.toString(),
    children: children.toString(),
  });
  return `${baseUrl}?${params.toString()}`;
};

/**
 * Derive a weekend check-in (Friday) and check-out (Sunday) from a date string.
 * If the date is already a Friday, use it as check-in. Otherwise, find the nearest Friday before it.
 */
export const deriveWeekendDates = (dateStr: string): { checkIn: string; checkOut: string } => {
  const date = new Date(dateStr);
  const day = date.getDay(); // 0=Sun, 5=Fri
  // Find Friday on or before the date
  const fridayOffset = day >= 5 ? day - 5 : day + 2; // days to subtract to reach Friday
  const friday = new Date(date);
  friday.setDate(date.getDate() - fridayOffset);
  const sunday = new Date(friday);
  sunday.setDate(friday.getDate() + 2);

  const fmt = (d: Date) => d.toISOString().split('T')[0];
  return { checkIn: fmt(friday), checkOut: fmt(sunday) };
};
