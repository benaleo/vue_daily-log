<script setup lang="ts">
import { ref, defineProps } from 'vue'
import ProfileDrawer from './ProfileDrawer.vue'
import SearchDrawer from './SearchDrawer.vue'

defineProps<{
  title: string
  backButton?: {
    to: string
  }
}>()

const showProfileDrawer = ref(false)
const showSearchDrawer = ref(false)
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
    
    <!-- Search Button -->
    <button 
      @click="showSearchDrawer = true"
      class="absolute right-12 text-gray-600 hover:text-gray-900"
      aria-label="Search"
    >
      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    </button>
    
    <!-- Profile/Settings Button -->
    <button 
      @click="showProfileDrawer = true"
      class="absolute right-4 text-gray-600 hover:text-gray-900"
      aria-label="Profile settings"
    >
      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    </button>
    
    <!-- Search Drawer -->
    <SearchDrawer v-model="showSearchDrawer" />
    
    <!-- Profile Drawer -->
    <ProfileDrawer v-model="showProfileDrawer" />
  </header>
</template>
