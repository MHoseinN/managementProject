import { useRouter } from 'vue-router';

/**
 * Hook برای مدیریت بازگشت به صفحه قبل یا home
 */
export function useNavigation() {
  const router = useRouter();
  
  const goBack = () => {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push('/');
    }
  };

  return { goBack };
}

/**
 * Hook برای دریافت سال جاری شمسی
 */
export function useJalaliYear() {
  const getJalaliYear = () => {
    try {
      const yFa = new Intl.DateTimeFormat('fa-IR-u-ca-persian', { year: 'numeric' }).format(new Date());
      const faDigits = '۰۱۲۳۴۵۶۷۸۹';
      const en = yFa
        .split('')
        .map(ch => {
          const idx = faDigits.indexOf(ch);
          return idx >= 0 ? String(idx) : ch;
        })
        .join('');
      return parseInt(en, 10) || 1400;
    } catch {
      return 1404;
    }
  };

  return { getJalaliYear };
}

/**
 * Hook برای دریافت برچسب وضعیت پروژه
 */
export function useProjectStatus() {
  const getStatusText = (status) => {
    const statusMap = {
      pending: 'در انتظار تایید',
      active: 'فعال',
      topic_submitted: 'موضوع ارسال شده - منتظر تایید استاد راهنما',
      topic_approved: 'موضوع تایید شده',
      scheduled: 'زمان‌بندی دفاع',
      defended: 'دفاع شده',
      graded: 'نمره‌گذاری شده'
    };
    return statusMap[status] || status;
  };

  return { getStatusText };
}

/**
 * Hook برای مدیریت برچسب ترم
 */
export function useTermLabel() {
  const termLabel = (term) => {
    if (!term) return '-';
    const [y, h] = String(term).split('-');
    return `${h === '2' ? 'بهمن' : 'مهر'} ${y}`;
  };

  const termString = (yearVal, half) => {
    if (!yearVal) return '';
    return `${yearVal}-${half}`;
  };

  return { termLabel, termString };
}
