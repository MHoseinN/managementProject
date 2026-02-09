<template>
  <div class="min-h-screen bg-dark-bg px-4 py-8">
    <div class="max-w-4xl mx-auto">
      <!-- Header with Back Button -->
      <div class="flex items-center justify-between mb-6">
        <h1 class="text-3xl font-bold text-warning">جزئیات دانشجو</h1>
        <button @click="goBack" class="btn-secondary">
          ← بازگشت
        </button>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="card">
        <p class="text-center text-text-secondary">در حال بارگذاری...</p>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="card bg-accent/20 border-accent">
        <p class="text-accent">{{ error }}</p>
      </div>

      <!-- Main Content -->
      <div v-else-if="project" class="space-y-6">
        <!-- Student Information Card -->
        <div class="card">
          <h2 class="text-xl font-bold mb-4 text-primary flex items-center">
            <span class="ml-2">📋</span>
            اطلاعات دانشجو
            <span class="mr-3 bg-dark-green/20 text-light-green px-3 py-1 rounded text-sm"
              v-if="project.studentId?.studentNumber">
              کد دانشجویی: {{ project.studentId.studentNumber }}
            </span>
          </h2>
          <div class="grid md:grid-cols-2 gap-4">
            <div class="bg-primary-lighter p-3 rounded border border-primary-light/30">
              <p class="text-sm text-text-secondary mb-1">نام و نام خانوادگی</p>
              <p class="font-bold text-lg">{{ project.studentId?.firstName }} {{ project.studentId?.lastName }}</p>
            </div>
            <div class="bg-primary-lighter p-3 rounded border border-primary-light/30">
              <p class="text-sm text-text-secondary mb-1">شماره دانشجویی</p>
              <p class="font-bold">{{ project.studentId?.studentNumber || 'نامشخص' }}</p>
            </div>
            <div class="bg-primary-lighter p-3 rounded border border-primary-light/30">
              <p class="text-sm text-text-secondary mb-1">رشته تحصیلی</p>
              <p class="font-bold">{{ getMajorName(project.studentId?.major) }}</p>
            </div>
            <div class="bg-primary-lighter p-3 rounded border border-primary-light/30">
              <p class="text-sm text-text-secondary mb-1">ترم</p>
              <p class="font-bold">{{ getTermName(project.term) }}</p>
            </div>
          </div>
        </div>

        <!-- Project Status Card -->
        <div class="card">
          <h2 class="text-xl font-bold mb-4 text-primary flex items-center">
            <span class="ml-2">📈</span>
            وضعیت پروژه
          </h2>
          <div class="bg-primary-lighter p-4 rounded border border-primary-light/30">
            <div class="flex items-center justify-between mb-3">
              <span class="text-text-secondary">وضعیت فعلی:</span>
              <span :class="getStatusClass(project.status)" class="px-4 py-2 rounded-lg font-bold">
                {{ getStatusText(project.status) }}
              </span>
            </div>
            <div v-if="project.topic" class="border-t border-primary-light/50 pt-3 mt-3">
              <p class="text-lg font-bold text-text-primary bg-success-light p-3 rounded border-l-4 border-success">
                <span class="text-primary">عنوان موضوع تایید شده:</span> {{ project.topic }}
              </p>
            </div>
            <div v-if="project.defenseDate || project.defenseTime" class="border-t border-primary-light/50 pt-3 mt-3">
              <div class="bg-warning-light p-4 rounded border-2 border-warning">
                <p class="text-sm text-text-secondary mb-2">📅 زمان دفاع:</p>
                <div class="text-lg font-bold text-warning">
                  <p v-if="project.defenseDate">
                    {{ formatDefenseDate(project.defenseDate, project.defenseTime) }}
                  </p>
                  <p v-else class="text-gray-400">تاریخ دفاع هنوز مشخص نشده</p>
                </div>
              </div>
            </div>
            <div v-if="project.grade" class="border-t border-primary-light/50 pt-3 mt-3">
              <p class="text-sm text-text-secondary mb-1">نمره:</p>
              <p class="font-bold text-warning text-2xl">{{ project.grade }}</p>
            </div>
          </div>
        </div>

        <!-- Proposed Topics Card -->
        <div class="card">
          <h2 class="text-xl font-bold mb-4 text-light-green flex items-center">
            <span class="ml-2">💡</span>
            موضوعات پیشنهادی دانشجو
          </h2>

          <!-- No Topics State -->
          <div v-if="!project.proposedTopics || project.proposedTopics.length === 0"
            class="bg-yellow-900/20 border border-yellow-600/30 rounded-lg p-4">
            <p class="text-yellow-400">دانشجو هنوز موضوعی پیشنهاد نداده است.</p>
          </div>

          <!-- Topics List -->
          <div v-else class="space-y-3">
            <div v-for="(topic, index) in project.proposedTopics" :key="index" :class="[
              'rounded-lg p-4 transition border-2',
              project.topic === topic.name
                ? 'bg-success-light border-success shadow-lg'
                : 'bg-primary-lighter border-primary-light/30 hover:bg-primary-light/10'
            ]">
              <div class="flex items-start justify-between">
                <div class="flex-1">
                  <div class="flex items-center mb-2">
                    <span :class="[
                      'font-bold px-3 py-1 rounded-full text-sm ml-3',
                      project.topic === topic.name
                        ? 'bg-success text-white'
                        : 'bg-primary text-white'
                    ]">
                      موضوع {{ index + 1 }}
                    </span>
                    <span v-if="project.topic === topic.name"
                      class="bg-success text-white px-3 py-1 rounded-full text-sm font-bold">
                      ✓ تایید شده
                    </span>
                  </div>
                  <p
                    :class="['text-lg font-bold leading-relaxed mb-2', project.topic === topic.name ? 'text-text-primary' : 'text-primary']">
                    {{ topic.name }}
                  </p>
                  <p class="text-sm text-text-secondary leading-relaxed">{{ topic.description }}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Topic Approval Form (Only if no topic selected yet) -->
          <div v-if="!project.topic && project.proposedTopics && project.proposedTopics.length > 0"
            class="mt-6 bg-orange/10 border border-orange/30 rounded-lg p-4">
            <h3 class="font-bold text-orange mb-3">انتخاب و تایید موضوع</h3>

            <div class="space-y-3">
              <div>
                <label class="block text-sm font-bold mb-2">موضوع را انتخاب کنید:</label>
                <select v-model="selectedTopic"
                  class="w-full bg-dark-bg border border-dark-green/50 px-4 py-3 rounded-lg">
                  <option value="">-- یکی از موضوعات پیشنهادی را انتخاب کنید --</option>
                  <option v-for="(topic, index) in project.proposedTopics" :key="index" :value="topic.name">
                    موضوع {{ index + 1 }}: {{ topic.name }}
                  </option>
                </select>
              </div>

              <!-- Custom Topic Input (Optional) -->
              <div>
                <label class="block text-sm font-bold mb-2">یا موضوع سفارشی وارد کنید:</label>
                <textarea v-model="customTopic" rows="3" placeholder="در صورت نیاز می‌توانید موضوع جدیدی وارد کنید..."
                  class="w-full bg-dark-bg border border-dark-green/50 px-4 py-3 rounded-lg resize-none"></textarea>
              </div>

              <!-- Action Buttons -->
              <div class="flex gap-3">
                <button @click="approveTopic" :disabled="!canApprove" class="btn-primary flex-1"
                  :class="{ 'opacity-50 cursor-not-allowed': !canApprove }">
                  ✓ تایید موضوع
                </button>
                <button @click="rejectTopics"
                  class="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-bold transition">
                  ✗ رد همه موضوعات
                </button>
              </div>

              <p v-if="!canApprove" class="text-xs text-yellow-400">
                لطفاً یکی از موضوعات پیشنهادی را انتخاب کنید یا موضوع سفارشی وارد کنید.
              </p>
            </div>
          </div>

          <!-- Already Approved Message -->
          <div v-if="project.topic" class="mt-4 bg-success-light border border-success rounded-lg p-4">
            <p class="text-success font-bold mb-2">✓ موضوع این پروژه قبلاً تایید شده است</p>
            <p class="text-sm text-text-secondary">موضوع تایید شده:</p>
            <p class="font-bold text-primary mt-2">{{ project.topic }}</p>
          </div>
        </div>

        <!-- Team Information Card -->
        <div class="card">
          <h2 class="text-xl font-bold mb-4 text-light-green flex items-center">
            <span class="ml-2">👥</span>
            تیم راهنمایی و داوری
          </h2>
          <div class="grid md:grid-cols-2 gap-4">
            <div class="bg-dark-green/10 p-3 rounded">
              <p class="text-sm text-gray-400 mb-1">استاد راهنما</p>
              <p class="font-bold">{{ project.advisorId?.firstName }} {{ project.advisorId?.lastName }}</p>
            </div>
            <div class="bg-dark-green/10 p-3 rounded">
              <p class="text-sm text-gray-400 mb-1">استاد داور</p>
              <p class="font-bold">{{ project.examinerId?.firstName }} {{ project.examinerId?.lastName }}</p>
            </div>
          </div>
        </div>

        <!-- Reports List -->
        <div class="card">
          <h2 class="text-xl font-bold mb-4 text-primary flex items-center">
            <span class="ml-2">📝</span>
            گزارش‌های دانشجو
          </h2>
          <ReportList
            :reports="reports"
            :format-date="toJalaliWithWeekDay"
            empty-text="گزارشی ثبت نشده است."
            untitled-text="بدون عنوان"
            no-description-text="بدون توضیح"
            download-text="دانلود فایل"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import api from '../api.js';
import { toJalali, formatDefenseDate, toFullPersianDate } from '../utils/dateUtils.js';
import ReportList from '../components/ReportList.vue';


const project = ref(null);
const loading = ref(true);
const error = ref(null);
const selectedTopic = ref('');
const customTopic = ref('');
const reports = ref([]);
const route = useRoute();
const router = useRouter();

const canApprove = computed(() => {
  return selectedTopic.value.trim() !== '' || customTopic.value.trim() !== '';
});

onMounted(() => {
  loadProjectDetails();
  // toJalali(date)
});

async function loadProjectDetails() {
  try {
    loading.value = true;
    error.value = null;

    const projectId = route.params.projectId;
    console.log('Loading project with ID:', projectId);
    console.log('Route params:', route.params);

    const response = await api.get(`/projects/${projectId}`);
    project.value = response.data;
    console.log('Project loaded:', project.value);
    console.log('Project topic:', project.value.topic);
    console.log('Project status:', project.value.status);
    await loadReports();

  } catch (err) {
    console.error('Error loading project:', err);
    console.error('Error response:', err.response);
    error.value = err.response?.data?.error || 'خطا در بارگذاری اطلاعات پروژه';
  } finally {
    loading.value = false;
  }
}
async function loadReports() {
  try {
    if (!project.value?._id) return;
    const res = await api.get(`/reports/project/${project.value._id}`);
    reports.value = res.data;
  } catch (err) {
    console.error('Error loading reports:', err);
  }
}
async function approveTopic() {
  if (!canApprove.value) return;

  const topicToApprove = customTopic.value.trim() || selectedTopic.value;

  try {
    await api.post('/projects/approve-topic', {
      projectId: project.value._id,
      topic: topicToApprove
    });

    alert('موضوع با موفقیت تایید شد ✓');

    // Reset form
    selectedTopic.value = '';
    customTopic.value = '';

    // Reload to show updated data
    await loadProjectDetails();

  } catch (err) {
    console.error('Error approving topic:', err);
    alert(err.response?.data?.error || 'خطا در تایید موضوع');
  }
}
async function rejectTopics() {
  if (!confirm('آیا از رد همه موضوعات پیشنهادی اطمینان دارید؟ دانشجو باید موضوعات جدید ارسال کند.')) {
    return;
  }

  try {
    await api.post('/projects/reject-topics', {
      projectId: project.value._id
    });

    alert('موضوعات رد شدند. دانشجو باید موضوعات جدید ارسال کند.');
    await loadProjectDetails();

  } catch (err) {
    console.error('Error rejecting topics:', err);
    alert(err.response?.data?.error || 'خطا در رد موضوعات');
  }
}
function goBack() {
  router.push('/teacher');
}
function getMajorName(major) {
  const majors = {
    'computer': 'کامپیوتر',
    'electrical': 'برق',
    'mechanical': 'مکانیک',
    'civil': 'عمران'
  };
  return majors[major] || major;
}
function getTermName(term) {
  if (!term) return 'نامشخص';
  const [year, semester] = term.split('-');
  const semesterName = semester === '2' ? 'بهمن' : 'مهر';
  return `${semesterName} ${year}`;
}
function getStatusText(status) {
  const statusMap = {
    'pending': 'در انتظار تایید',
    'active': 'فعال',
    'topic_approved': 'موضوع تایید شده',
    'scheduled': 'زمان دفاع تعیین شده',
    'defended': 'دفاع شده',
    'graded': 'نمره‌گذاری شده'
  };
  return statusMap[status] || status;
}
function getStatusClass(status) {
  const classMap = {
    'pending': 'bg-yellow-600/20 text-yellow-400',
    'active': 'bg-blue-600/20 text-blue-400',
    'topic_approved': 'bg-green-600/20 text-green-400',
    'scheduled': 'bg-purple-600/20 text-purple-400',
    'defended': 'bg-orange-600/20 text-orange-400',
    'graded': 'bg-green-700/20 text-green-300'
  };
  return classMap[status] || 'bg-gray-600/20 text-gray-400';
}

</script>
