/**
 * Formatting utilities for dates, numbers, and text
 */

// Format date
export const formatDate = (date, format = 'MMM dd, yyyy') => {
  if (!date) return '';
  
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthsFull = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  
  const year = d.getFullYear();
  const month = d.getMonth();
  const day = d.getDate();
  const hours = d.getHours();
  const minutes = d.getMinutes();
  const seconds = d.getSeconds();

  const replacements = {
    'yyyy': year,
    'yy': String(year).slice(-2),
    'MMMM': monthsFull[month],
    'MMM': months[month],
    'MM': String(month + 1).padStart(2, '0'),
    'M': month + 1,
    'dd': String(day).padStart(2, '0'),
    'd': day,
    'HH': String(hours).padStart(2, '0'),
    'H': hours,
    'hh': String(hours % 12 || 12).padStart(2, '0'),
    'h': hours % 12 || 12,
    'mm': String(minutes).padStart(2, '0'),
    'm': minutes,
    'ss': String(seconds).padStart(2, '0'),
    's': seconds,
    'a': hours >= 12 ? 'pm' : 'am',
    'A': hours >= 12 ? 'PM' : 'AM',
  };

  let formatted = format;
  for (const [key, value] of Object.entries(replacements)) {
    formatted = formatted.replace(new RegExp(key, 'g'), value);
  }

  return formatted;
};

// Format relative time (e.g., "2 hours ago")
export const formatRelativeTime = (date) => {
  if (!date) return '';
  
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';

  const now = new Date();
  const diff = now - d;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);

  if (seconds < 60) return 'just now';
  if (minutes < 60) return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
  if (hours < 24) return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
  if (days < 7) return `${days} ${days === 1 ? 'day' : 'days'} ago`;
  if (weeks < 4) return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
  if (months < 12) return `${months} ${months === 1 ? 'month' : 'months'} ago`;
  return `${years} ${years === 1 ? 'year' : 'years'} ago`;
};

// Format number with commas
export const formatNumber = (num) => {
  if (num === null || num === undefined) return '';
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

// Format currency
export const formatCurrency = (amount, currency = 'USD') => {
  if (amount === null || amount === undefined) return '';
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
};

// Format percentage
export const formatPercentage = (value, decimals = 0) => {
  if (value === null || value === undefined) return '';
  return `${Number(value).toFixed(decimals)}%`;
};

// Format reading progress
export const formatProgress = (current, total) => {
  if (!total || total === 0) return '0%';
  const percentage = Math.round((current / total) * 100);
  return `${percentage}%`;
};

// Format page progress (e.g., "25 / 350 pages")
export const formatPageProgress = (current, total) => {
  if (!total) return `${current || 0} pages`;
  return `${current || 0} / ${total} pages`;
};

// Format reading time (minutes to hours and minutes)
export const formatReadingTime = (minutes) => {
  if (!minutes) return '0 min';
  
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (hours === 0) return `${mins} min`;
  if (mins === 0) return `${hours} ${hours === 1 ? 'hour' : 'hours'}`;
  return `${hours}h ${mins}min`;
};

// Format book rating (e.g., 4.5 stars)
export const formatRating = (rating, maxRating = 5) => {
  if (!rating) return 'Not rated';
  return `${Number(rating).toFixed(1)} / ${maxRating}`;
};

// Format author names (array to string)
export const formatAuthors = (authors) => {
  if (!authors || authors.length === 0) return 'Unknown Author';
  if (authors.length === 1) return authors[0];
  if (authors.length === 2) return authors.join(' and ');
  return `${authors.slice(0, -1).join(', ')}, and ${authors[authors.length - 1]}`;
};

// Format ISBN (add hyphens)
export const formatISBN = (isbn) => {
  if (!isbn) return '';
  
  // Remove all non-digit characters
  const digits = isbn.replace(/\D/g, '');
  
  // ISBN-10: XXX-X-XXXXX-XXX-X
  if (digits.length === 10) {
    return `${digits.slice(0, 1)}-${digits.slice(1, 6)}-${digits.slice(6, 9)}-${digits.slice(9)}`;
  }
  
  // ISBN-13: XXX-X-XX-XXXXXX-X
  if (digits.length === 13) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 12)}-${digits.slice(12)}`;
  }
  
  return isbn;
};

// Format text to title case
export const toTitleCase = (str) => {
  if (!str) return '';
  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

// Format book status
export const formatBookStatus = (status) => {
  const statusMap = {
    'WANT_TO_READ': 'Want to Read',
    'CURRENTLY_READING': 'Currently Reading',
    'FINISHED': 'Finished',
    'DNF': 'Did Not Finish',
  };
  return statusMap[status] || status;
};

// Format role
export const formatRole = (role) => {
  const roleMap = {
    'ADMIN': 'Admin',
    'MODERATOR': 'Moderator',
    'MEMBER': 'Member',
  };
  return roleMap[role] || role;
};
