import { ref } from 'vue'
import { supabase } from '@/services/supabase'

export function useImageUpload() {
  const uploading = ref(false)
  const uploadError = ref<string | null>(null)

  const generateFileName = (email: string, prefix: string, file: File) => {
    // Remove everything after @ in email
    const emailPart = email.split('@')[0]
    
    // Get current timestamp
    const now = new Date()
    const timestamp = now.toISOString()
      .replace(/[-:]/g, '')
      .replace('T', '-')
      .split('.')[0]
    
    // Get file extension
    const extension = file.name.split('.').pop()
    
    return `${prefix}_${emailPart}_${timestamp}.${extension}`
  }

  const uploadImage = async (file: File, email: string, prefix: string = 'image') => {
    uploading.value = true
    uploadError.value = null

    try {
      const fileName = generateFileName(email, prefix, file)
      const filePath = fileName

      // Upload file to Supabase Storage
      const { data, error } = await supabase.storage
        .from('uploads')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (error) throw error

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('uploads')
        .getPublicUrl(filePath)

      return { url: publicUrl, path: data.path }
    } catch (error: any) {
      uploadError.value = error.message || 'Failed to upload image'
      throw error
    } finally {
      uploading.value = false
    }
  }

  const deleteImage = async (path: string) => {
    try {
      const { error } = await supabase.storage
        .from('uploads')
        .remove([path])

      if (error) throw error
      return true
    } catch (error: any) {
      uploadError.value = error.message || 'Failed to delete image'
      throw error
    }
  }

  return {
    uploading,
    uploadError,
    uploadImage,
    deleteImage
  }
}
