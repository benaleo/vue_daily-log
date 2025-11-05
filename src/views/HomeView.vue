<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import MainLayout from '@/layouts/MainLayout.vue'
import { authService } from '@/services/supabase'
import { useBanners } from '@/composables/useBanners'
import { useHistories } from '@/composables/useHistories'

const userName = ref('User')
const showZoomModal = ref(false)
const selectedBanner = ref('')

const { displayedBanners, loading, fetchBanners, hasMore, loadMore } = useBanners()

const { histories, fetchHistories } = useHistories()

const selectedMonth = ref<number>(new Date().getMonth() + 1)
const selectedYear = ref<number>(new Date().getFullYear())

const months = [
  { value: 1, label: 'Jan' }, { value: 2, label: 'Feb' }, { value: 3, label: 'Mar' }, { value: 4, label: 'Apr' },
  { value: 5, label: 'May' }, { value: 6, label: 'Jun' }, { value: 7, label: 'Jul' }, { value: 8, label: 'Aug' },
  { value: 9, label: 'Sep' }, { value: 10, label: 'Oct' }, { value: 11, label: 'Nov' }, { value: 12, label: 'Dec' }
]

const years = computed(() => {
  const current = new Date().getFullYear()
  return [current - 2, current - 1, current, current + 1]
})

const formatAmount = (amount: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount)

const balance = computed(() => {
  const income = histories.value.filter(h => h.type === 'INCOME').reduce((s, h) => s + h.amount, 0)
  const spend = histories.value.filter(h => h.type === 'SPEND').reduce((s, h) => s + h.amount, 0)
  return income - spend
})

const monthStats = computed(() => {
  const ym = `${selectedYear.value}-${String(selectedMonth.value).padStart(2, '0')}`
  const monthly = histories.value.filter(h => h.created_at.startsWith(ym))
  const income = monthly.filter(h => h.type === 'INCOME').reduce((s, h) => s + h.amount, 0)
  const spend = monthly.filter(h => h.type === 'SPEND').reduce((s, h) => s + h.amount, 0)
  return { income, spend, net: income - spend }
})

onMounted(async () => {
  const { session } = await authService.getSession()
  if (session?.user?.user_metadata?.name) {
    userName.value = session.user.user_metadata.name
  }
  
  await Promise.all([
    fetchBanners(),
    fetchHistories()
  ])
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

      <div class="space-y-3">
        <div class="flex items-center gap-3">
          <select v-model.number="selectedMonth" class="px-3 py-2 border border-gray-300 rounded-lg flex-1">
            <option v-for="m in months" :key="m.value" :value="m.value">{{ m.label }}</option>
          </select>
          <select v-model.number="selectedYear" class="px-3 py-2 border border-gray-300 rounded-lg flex-1">
            <option v-for="y in years" :key="y" :value="y">{{ y }}</option>
          </select>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div class="bg-white rounded-lg shadow p-4 border border-gray-200">
            <p class="text-sm text-gray-600">Balance</p>
            <p class="text-xl font-bold" :class="balance >= 0 ? 'text-green-600' : 'text-red-600'">{{ formatAmount(balance) }}</p>
          </div>
          <div class="bg-white rounded-lg shadow p-4 border border-gray-200">
            <p class="text-sm text-gray-600">This Month</p>
            <p class="text-xl font-bold" :class="monthStats.net >= 0 ? 'text-green-600' : 'text-red-600'">{{ formatAmount(monthStats.net) }}</p>
          </div>
          <div class="bg-white rounded-lg shadow p-4 border border-gray-200">
            <p class="text-sm text-gray-600">Income</p>
            <p class="text-xl font-bold text-green-600">{{ formatAmount(monthStats.income) }}</p>
          </div>
          <div class="bg-white rounded-lg shadow p-4 border border-gray-200">
            <p class="text-sm text-gray-600">Spend</p>
            <p class="text-xl font-bold text-red-600">{{ formatAmount(monthStats.spend) }}</p>
          </div>
        </div>
      </div>

      <!-- Banners Section -->
      <div class="space-y-4">
        <h3 class="text-lg font-semibold text-gray-900">Banner Information</h3>
        
        <div v-if="loading" class="text-center py-8 text-gray-500">
          Loading banner information...
        </div>
        
        <div v-else-if="displayedBanners.length === 0" class="text-center py-8 text-gray-500">
          Belum ada banner information
        </div>
        
        <div v-else class="space-y-3">
          <div 
            v-for="banner in displayedBanners" 
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
          <div class="pt-2" v-if="hasMore">
            <button @click="loadMore" class="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Load More</button>
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
