<template>
  <div class="min-h-screen bg-dark-bg px-4 py-8">
    <div class="max-w-md mx-auto">
      <div class="card">
        <h2 class="text-2xl font-bold mb-6 text-orange">ثبت نام</h2>
        
        <form @submit.prevent="register" class="space-y-3">
          <div>
            <label class="block text-sm mb-1">نقش</label>
            <select v-model="form.role" class="w-full bg-dark-bg border border-dark-green/50 px-3 py-2 rounded">
              <option value="student">دانشجو</option>
              <option value="teacher">استاد</option>
              <option value="manager">مدیر گروه</option>
            </select>
          </div>

          <input v-model="form.firstName" placeholder="نام" class="w-full bg-dark-bg border border-dark-green/50 px-3 py-2 rounded">
          <input v-model="form.lastName" placeholder="نام خانوادگی" class="w-full bg-dark-bg border border-dark-green/50 px-3 py-2 rounded">
          <input v-model="form.nationalId" placeholder="کد ملی" class="w-full bg-dark-bg border border-dark-green/50 px-3 py-2 rounded">
          <input v-model="form.identityNumber" placeholder="شماره دانشجویی / شناسه استاد" class="w-full bg-dark-bg border border-dark-green/50 px-3 py-2 rounded">
          
          <div>
            <label class="block text-sm mb-1">رشته تحصیلی</label>
            <select v-model="form.major" class="w-full bg-dark-bg border border-dark-green/50 px-3 py-2 rounded">
              <option value="کامپیوتر">کامپیوتر</option>
              <option value="برق">برق</option>
              <option value="مکانیک">مکانیک</option>
            </select>
          </div>

          <button type="submit" class="w-full btn-primary py-2">ثبت نام</button>
        </form>

        <div v-if="message" class="mt-4 p-2 bg-green-900/30 border border-green-500 rounded text-green-400">{{ message }}</div>
        <div v-if="error" class="mt-4 p-2 bg-red-900/30 border border-red-500 rounded text-red-400">{{ error }}</div>
        <router-link to="/login" class="block text-center mt-4 text-orange hover:underline">حساب دارید؟</router-link>
      </div>
    </div>
  </div>
</template>

<script>
import api from '../api.js';

export default {
  data() {
    return {
      form: { role: 'student', firstName: '', lastName: '', nationalId: '', identityNumber: '', major: 'کامپیوتر' },
      error: '',
      message: ''
    };
  },
  methods: {
    async register() {
      try {
        await api.post('/auth/register', this.form);
        this.message = 'ثبت نام موفق! در انتظار تایید ادمین...';
        this.form = { role: 'student', firstName: '', lastName: '', nationalId: '', identityNumber: '', major: 'کامپیوتر' };
      } catch (err) {
        this.error = err.response?.data?.error || 'خطا در ثبت نام';
      }
    }
  }
};
</script>
