<template>
  <div class="min-h-screen bg-dark-bg px-4 py-8">
    <div class="max-w-6xl mx-auto">
      <h1 class="text-3xl font-bold mb-8 text-orange">پورتال ادمین</h1>

      <div class="card mb-6">
        <h2 class="text-xl font-bold mb-4 text-primary">درخواست‌های ثبت‌نام (در انتظار تایید)</h2>
        <div v-if="pendingUsers.length" class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead class="bg-primary text-white">
              <tr>
                <th class="px-4 py-3 text-right font-bold">نام و نام خانوادگی</th>
                <th class="px-4 py-3 text-right font-bold">کد ملی</th>
                <th class="px-4 py-3 text-right font-bold">نقش</th>
                <th class="px-4 py-3 text-right font-bold">رشته</th>
                <th class="px-4 py-3 text-center font-bold">اقدامات</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="user in pendingUsers" :key="user._id" class="hover:bg-hover-bg transition">
                <td class="px-4 py-3 text-right font-semibold border-b border-border-color">{{ user.firstName }} {{ user.lastName }}</td>
                <td class="px-4 py-3 text-right text-text-secondary border-b border-border-color">{{ user.nationalId }}</td>
                <td class="px-4 py-3 text-right border-b border-border-color">
                  <span class="bg-warning-light text-warning px-2 py-1 rounded text-xs font-semibold">رول: {{ roleLabel(user.role) }}</span>
                </td>
                <td class="px-4 py-3 text-right text-text-secondary border-b border-border-color">{{ user.major }}</td>
                <td class="px-4 py-3 text-center border-b border-border-color">
                  <div class="flex justify-center gap-2">
                    <button @click="approve(user._id)" :disabled="loading" class="btn-primary text-xs px-3 py-1" :class="{'opacity-50 cursor-not-allowed': loading}">
                      تایید
                    </button>
                    <button @click="reject(user._id)" :disabled="loading" class="btn-secondary text-xs px-3 py-1" :class="{'opacity-50 cursor-not-allowed': loading}">
                      رد
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-else class="text-gray-400 text-center py-6">✓ هیچ درخواستی در انتظار نیست.</div>
      </div>

      <div class="card">
        <h2 class="text-xl font-bold mb-6 text-primary">کاربران تایید‌شده (تفکیک نقش و رشته)</h2>
        <div class="space-y-8">
          <div v-for="role in ['student','teacher','manager']" :key="role" class="bg-primary/10 rounded-lg p-4 border border-primary/20">
            <h3 class="text-lg font-bold text-warning mb-4">{{ roleLabel(role) }}</h3>
            <div v-if="approvedGrouped[role] && Object.keys(approvedGrouped[role]).length" class="space-y-4">
              <div v-for="(users, major) in approvedGrouped[role]" :key="major">
                <div class="flex items-center gap-2 mb-2">
                  <span class="text-primary font-semibold">رشته:</span>
                  <span class="text-sm bg-primary/20 text-primary px-3 py-1 rounded">{{ major }}</span>
                  <span class="text-xs text-text-secondary">(تعداد: {{ users.length }})</span>
                </div>
                <div class="overflow-x-auto">
                  <table class="w-full text-sm bg-dark-bg/50 rounded">
                    <thead class="border-b-2 border-primary/30 bg-primary/20">
                      <tr>
                        <th class="px-4 py-3 text-right font-bold text-text-primary">نام و نام خانوادگی</th>
                        <th class="px-4 py-3 text-right font-bold text-text-primary">کد ملی</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="u in users" :key="u._id" class="border-b border-primary/10 hover:bg-primary/10">
                        <td class="px-4 py-3 text-right">{{ u.firstName }} {{ u.lastName }}</td>
                        <td class="px-4 py-3 text-right text-text-secondary">{{ u.nationalId }}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            <div v-else class="text-gray-400 text-center py-4">— هیچ کاربری ثبت نشده است.</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import api from '../api.js';

const pendingUsers = ref([]);
const approvedGrouped = ref({ student: {}, teacher: {}, manager: {} });
const loading = ref(false);

const roleLabel = (role) => {
  const map = { student: 'دانشجو', teacher: 'استاد', manager: 'مدیر گروه', admin: 'ادمین' };
  return map[role] || role;
};

const loadPendingUsers = async () => {
  try {
    const res = await api.get('/auth/pending');
    pendingUsers.value = res.data;
  } catch (err) {
    console.error(err);
  }
};

const loadApprovedUsers = async () => {
  try {
    const res = await api.get('/auth/approved');
    approvedGrouped.value = res.data;
  } catch (err) {
    console.error(err);
  }
};

const approve = async (userId) => {
  if (loading.value) return;
  loading.value = true;
  try {
    const res = await api.post('/auth/approve', { userId });
    console.log('تایید موفق:', res.data);
    await loadPendingUsers();
    await loadApprovedUsers();
    alert('کاربر با موفقیت تایید شد');
  } catch (err) {
    console.error('خطای تایید:', err);
    alert(err.response?.data?.error || 'خطا در تایید کاربر');
  } finally {
    loading.value = false;
  }
};

const reject = async (userId) => {
  if (loading.value) return;
  loading.value = true;
  try {
    const res = await api.post('/auth/reject', { userId });
    console.log('رد موفق:', res.data);
    await loadPendingUsers();
    await loadApprovedUsers();
    alert('کاربر با موفقیت رد شد');
  } catch (err) {
    console.error('خطای رد:', err);
    alert(err.response?.data?.error || 'خطا در رد کاربر');
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  loadPendingUsers();
  loadApprovedUsers();
});
</script>
