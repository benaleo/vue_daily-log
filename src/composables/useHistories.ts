import { ref } from 'vue'
import { historyService, type History, type HistoryFilters } from '@/services/historyService'

export function useHistories() {
  const histories = ref<History[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const fetchHistories = async (filters?: HistoryFilters) => {
    loading.value = true
    error.value = null

    try {
      const { data, error: fetchError } = await historyService.getAll(filters)
      
      if (fetchError) throw fetchError
      
      histories.value = data || []
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

  return {
    histories,
    loading,
    error,
    fetchHistories,
    refresh
  }
}
