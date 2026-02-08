import { createRouter, createWebHistory } from 'vue-router';
import Home from './views/Home.vue';
import Register from './views/Register.vue';
import Login from './views/Login.vue';
import StudentPortal from './views/StudentPortal.vue';
import TeacherPortal from './views/TeacherPortal.vue';
import TeacherAdvisor from './views/TeacherAdvisor.vue';
import TeacherExaminer from './views/TeacherExaminer.vue';
import TeacherDefenseSchedule from './views/TeacherDefenseSchedule.vue';
import ManagerPortal from './views/ManagerPortal.vue';
import AdminPortal from './views/AdminPortal.vue';
import StudentDetailView from './views/StudentDetailView.vue';

const routes = [
  { path: '/', component: Home },
  { path: '/register', component: Register },
  { path: '/login', component: Login },
  { 
    path: '/student', 
    component: StudentPortal,
    meta: { requiresAuth: true, role: 'student' }
  },
  { 
    path: '/teacher', 
    component: TeacherPortal,
    meta: { requiresAuth: true, role: 'teacher' }
  },
  { 
    path: '/teacher/advisor', 
    component: TeacherAdvisor,
    meta: { requiresAuth: true, role: 'teacher' }
  },
  { 
    path: '/teacher/examiner', 
    component: TeacherExaminer,
    meta: { requiresAuth: true, role: 'teacher' }
  },
  { 
    path: '/teacher/defense', 
    component: TeacherDefenseSchedule,
    meta: { requiresAuth: true, role: 'teacher' }
  },
  { 
    path: '/teacher/student/:projectId', 
    component: StudentDetailView,
    meta: { requiresAuth: true, role: 'teacher' }
  },
  { 
    path: '/manager', 
    component: ManagerPortal,
    meta: { requiresAuth: true, role: 'manager' }
  },
  { 
    path: '/admin', 
    component: AdminPortal,
    meta: { requiresAuth: true, role: 'admin' }
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token');
  const user = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : null;
  
  if (to.meta.requiresAuth) {
    if (!token) {
      next('/login');
    } else if (to.meta.role && user?.role !== to.meta.role) {
      next('/');
    } else {
      next();
    }
  } else {
    next();
  }
});

export default router;
