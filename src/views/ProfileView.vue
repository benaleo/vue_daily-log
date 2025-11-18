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

const copyToClipboard = (text: string) => {
  if (typeof window !== 'undefined') {
    navigator.clipboard.writeText(text)
    toast.success('Email copied to clipboard!')
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
          <div class="group flex items-center gap-2 mt-1">
            <p class="text-gray-600 group-hover:text-blue-500 transition-colors duration-300 group-hover:font-bold">{{ user.email }}</p>
            <button 
              @click="copyToClipboard(user.email)"
              class="text-gray-400 hover:text-blue-500 transition-colors cursor-pointer group-hover:text-blue-500"
              title="Copy email"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
              </svg>
            </button>
          </div>
          <p class="text-sm text-gray-500 mt-1">Role: {{ user.role }}</p>
        </div>
      </div>
    </div>
  </MainLayout>
</template>
