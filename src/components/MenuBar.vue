<script setup lang="ts">
import { useRoute } from 'vue-router'
import { computed } from 'vue'

const route = useRoute()
const isActive = (path: string) => computed(() => route.path === path)
</script>

<template>
  <nav class="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
    <div class="w-full max-w-md mx-auto flex justify-around items-center h-16">
      <router-link 
        to="/" 
        class="flex flex-col items-center justify-center flex-1 py-2"
        :class="isActive('/').value ? 'text-blue-600' : 'text-gray-600'"
      >
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
        <span class="text-xs mt-1">Home</span>
      </router-link>

      <router-link 
        to="/history" 
        class="flex flex-col items-center justify-center flex-1 py-2"
        :class="isActive('/history').value ? 'text-blue-600' : 'text-gray-600'"
      >
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span class="text-xs mt-1">History</span>
      </router-link>

      <router-link 
        to="/profile" 
        class="flex flex-col items-center justify-center flex-1 py-2"
        :class="isActive('/profile').value ? 'text-blue-600' : 'text-gray-600'"
      >
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
        <span class="text-xs mt-1">Profile</span>
      </router-link>
    </div>
  </nav>
</template>
