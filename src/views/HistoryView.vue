<script setup lang="ts">
import { ref, computed } from 'vue'
import MainLayout from '@/layouts/MainLayout.vue'

type TransactionType = 'INCOME' | 'SPEND'

interface HistoryItem {
  id: number
  name: string
  image_url: string
  category_name: string
  type: TransactionType
  amount: number
  created_at: string
}

const showFilter = ref(false)
const filterName = ref('')
const filterType = ref<TransactionType | ''>('')
const filterCategory = ref('')
const filterDateStart = ref('')
const filterDateEnd = ref('')

// Hardcoded history data
const historyData = ref<HistoryItem[]>([
  {
    id: 1,
    name: 'Gaji Bulanan',
    image_url: 'https://via.placeholder.com/60/10b981/ffffff?text=💰',
    category_name: 'Salary',
    type: 'INCOME',
    amount: 5000000,
    created_at: '2024-01-15T10:00:00'
  },
  {
    id: 2,
    name: 'Belanja Groceries',
    image_url: 'https://via.placeholder.com/60/ef4444/ffffff?text=🛒',
    category_name: 'Food',
    type: 'SPEND',
    amount: 250000,
    created_at: '2024-01-14T15:30:00'
  },
  {
    id: 3,
    name: 'Bayar Listrik',
    image_url: 'https://via.placeholder.com/60/ef4444/ffffff?text=⚡',
    category_name: 'Utilities',
    type: 'SPEND',
    amount: 150000,
    created_at: '2024-01-13T09:00:00'
  },
  {
    id: 4,
    name: 'Freelance Project',
    image_url: 'https://via.placeholder.com/60/10b981/ffffff?text=💼',
    category_name: 'Work',
    type: 'INCOME',
    amount: 2000000,
    created_at: '2024-01-12T14:00:00'
  }
])

const categories = computed(() => {
  const cats = new Set(historyData.value.map(item => item.category_name))
  return Array.from(cats)
})

const filteredHistory = computed(() => {
  let result = [...historyData.value]

  if (filterName.value) {
    result = result.filter(item => 
      item.name.toLowerCase().includes(filterName.value.toLowerCase())
    )
  }

  if (filterType.value) {
    result = result.filter(item => item.type === filterType.value)
  }

  if (filterCategory.value) {
    result = result.filter(item => item.category_name === filterCategory.value)
  }

  if (filterDateStart.value) {
    result = result.filter(item => 
      new Date(item.created_at) >= new Date(filterDateStart.value)
    )
  }

  if (filterDateEnd.value) {
    result = result.filter(item => 
      new Date(item.created_at) <= new Date(filterDateEnd.value)
    )
  }

  return result.sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )
})

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}

const formatAmount = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(amount)
}

const resetFilter = () => {
  filterName.value = ''
  filterType.value = ''
  filterCategory.value = ''
  filterDateStart.value = ''
  filterDateEnd.value = ''
  showFilter.value = false
}
</script>

<template>
  <MainLayout title="History">
    <div class="p-4 space-y-4 relative">
      <!-- Filter Button -->
      <div class="flex justify-end">
        <button 
          @click="showFilter = true"
          class="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          Filter
        </button>
      </div>

      <!-- History List -->
      <div class="space-y-3">
        <div 
          v-for="item in filteredHistory" 
          :key="item.id"
          class="bg-white rounded-lg shadow p-4 border border-gray-200"
        >
          <div class="flex gap-3">
            <img 
              :src="item.image_url" 
              :alt="item.name"
              class="w-14 h-14 rounded-lg object-cover"
            >
            <div class="flex-1 min-w-0">
              <h3 class="font-semibold text-gray-900 truncate">{{ item.name }}</h3>
              <p class="text-sm text-gray-600">{{ item.category_name }}</p>
              <p class="text-xs text-gray-500 mt-1">{{ formatDate(item.created_at) }}</p>
            </div>
            <div class="text-right flex-shrink-0">
              <p 
                class="font-bold"
                :class="item.type === 'INCOME' ? 'text-green-600' : 'text-red-600'"
              >
                {{ item.type === 'INCOME' ? '+' : '-' }}{{ formatAmount(item.amount) }}
              </p>
              <span 
                class="inline-block mt-1 px-2 py-0.5 text-xs rounded-full"
                :class="item.type === 'INCOME' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'"
              >
                {{ item.type }}
              </span>
            </div>
          </div>
        </div>

        <div v-if="filteredHistory.length === 0" class="text-center py-12 text-gray-500">
          Tidak ada data history
        </div>
      </div>

      <!-- Create Button -->
      <div class="fixed bottom-20 left-1/2 transform -translate-x-1/2 max-w-md w-full px-4">
        <button 
        class="w-full h-14 bg-blue-600 text-white rounded-md shadow-lg hover:bg-blue-700 flex items-center justify-center z-10"
      >
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
      </button>
      </div>
    </div>

    <!-- Filter Modal -->
    <Teleport to="body">
      <div 
        v-if="showFilter"
        class="fixed inset-0 z-[100] bg-black bg-opacity-50 flex items-end justify-center"
        @click.self="showFilter = false"
      >
        <div class="bg-white rounded-t-2xl w-full max-w-md p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-xl font-bold text-gray-900">Filter History</h2>
            <button @click="showFilter = false" class="text-gray-500 hover:text-gray-700">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <!-- Name Filter -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Name</label>
            <input 
              v-model="filterName"
              type="text" 
              placeholder="Cari nama transaksi..."
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
          </div>

          <!-- Date Range Filter -->
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
              <input 
                v-model="filterDateStart"
                type="date" 
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">End Date</label>
              <input 
                v-model="filterDateEnd"
                type="date" 
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
            </div>
          </div>

          <!-- Type Filter -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Type</label>
            <select 
              v-model="filterType"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Semua Type</option>
              <option value="INCOME">INCOME</option>
              <option value="SPEND">SPEND</option>
            </select>
          </div>

          <!-- Category Filter -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Category</label>
            <select 
              v-model="filterCategory"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Semua Category</option>
              <option v-for="cat in categories" :key="cat" :value="cat">
                {{ cat }}
              </option>
            </select>
          </div>

          <!-- Action Buttons -->
          <div class="flex gap-3 pt-4">
            <button 
              @click="resetFilter"
              class="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Reset
            </button>
            <button 
              @click="showFilter = false"
              class="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Terapkan
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </MainLayout>
</template>
