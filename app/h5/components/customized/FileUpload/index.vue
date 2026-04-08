<template>
  <!-- 附件上传组件 — 通用跨端文件上传
       数据走向：调用 POST /api/attachments/upload → 返回 attachmentId
       触发 change 事件：返回已上传文件列表 { attachmentId, fileName, url } -->
  <div class="file-upload">
    <a-upload
      :file-list="fileList"
      :multiple="maxCount > 1"
      :max-count="maxCount"
      :accept="accept"
      :before-upload="handleBeforeUpload"
      :custom-request="handleUpload"
      @remove="handleRemove"
      list-type="text"
    >
      <a-button :disabled="fileList.length >= maxCount">
        <upload-outlined />
        上传附件
      </a-button>
      <template #itemRender="{ file, actions }">
        <div style="display: flex; align-items: center; gap: 8px; padding: 4px 0;">
          <paper-clip-outlined />
          <span style="flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
            {{ file.name }}
          </span>
          <a-tag v-if="file.status === 'done'" color="green">已上传</a-tag>
          <a-tag v-else-if="file.status === 'uploading'" color="blue">上传中</a-tag>
          <a-tag v-else-if="file.status === 'error'" color="red">失败</a-tag>
          <a-button type="link" danger size="small" @click="actions.remove">删除</a-button>
        </div>
      </template>
    </a-upload>
    <div v-if="hint" style="color: #999; font-size: 12px; margin-top: 4px;">{{ hint }}</div>
  </div>
</template>

<script setup lang="ts">
/**
 * FileUpload — 附件上传组件
 * Props: maxCount（最大文件数）, accept（MIME 类型过滤）, businessType, businessId
 * Emits: change(uploaded: UploadedFile[]) — 每次上传/删除后触发
 */
import { ref } from 'vue'
import { message } from 'ant-design-vue'
import { UploadOutlined, PaperClipOutlined } from '@ant-design/icons-vue'
import { useCookie } from '#app'

interface UploadedFile {
  attachmentId: number
  fileName: string
  storagePath: string
  uid: string
}

interface AntUploadFile {
  uid: string
  name: string
  status?: 'done' | 'uploading' | 'error' | 'removed'
  response?: { attachmentId: number; fileName: string; storagePath: string }
  url?: string
}

const props = withDefaults(defineProps<{
  maxCount?: number
  accept?: string
  businessType?: string
  businessId?: number | null
  hint?: string
}>(), {
  maxCount: 5,
  accept: 'image/*,.pdf',
  businessType: 'GENERAL',
  businessId: null,
  hint: ''
})

const emit = defineEmits<{
  (e: 'change', files: UploadedFile[]): void
}>()

const fileList = ref<AntUploadFile[]>([])
const uploaded = ref<UploadedFile[]>([])

function handleBeforeUpload(file: File) {
  const isValidSize = file.size / 1024 / 1024 < 10
  if (!isValidSize) {
    message.error('文件大小不能超过 10MB')
    return false
  }
  return true
}

async function handleUpload({ file, onSuccess, onError, onProgress }: {
  file: File
  onSuccess: (res: unknown) => void
  onError: (err: Error) => void
  onProgress: (event: { percent: number }) => void
}) {
  const tokenCookie = useCookie<string | null>('oa-token')
  const formData = new FormData()
  formData.append('file', file)
  formData.append('businessType', props.businessType)
  if (props.businessId) formData.append('businessId', String(props.businessId))

  try {
    onProgress({ percent: 30 })
    const res = await $fetch<{ attachmentId: number; fileName: string; storagePath: string }>(
      '/api/attachments/upload',
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${tokenCookie.value ?? ''}` },
        body: formData
      }
    )
    onProgress({ percent: 100 })
    onSuccess(res)

    const entry: UploadedFile = {
      attachmentId: res.attachmentId,
      fileName: res.fileName,
      storagePath: res.storagePath,
      uid: (file as unknown as AntUploadFile).uid ?? String(Date.now())
    }
    uploaded.value.push(entry)
    emit('change', [...uploaded.value])
    message.success(`${file.name} 上传成功`)
  } catch {
    onError(new Error('上传失败'))
    message.error(`${file.name} 上传失败`)
  }
}

function handleRemove(file: AntUploadFile) {
  uploaded.value = uploaded.value.filter(u => u.uid !== file.uid)
  emit('change', [...uploaded.value])
}

/** 外部可调用 clear() 清空上传列表 */
function clear() {
  fileList.value = []
  uploaded.value = []
  emit('change', [])
}

defineExpose({ clear })
</script>
