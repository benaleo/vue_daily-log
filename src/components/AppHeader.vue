<script setup lang="ts">
defineProps<{
  title: string
  backButton?: {
    to: string
  }
}>()
</script>

<template>
  <header class="sticky top-0 z-50 bg-white border-b border-gray-200 h-14 flex items-center px-4">
    <router-link 
      v-if="backButton" 
      :to="backButton.to"
      class="absolute left-4 text-gray-600 hover:text-gray-900"
    >
      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
      </svg>
    </router-link>
    <h1 class="text-lg font-semibold text-gray-900 text-center flex-1">{{ title }}</h1>
  </header>
</template>
