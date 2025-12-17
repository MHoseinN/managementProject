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

        <div class="border-t border-dark-green/30 pt-4 mt-4">
          <p class="text-sm text-gray-400 text-center mb-2">نام کاربری ادمین: admin01</p>
          <p class="text-sm text-gray-400 text-center">رمز عبور ادمین: admin0123</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Home'
};
</script>
