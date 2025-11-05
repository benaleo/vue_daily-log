<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import MainLayout from '@/layouts/MainLayout.vue'
import HistoryForm from '@/components/forms/HistoryForm.vue'
import { useHistories } from '@/composables/useHistories'
import { useOptionHistoryCategories } from '@/composables/useOptionHistoryCategories'
import { historyService, type History, type HistoryType } from '@/services/historyService'

const showFilter = ref(false)
const showCreateModal = ref(false)
const showEditModal = ref(false)
const selectedHistory = ref<History | null>(null)
const activeMenu = ref<number | null>(null)

const filterName = ref('')
const filterType = ref<HistoryType | ''>('')
const filterCategory = ref<number | ''>('')
const filterDateStart = ref('')
const filterDateEnd = ref('')

const { histories, loading, fetchHistories, refresh } = useHistories()
const { categories, fetchCategories, getOptionHistoryCategories } = useOptionHistoryCategories()

onMounted(async () => {
  await fetchCategories()
  await fetchHistories()
})

const currentFilters = computed(() => ({
  name: filterName.value,
  type: filterType.value,
  category_id: filterCategory.value,
  date_start: filterDateStart.value,
  date_end: filterDateEnd.value
}))

const applyFilter = async () => {
  await fetchHistories(currentFilters.value)
  showFilter.value = false
}

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

const resetFilter = async () => {
  filterName.value = ''
  filterType.value = ''
  filterCategory.value = ''
  filterDateStart.value = ''
  filterDateEnd.value = ''
  await fetchHistories()
  showFilter.value = false
}

const toggleMenu = (id: number) => {
  activeMenu.value = activeMenu.value === id ? null : id
}

const openCreateModal = () => {
  selectedHistory.value = null
  showCreateModal.value = true
}

const openEditModal = (history: History) => {
  selectedHistory.value = history
  activeMenu.value = null
  showEditModal.value = true
}

const handleCreate = async (data: any) => {
  try {
    const { error } = await historyService.create(data)
    if (error) throw error
    
    await refresh(currentFilters.value)
    showCreateModal.value = false
  } catch (error: any) {
    alert(error.message || 'Gagal membuat history')
  }
}

const handleUpdate = async (data: any) => {
  if (!selectedHistory.value) return
  
  try {
    const { error } = await historyService.update(selectedHistory.value.id, data)
    if (error) throw error
    
    await refresh(currentFilters.value)
    showEditModal.value = false
    selectedHistory.value = null
  } catch (error: any) {
    alert(error.message || 'Gagal update history')
  }
}

const handleDelete = async (id: number) => {
  if (!confirm('Yakin ingin menghapus history ini?')) return
  
  try {
    const { error } = await historyService.delete(id)
    if (error) throw error
    
    activeMenu.value = null
    await refresh(currentFilters.value)
  } catch (error: any) {
    alert(error.message || 'Gagal menghapus history')
  }
}

const getCategoryName = (history: History) => {
  return history.category?.name || 'Uncategorized'
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
      <div v-if="loading" class="text-center py-12 text-gray-500">
        Loading histories...
      </div>

      <div v-else class="space-y-3">
        <div 
          v-for="item in histories" 
          :key="item.id"
          class="bg-white rounded-lg shadow p-4 border border-gray-200 relative"
        >
          <div class="flex gap-3">
            <img 
              :src="item.image_url || 'https://via.placeholder.com/60/6366f1/ffffff?text=No+Image'" 
              :alt="item.name"
              class="w-14 h-14 rounded-lg object-cover"
            >
            <div class="flex-1 min-w-0">
              <h3 class="font-semibold text-gray-900 truncate">{{ item.name }}</h3>
              <p class="text-sm text-gray-600">{{ getCategoryName(item) }}</p>
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
            
            <!-- Hamburger Menu Button -->
            <button
              @click="toggleMenu(item.id)"
              class="absolute top-2 right-2 p-1 hover:bg-gray-100 rounded"
            >
              <svg class="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
              </svg>
            </button>
          </div>

          <!-- Overlay Menu -->
          <div 
            v-if="activeMenu === item.id"
            @click.self="activeMenu = null"
            class="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center gap-4 z-10"
          >
            <button
              @click="openEditModal(item)"
              class="p-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 shadow-lg"
            >
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </button>
            <button
              @click="handleDelete(item.id)"
              class="p-3 bg-red-600 text-white rounded-full hover:bg-red-700 shadow-lg"
            >
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>

        <div v-if="histories.length === 0" class="text-center py-12 text-gray-500">
          Tidak ada data history
        </div>
      </div>

      <!-- Create Button -->
      <div class="fixed bottom-20 left-1/2 transform -translate-x-1/2 max-w-md w-full px-4">
        <button 
          @click="openCreateModal"
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
              <option 
                v-for="option in getOptionHistoryCategories()" 
                :key="option.value" 
                :value="option.value"
              >
                {{ option.label }}
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
              @click="applyFilter"
              class="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Terapkan
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Create History Modal -->
    <Teleport to="body">
      <div 
        v-if="showCreateModal"
        class="fixed inset-0 z-[100] bg-black bg-opacity-50 flex items-end justify-center"
        @click.self="showCreateModal = false"
      >
        <div class="bg-white rounded-t-2xl w-full max-w-md p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-xl font-bold text-gray-900">Tambah History</h2>
            <button @click="showCreateModal = false" class="text-gray-500 hover:text-gray-700">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <HistoryForm 
            @submit="handleCreate"
            @cancel="showCreateModal = false"
          />
        </div>
      </div>
    </Teleport>

    <!-- Edit History Modal -->
    <Teleport to="body">
      <div 
        v-if="showEditModal"
        class="fixed inset-0 z-[100] bg-black bg-opacity-50 flex items-end justify-center"
        @click.self="showEditModal = false"
      >
        <div class="bg-white rounded-t-2xl w-full max-w-md p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-xl font-bold text-gray-900">Edit History</h2>
            <button @click="showEditModal = false" class="text-gray-500 hover:text-gray-700">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <HistoryForm 
            :history="selectedHistory"
            @submit="handleUpdate"
            @cancel="showEditModal = false"
          />
        </div>
      </div>
    </Teleport>
  </MainLayout>
</template>
