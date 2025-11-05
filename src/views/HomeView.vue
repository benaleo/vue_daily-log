<script setup lang="ts">
import { ref, onMounted } from 'vue'
import MainLayout from '@/layouts/MainLayout.vue'
import { authService } from '@/services/supabase'
import { useBanners } from '@/composables/useBanners'

const userName = ref('User')
const showZoomModal = ref(false)
const selectedBanner = ref('')

const { banners, loading, fetchBanners } = useBanners()

onMounted(async () => {
  const { session } = await authService.getSession()
  if (session?.user?.user_metadata?.name) {
    userName.value = session.user.user_metadata.name
  }
  
  await fetchBanners()
})

const openBanner = (imageUrl: string) => {
  selectedBanner.value = imageUrl
  showZoomModal.value = true
}

const closeBanner = () => {
  showZoomModal.value = false
  selectedBanner.value = ''
}

</script>

<template>
  <MainLayout title="Home">
    <div class="p-4 space-y-6">
      <!-- Welcome Section -->
      <div class="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-6 text-white">
        <h2 class="text-2xl font-bold mb-2">Welcome back,</h2>
        <p class="text-xl">{{ userName }}!</p>
      </div>

      <!-- Banners Section -->
      <div class="space-y-4">
        <h3 class="text-lg font-semibold text-gray-900">Promo & Banner</h3>
        
        <div v-if="loading" class="text-center py-8 text-gray-500">
          Loading banners...
        </div>
        
        <div v-else-if="banners.length === 0" class="text-center py-8 text-gray-500">
          Belum ada banner
        </div>
        
        <div v-else class="space-y-3">
          <div 
            v-for="banner in banners" 
            :key="banner.id"
            @click="openBanner(banner.url)"
            class="rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
          >
            <img 
              :src="banner.url" 
              :alt="banner.name"
              class="w-full h-40 object-cover"
            >
          </div>
        </div>
      </div>
    </div>

    <!-- Zoom Modal -->
    <Teleport to="body">
      <div 
        v-if="showZoomModal"
        @click="closeBanner"
        class="fixed inset-0 z-[100] bg-black bg-opacity-90 flex items-center justify-center p-4"
      >
        <div class="max-w-md w-full">
          <img 
            :src="selectedBanner" 
            alt="Banner Zoom"
            class="w-full rounded-lg"
          >
        </div>
      </div>
    </Teleport>
  </MainLayout>
</template>
