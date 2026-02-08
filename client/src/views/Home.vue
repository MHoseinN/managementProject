<template>
  <div class="min-h-screen flex flex-col justify-center items-center bg-dark-bg px-4">
    <div class="m-auto w-96">
      <h1 class="text-4xl mb-6 text-center font-bold text-orange">سیستم مدیریت پروژه</h1>
      <h2 class="text-2xl font-bold mb-6 text-center text-black">خوش آمدید</h2>
      <div class="card space-y-4">

        <router-link to="/login" class="block">
          <button class="w-full btn-primary text-lg">ورود</button>
        </router-link>

        <router-link to="/register" class="block">
          <button class="w-full btn-secondary text-lg">ثبت نام</button>
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router';

defineOptions({ name: 'Home' });

const router = useRouter();
const goBack = () => {
  if (window.history.length > 1) {
    router.back();
  } else {
    router.push('/');
  }
};
</script>
