import { ref } from 'vue'
import { historyCategoryService, type HistoryCategory } from '@/services/historyCategoryService'

export function useHistoryCategories() {
  const categories = ref<HistoryCategory[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const fetchCategories = async () => {
    loading.value = true
    error.value = null

    try {
      const { data, error: fetchError } = await historyCategoryService.getAll()
      
      if (fetchError) throw fetchError
      
      categories.value = data || []
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch categories'
      categories.value = []
    } finally {
      loading.value = false
    }
  }

  const getOptionHistoryCategories = () => {
    return categories.value.map(cat => ({
      label: cat.name,
      value: cat.id
    }))
  }

  return {
    categories,
    loading,
    error,
    fetchCategories,
    getOptionHistoryCategories
  }
}
