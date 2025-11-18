import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import HistoryView from '../views/HistoryView.vue'
import ProfileView from '../views/ProfileView.vue'
import LoginView from '../views/LoginView.vue'
import RegisterView from '../views/RegisterView.vue'
import ChatRoomView from '../views/ChatRoomView.vue'
import { authGuard } from './auth-guard'
import ChatMessagesView from '@/views/ChatMessagesView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: LoginView,
      meta: { requiresGuest: true, title: 'Login' }
    },
    {
      path: '/register',
      name: 'register',
      component: RegisterView,
      meta: { requiresGuest: true, title: 'Register' }
    },
    {
      path: '/',
      redirect: '/home'
    },
    {
      path: '/home',
      name: 'home',
      component: HomeView,
      meta: { requiresAuth: true, title: 'Home' }
    },
    {
      path: '/history',
      name: 'history',
      component: HistoryView,
      meta: { requiresAuth: true, title: 'History' }
    },
    {
      path: '/profile',
      name: 'profile',
      component: ProfileView,
      meta: { requiresAuth: true, title: 'Profile' }
    },
    {
      path: '/chat',
      children: [
        {
          path: '',
          name: 'chat',
          component: ChatRoomView,
          meta: { requiresAuth: true, title: 'Chat' },
        },
        {
          path: ':fromId/:roomId',
          name: 'chat-room',
          component: ChatMessagesView,
          meta: { requiresAuth: true, title: 'Chat Room' },
          props: true
        }
      ]
    },
  ],
})

router.beforeEach(authGuard)

export default router

