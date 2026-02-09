<template>
  <div class="persian-date-picker relative">
    <!-- Hidden native date input for v-model binding -->
    <input
      type="date"
      :value="modelValue"
      @input="$emit('update:modelValue', $event.target.value)"
      :min="min"
      class="absolute opacity-0 pointer-events-none"
      ref="hiddenInput"
    />
    
    <!-- Custom Persian display -->
    <div 
      @click="toggleCalendar"
      class="custom-date-display cursor-pointer w-full bg-card-bg border-2 border-border-color px-3 py-2 rounded-lg hover:border-primary focus:border-primary focus:outline-none transition-all"
      :class="{ 
        'border-primary ring-2 ring-primary/20': showCalendar,
        'border-green-400': modelValue && isWorkDay(modelValue)
      }"
    >
      <div class="flex items-center justify-between gap-2">
        <div class="flex-1">
          <span v-if="modelValue" class="text-sm font-medium">
            {{ displayDate }}
          </span>
          <span v-else class="text-sm text-gray-400">
            یک تاریخ انتخاب کنید (تقویم شمسی)
          </span>
        </div>
        <div class="text-primary">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
      </div>
    </div>

    <!-- Calendar Popup -->
    <div v-if="showCalendar" class="calendar-popup absolute top-full left-0 mt-2 bg-card-bg border-2 border-primary rounded-lg shadow-2xl z-50 w-80 p-4">
      <!-- Header with month navigation -->
      <div class="calendar-header flex items-center justify-between mb-4">
        <button @click.stop="prevMonth" class="nav-button px-3 py-1 rounded hover:bg-primary/10 transition-colors">
          ‹
        </button>
        <div class="text-center font-bold text-primary">
          <div>{{ currentMonthName }}</div>
          <div class="text-sm">{{ currentYear }}</div>
        </div>
        <button @click.stop="nextMonth" class="nav-button px-3 py-1 rounded hover:bg-primary/10 transition-colors">
          ›
        </button>
      </div>

      <!-- Weekday headers -->
      <div class="calendar-grid grid grid-cols-7 gap-1 mb-2">
        <div v-for="day in weekDays" :key="day" class="text-center text-xs font-bold text-gray-500 py-1">
          {{ day }}
        </div>
      </div>

      <!-- Calendar days -->
      <div class="calendar-grid grid grid-cols-7 gap-1">
        <div
          v-for="(day, index) in calendarDays"
          :key="index"
          @click.stop="selectDate(day)"
          class="calendar-day text-center p-2 rounded cursor-pointer transition-all text-sm"
          :class="{
            'invisible': !day.day,
            'bg-primary text-white font-bold': day.isSelected,
            'bg-green-50 dark:bg-green-900/20 border border-green-400 hover:bg-green-100 dark:hover:bg-green-800/30': day.day && !day.isSelected && day.isWorkDay,
            'bg-red-50 dark:bg-red-900/20 border border-red-300 text-red-600 hover:bg-red-100 dark:hover:bg-red-800/30': day.day && !day.isSelected && !day.isWorkDay,
            'opacity-40': day.isPast,
            'font-bold ring-2 ring-blue-400': day.isToday
          }"
        >
          {{ day.day }}
        </div>
      </div>

      <!-- Footer info -->
      <div class="mt-3 pt-3 border-t border-border-color text-xs text-gray-500 space-y-1">
        <div class="flex items-center gap-2">
          <div class="w-4 h-4 bg-green-50 dark:bg-green-900/20 border border-green-400 rounded"></div>
          <span>روزهای کاری (شنبه تا چهارشنبه)</span>
        </div>
        <div class="flex items-center gap-2">
          <div class="w-4 h-4 bg-red-50 dark:bg-red-900/20 border border-red-300 rounded"></div>
          <span>جمعه (تعطیل)</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue';
import { inputToJalaliWithWeekDay, isWorkDay } from '../utils/dateUtils.js';

const props = defineProps({
  modelValue: String,
  min: String
});

const emit = defineEmits(['update:modelValue']);

const showCalendar = ref(false);

// Initialize to current Persian date
const today = new Date();
const todayPersian = today.toLocaleDateString('fa-IR-u-ca-persian', {
  year: 'numeric',
  month: 'numeric'
});

const persianToEnglishSimple = (str) => {
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  let result = str;
  for (let i = 0; i < 10; i++) {
    result = result.replace(new RegExp(persianDigits[i], 'g'), i.toString());
  }
  return result;
};

const currentPersianParts = persianToEnglishSimple(todayPersian).split('/');
const currentYear = ref(parseInt(currentPersianParts[0]) || 1404);
const currentMonth = ref(parseInt(currentPersianParts[1]) || 2);
const hiddenInput = ref(null);

// Helper function to convert Persian digits to English
const persianToEnglish = (str) => {
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  let result = str;
  for (let i = 0; i < 10; i++) {
    result = result.replace(new RegExp(persianDigits[i], 'g'), i.toString());
    result = result.replace(new RegExp(arabicDigits[i], 'g'), i.toString());
  }
  return result;
};

// Persian month names
const monthNames = [
  'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
  'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
];

// Persian weekday names (starting from Saturday)
const weekDays = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'];

const displayDate = computed(() => {
  if (!props.modelValue) return '';
  return inputToJalaliWithWeekDay(props.modelValue);
});

const currentMonthName = computed(() => monthNames[currentMonth.value - 1]);

const toggleCalendar = () => {
  showCalendar.value = !showCalendar.value;
  if (showCalendar.value && props.modelValue) {
    // Set calendar to selected date's month
    const date = new Date(props.modelValue);
    const persianDateStr = date.toLocaleDateString('fa-IR-u-ca-persian', { 
      year: 'numeric', 
      month: 'numeric'
    });
    const englishDateStr = persianToEnglish(persianDateStr);
    const persianDate = englishDateStr.split('/');
    currentYear.value = parseInt(persianDate[0]);
    currentMonth.value = parseInt(persianDate[1]);
  } else if (showCalendar.value) {
    // Set to current Persian date
    const today = new Date();
    const persianDateStr = today.toLocaleDateString('fa-IR-u-ca-persian', { 
      year: 'numeric', 
      month: 'numeric'
    });
    const englishDateStr = persianToEnglish(persianDateStr);
    const persianDate = englishDateStr.split('/');
    currentYear.value = parseInt(persianDate[0]);
    currentMonth.value = parseInt(persianDate[1]);
  }
};

const prevMonth = () => {
  if (currentMonth.value === 1) {
    currentMonth.value = 12;
    currentYear.value--;
  } else {
    currentMonth.value--;
  }
};

const nextMonth = () => {
  if (currentMonth.value === 12) {
    currentMonth.value = 1;
    currentYear.value++;
  } else {
    currentMonth.value++;
  }
};

const calendarDays = computed(() => {
  const days = [];
  
  try {
    // Start from today and search backwards/forwards for the first day of the target month
    const today = new Date();
    let gregorianFirst = null;
    
    // Search up to 400 days in the past and future (covers more than a year)
    for (let offset = -400; offset <= 400; offset++) {
      const testDate = new Date(today);
      testDate.setDate(today.getDate() + offset);
      
      try {
        const persianDateStr = testDate.toLocaleDateString('fa-IR-u-ca-persian', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        });
        
        const englishDateStr = persianToEnglish(persianDateStr);
        const persianParts = englishDateStr.split('/');
        
        const persianYear = parseInt(persianParts[0]);
        const persianMonth = parseInt(persianParts[1]);
        const persianDay = parseInt(persianParts[2]);
        
        if (persianYear === currentYear.value && 
            persianMonth === currentMonth.value && 
            persianDay === 1) {
          gregorianFirst = new Date(testDate);
          break;
        }
      } catch (e) {
        continue;
      }
    }
    
    if (!gregorianFirst) {
      console.error('Could not find first day of Persian month', currentYear.value, currentMonth.value);
      // Fallback: show empty calendar
      return days;
    }
    
    // Get starting weekday (0 = Saturday in Persian calendar)
    const startWeekday = (gregorianFirst.getDay() + 1) % 7;
    
    // Days in current Persian month
    let daysInMonth = 31;
    if (currentMonth.value >= 1 && currentMonth.value <= 6) {
      daysInMonth = 31;
    } else if (currentMonth.value >= 7 && currentMonth.value <= 11) {
      daysInMonth = 30;
    } else {
      // Check if leap year for Esfand
      const isLeap = ((currentYear.value - 474) % 128) % 33 < 29 && 
                      ((currentYear.value - 474) % 128) % 33 % 4 === 0;
      daysInMonth = isLeap ? 30 : 29;
    }
    
    // Empty cells before first day
    for (let i = 0; i < startWeekday; i++) {
      days.push({ day: null });
    }
    
    // Actual days
    const todayStr = today.toLocaleDateString('fa-IR-u-ca-persian');
    const minDate = props.min ? new Date(props.min) : null;
    
    for (let day = 1; day <= daysInMonth; day++) {
      const currentDate = new Date(gregorianFirst);
      currentDate.setDate(gregorianFirst.getDate() + day - 1);
      
      // Safety check
      if (isNaN(currentDate.getTime())) {
        console.error('Invalid date generated for day', day);
        continue;
      }
      
      try {
        const dateStr = currentDate.toISOString().split('T')[0];
        const persianStr = currentDate.toLocaleDateString('fa-IR-u-ca-persian');
        
        days.push({
          day,
          date: currentDate,
          dateStr,
          isSelected: dateStr === props.modelValue,
          isToday: persianStr === todayStr,
          isPast: minDate && currentDate < minDate,
          isWorkDay: isWorkDay(currentDate)
        });
      } catch (e) {
        console.error('Error processing day', day, e);
        continue;
      }
    }
  } catch (error) {
    console.error('Error generating calendar days:', error);
  }
  
  return days;
});


const selectDate = (day) => {
  if (!day.day || day.isPast) return;
  emit('update:modelValue', day.dateStr);
  showCalendar.value = false;
};

// Close calendar when clicking outside
const handleClickOutside = (event) => {
  const picker = event.target.closest('.persian-date-picker');
  if (!picker && showCalendar.value) {
    showCalendar.value = false;
  }
};

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>

<style scoped>
.persian-date-picker {
  position: relative;
  width: 100%;
}
</style>

