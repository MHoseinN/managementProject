<template>
  <div class="min-h-screen bg-dark-bg px-4 py-8">
    <div class="max-w-6xl mx-auto">
      <div class="flex items-center justify-between mb-8">
        <h1 class="text-3xl font-bold text-primary">پورتال استاد</h1>
        <button type="button" @click="goBack" class="btn-secondary">بازگشت</button>
      </div>

      <div class="grid grid-cols-2 gap-6">
        <!-- Advisor Section -->
        <div class="card">
          <h2 class="text-xl font-bold mb-4 text-primary">استاد راهنما</h2>
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
              هیچ پروژه‌ای به عنوان استاد راهنما ندارید
            </div>
          </div>
        </div>

        <!-- Examiner Section -->
        <div class="card">
          <h2 class="text-xl font-bold mb-4 text-primary">استاد داور</h2>
          <div class="space-y-3 mb-6">
            <h3 class="font-semibold text-warning">ارائه زمان‌های خالی برای دفاع (حداقل 2 روز)</h3>

            <!-- Term Selection -->
            <div class="bg-primary-lighter border border-primary-light/30 rounded-lg p-4 mb-4">
              <div class="grid md:grid-cols-2 gap-3">
                <div>
                  <label class="block text-sm font-bold mb-1">سال</label>
                  <input type="number" v-model.number="year" min="1390" max="1500" placeholder="مثلاً 1404"
                    class="w-full bg-card-bg border border-border-color px-3 py-2 rounded">
                </div>
                <div>
                  <label class="block text-sm font-bold mb-1">ترم</label>
                  <select v-model="termHalf" class="w-full bg-card-bg border border-border-color px-3 py-2 rounded">
                    <option value="1">مهر</option>
                    <option value="2">بهمن</option>
                  </select>
                </div>
              </div>
              <p class="text-sm text-primary mt-2">ترم انتخابی: {{ termLabel }}</p>
            </div>

            <div v-for="(slot, index) in defenseSlots" :key="index"
              class="bg-dark-green/5 border border-dark-green/20 rounded-lg p-4">
              <div class="flex justify-between items-center mb-3">
                <span class="font-bold text-light-green">روز {{ index + 1 }}</span>
                <button v-if="defenseSlots.length > 2" @click="removeSlot(index)"
                  class="text-red-500 hover:text-red-700 text-sm">
                  ✕ حذف
                </button>
              </div>

              <div class="grid md:grid-cols-3 gap-3">
                <div>
                  <label class="block text-sm mb-1">تاریخ</label>
                  <input type="date" v-model="slot.date"
                    class="w-full bg-card-bg border border-border-color px-3 py-2 rounded" :min="minDate">
                  <p v-if="slot.date" class="text-xs text-text-secondary mt-1">{{ inputToJalali(slot.date) }}</p>
                </div>
                <div>
                  <label class="block text-sm mb-1">ساعت شروع</label>
                  <input type="time" v-model="slot.startTime"
                    class="w-full bg-card-bg border border-border-color px-3 py-2 rounded">
                </div>
                <div>
                  <label class="block text-sm mb-1">ساعت پایان</label>
                  <input type="time" v-model="slot.endTime"
                    class="w-full bg-card-bg border border-border-color px-3 py-2 rounded">
                </div>
              </div>
            </div>

            <button @click="addSlot" class="btn-secondary w-full">
              + افزودن روز جدید
            </button>

            <button @click="submitDefenseSlots" class="btn-primary w-full" :disabled="!canSubmitSlots">
              ثبت زمان‌های پیشنهادی
            </button>
            <p v-if="!canSubmitSlots" class="text-xs text-red-400">لطفاً حداقل 2 روز با تاریخ و ساعت کامل وارد کنید</p>
          </div>

          <div class="space-y-2">
            <h3 class="font-semibold text-orange">پروژه های مربوط</h3>
            <div v-for="project in examinerProjects" :key="project._id" class="border border-dark-green/30 p-2 rounded">
              <p><strong>{{ project.studentId?.firstName }}</strong></p>
              <p class="text-sm">{{ project.topic || 'منتظر انتخاب' }}</p>
                <p v-if="project.defenseDate" class="text-xs text-warning mt-2">📅 {{ toJalali(project.defenseDate) }}
                - {{ project.defenseTime }}</p>
              <p v-else class="text-xs text-gray-400 mt-2">⏳ در انتظار زمان‌بندی</p>
              <input type="number" v-model="gradeMap[project._id]" placeholder="نمره"
                class="w-full bg-dark-bg border border-dark-green/50 px-2 py-1 rounded text-sm mt-1">
              <button @click="submitGrade(project._id)" class="mt-1 btn-primary text-sm">ثبت نمره</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import api from '../api.js';
import { inputToJalali, toJalali } from '../utils/dateUtils.js';

const advisorProjects = ref([]);
const examinerProjects = ref([]);
const year = ref(null);
const termHalf = ref('1');
const defenseSlots = ref([
  { date: '', startTime: '', endTime: '' },
  { date: '', startTime: '', endTime: '' }
]);
const gradeMap = ref({});
const router = useRouter();
const goBack = () => {
  if (window.history.length > 1) {
    router.back();
  } else {
    router.push('/');
  }
};

const minDate = computed(() => {
  const today = new Date();
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, '0');
  const d = String(today.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
});
const canSubmitSlots = computed(() => {
  const validSlots = defenseSlots.value.filter(s => s.date && s.startTime && s.endTime);
  return validSlots.length >= 2 && year.value;
});
const termLabel = computed(() => {
  if (!year.value) return 'سال را انتخاب کنید';
  const termName = termHalf.value === '2' ? 'بهمن' : 'مهر';
  return `${termName} ${year.value}`;
});

onMounted(() => {
  loadProjects();
  year.value = getJalaliYear();
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
function addSlot() {
  defenseSlots.value.push({ date: '', startTime: '', endTime: '' });
}
function removeSlot(index) {
  if (defenseSlots.value.length > 2) {
    defenseSlots.value.splice(index, 1);
  }
}
async function loadProjects() {
  try {
    const [advisor, examiner] = await Promise.all([
      api.get('/projects/advisor'),
      api.get('/projects/examiner')
    ]);
    advisorProjects.value = advisor.data;
    examinerProjects.value = examiner.data;
  } catch (err) {
    console.error(err);
  }
}
async function submitDefenseSlots() {
  if (!canSubmitSlots.value) {
    alert('لطفا سال و حداقل 2 روز با تاریخ و ساعت کامل وارد کنید');
    return;
  }

  try {
    const term = `${year.value}-${termHalf.value}`;
    const proposedDates = defenseSlots.value
      .filter(s => s.date && s.startTime && s.endTime)
      .map(s => ({
        date: s.date,
        timeSlots: generateTimeSlots(s.startTime, s.endTime)
      }));

    await api.post('/defense/slots', { term, proposedDates });
    alert(`زمان های خالی برای ${proposedDates.length} روز در ترم ${termLabel.value} ثبت شد`);

    defenseSlots.value = [
      { date: '', startTime: '', endTime: '' },
      { date: '', startTime: '', endTime: '' }
    ];
  } catch (err) {
    alert(err.response?.data?.error || 'خطا در ثبت');
  }
}
function generateTimeSlots(start, end) {
  const slots = [];
  let current = new Date(`2000-01-01T${start}`);
  const endTime = new Date(`2000-01-01T${end}`);
  while (current < endTime) {
    const next = new Date(current.getTime() + 30 * 60000);
    slots.push(
      `${current.getHours().toString().padStart(2, '0')}:${current.getMinutes().toString().padStart(2, '0')}-${next
        .getHours()
        .toString()
        .padStart(2, '0')}:${next.getMinutes().toString().padStart(2, '0')}`
    );
    current = next;
  }
  return slots;
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
