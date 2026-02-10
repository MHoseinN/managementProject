<template>
  <div class="min-h-screen bg-dark-bg px-4 py-8">
    <div class="max-w-6xl mx-auto">
      <div class="flex items-center justify-between mb-8">
        <h1 class="text-3xl font-bold text-primary">پورتال استاد</h1>
        <button type="button" @click="goBack" class="btn-secondary">بازگشت</button>
      </div>

      <div class="grid md:grid-cols-3 gap-6">
        <router-link to="/teacher/examiner" class="card hover:bg-primary/5 transition">
          <h2 class="text-xl font-bold text-primary mb-2">داوری</h2>
          <p class="text-sm text-text-secondary">مشاهده پروژه های داوری و ثبت نمره</p>
        </router-link>

        <router-link to="/teacher/advisor" class="card hover:bg-primary/5 transition">
          <h2 class="text-xl font-bold text-primary mb-2">راهنما</h2>
          <p class="text-sm text-text-secondary">مدیریت پروژه های راهنمایی</p>
        </router-link>

        <router-link to="/teacher/defense" class="card hover:bg-primary/5 transition">
          <h2 class="text-xl font-bold text-primary mb-2">تعیین تاریخ دفاع</h2>
          <p class="text-sm text-text-secondary">ثبت زمان های پیشنهادی دفاع</p>
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useNavigation } from '../composables/useCommon.js';

const { goBack } = useNavigation();
</script>
