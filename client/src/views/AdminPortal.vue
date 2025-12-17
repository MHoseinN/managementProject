<template>
  <div class="min-h-screen bg-dark-bg px-4 py-8">
    <div class="max-w-6xl mx-auto">
      <h1 class="text-3xl font-bold mb-8 text-orange">پورتال ادمین</h1>

      <div class="card">
        <h2 class="text-xl font-bold mb-4 text-light-green">درخواست های ثبت نام</h2>
        <div class="space-y-2">
          <div v-for="user in pendingUsers" :key="user._id" class="flex items-center justify-between border border-dark-green/30 p-3 rounded bg-card-bg">
            <div>
              <p><strong>{{ user.firstName }} {{ user.lastName }}</strong></p>
              <p class="text-sm text-gray-400">{{ user.role }} - {{ user.major }}</p>
            </div>
            <div class="space-x-2">
              <button @click="approve(user._id)" class="btn-primary text-sm">تایید</button>
              <button @click="reject(user._id)" class="btn-secondary text-sm">رد</button>
            </div>
          </div>
        </div>
        <div v-if="pendingUsers.length === 0" class="text-gray-400">هیچ درخواستی در انتظار نیست</div>
      </div>
    </div>
  </div>
</template>

<script>
import api from '../api.js';

export default {
  data() {
    return {
      pendingUsers: []
    };
  },
  mounted() {
    this.loadPendingUsers();
  },
  methods: {
    async loadPendingUsers() {
      try {
        const res = await api.get('/auth/pending');
        this.pendingUsers = res.data;
      } catch (err) {
        console.error(err);
      }
    },
    async approve(userId) {
      try {
        await api.post('/auth/approve', { userId, approved: true });
        this.loadPendingUsers();
      } catch (err) {
        alert(err.response?.data?.error || 'خطا');
      }
    },
    async reject(userId) {
      try {
        await api.post('/auth/approve', { userId, approved: false });
        this.loadPendingUsers();
      } catch (err) {
        alert(err.response?.data?.error || 'خطا');
      }
    }
  }
};
</script>
