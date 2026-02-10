<template>
  <div class="min-h-screen bg-dark-bg px-4 py-8">
    <div class="max-w-5xl mx-auto">
      <div class="flex items-center justify-between mb-8">
        <h1 class="text-3xl font-bold text-primary">داوری</h1>
        <button type="button" @click="goBack" class="btn-secondary">بازگشت</button>
      </div>

      <div class="card">
        <h2 class="text-xl font-bold mb-4 text-primary">پروژه های داوری</h2>
        <div class="space-y-3">
          <div v-for="project in examinerProjects" :key="project._id" class="border border-dark-green/30 p-3 rounded">
            <div class="flex justify-between items-start">
              <div class="flex-1">
                <p class="font-bold text-lg">{{ project.studentId?.firstName }} {{ project.studentId?.lastName }}</p>
                <p class="text-sm text-text-secondary mt-1">عنوان موضوع: {{ project.topic || 'منتظر انتخاب' }}</p>
                <p class="text-xs text-text-secondary mt-1">وضعیت: {{ getStatusText(project.status) }}</p>
                <p v-if="project.defenseDate" class="text-xs text-warning mt-2">
                  📅 {{ formatDefenseDate(project.defenseDate, project.defenseTime) }}
                </p>
                <p v-else class="text-xs text-gray-400 mt-2">⏳ در انتظار زمان بندی</p>
              </div>
              <div class="w-40">
                <input type="number" v-model="gradeMap[project._id]" placeholder="نمره"
                  class="w-full bg-dark-bg border border-dark-green/50 px-2 py-1 rounded text-sm">
                <button @click="submitGrade(project._id)" class="mt-2 btn-primary text-sm w-full">ثبت نمره</button>
              </div>
            </div>
          </div>
          <div v-if="examinerProjects.length === 0" class="text-center text-gray-400 py-4">
            هیچ پروژه ای برای داوری ندارید
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import api from '../api.js';
import { toJalali, formatDefenseDate, toJalaliWithWeekDay } from '../utils/dateUtils.js';
import { useNavigation, useProjectStatus } from '../composables/useCommon.js';

const { goBack } = useNavigation();
const { getStatusText } = useProjectStatus();
const examinerProjects = ref([]);
const gradeMap = ref({});

onMounted(() => {
  loadProjects();
});

async function loadProjects() {
  try {
    const res = await api.get('/projects/examiner');
    examinerProjects.value = res.data;
  } catch (err) {
    console.error(err);
  }
}
async function submitGrade(projectId) {
  try {
    await api.post('/projects/grade', { projectId, grade: gradeMap.value[projectId] });
    alert('نمره ثبت شد');
  } catch (err) {
    alert(err.response?.data?.error || 'خطا');
  }
}
</script>
