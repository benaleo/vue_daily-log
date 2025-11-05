import { ref, computed } from 'vue'
import { bannerService, type Banner } from '@/services/bannerService'

export function useBanners() {
  const banners = ref<Banner[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const visibleCount = ref(3)

  const displayedBanners = computed(() => banners.value.slice(0, visibleCount.value))
  const hasMore = computed(() => banners.value.length > visibleCount.value)

  const fetchBanners = async () => {
    loading.value = true
    error.value = null

    try {
      const { data, error: fetchError } = await bannerService.getAll()
      
      if (fetchError) throw fetchError
      
      banners.value = data || []
      visibleCount.value = 3
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch banners'
      banners.value = []
    } finally {
      loading.value = false
    }
  }

  const refresh = () => {
    return fetchBanners()
  }

  const loadMore = () => {
    if (hasMore.value) {
      visibleCount.value += 3
    }
  }

  const resetVisible = () => {
    visibleCount.value = 3
  }

  return {
    banners,
    loading,
    error,
    displayedBanners,
    hasMore,
    fetchBanners,
    refresh,
    loadMore,
    resetVisible
  }
}
