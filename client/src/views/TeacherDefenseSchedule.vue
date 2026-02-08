<template>
  <div class="min-h-screen bg-dark-bg px-4 py-8">
    <div class="max-w-5xl mx-auto">
      <div class="flex items-center justify-between mb-8">
        <h1 class="text-3xl font-bold text-primary">تعیین تاریخ دفاع</h1>
        <button type="button" @click="goBack" class="btn-secondary">بازگشت</button>
      </div>

      <div class="card">
        <h2 class="text-xl font-bold mb-4 text-primary">ارائه زمان های خالی برای دفاع</h2>
        <div class="space-y-3">
          <h3 class="font-semibold text-warning">حداقل اسلات لازم بر اساس ظرفیت ترم</h3>
          <p class="text-xs text-text-secondary">حداقل مجموع اسلات همه اساتید باید برابر با بیشترین ظرفیت استاد در ترم باشد.</p>
          <div class="text-sm text-primary">مجموع اسلات ثبت شده: {{ totalSlots }} / حداقل لازم: {{ requiredSlots }}</div>

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
              <button v-if="defenseSlots.length > 1" @click="removeSlot(index)"
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

          <button @click="addSlot" class="btn-secondary w-full">+ افزودن روز جدید</button>

          <button @click="submitDefenseSlots" class="btn-primary w-full" :disabled="!canSubmitSlots">
            ثبت زمان های پیشنهادی
          </button>
          <p v-if="!canSubmitSlots" class="text-xs text-red-400">
            برای تایید، مجموع اسلات باید حداقل {{ requiredSlots }} باشد. 
            در حال حاضر: {{ totalSlots }} اسلات موجود است.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import api from '../api.js';
import { inputToJalali } from '../utils/dateUtils.js';

const year = ref(null);
const termHalf = ref('1');
const defenseSlots = ref([
  { date: '', startTime: '', endTime: '' }
]);
const requiredSlots = ref(0);
const totalSlots = ref(0);
const router = useRouter();
const goBack = () => {
  if (window.history.length > 1) {
    router.back();
  } else {
    router.push('/teacher');
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
  const slotsCount = validSlots.reduce((sum, slot) => {
    const start = parseInt(slot.startTime.split(':')[0]);
    const end = parseInt(slot.endTime.split(':')[0]);
    return sum + Math.max(0, end - start);
  }, 0);
  return validSlots.length >= 1 && year.value && (totalSlots.value + slotsCount) >= requiredSlots.value;
});
const termLabel = computed(() => {
  if (!year.value) return 'سال را انتخاب کنید';
  const termName = termHalf.value === '2' ? 'بهمن' : 'مهر';
  return `${termName} ${year.value}`;
});

onMounted(() => {
  year.value = getJalaliYear();
  loadRequirements();
});

watch([year, termHalf], () => {
  loadRequirements();
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
function addSlot() {
  defenseSlots.value.push({ date: '', startTime: '', endTime: '' });
}
function removeSlot(index) {
  if (defenseSlots.value.length > 1) {
    defenseSlots.value.splice(index, 1);
  }
}
async function loadRequirements() {
  try {
    if (!year.value) return;
    const term = `${year.value}-${termHalf.value}`;
    const res = await api.get(`/defense/slot-requirements?term=${encodeURIComponent(term)}`);
    requiredSlots.value = res.data?.requiredSlots ?? 0;
    totalSlots.value = res.data?.totalSlots ?? 0;
  } catch (err) {
    requiredSlots.value = 0;
    totalSlots.value = 0;
    console.error(err);
  }
}
async function submitDefenseSlots() {
  if (!canSubmitSlots.value) {
    alert('لطفا حداقل یک بازه کامل وارد کنید');
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

    const res = await api.post('/defense/slots', { term, proposedDates });
    requiredSlots.value = res.data?.requiredSlots ?? requiredSlots.value;
    totalSlots.value = res.data?.totalSlots ?? totalSlots.value;
    alert(`زمان های خالی برای ${proposedDates.length} روز در ترم ${termLabel.value} ثبت شد`);

    defenseSlots.value = [
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
</script>
