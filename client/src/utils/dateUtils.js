/**
 * نام روزهای هفته به فارسی
 */
const weekDays = ['یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه', 'شنبه'];

/**
 * نام ماه‌های شمسی
 */
const persianMonths = [
  'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
  'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
];

/**
 * تبدیل اعداد فارسی به انگلیسی
 */
function persianToEnglish(str) {
  const persianDigits = '۰۱۲۳۴۵۶۷۸۹';
  return str.split('').map(ch => {
    const idx = persianDigits.indexOf(ch);
    return idx >= 0 ? String(idx) : ch;
  }).join('');
}

/**
 * تبدیل اعداد انگلیسی به فارسی
 */
function englishToPersian(str) {
  const englishDigits = '0123456789';
  const persianDigits = '۰۱۲۳۴۵۶۷۸۹';
  return str.split('').map(ch => {
    const idx = englishDigits.indexOf(ch);
    return idx >= 0 ? persianDigits[idx] : ch;
  }).join('');
}

/**
 * گرفتن روز هفته از تاریخ میلادی
 */
function getWeekDay(date) {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '';
  return weekDays[d.getDay()];
}

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
    
    return `${persianToEnglish(year)}/${persianToEnglish(month)}/${persianToEnglish(day)}`;
  } catch (err) {
    console.error('Error converting to Jalali:', err);
    return '-';
  }
}

/**
 * تبدیل تاریخ میلادی به شمسی با روز هفته
 * @param {Date|string} date - تاریخ میلادی
 * @returns {string} - فرمت: "سه‌شنبه ۱۴۰۴/۰۲/۲۵"
 */
export function toJalaliWithWeekDay(date) {
  if (!date) return '-';
  
  try {
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return '-';
    
    const weekDay = getWeekDay(d);
    const jalaliDate = toJalali(d);
    const persianDate = englishToPersian(jalaliDate);
    
    return `${weekDay} ${persianDate}`;
  } catch (err) {
    console.error('Error converting to Jalali with weekday:', err);
    return '-';
  }
}

/**
 * تبدیل تاریخ میلادی به فرمت کامل شمسی
 * @param {Date|string} date - تاریخ میلادی
 * @returns {string} - فرمت: "سه‌شنبه ۲۵ بهمن ۱۴۰۴"
 */
export function toFullPersianDate(date) {
  if (!date) return '-';
  
  try {
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return '-';
    
    const formatter = new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric'
    });
    
    const parts = formatter.formatToParts(d);
    const year = persianToEnglish(parts.find(p => p.type === 'year')?.value || '');
    const month = parseInt(persianToEnglish(parts.find(p => p.type === 'month')?.value || '1'));
    const day = persianToEnglish(parts.find(p => p.type === 'day')?.value || '');
    
    const weekDay = getWeekDay(d);
    const monthName = persianMonths[month - 1] || '';
    const persianYear = englishToPersian(year);
    const persianDay = englishToPersian(day);
    
    return `${weekDay} ${persianDay} ${monthName} ${persianYear}`;
  } catch (err) {
    console.error('Error converting to full Persian date:', err);
    return '-';
  }
}

/**
 * گرفتن روز هفته به فارسی
 * @param {Date|string} date - تاریخ
 * @returns {string} - نام روز هفته
 */
export function getPersianWeekDay(date) {
  return getWeekDay(date);
}

/**
 * فرمت‌بندی ساعت به فارسی
 * @param {string} time - ساعت (HH:MM)
 * @returns {string} - ساعت بهفارسی
 */
export function formatPersianTime(time) {
  if (!time) return '-';
  return englishToPersian(time);
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
 * گرفتن تاریخ شمسی امروز با روز هفته
 * @returns {string} - تاریخ امروز با روز هفته
 */
export function getCurrentJalaliWithWeekDay() {
  return toJalaliWithWeekDay(new Date());
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

/**
 * تبدیل تاریخ input به شمسی با روز هفته
 * @param {string} inputDate - تاریخ از input (YYYY-MM-DD)
 * @returns {string} - تاریخ شمسی با روز هفته
 */
export function inputToJalaliWithWeekDay(inputDate) {
  if (!inputDate) return '-';
  return toJalaliWithWeekDay(new Date(inputDate));
}

/**
 * بررسی اینکه آیا تاریخ آخر هفته است (جمعه)
 * @param {Date|string} date - تاریخ
 * @returns {boolean} - true اگر جمعه باشد
 */
export function isFriday(date) {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return false;
  return d.getDay() === 5; // Friday
}

/**
 * تشخیص روز کاری (شنبه تا چهارشنبه)
 * @param {Date|string} date - تاریخ
 * @returns {boolean} - true اگر روز کاری باشد
 */
export function isWorkDay(date) {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return false;
  const day = d.getDay();
  return day >= 6 || day <= 3; // Saturday to Wednesday
}

/**
 * فرمت کامل برای نمایش تاریخ دفاع
 * @param {Date|string} date - تاریخ دفاع
 * @param {string} time - ساعت دفاع
 * @returns {string} - "سه‌شنبه تاریخ ۱۴۰۴/۰۲/۲۵ ساعت ۱۰:۳۰ تاریخ دفاع شماست"
 */
export function formatDefenseDate(date, time = '') {
  if (!date) return '-';
  
  const weekDayAndDate = toJalaliWithWeekDay(date);
  const persianTime = time ? formatPersianTime(time) : '';
  
  if (persianTime) {
    return `${weekDayAndDate} ساعت ${persianTime} تاریخ دفاع شماست`;
  } else {
    return `${weekDayAndDate} تاریخ دفاع شماست`;
  }
}
