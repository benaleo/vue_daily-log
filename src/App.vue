<script setup lang="ts">
import { RouterView, useRoute } from 'vue-router'
import { computed } from 'vue'
import MainLayout from '@/layouts/MainLayout.vue'

const route = useRoute()

// Determine the title based on the current route
const pageTitle = computed(() => {
  const routeName = route.name?.toString() || 'Home'
  return routeName.charAt(0).toUpperCase() + routeName.slice(1)
})

// Configure back button for specific routes
const backButton = computed(() => {
  if (route.meta.requiresAuth && route.name !== 'home') {
    return { to: '/' }
  }
  return undefined
})
</script>

<template>
    <RouterView v-slot="{ Component }">
      <transition name="fade" mode="out-in">
        <component :is="Component" />
      </transition>
    </RouterView>
</template>

<style>
/* Smooth page transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
