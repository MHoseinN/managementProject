<template>
  <div class="min-h-screen bg-dark-bg px-4 py-8">
    <div class="max-w-md mx-auto">
      <div class="card">
        <h2 class="text-2xl font-bold mb-6 text-orange">ورود</h2>
        
        <form @submit.prevent="login" class="space-y-4">
          <div>
            <label class="block text-sm mb-1">نقش</label>
            <select v-model="form.role" class="w-full bg-dark-bg border border-dark-green/50 px-3 py-2 rounded">
              <option value="student">دانشجو</option>
              <option value="teacher">استاد</option>
              <option value="manager">مدیر گروه</option>
              <option value="admin">ادمین</option>
            </select>
          </div>

          <div>
            <label class="block text-sm mb-1">کد ملی (نام کاربری)</label>
            <input v-model="form.nationalId" class="w-full bg-dark-bg border border-dark-green/50 px-3 py-2 rounded" placeholder="۰۳۷۲۱۹۹۹۸۴">
          </div>

          <div>
            <label class="block text-sm mb-1">شناسه</label>
            <input v-model="form.identityNumber" type="password" class="w-full bg-dark-bg border border-dark-green/50 px-3 py-2 rounded" placeholder="شماره دانشجویی یا شناسه استاد">
          </div>

          <button type="submit" class="w-full btn-primary py-2">ورود</button>
        </form>

        <div v-if="error" class="mt-4 p-2 bg-red-900/30 border border-red-500 rounded text-red-400">{{ error }}</div>
        <router-link to="/register" class="block text-center mt-4 text-orange hover:underline">ثبت نام ندارید؟</router-link>
      </div>
    </div>
  </div>
</template>

<script>
import api from '../api.js';

export default {
  data() {
    return {
      form: { role: 'student', nationalId: '', identityNumber: '' },
      error: ''
    };
  },
  methods: {
    async login() {
      try {
        const res = await api.post('/auth/login', this.form);
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify(res.data.user));
        
        const roleRoutes = { student: '/student', teacher: '/teacher', manager: '/manager', admin: '/admin' };
        this.$router.push(roleRoutes[res.data.user.role]);
      } catch (err) {
        this.error = err.response?.data?.error || 'خطا در ورود';
      }
    }
  }
};
</script>
