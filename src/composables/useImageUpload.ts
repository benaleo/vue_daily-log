import { ref } from 'vue'
import { supabase } from '@/services/supabase'

export function useImageUpload() {
  const uploading = ref(false)
  const uploadError = ref<string | null>(null)

  const generateFileName = (file: File, email: String, prefix: String): string => {
    // Sanitize prefix
    const safePrefix = prefix.replace(/[^a-z0-9]/gi, '_').toLowerCase()
    
    // Get current timestamp
    const now = new Date()
    const timestamp = now.toISOString()
      .replace(/[-:]/g, '')
      .replace('T', '-')
      .split('.')[0] || Date.now().toString()
    
    // Get file extension
    const extension = file.name.split('.').pop()?.toLowerCase() || 'bin'
    
    return `${safePrefix}_${timestamp}.${extension}`
  }

  const uploadImage = async (file: File,email: string = 'anonymous', prefix: string = 'image') => {
    uploading.value = true
    uploadError.value = null

    try {
      // Get current user session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError) throw sessionError
      if (!session?.user) throw new Error('User not authenticated')
      
      const userId = session.user.id
      const fileName = generateFileName(file, email, prefix)
      const filePath = `${userId}/${fileName}`  // Remove 'uploads/' from path as it's the bucket name

      // Upload file to Supabase Storage
      const { data, error: uploadError } = await supabase.storage
        .from('uploads')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
          contentType: file.type
        })

      if (uploadError) {
        console.error('Upload error details:', uploadError)
        throw new Error(uploadError.message || 'Failed to upload file')
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('uploads')
        .getPublicUrl(filePath)

      return { 
        url: publicUrl, 
        path: filePath,
        fileName: fileName
      }
    } catch (error: any) {
      console.error('Upload error:', error)
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
