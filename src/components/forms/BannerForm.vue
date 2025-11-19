<script setup lang="ts">
import { ref, watch } from 'vue'
import { useImageUpload } from '@/composables/useImageUpload'
import { authService } from '@/services/supabase'
import type { Banner } from '@/services/bannerService'

const props = defineProps<{
  banner?: Banner | null
}>()

const emit = defineEmits<{
  submit: [data: { name: string; url: string }]
  cancel: []
}>()

const name = ref('')
const url = ref('')
const imageFile = ref<File | null>(null)
const imagePreview = ref<string | null>(null)

const { uploading, uploadImage } = useImageUpload()

const resetForm = () => {
  name.value = ''
  url.value = ''
  imageFile.value = null
  imagePreview.value = null
}

// Watch for banner prop changes (edit mode)
watch(() => props.banner, (newBanner) => {
  if (newBanner) {
    name.value = newBanner.name
    url.value = newBanner.url
    imagePreview.value = newBanner.url
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
  let finalUrl = url.value

  // Upload image if file selected
  if (imageFile.value) {
    try {
      const { sessionUser } = await authService.getSession()
      const email = sessionUser?.email || 'anonymous'
      
      const result = await uploadImage(imageFile.value, email, 'banner')
      finalUrl = result.url
    } catch (error) {
      console.error('Upload error:', error)
      return
    }
  }

  emit('submit', {
    name: name.value,
    url: finalUrl
  })
}

const handleCancel = () => {
  resetForm()
  emit('cancel')
}
</script>

<template>
  <div class="space-y-4">
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-2">Nama Banner</label>
      <input 
        v-model="name"
        type="text" 
        placeholder="Masukkan nama banner..."
        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        required
      >
    </div>

    <div>
      <label class="block text-sm font-medium text-gray-700 mb-2">Upload Gambar</label>
      <input 
        type="file"
        accept="image/*"
        @change="handleFileChange"
        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      >
      <p class="text-xs text-gray-500 mt-1">Atau masukkan URL gambar dibawah</p>
    </div>

    <div v-if="imagePreview" class="mt-3">
      <img 
        :src="imagePreview" 
        alt="Preview"
        class="w-full h-40 object-cover rounded-lg border border-gray-200"
      >
    </div>

    <div>
      <label class="block text-sm font-medium text-gray-700 mb-2">URL Gambar</label>
      <input 
        v-model="url"
        type="url" 
        placeholder="https://example.com/image.jpg"
        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        :required="!imageFile"
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
        :disabled="uploading || (!name || (!url && !imageFile))"
      >
        {{ uploading ? 'Uploading...' : (banner ? 'Update' : 'Simpan') }}
      </button>
    </div>
  </div>
</template>
