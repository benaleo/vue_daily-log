<script setup lang="ts">
import { watch } from 'vue'
import { useRoute } from 'vue-router'
import AppHeader from '@/components/AppHeader.vue'
import MenuBar from '@/components/MenuBar.vue'

const props = defineProps<{
  title?: string
  backButton?: {
    to: string
  }
}>()

const route = useRoute()

// Set document title based on the title prop or route meta
watch(() => props.title || route.meta.title, (newTitle) => {
  if (newTitle) {
    document.title = `Diary Log${newTitle === 'Home' ? '' : ' - ' + newTitle}`
  }
}, { immediate: true })
</script>

<template>
  <div class="min-h-screen bg-gray-50 flex flex-col">
    <div class="w-full max-w-md mx-auto bg-white min-h-screen flex flex-col">
      <AppHeader :title="title || 'Diary Log'" :back-button="backButton" />
      
      <main class="flex-1 overflow-y-auto pb-16">
        <slot />
      </main>

      <MenuBar />
    </div>
  </div>
</template>
