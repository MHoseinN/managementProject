<template>
  <div class="min-h-screen bg-dark-bg px-4 py-8">
    <div class="max-w-6xl mx-auto">
      <div class="flex items-center justify-between mb-8">
        <h1 class="text-3xl font-bold text-primary">پورتال مدیر گروه</h1>
        <button type="button" @click="goBack" class="btn-secondary">بازگشت</button>
      </div>

      <div class="grid gap-6">
        <!-- Set Capacity -->
        <div class="card">
          <h2 class="text-xl font-bold mb-4 text-primary">تعیین ظرفیت پروژه</h2>
          <div class="grid md:grid-cols-4 gap-3 bg-primary-lighter p-4 rounded border border-primary-light/30">
            <div>
              <label class="block text-sm mb-1">سال</label>
              <input v-model="year" type="number" min="1390" max="1500" placeholder="مثلاً 1404" class="w-full bg-card-bg border border-border-color px-3 py-2 rounded">
            </div>
            <div>
              <label class="block text-sm mb-1">ترم</label>
              <select v-model="termHalf" class="w-full bg-card-bg border border-border-color px-3 py-2 rounded">
                <option value="1">مهر</option>
                <option value="2">بهمن</option>
              </select>
            </div>
            <div>
              <label class="block text-sm mb-1">ظرفیت</label>
              <input v-model.number="capacity" type="number" min="0" placeholder="تعداد" class="w-full bg-card-bg border border-border-color px-3 py-2 rounded">
            </div>
            <div class="flex items-end">
              <button @click="setCapacity" class="btn-primary w-full" :disabled="!canSubmitCapacity">ثبت ظرفیت</button>
            </div>
          </div>
          <div class="mt-4">
            <h3 class="text-sm font-bold text-text-secondary mb-2">ظرفیت هر استاد</h3>
            <div v-if="advisorLimits.length" class="space-y-2">
              <div v-for="advisor in advisorLimits" :key="advisor.advisorId" class="grid md:grid-cols-4 gap-3 items-center bg-card-bg p-3 rounded border border-border-color">
                <div class="md:col-span-2">
                  <p class="font-bold">{{ advisor.firstName }} {{ advisor.lastName }}</p>
                  <p class="text-xs text-text-secondary">باقی‌مانده: {{ Math.max(0, (advisor.limit || 0) - (advisor.assigned || 0)) }}</p>
                </div>
                <div>
                  <label class="block text-xs mb-1">ظرفیت راهنمایی</label>
                  <input v-model.number="advisor.limit" type="number" min="0" class="w-full bg-white border border-border-color px-3 py-2 rounded">
                </div>
                <div class="text-xs text-text-secondary">
                  اخذ شده: {{ advisor.assigned }}
                </div>
              </div>
            </div>
            <div v-else class="text-xs text-text-secondary">هیچ استادی برای این رشته ثبت نشده است.</div>
          </div>
          <p class="mt-3 text-xs" :class="capacityNoteClass">مجموع ظرفیت اساتید: {{ totalAdvisorLimit }} / ظرفیت کل: {{ capacity || 0 }}</p>
          <div class="mt-3 text-sm text-gray-600" v-if="currentCapacity">
            <span class="text-light-green font-bold">وضعیت ترم {{ termLabel(currentCapacity.term) }}:</span>
            ظرفیت {{ currentCapacity.capacity }} — اخذ شده {{ currentCapacity.enrolled }}
          </div>
          <div class="mt-2">
            <button class="btn-secondary text-sm" @click="loadCapacity">مشاهده ظرفیت ترم انتخابی</button>
          </div>
        </div>

        <!-- Defense Slots Display -->
        <div class="card">
          <h2 class="text-xl font-bold mb-4 text-warning">🕐 زمان‌های خالی دفاع ثبت‌شده توسط اساتید</h2>
          
          <div class="mb-4 p-4 bg-warning-light/10 border border-warning/30 rounded">
            <p class="text-sm text-text-secondary mb-2">برای دیدن اسلات‌های یک ترم خاص:</p>
            <div class="flex gap-3 items-end">
              <div>
                <label class="block text-sm font-bold mb-1">سال</label>
                <input v-model.number="slotFilterYear" type="number" min="1390" max="1500" placeholder="مثلاً 1404" class="w-full bg-card-bg border border-border-color px-3 py-2 rounded">
              </div>
              <div>
                <label class="block text-sm font-bold mb-1">ترم</label>
                <select v-model="slotFilterTermHalf" class="w-full bg-card-bg border border-border-color px-3 py-2 rounded">
                  <option value="1">مهر</option>
                  <option value="2">بهمن</option>
                </select>
              </div>
              <button @click="loadDefenseSlots" class="btn-secondary">نمایش اسلات‌ها</button>
            </div>
          </div>

          <div v-if="defenseSlots.length" class="space-y-4">
            <div v-for="slot in defenseSlots" :key="slot._id" class="border border-warning/30 rounded-lg p-4 bg-dark-green/5">
              <div class="flex items-center justify-between mb-3">
                <div>
                  <p class="font-bold text-warning">استاد داور: {{ slot.examinerId?.firstName }} {{ slot.examinerId?.lastName }}</p>
                  <p class="text-sm text-text-secondary mt-1">ترم: {{ termLabel(slot.term) }}</p>
                </div>
                <span class="text-sm text-light-green bg-dark-green/20 px-3 py-1 rounded">{{ slot.approvedSlots?.length || 0 }} / {{ countTotalSlots(slot) }} استفاده‌شده</span>
              </div>

              <div class="mt-3">
                <p class="text-sm font-bold text-primary mb-2">روزهای ثبت‌شده:</p>
                <div class="space-y-2">
                  <div v-for="(pd, dateIdx) in slot.proposedDates" :key="dateIdx" class="bg-card-bg p-3 rounded border border-border-color">
                    <p class="font-bold text-light-green">{{ toJalali(new Date(pd.date)) }}</p>
                    <div class="text-xs text-text-secondary mt-1 flex flex-wrap gap-1">
                      <span v-for="(time, timeIdx) in pd.timeSlots" :key="timeIdx" :class="[
                        'px-2 py-1 rounded',
                        isSlotTaken(slot, pd, time) ? 'bg-error/20 text-error line-through' : 'bg-success/20 text-success'
                      ]">
                        {{ time }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div v-else class="text-center text-gray-400 py-8">
            هنوز اسلات دفاعی برای این ترم ثبت نشده است.
          </div>
        </div>

        <!-- Students List -->
        <div class="card">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-xl font-bold text-light-green">پروژه‌های تایید شده</h2>
            <button @click="scheduleAuto" class="btn-primary text-sm">🔄 زمان‌بندی خودکار پروژه‌های معلق</button>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead class="bg-dark-green border-b-2 border-dark-green">
                <tr>
                  <th class="px-4 py-3 text-right font-bold text-white">نام دانشجو</th>
                  <th class="px-4 py-3 text-right font-bold text-white">موضوع</th>
                  <th class="px-4 py-3 text-right font-bold text-white">استاد راهنما</th>
                  <th class="px-4 py-3 text-right font-bold text-white">استاد داور</th>
                  <th class="px-4 py-3 text-right font-bold text-white">تاریخ دفاع</th>
                  <th class="px-4 py-3 text-right font-bold text-white">ساعت دفاع</th>
                  <th class="px-4 py-3 text-right font-bold text-white">نمره</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="project in projects" :key="project._id" class="border-b border-dark-green/20 hover:bg-dark-green/10 transition">
                  <td class="px-4 py-3 text-right">{{ project.studentId?.firstName }} {{ project.studentId?.lastName }}</td>
                  <td class="px-4 py-3 text-right">{{ project.topic || '-' }}</td>
                  <td class="px-4 py-3 text-right">{{ project.advisorId?.lastName || '-' }}</td>
                  <td class="px-4 py-3 text-right">{{ project.examinerId?.lastName || '-' }}</td>
                  <td class="px-4 py-3 text-right">{{ formatDate(project.defenseDate) }}</td>
                  <td class="px-4 py-3 text-right">{{ project.defenseTime || '-' }}</td>
                  <td class="px-4 py-3 text-right">{{ project.grade || '-' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import api from '../api.js';
import { toJalali } from '../utils/dateUtils.js';

const year = ref(null);
const termHalf = ref('1');
const capacity = ref('');
const projects = ref([]);
const currentCapacity = ref(null);
const user = ref(JSON.parse(localStorage.getItem('user') || '{}'));
const defenseSlots = ref([]);
const slotFilterYear = ref(null);
const slotFilterTermHalf = ref('1');
const teachers = ref([]);
const advisorLimits = ref([]);
const router = useRouter();
const goBack = () => {
  if (window.history.length > 1) {
    router.back();
  } else {
    router.push('/');
  }
};

const countTotalSlots = (slot) => {
  return (slot.proposedDates || []).reduce((sum, pd) => sum + (pd.timeSlots || []).length, 0);
};

const isSlotTaken = (slot, pd, time) => {
  return (slot.approvedSlots || []).some(as => {
    if (!as.date || !pd.date) return false;
    const sameDay = new Date(as.date).toISOString().slice(0, 10) === new Date(pd.date).toISOString().slice(0, 10);
    return sameDay && as.time === time;
  });
};

const loadDefenseSlots = async () => {
  try {
    const term = `${slotFilterYear.value}-${slotFilterTermHalf.value}`;
    const res = await api.get(`/defense/slots?term=${encodeURIComponent(term)}`);
    defenseSlots.value = res.data;
  } catch (err) {
    console.error(err);
  }
};

const getJalaliYear = () => {
  try {
    const yFa = new Intl.DateTimeFormat('fa-IR-u-ca-persian', { year: 'numeric' }).format(new Date());
    const faDigits = '۰۱۲۳۴۵۶۷۸۹';
    const en = yFa.split('').map(ch => {
      const idx = faDigits.indexOf(ch);
      return idx >= 0 ? String(idx) : ch;
    }).join('');
    return parseInt(en, 10) || 1400;
  } catch {
    return 1404;
  }
};

const termString = (yearVal, half) => `${yearVal}-${half}`;

const termLabel = (term) => {
  if (!term) return '-';
  const [y, h] = String(term).split('-');
  return `${h === '2' ? 'بهمن' : 'مهر'} ${y}`;
};

const totalAdvisorLimit = computed(() => {
  return advisorLimits.value.reduce((sum, l) => sum + Number(l.limit || 0), 0);
});

const canSubmitCapacity = computed(() => {
  const hasCapacity = capacity.value !== '' && capacity.value !== null;
  return hasCapacity && Number(capacity.value) === totalAdvisorLimit.value;
});

const capacityNoteClass = computed(() => {
  return canSubmitCapacity.value ? 'text-success' : 'text-error';
});

const formatDate = (date) => {
  if (!date) return '-';
  return toJalali(date);
};

const formatTime = (date) => {
  if (!date) return '-';
  const d = new Date(date);
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
};

const setCapacity = async () => {
  try {
    const term = termString(year.value, termHalf.value);
    await api.post('/manager/capacity', {
      term,
      capacity: capacity.value,
      major: user.value.major,
      advisorLimits: advisorLimits.value.map(a => ({
        advisorId: a.advisorId,
        limit: a.limit
      }))
    });
    alert('ظرفیت ثبت شد');
    await loadCapacity();
  } catch (err) {
    alert(err.response?.data?.error || 'خطا');
  }
};

const loadTeachers = async () => {
  try {
    const res = await api.get('/manager/teachers');
    teachers.value = res.data;
    buildAdvisorLimits();
  } catch (err) {
    console.error(err);
  }
};

const buildAdvisorLimits = () => {
  const existing = currentCapacity.value?.advisorLimits || [];
  const existingMap = existing.reduce((acc, item) => {
    acc[String(item.advisorId)] = item;
    return acc;
  }, {});

  advisorLimits.value = teachers.value.map(t => {
    const match = existingMap[String(t._id)] || {};
    const limit = Number(match.limit || 0);
    const assigned = Number(match.assigned || 0);
    return {
      advisorId: t._id,
      firstName: t.firstName,
      lastName: t.lastName,
      limit,
      assigned
    };
  });
};

const loadCapacity = async () => {
  try {
    const term = termString(year.value, termHalf.value);
    const res = await api.get(`/manager/capacity?term=${encodeURIComponent(term)}`);
    currentCapacity.value = res.data && res.data.length ? res.data[0] : null;
    capacity.value = currentCapacity.value?.capacity ?? '';
    buildAdvisorLimits();
  } catch (err) {
    console.error(err);
  }
};

const loadProjects = async () => {
  try {
    const res = await api.get('/manager/projects');
    projects.value = res.data;
  } catch (err) {
    console.error(err);
  }
};

const scheduleAuto = async () => {
  try {
    const res = await api.post('/manager/schedule-unscheduled');
    alert(res.data?.message || 'زمان‌بندی انجام شد');
    await loadProjects();
  } catch (err) {
    alert(err.response?.data?.error || 'خطا در زمان‌بندی خودکار');
  }
};

onMounted(() => {
  year.value = getJalaliYear();
  slotFilterYear.value = year.value;
  capacity.value = '';
  loadProjects();
  loadTeachers();
  loadDefenseSlots();
});
</script>
