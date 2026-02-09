<template>
  <div class="min-h-screen bg-dark-bg px-4 py-8">
    <div class="max-w-4xl mx-auto">
      <h1 class="text-3xl font-bold text-primary mb-6">تست نمایش تاریخ‌های شمسی</h1>
      
      <div class="grid gap-6">
        <!-- تاریخ امروز -->
        <div class="card">
          <h2 class="text-xl font-bold mb-4 text-light-green">تاریخ امروز</h2>
          <div class="space-y-2">
            <p><strong>تاریخ ساده:</strong> {{ toJalali(today) }}</p>
            <p><strong>تاریخ با روز هفته:</strong> {{ toJalaliWithWeekDay(today) }}</p>
            <p><strong>تاریخ کامل فارسی:</strong> {{ toFullPersianDate(today) }}</p>
            <p><strong>روز هفته:</strong> {{ getPersianWeekDay(today) }}</p>
          </div>
        </div>

        <!-- تست تاریخ‌های مختلف -->
        <div class="card">
          <h2 class="text-xl font-bold mb-4 text-light-green">نمونه تاریخ‌های مختلف</h2>
          <div class="space-y-4">
            <div v-for="(date, index) in sampleDates" :key="index" class="border-b border-gray-600 pb-2">
              <p class="text-sm text-gray-400">{{ date.toISOString().split('T')[0] }} (میلادی)</p>
              <p class="font-bold text-warning">{{ formatDefenseDate(date, '10:30') }}</p>
              <p class="text-xs" :class="isWorkDay(date) ? 'text-green-400' : 'text-orange-400'">
                {{ isWorkDay(date) ? '✅ روز کاری' : '⚠️ روز غیرکاری' }}
                {{ isFriday(date) ? '(جمعه)' : '' }}
              </p>
            </div>
          </div>
        </div>

        <!-- انتخاب تاریخ -->
        <div class="card">
          <h2 class="text-xl font-bold mb-4 text-light-green">انتخاب تاریخ دستی</h2>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-bold mb-2">انتخاب تاریخ:</label>
              <input 
                type="date" 
                v-model="selectedDate"
                class="w-full bg-card-bg border border-border-color px-3 py-2 rounded"
              >
            </div>
            <div v-if="selectedDate" class="bg-blue-900/30 p-4 rounded border border-blue-500">
              <h3 class="font-bold mb-2">تاریخ انتخاب شده:</h3>
              <p><strong>شمسی ساده:</strong> {{ inputToJalali(selectedDate) }}</p>
              <p><strong>شمسی با روز هفته:</strong> {{ inputToJalaliWithWeekDay(selectedDate) }}</p>
              <p><strong>فرمت دفاع:</strong> {{ formatDefenseDate(new Date(selectedDate), '14:00') }}</p>
              <p class="text-sm mt-2" :class="isWorkDay(new Date(selectedDate)) ? 'text-green-400' : 'text-orange-400'">
                {{ isWorkDay(new Date(selectedDate)) ? '✅ مناسب برای دفاع' : '⚠️ روز غیرکاری - توصیه نمی‌شود' }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { 
  toJalali, 
  toJalaliWithWeekDay, 
  toFullPersianDate,
  getPersianWeekDay,
  formatDefenseDate,
  inputToJalali,
  inputToJalaliWithWeekDay,
  isWorkDay,
  isFriday
} from '../utils/dateUtils.js';

const today = new Date();
const selectedDate = ref('');

// تاریخ‌های نمونه برای تست
const sampleDates = [
  new Date(), // امروز
  new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // فردا
  new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // پس‌فردا
  new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // هفته آینده
  new Date('2024-12-25'), // کریسمس
  new Date('2025-03-21'), // عید نوروز
];
</script>