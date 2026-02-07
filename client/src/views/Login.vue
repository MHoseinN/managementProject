<template>
  <div class="min-h-screen bg-dark-bg px-4 py-8">
    <div class="max-w-md mx-auto">
      <div class="card">
        <h2 class="text-2xl font-bold mb-6 text-orange">ورود</h2>
        
        <form @submit.prevent="login" class="space-y-4">
          <div>
            <label class="block text-sm mb-1">نقش</label>
            <select v-model="form.role" class="w-full bg-card-bg border border-border-color px-3 py-2 rounded">
              <option value="student">دانشجو</option>
              <option value="teacher">استاد</option>
              <option value="manager">مدیر گروه</option>
              <option value="admin">ادمین</option>
            </select>
          </div>

          <div>
            <label class="block text-sm mb-1">کد ملی (نام کاربری)</label>
            <input v-model="form.nationalId" class="w-full bg-dark-bg border border-primary/30 px-3 py-2 rounded" placeholder="۰۳۷۲۱۹۹۹۸۴">
            <small class="text-gray-400">برای تست: 0372199984 (دانشجو)</small>
          </div>

          <div>
            <label class="block text-sm mb-1">شناسه</label>
            <input v-model="form.identityNumber" type="password" class="w-full bg-dark-bg border border-primary/30 px-3 py-2 rounded" placeholder="شماره دانشجویی یا شناسه استاد">
            <small class="text-text-secondary">برای تست: 99101241 (دانشجو)</small>
          </div>

          <button type="submit" class="w-full btn-primary py-2" :disabled="loading">{{ loading ? 'در حال ورود...' : 'ورود' }}</button>
        </form>

        <div v-if="error" class="mt-4 p-3 bg-red-900/30 border border-red-500 rounded text-red-300">
          <strong>خطا:</strong> {{ error }}
          <br><small>اطلاعات ورود را بررسی کنید و دوباره تلاش کنید</small>
        </div>
        <router-link to="/register" class="block text-center mt-4 text-orange hover:underline">ثبت نام ندارید؟</router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import api from '../api.js';

const router = useRouter();
const form = reactive({ role: 'student', nationalId: '', identityNumber: '' });
const error = ref('');
const loading = ref(false);

const login = async () => {
  error.value = '';
  if (!form.nationalId || !form.identityNumber) {
    error.value = 'کد ملی و شناسه لازم است';
    return;
  }
  loading.value = true;
  try {
    const res = await api.post('/auth/login', form);
    localStorage.setItem('token', res.data.token);
    localStorage.setItem('user', JSON.stringify(res.data.user));
    console.log('ورود موفق:', res.data.user);
    const roleRoutes = { student: '/student', teacher: '/teacher', manager: '/manager', admin: '/admin' };
    router.push(roleRoutes[res.data.user.role]);
  } catch (err) {
    console.error('خطا ورود:', err);
    error.value = err.response?.data?.error || 'خطا در اتصال به سرور';
  } finally {
    loading.value = false;
  }
};
</script>
