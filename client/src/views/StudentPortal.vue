<template>
  <div class="min-h-screen bg-dark-bg px-4 py-8">
    <div class="max-w-4xl mx-auto">
      <div class="flex items-center justify-between mb-8">
        <h1 class="text-3xl font-bold text-orange">پورتال دانشجو</h1>
        <button type="button" @click="goBack" class="btn-secondary">بازگشت</button>
      </div>

      <div class="grid gap-6">
        <!-- Project Status (hidden after approval) -->
        <div v-if="project && !isTopicApproved" class="card">
          <h2 class="text-xl font-bold mb-4 text-light-green">وضعیت پروژه</h2>
          <div class="space-y-2">
            <p><span class="text-orange">موضوع تایید شده:</span> {{ approvedTopicTitle || 'منتظر تایید استاد راهنما' }}
            </p>
            <p><span class="text-orange">وضعیت:</span> {{ statusLabel }}</p>
            <p><span class="text-orange">استاد راهنما:</span> {{ project.advisorId?.lastName || '-' }}</p>
            <p><span class="text-orange">استاد داور:</span> {{ project.examinerId?.lastName || '-' }}</p>
            <p><span class="text-orange">تاریخ و ساعت دفاع:</span>
              <span v-if="project.defenseDate" class="text-warning font-bold">
                {{ formatDefenseDate(project.defenseDate, project.defenseTime) }}
              </span>
              <span v-else class="text-gray-400">مشخص نشده</span>
            </p>
            <p v-if="project.grade"><span class="text-orange">نمره نهایی:</span> {{ project.grade }}</p>
          </div>
        </div>

        <!-- Enrollment (when no project yet) -->
        <div v-if="!project" class="card">
          <h2 class="text-xl font-bold mb-4 text-light-green">اخذ پروژه</h2>
          <div class="grid md:grid-cols-4 gap-3 mb-3">
            <div>
              <label class="block text-sm mb-1">سال</label>
              <input v-model="year" type="number" min="1390" max="1500" placeholder="مثلاً 1404"
                class="w-full bg-card-bg border border-border-color px-3 py-2 rounded">
            </div>
            <div>
              <label class="block text-sm mb-1">ترم</label>
              <select v-model="termHalf" class="w-full bg-card-bg border border-border-color px-3 py-2 rounded">
                <option value="1">مهر</option>
                <option value="2">بهمن</option>
              </select>
            </div>
            <div>
              <label class="block text-sm mb-1">استاد راهنما</label>
              <select v-model="selectedAdvisorId" class="w-full bg-card-bg border border-border-color px-3 py-2 rounded">
                <option value="">انتخاب کنید</option>
                <option
                  v-for="advisor in advisorOptions"
                  :key="advisor.advisorId"
                  :value="advisor.advisorId"
                  :disabled="advisor.remaining <= 0"
                >
                  {{ advisor.firstName }} {{ advisor.lastName }} (باقی‌مانده: {{ advisor.remaining }})
                </option>
              </select>
            </div>
            <div class="flex items-end">
              <button @click="enrollProject" class="btn-primary w-full">اخذ پروژه</button>
            </div>
          </div>
          <p class="text-sm text-gray-500">ترم انتخابی: {{ selectedTermLabel }}</p>
          <p v-if="advisorOptions.length === 0" class="text-xs text-text-secondary mt-2">ظرفیت اساتید برای این ترم ثبت نشده است.</p>
        </div>

        <!-- Proposed Topics -->
        <div v-if="project" class="card">
          <h2 class="text-xl font-bold mb-4 text-primary">موضوعات پیشنهادی</h2>

          <!-- Topic submission form (only if topic not approved) -->
          <div
            v-if="project && !isTopicApproved && (project.status === 'active' || project.status === 'topic_submitted')"
            class="space-y-4">
            <div class="text-sm text-text-secondary mb-4">
              حداقل دو موضوع با توضیحات کوتاه وارد کنید. می‌توانید موضوعات بیشتری اضافه کنید و ترتیب نمایش اولویت را
              مشخص می‌کند.
            </div>

            <div class="space-y-4">
              <div v-for="(topic, index) in topicsForm" :key="index"
                class="bg-primary-lighter border border-primary-light/40 rounded-lg p-4">
                <div class="flex items-center justify-between mb-3">
                  <div class="flex items-center gap-2">
                    <span class="bg-primary text-white text-xs px-3 py-1 rounded-full">اولویت {{ index + 1 }}</span>
                    <span class="text-xs text-text-secondary">(موضوع {{ index + 1 }})</span>
                    <span v-if="topic.name && topic.name.trim()"
                      class="bg-success text-white text-xs px-2 py-1 rounded">✓ پر شده</span>
                  </div>
                  <button v-if="topicsForm.length > 2" @click="removeTopic(index)"
                    class="text-error text-sm hover:underline">
                    حذف
                  </button>
                </div>

                <div class="mb-3">
                  <label class="block text-sm font-bold mb-1">عنوان موضوع</label>
                  <input v-model="topic.name" type="text" placeholder="مثلاً سیستم مدیریت هوشمند"
                    class="w-full bg-white border border-border-color px-3 py-2 rounded" />
                </div>

                <div>
                  <label class="block text-sm font-bold mb-1">توضیحات</label>
                  <textarea v-model="topic.description" rows="3" placeholder="توضیح کوتاه درباره موضوع"
                    class="w-full bg-white border border-border-color px-3 py-2 rounded resize-none"></textarea>
                </div>
              </div>
              <div class="flex gap-3">
                <button @click="addTopic" class="btn-secondary">+ افزودن موضوع</button>
                <button @click="submitTopics" class="btn-primary" :disabled="!canSubmitTopics"
                  :class="{ 'opacity-50 cursor-not-allowed': !canSubmitTopics }">
                  ارسال موضوعات پیشنهادی
                </button>
              </div>

              <div class="flex gap-2 items-center">
                <p class="text-xs text-text-secondary">حداقل دو موضوع لازم است. ترتیب نمایش، اولویت را مشخص می‌کند.</p>
                <p v-if="!canSubmitTopics" class="text-xs text-error">
                  ({{topicsForm.filter(t => t.name && t.name.trim()).length}}/2 موضوع معتبر)
                </p>
              </div>
            </div>
          </div>

          <!-- Approved topic detail card -->
          <div v-else-if="isTopicApproved" class="bg-success-light border-2 border-success rounded-lg p-6">
            <div class="flex items-center mb-4">
              <span class="text-3xl ml-3">✓</span>
              <h3 class="text-2xl font-bold text-success">موضوع نهایی تایید شده</h3>
            </div>

            <div class="space-y-4">
              <div class="bg-white rounded p-4 border border-success/30">
                <p class="text-sm text-text-secondary mb-2">عنوان موضوع:</p>
                <p class="text-xl font-bold text-primary">{{ approvedTopicTitle }}</p>
              </div>

              <div v-if="approvedTopicDescription" class="bg-white rounded p-4 border border-success/30">
                <p class="text-sm text-text-secondary mb-2">توضیحات:</p>
                <p class="text-text-primary leading-relaxed">{{ approvedTopicDescription }}</p>
              </div>

              <div class="grid md:grid-cols-2 gap-4">
                <div class="bg-white rounded p-4 border border-success/30">
                  <p class="text-sm text-text-secondary mb-2">استاد راهنما:</p>
                  <p class="font-bold text-primary">{{ project.advisorId?.firstName }} {{ project.advisorId?.lastName }}
                  </p>
                </div>
                <div class="bg-white rounded p-4 border border-success/30">
                  <p class="text-sm text-text-secondary mb-2">استاد داور:</p>
                  <p class="font-bold text-primary">{{ project.examinerId?.firstName }} {{ project.examinerId?.lastName
                  }}</p>
                </div>
              </div>

              <div class="bg-warning-light rounded p-4 border-2 border-warning">
                <p class="text-sm text-text-secondary mb-2">زمان دفاع:</p>
                <div class="text-lg font-bold text-warning">
                  <p v-if="project.defenseDate">
                    {{ formatDefenseDate(project.defenseDate, project.defenseTime) }}
                  </p>
                  <p v-else class="text-gray-400">تاریخ دفاع هنوز مشخص نشده</p>
                </div>
              </div>

              <div v-if="project.grade" class="bg-primary-lighter rounded p-4 border-2 border-primary">
                <p class="text-sm text-text-secondary mb-2">نمره نهایی:</p>
                <p class="text-3xl font-bold text-primary">{{ project.grade }}</p>
              </div>

              <div class="bg-white rounded p-4 border border-success/30">
                <div class="flex items-center justify-between mb-3">
                  <div>
                    <p class="text-sm text-text-secondary mb-1">گزارش‌های ارسال‌شده</p>
                    <p class="text-xs text-text-secondary">پس از تایید موضوع می‌توانید گزارش متنی یا فایل بارگذاری کنید.
                    </p>
                  </div>
                  <span class="text-xs bg-success-light text-success px-3 py-1 rounded-full">قابل مشاهده برای استاد
                    راهنما</span>
                </div>

                <div class="mb-4 max-h-48 overflow-y-auto">
                  <ReportList
                    :reports="reports"
                    :format-date="toJalaliWithWeekDay"
                    empty-text="هنوز گزارشی ثبت نشده است."
                    untitled-text="بدون عنوان"
                    no-description-text="بدون توضیح"
                    download-text="دانلود فایل"
                  />
                </div>

                <div class="grid gap-3">
                  <div>
                    <label class="block text-sm font-bold mb-1">عنوان گزارش</label>
                    <input v-model="reportTitle" class="w-full bg-white border border-border-color px-3 py-2 rounded"
                      placeholder="مثلاً پیشرفت فاز اول">
                  </div>
                  <div>
                    <label class="block text-sm font-bold mb-1">توضیحات</label>
                    <textarea v-model="reportDescription" rows="3"
                      class="w-full bg-white border border-border-color px-3 py-2 rounded resize-none"
                      placeholder="خلاصه پیشرفت یا نکات مهم"></textarea>
                  </div>
                  <div>
                    <label class="block text-sm font-bold mb-1">فایل (اختیاری)</label>
                    <input type="file" @change="onReportFileChange" class="w-full text-sm"
                      accept=".pdf,.doc,.docx,.ppt,.pptx,.zip">
                  </div>
                  <button @click="submitReport" class="btn-primary" :disabled="!canSubmitReport"
                    :class="{ 'opacity-50 cursor-not-allowed': !canSubmitReport }">ارسال گزارش</button>
                </div>
              </div>
            </div>
          </div>

          <!-- Submitted topics list (when topic not approved yet) -->
          <div v-if="!isTopicApproved && project?.proposedTopics?.length"
            class="mt-6 border-t border-border-color pt-4">
            <h3 class="text-lg font-bold text-primary mb-3">موضوعات ارسال شده</h3>
            <div class="space-y-3">
              <div v-for="pt in sortedProposedTopics" :key="pt.priority"
                class="border border-border-color rounded p-3 bg-hover-bg">
                <div class="flex items-center justify-between mb-2">
                  <span class="text-sm text-text-secondary">اولویت {{ pt.priority }}</span>
                  <span v-if="project.topic === pt.name" class="text-success font-bold">✓ تایید شده</span>
                </div>
                <p class="font-bold text-primary mb-1">{{ pt.name }}</p>
                <p class="text-sm text-text-secondary">{{ pt.description || 'بدون توضیح' }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Messages -->
        <div class="card">
          <h2 class="text-xl font-bold mb-4 text-primary">پیام‌ها</h2>

          <div class="space-y-4 mb-4">
            <MessageThread
              v-if="managerMessages.length"
              title="گفتگو با مدیر گروه"
              count-label="پیام"
              from-label="از"
              :messages="managerMessages"
            />

            <MessageThread
              v-if="advisorMessages.length"
              title="گفتگو با استاد راهنما"
              count-label="پیام"
              from-label="از"
              :messages="advisorMessages"
            />

            <MessageThread
              v-if="examinerMessages.length"
              title="گفتگو با استاد داور"
              count-label="پیام"
              from-label="از"
              :messages="examinerMessages"
            />
          </div>

          <div class="grid md:grid-cols-3 gap-3 mb-3">
            <div class="md:col-span-1">
              <label class="block text-sm font-bold mb-1">گیرنده</label>
              <select v-model="messageTargetRole" class="w-full bg-white border border-border-color px-3 py-2 rounded">
                <option value="advisor">استاد راهنما</option>
                <option value="examiner">استاد داور</option>
                <option value="manager">مدیر گروه</option>
              </select>
            </div>
            <div class="md:col-span-2">
              <label class="block text-sm font-bold mb-1">متن پیام</label>
              <input v-model="newMessage" placeholder="پیام جدید..."
                class="w-full bg-white border border-border-color px-3 py-2 rounded">
            </div>
          </div>

          <button @click="sendMessage" class="btn-primary">ارسال</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import api from '../api.js';
import { 
  toJalali, 
  toJalaliWithWeekDay, 
  formatDefenseDate,
  toFullPersianDate 
} from '../utils/dateUtils.js';
import MessageThread from '../components/MessageThread.vue';
import ReportList from '../components/ReportList.vue';
import { useNavigation, useJalaliYear, useProjectStatus, useTermLabel } from '../composables/useCommon.js';

const { goBack } = useNavigation();
const { getJalaliYear } = useJalaliYear();
const { getStatusText } = useProjectStatus();
const { termLabel, termString } = useTermLabel();
const project = ref(null);
const reports = ref([]);
const messages = ref([]);
const newMessage = ref('');
const messageTargetRole = ref('advisor');
const topicsForm = ref([
  { name: '', description: '', priority: 1 },
  { name: '', description: '', priority: 2 }
]);
const year = ref(null);
const termHalf = ref('1');
const advisorOptions = ref([]);
const selectedAdvisorId = ref('');
const reportTitle = ref('');
const reportDescription = ref('');
const reportFile = ref(null);

onMounted(() => {
  loadProject();
  loadMessages();
  year.value = getJalaliYear();
  loadAdvisorOptions();
});

watch([year, termHalf], () => {
  loadAdvisorOptions();
});

const canSubmitTopics = computed(() => {
  const filled = topicsForm.value.filter(t => t.name && t.name.trim());
  return filled.length >= 2;
});
const sortedProposedTopics = computed(() => {
  if (!project.value?.proposedTopics) return [];
  return [...project.value.proposedTopics].sort((a, b) => (a.priority || 0) - (b.priority || 0));
});
const approvedTopicTitle = computed(() => {
  if (!project.value?.topic) return '';
  const topicVal = (project.value.topic || '').trim();
  const pts = project.value.proposedTopics || [];
  const byName = pts.find(t => t.name && t.name.trim() === topicVal);
  if (byName) return byName.name;
  const byDesc = pts.find(t => t.description && t.description.trim() === topicVal);
  if (byDesc) return byDesc.name || topicVal;
  if (project.value.status === 'topic_approved' && pts.length > 0) {
    return pts[0].name || topicVal;
  }
  return topicVal;
});
const statusLabel = computed(() => {
  return getStatusText(project.value?.status);
});
const isTopicApproved = computed(() => {
  const approvedStatuses = ['topic_approved', 'scheduled', 'defended', 'graded'];
  return approvedStatuses.includes(project.value?.status);
});
const canSubmitReport = computed(() => {
  const approved = isTopicApproved.value;
  const hasContent =
    (reportTitle.value && reportTitle.value.trim()) ||
    (reportDescription.value && reportDescription.value.trim()) ||
    reportFile.value;
  return approved && !!hasContent;
});
const approvedTopicDescription = computed(() => {
  if (!project.value?.topic) return '';
  const topicVal = (project.value.topic || '').trim();
  const pts = project.value.proposedTopics || [];
  const byName = pts.find(t => t.name && t.name.trim() === topicVal);
  if (byName) return byName.description || '';
  const byDesc = pts.find(t => t.description && t.description.trim() === topicVal);
  if (byDesc) return byDesc.description || '';
  if (project.value.status === 'topic_approved' && pts.length > 0) {
    return pts[0].description || '';
  }
  return '';
});
const managerMessages = computed(() => filterMessagesById(project.value?.managerId));
const advisorMessages = computed(() => filterMessagesById(project.value?.advisorId));
const examinerMessages = computed(() => filterMessagesById(project.value?.examinerId));
const selectedTermLabel = computed(() => termLabel(termString(year.value, termHalf.value)));
function getId(val) {
  return val?._id || val || null;
}
function filterMessagesById(target) {
  const targetId = getId(target);
  if (!targetId) return [];
  return messages.value.filter(msg => {
    const sId = getId(msg.senderId);
    const rId = getId(msg.receiverId);
    return sId === targetId || rId === targetId;
  });
}
async function enrollProject() {
  try {
    const term = termString(year.value, termHalf.value);
    if (!selectedAdvisorId.value) {
      alert('استاد راهنما را انتخاب کنید');
      return;
    }
    const res = await api.post('/projects/enroll', { term, advisorId: selectedAdvisorId.value });
    project.value = res.data;
  } catch (err) {
    alert(err.response?.data?.error || 'خطا');
  }
}
async function loadAdvisorOptions() {
  try {
    const term = termString(year.value, termHalf.value);
    if (!term) return;
    const res = await api.get(`/projects/advisor-options?term=${encodeURIComponent(term)}`);
    advisorOptions.value = res.data?.advisors || [];
    const stillValid = advisorOptions.value.find(a => String(a.advisorId) === String(selectedAdvisorId.value) && a.remaining > 0);
    if (!stillValid) {
      selectedAdvisorId.value = '';
    }
  } catch (err) {
    advisorOptions.value = [];
    console.error(err);
  }
}
async function submitTopics() {
  try {
    const normalized = topicsForm.value
      .map((t, idx) => ({
        name: t.name?.trim(),
        description: t.description?.trim() || '',
        priority: idx + 1
      }))
      .filter(t => t.name);

    if (normalized.length < 2) {
      alert('حداقل دو موضوع وارد کنید');
      return;
    }

    await api.post('/projects/topics', { projectId: project.value._id, topics: normalized });
    alert('موضوعات ارسال شدند. لطفا منتظر تایید استاد راهنما باشید.');
    loadProject();
  } catch (err) {
    alert(err.response?.data?.error || err.message || 'خطا در ارسال موضوعات');
  }
}
function addTopic() {
  const nextIndex = topicsForm.value.length + 1;
  topicsForm.value.push({ name: '', description: '', priority: nextIndex });
}
function removeTopic(index) {
  if (topicsForm.value.length <= 2) return;
  topicsForm.value.splice(index, 1);
  topicsForm.value = topicsForm.value.map((t, idx) => ({ ...t, priority: idx + 1 }));
}
async function loadProject() {
  try {
    const res = await api.get('/projects/student');
    project.value = res.data[0];
    if (project.value) {
      if (project.value.proposedTopics && project.value.proposedTopics.length > 0) {
        topicsForm.value = [...project.value.proposedTopics];
      } else {
        topicsForm.value = [
          { name: '', description: '', priority: 1 },
          { name: '', description: '', priority: 2 }
        ];
      }
      await loadReports();
    }
  } catch (err) {
    console.error(err);
  }
}
async function loadReports() {
  try {
    if (!project.value?._id) return;
    const res = await api.get(`/reports/project/${project.value._id}`);
    reports.value = res.data;
  } catch (err) {
    console.error(err);
  }
}
async function loadMessages() {
  try {
    const res = await api.get('/messages');
    messages.value = res.data;
  } catch (err) {
    console.error(err);
  }
}
async function sendMessage() {
  try {
    let receiverId = null;
    if (!project.value) {
      alert('پروژه ای یافت نشد');
      return;
    }

    if (messageTargetRole.value === 'advisor') {
      receiverId = project.value.advisorId?._id || project.value.advisorId;
    } else if (messageTargetRole.value === 'examiner') {
      receiverId = project.value.examinerId?._id || project.value.examinerId;
    } else if (messageTargetRole.value === 'manager') {
      receiverId = project.value.managerId?._id || project.value.managerId;
    }

    if (!receiverId) {
      alert('گیرنده معتبر یافت نشد');
      return;
    }

    await api.post('/messages/send', {
      receiverId,
      projectId: project.value?._id,
      content: newMessage.value
    });
    newMessage.value = '';
    loadMessages();
  } catch (err) {
    alert(err.response?.data?.error || 'خطا');
  }
}
function onReportFileChange(e) {
  const files = e.target.files;
  reportFile.value = files && files[0] ? files[0] : null;
}
async function submitReport() {
  if (!project.value?._id) return;
  if (!canSubmitReport.value) return;
  try {
    const formData = new FormData();
    formData.append('projectId', project.value._id);
    formData.append('title', reportTitle.value || '');
    formData.append('description', reportDescription.value || '');
    if (reportFile.value) formData.append('file', reportFile.value);
    await api.post('/reports', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
    reportTitle.value = '';
    reportDescription.value = '';
    reportFile.value = null;
    await loadReports();
  } catch (err) {
    alert(err.response?.data?.error || 'خطا در ارسال گزارش');
  }
}
</script>
