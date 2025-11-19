<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { useImageUpload } from '@/composables/useImageUpload'
import { authService } from '@/services/supabase'
import type { History, HistoryType } from '@/services/historyService'
import { useOptionHistoryCategories } from '@/composables/useOptionHistoryCategories'
import { format } from 'date-fns'

const props = defineProps<{
  history?: History | null
}>()

const emit = defineEmits<{
  submit: [data: { name: string; category_id: number; image_url: string | null; type: HistoryType; amount: number; ts_at: string }]
  cancel: []
}>()

const name = ref('')
const categoryId = ref<number | ''>('')
const type = ref<HistoryType>('SPEND')
const amount = ref<number>(0)
const tsAt = ref<string>(new Date().toISOString())
const showDateTimePicker = ref(false)
const imageUrl = ref<string | null>(null)
const imageFile = ref<File | null>(null)
const imagePreview = ref<string | null>(null)

const { uploading, uploadImage } = useImageUpload()
const { categories, fetchCategories, getOptionHistoryCategories } = useOptionHistoryCategories()

const resetForm = () => {
  name.value = ''
  categoryId.value = ''
  type.value = 'SPEND'
  amount.value = 0
  tsAt.value = new Date().toISOString()
  showDateTimePicker.value = false
  imageUrl.value = null
  imageFile.value = null
  imagePreview.value = null
}

onMounted(async () => {
  await fetchCategories()
})

// Watch for history prop changes (edit mode)
watch(() => props.history, (newHistory) => {
  if (newHistory) {
    name.value = newHistory.name
    categoryId.value = newHistory.category_id
    type.value = newHistory.type
    amount.value = newHistory.amount
    tsAt.value = newHistory.ts_at || new Date().toISOString()
    imageUrl.value = newHistory.image_url
    imagePreview.value = newHistory.image_url
  } else {
    resetForm()
  }
}, { immediate: true })

const handleFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  
  if (file) {
    imageFile.value = file
    
    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      imagePreview.value = e.target?.result as string
    }
    reader.readAsDataURL(file)
  }
}


const handleSubmit = async () => {
  let finalImageUrl = imageUrl.value

  // Upload image if file selected
  if (imageFile.value) {
    try {
      const { sessionUser } = await authService.getSession()
      const email = sessionUser?.email || 'anonymous'
      
      const result = await uploadImage(imageFile.value, email, 'history')
      finalImageUrl = result.url
    } catch (error) {
      console.error('Upload error:', error)
      return
    }
  }

  const submitData = {
    name: name.value,
    category_id: Number(categoryId.value),
    image_url: finalImageUrl,
    type: type.value,
    amount: Number(amount.value),
    ts_at: tsAt.value
  }
  emit('submit', submitData)
}

const handleCancel = () => {
  resetForm()
  emit('cancel')
}
</script>

<template>
  <div class="space-y-4">
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-2">Nama Transaksi</label>
      <input 
        v-model="name"
        type="text" 
        placeholder="Masukkan nama transaksi..."
        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        required
      >
    </div>

    <div>
      <label class="block text-sm font-medium text-gray-700 mb-2">Kategori</label>
      <select 
        v-model="categoryId"
        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        required
      >
        <option value="">Pilih Kategori</option>
        <option 
          v-for="option in getOptionHistoryCategories()" 
          :key="option.value" 
          :value="option.value"
        >
          {{ option.label }}
        </option>
      </select>
    </div>

    <div>
      <label class="block text-sm font-medium text-gray-700 mb-2">Tipe</label>
      <div class="grid grid-cols-2 gap-3">
        <button
          type="button"
          @click="type = 'INCOME'"
          class="px-4 py-2 rounded-lg border-2 transition-colors"
          :class="type === 'INCOME' ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-300 text-gray-700'"
        >
          INCOME
        </button>
        <button
          type="button"
          @click="type = 'SPEND'"
          class="px-4 py-2 rounded-lg border-2 transition-colors"
          :class="type === 'SPEND' ? 'border-red-500 bg-red-50 text-red-700' : 'border-gray-300 text-gray-700'"
        >
          SPEND
        </button>
      </div>
    </div>

    <div>
      <label class="block text-sm font-medium text-gray-700 mb-2">Jumlah</label>
      <input 
        v-model.number="amount"
        type="number" 
        min="0"
        step="1000"
        placeholder="0"
        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        required
      >
    </div>

    <div>
      <label class="block text-sm font-medium text-gray-700 mb-2">Tanggal & Waktu</label>
      <div class="relative">
        <input
          type="text"
          :value="format(new Date(tsAt), 'dd MMMM yyyy HH:mm')"
          readonly
          @click="showDateTimePicker = !showDateTimePicker"
          class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer"
        />
        <div v-if="showDateTimePicker" class="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg p-4">
          <input
            type="datetime-local"
            :value="format(new Date(tsAt), 'yyyy-MM-dd\'T\'HH:mm')"
            @input="(e) => { tsAt = new Date((e.target as HTMLInputElement).value).toISOString() }"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <div class="flex justify-end mt-2">
            <button
              type="button"
              @click="showDateTimePicker = false"
              class="px-4 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>

    <div>
      <label class="block text-sm font-medium text-gray-700 mb-2">Upload Gambar (Opsional)</label>
      <input 
        type="file"
        accept="image/*"
        @change="handleFileChange"
        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      >
    </div>

    <div v-if="imagePreview" class="mt-3">
      <img 
        :src="imagePreview" 
        alt="Preview"
        class="w-full h-40 object-cover rounded-lg border border-gray-200"
      >
    </div>

    <div class="flex gap-3 pt-4">
      <button 
        type="button"
        @click="handleCancel"
        class="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
        :disabled="uploading"
      >
        Batal
      </button>
      <button 
        type="button"
        @click="handleSubmit"
        class="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        :disabled="uploading || !name || !categoryId || amount <= 0"
      >
        {{ uploading ? 'Uploading...' : (history ? 'Update' : 'Simpan') }}
      </button>
    </div>
  </div>
</template>
