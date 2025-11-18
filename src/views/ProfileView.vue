<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import MainLayout from '@/layouts/MainLayout.vue'
import { authService } from '@/services/supabase'
import { toast } from 'vue-sonner'

const router = useRouter()

const user = ref({
  name: '',
  email: '',
  avatar: '',
  role: ''
})

onMounted(async () => {
  await loadUserData()
})

const loadUserData = async () => {
  const { session } = await authService.getSession()
  if (session?.user) {
    user.value = {
      name: session.user.user_metadata?.name || 'User',
      email: session.user.email || '',
      avatar: session.user.user_metadata?.avatar_url || '/img.jpg',
      role: session.user.role || 'UNKNOWN'
    }
  }
}
</script>

<template>
  <MainLayout title="Profile">
    <div class="p-4">
      <!-- User Card -->
      <div class="bg-white rounded-lg shadow p-6 border border-gray-200">
        <div class="flex flex-col items-center">
          <img 
            :src="user.avatar" 
            :alt="user.name"
            class="w-24 h-24 rounded-full object-cover border-4 border-blue-100"
          >
          <h2 class="mt-4 text-xl font-bold text-gray-900">{{ user.name }}</h2>
          <p class="text-gray-600 mt-1">{{ user.email }}</p>
          <p class="text-sm text-gray-500 mt-1">Role: {{ user.role }}</p>
        </div>
      </div>
    </div>
  </MainLayout>
</template>
