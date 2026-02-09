<template>
  <div class="min-h-screen bg-dark-bg px-4 py-8">
    <div class="max-w-5xl mx-auto">
      <div class="flex items-center justify-between mb-8">
        <h1 class="text-3xl font-bold text-primary">تعیین تاریخ دفاع</h1>
        <div class="flex gap-2">
          <button type="button" @click="refreshData" class="btn-primary" :disabled="loadingCapacity">
            {{ loadingCapacity ? 'در حال بارگیری...' : '🔄 به‌روزرسانی' }}
          </button>
          <button type="button" @click="goBack" class="btn-secondary">بازگشت</button>
        </div>
      </div>

      <div class="card">
        <!-- بررسی وضعیت ظرفیت -->
        <div v-if="!loadingCapacity && !capacityExists" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <strong class="font-bold">توجه!</strong>
          <p class="block mt-1">مدیر گروه هنوز ظرفیت‌های دفاع را برای این ترم تعیین نکرده است.</p>
          <p class="text-sm mt-2">تا زمانی که ظرفیت‌ها مشخص نشوند، نمی‌توانید تاریخ‌های پیشنهادی خود را اعلام کنید.</p>
          <p class="text-sm">لطفاً با مدیر گروه تماس بگیرید.</p>
        </div>

        <div v-else-if="!loadingCapacity && !canSubmitForUser" class="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
          <strong class="font-bold">توجه!</strong>
          <p class="block mt-1">شما در لیست داوران این ترم قرار ندارید یا ظرفیت شما تعیین نشده است.</p>
          <p class="text-sm mt-2">لطفاً با مدیر گروه تماس بگیرید.</p>
        </div>

        <h2 class="text-xl font-bold mb-4 text-primary">ارائه زمان های خالی برای دفاع</h2>
        <div class="space-y-3" v-if="capacityExists && canSubmitForUser">
          <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <h3 class="font-semibold text-blue-800 mb-2">اطلاعات ظرفیت و اسلات مورد نیاز</h3>
            <div class="grid md:grid-cols-2 gap-4 text-sm">
              <div>
                <p class="text-blue-700"><strong>حداقل اسلات لازم برای همه اساتید:</strong> {{ requiredSlots }} اسلات</p>
                <p class="text-blue-700"><strong>معادل ساعت:</strong> {{ requiredSlots/2 }} ساعت</p>
                <p class="text-blue-700"><strong>ظرفیت شما در این ترم:</strong> {{ userCapacity }} پروژه</p>
              </div>
              <div>
                <p class="text-green-700"><strong>اسلات فعلی شما:</strong> {{ currentUserSlots }} اسلات</p>
                <p class="text-green-700"><strong>ساعات فعلی شما:</strong> {{ currentUserSlots/2 }} ساعت</p>
                <p class="text-orange-600"><strong>اسلات در حال ورود:</strong> {{ enteredSlots }} اسلات</p>
              </div>
            </div>
            <div class="mt-2 p-2 bg-yellow-50 rounded border">
              <p class="text-xs text-gray-600">هر ساعت از ۲ اسلات نیم‌ساعته تشکیل شده است. بر اساس بیشترین ظرفیت بین اساتید، همه باید حداقل {{ requiredSlots }} اسلات پیشنهاد دهند.</p>
            </div>
          </div>

          <div class="bg-primary-lighter border border-primary-light/30 rounded-lg p-4 mb-4">
            <div class="grid md:grid-cols-3 gap-3">
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
              <div class="flex items-end gap-1">
                <button @click="refreshData" class="btn-secondary flex-1 h-10 text-sm" :disabled="loadingCapacity">
                  {{ loadingCapacity ? 'بارگیری...' : 'بررسی مجدد' }}
                </button>
                <button @click="testCapacity" class="btn-primary h-10 text-xs px-2" :disabled="loadingCapacity">
                  🧪 تست
                </button>
                <button @click="debugUser" class="btn-secondary h-10 text-xs px-2" :disabled="loadingCapacity">
                  🔍 کاربر
                </button>
              </div>
            </div>
            <p class="text-sm text-primary mt-2">ترم انتخابی: {{ termLabel }}</p>
            <p v-if="loadingCapacity" class="text-xs text-blue-600 mt-1">در حال بررسی وضعیت ظرفیت...</p>
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

          <button @click="submitDefenseSlots" class="btn-primary w-full" 
                  :disabled="!canSubmitSlots || !capacityExists || !canSubmitForUser">
            ثبت زمان های پیشنهادی
          </button>
          <p v-if="!canSubmitSlots && capacityExists && canSubmitForUser" class="text-xs text-red-400">
            شما باید حداقل {{ requiredSlots }} اسلات ({{ Math.ceil(requiredSlots/2) }} ساعت) ارائه دهید.
            اسلات در حال ورود: {{ enteredSlots }}
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
const currentUserSlots = ref(0);
const capacityExists = ref(false);
const canSubmitForUser = ref(false);
const userCapacity = ref(0);
const loadingCapacity = ref(false);
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
  return validSlots.length >= 1 && year.value && enteredSlots.value >= requiredSlots.value && capacityExists.value && canSubmitForUser.value;
});

const enteredSlots = computed(() => {
  const validSlots = defenseSlots.value.filter(s => s.date && s.startTime && s.endTime);
  return validSlots.reduce((sum, slot) => {
    if (!slot.startTime || !slot.endTime) return sum;
    const start = parseInt(slot.startTime.split(':')[0]) * 60 + parseInt(slot.startTime.split(':')[1]);
    const end = parseInt(slot.endTime.split(':')[0]) * 60 + parseInt(slot.endTime.split(':')[1]);
    const minutes = Math.max(0, end - start);
    return sum + Math.floor(minutes / 30); // هر 30 دقیقه = 1 اسلات
  }, 0);
});
const termLabel = computed(() => {
  if (!year.value) return 'سال را انتخاب کنید';
  const termName = termHalf.value === '2' ? 'بهمن' : 'مهر';
  return `${termName} ${year.value}`;
});

onMounted(() => {
  year.value = getJalaliYear();
  loadRequirements();
  // به‌روزرسانی خودکار هر 30 ثانیه
  setInterval(() => {
    if (year.value) {
      loadRequirements();
    }
  }, 30000);
});

watch([year, termHalf], () => {
  loadRequirements();
});

// تابع جدید برای به‌روزرسانی دستی
const refreshData = async () => {
  await loadRequirements();
};

// تابع تست ظرفیت
const testCapacity = async () => {
  try {
    if (!year.value) {
      alert('لطفاً سال را انتخاب کنید');
      return;
    }
    
    const term = `${year.value}-${termHalf.value}`;
    console.log('🧪 Testing capacity for term:', term);
    
    const res = await api.get(`/defense/test-capacity?term=${encodeURIComponent(term)}`);
    console.log('🧪 Test result:', res.data);
    
    alert(`نتیجه تست ظرفیت:\n
ترم: ${res.data.term}
رشته: ${res.data.major}
تعداد کل ظرفیت‌ها در دیتابیس: ${res.data.totalCapacitiesInDB}
ظرفیت مخصوص یافت شد: ${res.data.specificCapacityFound ? 'بله' : 'خیر'}
شما در لیست داوران: ${res.data.userInExaminerList ? 'بله' : 'خیر'}

تمام ظرفیت‌های موجود: ${res.data.allCapacities.map(c => `${c.term} (${c.major})`).join(', ')}`);
    
  } catch (err) {
    console.error('❌ خطا در تست ظرفیت:', err);
    alert('خطا در تست ظرفیت: ' + (err.response?.data?.error || err.message));
  }
};

// تابع debug اطلاعات کاربر
const debugUser = async () => {
  try {
    console.log('🔍 Debugging user info...');
    
    const res = await api.get('/defense/debug-user');
    console.log('🔍 Debug user result:', res.data);
    
    alert(`اطلاعات کاربر:\n
ID: ${res.data.user.id}
نام: ${res.data.user.firstName} ${res.data.user.lastName}
نقش: ${res.data.user.role}
رشته: ${res.data.user.major}
شماره ملی: ${res.data.user.nationalId}
Authorization Header: ${res.data.headers.authorization}`);
    
  } catch (err) {
    console.error('❌ خطا در debug کاربر:', err);
    alert('خطا در debug کاربر: ' + (err.response?.data?.error || err.message));
  }
};

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
    
    loadingCapacity.value = true;
    const term = `${year.value}-${termHalf.value}`;
    
    console.log('بررسی اطلاعات ظرفیت برای ترم:', term);
    
    // دریافت اطلاعات کامل ظرفیت و اسلات مورد نیاز
    const res = await api.get(`/defense/slot-requirements?term=${encodeURIComponent(term)}`);
    
    console.log('پاسخ دریافت شده:', res.data);
    
    capacityExists.value = res.data?.capacityExists ?? false;
    canSubmitForUser.value = res.data?.canSubmit ?? false;
    requiredSlots.value = res.data?.requiredSlots ?? 0;
    currentUserSlots.value = res.data?.mySlots ?? 0;
    userCapacity.value = res.data?.userCapacity ?? 0;
    
    console.log('وضعیت فعلی:', {
      capacityExists: capacityExists.value,
      canSubmitForUser: canSubmitForUser.value,
      requiredSlots: requiredSlots.value,
      currentUserSlots: currentUserSlots.value,
      userCapacity: userCapacity.value
    });
    
  } catch (err) {
    console.error('خطا در بارگیری اطلاعات ظرفیت:', err);
    console.error('پاسخ خطا:', err.response?.data);
    
    capacityExists.value = false;
    canSubmitForUser.value = false;
    requiredSlots.value = 0;
    currentUserSlots.value = 0;
    userCapacity.value = 0;
  } finally {
    loadingCapacity.value = false;
  }
}
async function submitDefenseSlots() {
  if (!canSubmitSlots.value) {
    if (!capacityExists.value) {
      alert('مدیر گروه هنوز ظرفیت‌های دفاع را برای این ترم تعیین نکرده است.');
      return;
    }
    if (!canSubmitForUser.value) {
      alert('شما در لیست داوران این ترم قرار ندارید یا ظرفیت شما تعیین نشده است.');
      return;
    }
    alert(`لطفا حداقل ${requiredSlots.value} اسلات (${Math.ceil(requiredSlots.value/2)} ساعت) وارد کنید. در حال حاضر ${enteredSlots.value} اسلات وارد کرده‌اید.`);
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
    
    // به‌روزرسانی اطلاعات بعد از ثبت موفق
    await loadRequirements();
    
    alert(`زمان‌های خالی برای ${proposedDates.length} روز در ترم ${termLabel.value} ثبت شد. ${res.data?.message || ''}`);

    defenseSlots.value = [
      { date: '', startTime: '', endTime: '' }
    ];
  } catch (err) {
    const errorMsg = err.response?.data?.error || 'خطا در ثبت';
    alert(errorMsg);
    console.error('خطا در ثبت زمان‌های دفاع:', err);
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
