<template>
  <div class="min-h-screen bg-dark-bg px-4 py-8">
    <div class="max-w-5xl mx-auto">
      <div class="flex items-center justify-between mb-8">
        <h1 class="text-3xl font-bold text-primary">راهنما</h1>
        <button type="button" @click="goBack" class="btn-secondary">بازگشت</button>
      </div>

      <div class="card">
        <h2 class="text-xl font-bold mb-4 text-primary">ظرفیت راهنمایی</h2>
        <div class="grid md:grid-cols-3 gap-3 bg-primary-lighter p-4 rounded border border-primary-light/30 mb-4">
          <div>
            <label class="block text-sm mb-1">سال</label>
            <input v-model.number="year" type="number" min="1390" max="1500" placeholder="مثلاً 1404"
              class="w-full bg-card-bg border border-border-color px-3 py-2 rounded">
          </div>
          <div>
            <label class="block text-sm mb-1">ترم</label>
            <select v-model="termHalf" class="w-full bg-card-bg border border-border-color px-3 py-2 rounded">
              <option value="1">مهر</option>
              <option value="2">بهمن</option>
            </select>
          </div>
          <div class="flex items-end">
            <button @click="loadAdvisorCapacity" class="btn-secondary w-full">نمایش</button>
          </div>
        </div>
        <div v-if="advisorCapacity" class="text-sm text-text-secondary mb-6">
          ظرفیت: {{ advisorCapacity.limit }} — اخذ شده: {{ advisorCapacity.assigned }} — باقی مانده: {{ advisorCapacity.remaining }}
        </div>

        <h2 class="text-xl font-bold mb-4 text-primary">پروژه های استاد راهنما</h2>
        <div class="space-y-3">
          <div v-for="project in advisorProjects" :key="project._id"
            class="border border-primary/30 p-3 rounded hover:bg-primary/5 transition">
            <div class="flex justify-between items-start">
              <div class="flex-1">
                <p class="font-bold text-lg">{{ project.studentId?.firstName }} {{ project.studentId?.lastName }}</p>
                <p class="text-sm text-text-secondary mt-1">عنوان موضوع: {{ project.topic || 'منتظر انتخاب' }}</p>
                <p class="text-xs text-text-secondary mt-1">وضعیت: {{ getStatusText(project.status) }}</p>
              </div>
              <router-link :to="`/teacher/student/${project._id}`"
                class="btn-secondary text-sm whitespace-nowrap mr-3">
                مشاهده جزئیات ←
              </router-link>
            </div>
          </div>
          <div v-if="advisorProjects.length === 0" class="text-center text-gray-400 py-4">
            هیچ پروژه ای به عنوان استاد راهنما ندارید
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import api from '../api.js';

const advisorProjects = ref([]);
const advisorCapacity = ref(null);
const year = ref(null);
const termHalf = ref('1');
const router = useRouter();
const goBack = () => {
  if (window.history.length > 1) {
    router.back();
  } else {
    router.push('/teacher');
  }
};

onMounted(() => {
  loadProjects();
  year.value = getJalaliYear();
  loadAdvisorCapacity();
});

function getJalaliYear() {
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
}
async function loadAdvisorCapacity() {
  try {
    if (!year.value) return;
    const term = `${year.value}-${termHalf.value}`;
    const res = await api.get(`/projects/advisor-capacity?term=${encodeURIComponent(term)}`);
    advisorCapacity.value = res.data;
  } catch (err) {
    advisorCapacity.value = null;
    console.error(err);
  }
}

function getStatusText(status) {
  const statusMap = {
    pending: 'در انتظار تایید',
    active: 'فعال',
    topic_approved: 'موضوع تایید شده',
    scheduled: 'زمان دفاع تعیین شده',
    defended: 'دفاع شده',
    graded: 'نمره گذاری شده'
  };
  return statusMap[status] || status;
}
async function loadProjects() {
  try {
    const res = await api.get('/projects/advisor');
    advisorProjects.value = res.data;
  } catch (err) {
    console.error(err);
  }
}
</script>
