/**
 * Convert Gregorian date to Jalali (Persian) date string
 * @param {Date|string} date - Date object or ISO string
 * @returns {string} - Formatted Jalali date (YYYY/MM/DD)
 */
export function toJalali(date) {
  if (!date) return '-';
  
  try {
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return '-';
    
    const formatter = new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    
    const parts = formatter.formatToParts(d);
    const year = parts.find(p => p.type === 'year')?.value || '';
    const month = parts.find(p => p.type === 'month')?.value || '';
    const day = parts.find(p => p.type === 'day')?.value || '';
    
    // Convert Persian digits to English
    const toEnglish = (str) => {
      const persianDigits = '۰۱۲۳۴۵۶۷۸۹';
      return str.split('').map(ch => {
        const idx = persianDigits.indexOf(ch);
        return idx >= 0 ? String(idx) : ch;
      }).join('');
    };
    
    return `${toEnglish(year)}/${toEnglish(month)}/${toEnglish(day)}`;
  } catch (err) {
    console.error('Error converting to Jalali:', err);
    return '-';
  }
}

/**
 * Convert Jalali date string to Date object
 * @param {string} jalaliDate - Jalali date string (YYYY/MM/DD or YYYY-MM-DD)
 * @returns {Date|null} - Date object or null
 */
export function fromJalali(jalaliDate) {
  if (!jalaliDate) return null;
  
  try {
    // Parse Jalali date
    const parts = jalaliDate.split(/[-\/]/).map(p => parseInt(p, 10));
    if (parts.length !== 3) return null;
    
    const [jy, jm, jd] = parts;
    
    // Simple Jalali to Gregorian conversion (approximate)
    // For production, use a proper library like moment-jalaali
    const gy = jy + 621;
    const gm = jm;
    const gd = jd;
    
    return new Date(gy, gm - 1, gd);
  } catch (err) {
    console.error('Error converting from Jalali:', err);
    return null;
  }
}

/**
 * Get current Jalali date
 * @returns {string} - Current Jalali date (YYYY/MM/DD)
 */
export function getCurrentJalali() {
  return toJalali(new Date());
}

/**
 * Format date for input type="date" (requires YYYY-MM-DD)
 * @param {string} jalaliDate - Jalali date string
 * @returns {string} - Gregorian date in YYYY-MM-DD format
 */
export function jalaliToInputFormat(jalaliDate) {
  const date = fromJalali(jalaliDate);
  if (!date) return '';
  
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

/**
 * Format Gregorian date from input to Jalali display
 * @param {string} inputDate - Date from input (YYYY-MM-DD)
 * @returns {string} - Jalali date string
 */
export function inputToJalali(inputDate) {
  if (!inputDate) return '-';
  return toJalali(new Date(inputDate));
}
