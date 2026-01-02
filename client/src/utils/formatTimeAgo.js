// src/utils/formatTimeAgo.js
import { format, formatDistanceToNowStrict } from 'date-fns';

export function formatTimeAgo(dateString) {
  const date = new Date(dateString);
  const now = new Date();

  if (isNaN(date)) return 'Invalid date';

  const secondsDiff = Math.floor((now - date) / 1000);
  const minutesDiff = Math.floor(secondsDiff / 60);
  const hoursDiff = Math.floor(minutesDiff / 60);
  const daysDiff = Math.floor(hoursDiff / 24);

  // Less than 1 minute → "Just now"
  if (minutesDiff < 1) {
    return 'Just now';
  }

  // 1+ days ago → show calendar date
  if (daysDiff >= 1) {
    return format(date, 'MMM d'); // e.g., "Dec 15"
  }

  // Build relative string manually 
  let timeText = '';

  if (hoursDiff > 0) {
    // Hours
    if (hoursDiff === 1) {
      timeText = '1hr';
    } else {
      timeText = `${hoursDiff}hrs`;
    }
  } else {
    // Minutes
    if (minutesDiff === 1) {
      timeText = '1m';
    } else {
      timeText = `${minutesDiff}m`;
    }
  }

  return `Sent ${timeText} ago`;
}

export function formatDateTime(dateString) {
  const date = new Date(dateString);
  if (isNaN(date)) return 'Invalid date';
  return format(date, 'EEE, MMMM d p');
}

// Compact separator time for middle timestamps (e.g., "Mon 3:40 PM")
export function formatSeparator(dateString) {
  const date = new Date(dateString);
  if (isNaN(date)) return '';
  return format(date, 'EEE p');
}