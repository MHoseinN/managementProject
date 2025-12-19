<template>
  <div class="min-h-screen bg-dark-bg px-4 py-8">
    <div class="max-w-6xl mx-auto">
      <h1 class="text-3xl font-bold mb-8 text-light-green">پورتال مدیر گروه</h1>

      <div class="grid gap-6">
        <!-- Set Capacity -->
        <div class="card">
          <h2 class="text-xl font-bold mb-4 text-light-green">تعیین ظرفیت</h2>
          <div class="space-y-2">
            <input v-model="capacity" type="number" placeholder="ظرفیت ترم جاری" class="w-full bg-card-bg border border-border-color px-3 py-2 rounded">
            <button @click="setCapacity" class="btn-primary">ثبت ظرفیت</button>
          </div>
        </div>

        <!-- Students List -->
        <div class="card">
          <h2 class="text-xl font-bold mb-4 text-light-green">جدول دانشجویان و پروژه ها</h2>
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b border-border-color">
                  <th class="p-2 text-left">نام دانشجو</th>
                  <th class="p-2 text-left">موضوع</th>
                  <th class="p-2 text-left">استاد راهنما</th>
                  <th class="p-2 text-left">استاد داور</th>
                  <th class="p-2 text-left">تاریخ دفاع</th>
                  <th class="p-2 text-left">ساعت دفاع</th>
                  <th class="p-2 text-left">نمره</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="project in projects" :key="project._id" class="border-b border-border-color hover:bg-peach/10">
                  <td class="p-2">{{ project.studentId?.firstName }}</td>
                  <td class="p-2">{{ project.topic || '-' }}</td>
                  <td class="p-2">{{ project.advisorId?.firstName || '-' }}</td>
                  <td class="p-2">{{ project.examinerId?.firstName || '-' }}</td>
                  <td class="p-2">{{ formatDate(project.defenseDate) }}</td>
                  <td class="p-2">{{ formatTime(project.defenseDate) }}</td>
                  <td class="p-2">{{ project.grade || '-' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import api from '../api.js';

export default {
  data() {
    return {
      capacity: '',
      projects: []
    };
  },
  mounted() {
    this.loadProjects();
  },
  methods: {
    formatDate(date) {
      if (!date) return '-';
      const d = new Date(date);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}/${month}/${day}`;
    },
    formatTime(date) {
      if (!date) return '-';
      const d = new Date(date);
      const hours = String(d.getHours()).padStart(2, '0');
      const minutes = String(d.getMinutes()).padStart(2, '0');
      return `${hours}:${minutes}`;
    },
    async setCapacity() {
      try {
        await api.post('/manager/capacity', { term: '1404-1', capacity: this.capacity });
        alert('ظرفیت ثبت شد');
      } catch (err) {
        alert(err.response?.data?.error || 'خطا');
      }
    },
    async loadProjects() {
      try {
        const res = await api.get('/manager/projects');
        this.projects = res.data;
      } catch (err) {
        console.error(err);
      }
    }
  }
};
</script>
