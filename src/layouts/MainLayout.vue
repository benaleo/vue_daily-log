<script setup lang="ts">
import AppHeader from '@/components/AppHeader.vue'
import MenuBar from '@/components/MenuBar.vue'

defineProps<{
  title: string
  backButton?: {
    to: string
  }
}>()
</script>

<template>
  <div class="min-h-screen bg-gray-50 flex flex-col">
    <div class="w-full max-w-md mx-auto bg-white min-h-screen flex flex-col">
      <AppHeader :title="title" :back-button="backButton" />
      
      <main class="flex-1 overflow-y-auto pb-16">
        <slot />
      </main>

      <MenuBar />
    </div>
  </div>
</template>
