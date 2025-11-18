<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import MainLayout from '@/layouts/MainLayout.vue'
import { userFollowers } from '@/services/userFollowersService'
import { useGetUserProfile } from '@/composables/useGetUserProfile'
import { toast } from 'vue-sonner'

const router = useRouter()
const route = useRoute()

const { 
  user, 
  loading, 
  error, 
  isCurrentUser, 
  fetchUserProfile, 
  fetchCurrentUser 
} = useGetUserProfile()

const stats = ref({
  followers: 0,
  following: 0
})

const loadUserData = async () => {
  try {
    const userId = route.query.id?.toString()
    
    // If no ID in URL, fetch current user
    if (!userId) {
      await fetchCurrentUser()
    } else {
      // Load user by ID using the composable
      await fetchUserProfile(userId)
    }
  } catch (err) {
    console.error('Error loading user data:', err)
    toast.error('Failed to load user profile')
    router.push('/')
  }
}

const loadUserStats = async () => {
  try {
    loading.value = true
    const userId = route.query.id?.toString() || user.value?.id
    
    if (!userId) return
    
    const [followers, following] = await Promise.all([
      userFollowers.getFollowerCount(userId),
      userFollowers.getFollowingCount(userId)
    ])
    
    stats.value = {
      followers,
      following
    }
  } catch (err) {
    console.error('Error loading user stats:', err)
    toast.error('Failed to load user statistics')
  } finally {
    loading.value = false
  }
}

// Watch for route changes to load different user profiles
watch(() => route.query.id, async () => {
  await loadUserData()
  await loadUserStats()
}, { immediate: true })

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
            :src="user?.avatar_url || '/img.jpg'" 
            :alt="user?.name || 'User'"
            class="w-24 h-24 rounded-full object-cover border-4 border-blue-100"
          >
          <h2 class="mt-4 text-xl font-bold text-gray-900">{{ user?.name }}</h2>
          <div v-if="(isCurrentUser && user?.email) || (!isCurrentUser && user?.email)" class="group flex items-center gap-2 mt-1">
            <p class="text-gray-600 group-hover:text-blue-500 transition-colors duration-300 group-hover:font-bold">{{ user?.email }}</p>
            <button 
              v-if="isCurrentUser"
              @click="copyToClipboard(user.email)"
              class="text-gray-400 hover:text-blue-500 transition-colors cursor-pointer group-hover:text-blue-500"
              title="Copy email"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
              </svg>
            </button>
          </div>
          <!-- <p v-if="user?.role" class="text-sm text-gray-500 mt-1">Role: {{ user.role }}</p> -->
          
          <!-- Follow Stats -->
          <div class="w-full mt-6">
            <div class="grid grid-cols-2 gap-4">
              <!-- Followers -->
              <div class="bg-gray-50 rounded-lg p-4 text-center border border-gray-100 hover:border-blue-200 transition-colors">
                <div v-if="loading" class="animate-pulse">
                  <div class="h-6 w-3/4 bg-gray-200 rounded mx-auto mb-1"></div>
                  <div class="h-4 w-1/2 bg-gray-200 rounded mx-auto"></div>
                </div>
                <template v-else>
                  <p class="text-2xl font-bold text-gray-900">{{ stats.followers.toLocaleString() }}</p>
                  <p class="text-sm text-gray-500">Followers</p>
                </template>
              </div>
              
              <!-- Following -->
              <div class="bg-gray-50 rounded-lg p-4 text-center border border-gray-100 hover:border-blue-200 transition-colors">
                <div v-if="loading" class="animate-pulse">
                  <div class="h-6 w-3/4 bg-gray-200 rounded mx-auto mb-1"></div>
                  <div class="h-4 w-1/2 bg-gray-200 rounded mx-auto"></div>
                </div>
                <template v-else>
                  <p class="text-2xl font-bold text-gray-900">{{ stats.following.toLocaleString() }}</p>
                  <p class="text-sm text-gray-500">Following</p>
                </template>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </MainLayout>
</template>
