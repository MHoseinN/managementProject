<template>
  <div class="min-h-screen flex flex-col justify-center items-center bg-dark-bg px-4">
    <div class="w-full max-w-md">
      <h1 class="text-4xl font-bold text-center mb-12 text-orange">سیستم مدیریت پروژه</h1>
      
      <div class="card space-y-4">
        <h2 class="text-2xl font-bold mb-6 text-center text-orange">خوش آمدید</h2>
        
        <router-link to="/login" class="block">
          <button class="w-full btn-primary text-lg py-3">ورود</button>
        </router-link>
        
        <router-link to="/register" class="block">
          <button class="w-full btn-secondary text-lg py-3">ثبت نام</button>
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
defineOptions({ name: 'Home' });
</script>
