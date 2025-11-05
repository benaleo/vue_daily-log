import { ref, computed } from 'vue'
import { historyService, type History, type HistoryFilters } from '@/services/historyService'

export function useHistories() {
  const histories = ref<History[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const pageSize = ref(10)
  const visibleCount = ref(10)

  const displayedHistories = computed(() => histories.value.slice(0, visibleCount.value))
  const hasMore = computed(() => histories.value.length > visibleCount.value)

  const fetchHistories = async (filters?: HistoryFilters) => {
    loading.value = true
    error.value = null

    try {
      const { data, error: fetchError } = await historyService.getAll(filters)
      
      if (fetchError) throw fetchError
      
      histories.value = data || []
      visibleCount.value = pageSize.value
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch histories'
      histories.value = []
    } finally {
      loading.value = false
    }
  }

  const refresh = (filters?: HistoryFilters) => {
    return fetchHistories(filters)
  }

  const loadMore = () => {
    if (hasMore.value) {
      visibleCount.value += pageSize.value
    }
  }

  const setPageSize = (size: number) => {
    pageSize.value = size
    visibleCount.value = size
  }

  return {
    histories,
    loading,
    error,
    pageSize,
    displayedHistories,
    hasMore,
    fetchHistories,
    refresh,
    loadMore,
    setPageSize
  }
}
