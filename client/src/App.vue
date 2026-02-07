<template>
  <div class="min-h-screen flex flex-col bg-dark-bg">
    <!-- Navigation -->
    <nav class="bg-dark-green border-b border-dark-green/50 px-6 py-4 flex justify-between items-center">
      <div class="text-2xl font-bold text-orange">📚 Project Management</div>
      <div>
        <router-link v-if="!token" to="/login" class="btn-primary mr-3">ورود</router-link>
        <router-link v-if="!token" to="/register" class="btn-secondary">ثبت نام</router-link>
        <button v-if="token" @click="logout" class="btn-primary">خروج</button>
      </div>
    </nav>

    <!-- Main Content -->
    <router-view></router-view>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const token = ref(localStorage.getItem('token'));

const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  router.push('/');
  location.reload();
};
</script>
