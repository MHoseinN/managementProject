<template>
  <div class="min-h-screen bg-dark-bg px-4 py-8">
    <div class="max-w-6xl mx-auto">
      <h1 class="text-3xl font-bold mb-8 text-orange">پورتال استاد</h1>

      <div class="grid grid-cols-2 gap-6">
        <!-- Advisor Section -->
        <div class="card">
          <h2 class="text-xl font-bold mb-4 text-light-green">استاد راهنما</h2>
          <div class="space-y-3">
            <div v-for="project in advisorProjects" :key="project._id" class="border border-dark-green/30 p-2 rounded">
              <p><strong>{{ project.studentId?.firstName }}</strong></p>
              <p class="text-sm text-gray-400">موضوع: {{ project.topic || 'منتظر انتخاب' }}</p>
              <div v-if="!project.topic" class="mt-2">
                <select v-model="selectedTopic" class="w-full bg-dark-bg border border-dark-green/50 px-2 py-1 rounded text-sm">
                  <option>انتخاب موضوع</option>
                  <option v-for="t in project.proposedTopics" :key="t" :value="t">{{ t }}</option>
                </select>
                <button @click="approveTopic(project._id)" class="mt-1 btn-primary text-sm">تایید</button>
              </div>
            </div>
          </div>
        </div>

        <!-- Examiner Section -->
        <div class="card">
          <h2 class="text-xl font-bold mb-4 text-light-green">استاد داور</h2>
          <div class="space-y-3 mb-4">
            <h3 class="font-semibold text-orange">ارائه زمان‌های خالی</h3>
            <input type="date" v-model="defenseDate" class="w-full bg-dark-bg border border-dark-green/50 px-2 py-1 rounded">
            <input type="time" v-model="startTime" placeholder="شروع" class="w-full bg-dark-bg border border-dark-green/50 px-2 py-1 rounded">
            <input type="time" v-model="endTime" placeholder="پایان" class="w-full bg-dark-bg border border-dark-green/50 px-2 py-1 rounded">
            <button @click="submitDefenseSlots" class="btn-primary">ارسال</button>
          </div>

          <div class="space-y-2">
            <h3 class="font-semibold text-orange">پروژه های مربوط</h3>
            <div v-for="project in examinerProjects" :key="project._id" class="border border-dark-green/30 p-2 rounded">
              <p><strong>{{ project.studentId?.firstName }}</strong></p>
              <p class="text-sm">{{ project.topic }}</p>
              <input type="number" v-model="gradeMap[project._id]" placeholder="نمره" class="w-full bg-dark-bg border border-dark-green/50 px-2 py-1 rounded text-sm mt-1">
              <button @click="submitGrade(project._id)" class="mt-1 btn-primary text-sm">ثبت نمره</button>
            </div>
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
      advisorProjects: [],
      examinerProjects: [],
      defenseDate: '',
      startTime: '',
      endTime: '',
      selectedTopic: '',
      gradeMap: {}
    };
  },
  mounted() {
    this.loadProjects();
  },
  methods: {
    async loadProjects() {
      try {
        const [advisor, examiner] = await Promise.all([
          api.get('/projects/advisor'),
          api.get('/projects/examiner')
        ]);
        this.advisorProjects = advisor.data;
        this.examinerProjects = examiner.data;
      } catch (err) {
        console.error(err);
      }
    },
    async approveTopic(projectId) {
      try {
        await api.post('/projects/approve-topic', { projectId, topic: this.selectedTopic });
        this.loadProjects();
        alert('موضوع تایید شد');
      } catch (err) {
        alert(err.response?.data?.error || 'خطا');
      }
    },
    async submitDefenseSlots() {
      try {
        const proposedDates = [{
          date: this.defenseDate,
          timeSlots: this.generateTimeSlots(this.startTime, this.endTime)
        }];
        await api.post('/defense/slots', { term: '1404-1', proposedDates });
        alert('زمان‌های خالی ارسال شدند');
      } catch (err) {
        alert(err.response?.data?.error || 'خطا');
      }
    },
    generateTimeSlots(start, end) {
      const slots = [];
      let current = new Date(`2000-01-01T${start}`);
      const endTime = new Date(`2000-01-01T${end}`);
      while (current < endTime) {
        const next = new Date(current.getTime() + 30 * 60000);
        slots.push(`${current.getHours().toString().padStart(2, '0')}:${current.getMinutes().toString().padStart(2, '0')}-${next.getHours().toString().padStart(2, '0')}:${next.getMinutes().toString().padStart(2, '0')}`);
        current = next;
      }
      return slots;
    },
    async submitGrade(projectId) {
      try {
        await api.post('/projects/grade', { projectId, grade: this.gradeMap[projectId] });
        alert('نمره ثبت شد');
      } catch (err) {
        alert(err.response?.data?.error || 'خطا');
      }
    }
  }
};
</script>
