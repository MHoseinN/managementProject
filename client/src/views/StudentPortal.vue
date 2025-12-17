<template>
  <div class="min-h-screen bg-dark-bg px-4 py-8">
    <div class="max-w-4xl mx-auto">
      <h1 class="text-3xl font-bold mb-8 text-orange">پورتال دانشجو</h1>

      <div class="grid gap-6">
        <!-- Project Status -->
        <div class="card">
          <h2 class="text-xl font-bold mb-4 text-light-green">وضعیت پروژه</h2>
          <div v-if="project" class="space-y-2">
            <p><span class="text-orange">موضوع:</span> {{ project.topic || 'منتظر تایید' }}</p>
            <p><span class="text-orange">وضعیت:</span> {{ project.status }}</p>
            <p><span class="text-orange">استاد راهنما:</span> {{ project.advisorId?.firstName || '-' }}</p>
            <p><span class="text-orange">استاد داور:</span> {{ project.examinerId?.firstName || '-' }}</p>
            <p v-if="project.defenseDate"><span class="text-orange">تاریخ دفاع:</span> {{ project.defenseDate }} - {{ project.defenseTime }}</p>
          </div>
          <div v-else>
            <button @click="enrollProject" class="btn-primary">اخذ پروژه</button>
          </div>
        </div>

        <!-- Proposed Topics -->
        <div class="card">
          <h2 class="text-xl font-bold mb-4 text-light-green">موضوعات پیشنهادی</h2>
          <textarea v-model="newTopics" placeholder="موضوعات پیشنهادی خود را وارد کنید (هر یک در یک خط)" class="w-full bg-dark-bg border border-dark-green/50 px-3 py-2 rounded mb-2 h-24"></textarea>
          <button @click="submitTopics" class="btn-primary">ارسال موضوعات</button>
        </div>

        <!-- Messages -->
        <div class="card">
          <h2 class="text-xl font-bold mb-4 text-light-green">پیام ها</h2>
          <div class="bg-dark-bg rounded p-3 mb-3 h-48 overflow-y-auto">
            <div v-for="msg in messages" :key="msg._id" class="mb-2 p-2 border-b border-dark-green/20">
              <p class="text-sm text-orange">{{ msg.senderId?.firstName }}: {{ msg.content }}</p>
            </div>
          </div>
          <input v-model="newMessage" placeholder="پیام جدید..." class="w-full bg-dark-bg border border-dark-green/50 px-3 py-2 rounded mb-2">
          <button @click="sendMessage" class="btn-primary">ارسال</button>
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
      project: null,
      messages: [],
      newTopics: '',
      newMessage: ''
    };
  },
  mounted() {
    this.loadProject();
    this.loadMessages();
  },
  methods: {
    async enrollProject() {
      try {
        const res = await api.post('/projects/enroll', { term: '1404-1' });
        this.project = res.data;
      } catch (err) {
        alert(err.response?.data?.error || 'خطا');
      }
    },
    async submitTopics() {
      try {
        const topics = this.newTopics.split('\n').filter(t => t.trim());
        await api.post('/projects/topics', { projectId: this.project._id, topics });
        this.newTopics = '';
        alert('موضوعات ارسال شدند');
      } catch (err) {
        alert(err.response?.data?.error || 'خطا');
      }
    },
    async loadProject() {
      try {
        const res = await api.get('/projects/student');
        this.project = res.data[0];
      } catch (err) {
        console.error(err);
      }
    },
    async loadMessages() {
      try {
        const res = await api.get('/messages');
        this.messages = res.data;
      } catch (err) {
        console.error(err);
      }
    },
    async sendMessage() {
      try {
        await api.post('/messages/send', { receiverId: this.project?.advisorId, projectId: this.project?._id, content: this.newMessage });
        this.newMessage = '';
        this.loadMessages();
      } catch (err) {
        alert(err.response?.data?.error || 'خطا');
      }
    }
  }
};
</script>
