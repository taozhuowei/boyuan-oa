<template>
  <div class="password-page">
    <h2 class="page-title">修改密码</h2>
    <a-card class="password-card">
      <a-form
        :model="formState"
        :rules="rules"
        layout="vertical"
        @finish="handleSubmit"
      >
        <a-form-item label="当前密码" name="currentPassword">
          <a-input-password
            v-model:value="formState.currentPassword"
            placeholder="请输入当前密码"
          />
        </a-form-item>

        <a-form-item label="新密码" name="newPassword">
          <a-input-password
            v-model:value="formState.newPassword"
            placeholder="请输入新密码"
          />
        </a-form-item>

        <a-form-item label="确认新密码" name="confirmPassword">
          <a-input-password
            v-model:value="formState.confirmPassword"
            placeholder="请再次输入新密码"
          />
        </a-form-item>

        <a-form-item>
          <a-space>
            <a-button type="primary" html-type="submit" :loading="loading" data-catch="me-password-submit">
              保存
            </a-button>
            <a-button @click="handleCancel">取消</a-button>
          </a-space>
        </a-form-item>
      </a-form>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { message } from 'ant-design-vue'
import { request } from '~/utils/http'

definePageMeta({
  layout: 'default'
})

interface FormState {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

const formState = reactive<FormState>({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const loading = ref(false)

const validateConfirmPassword = (_rule: unknown, value: string) => {
  if (!value) {
    return Promise.reject(new Error('请确认新密码'))
  }
  if (value !== formState.newPassword) {
    return Promise.reject(new Error('两次输入的密码不一致'))
  }
  return Promise.resolve()
}

const rules = {
  currentPassword: [
    { required: true, message: '请输入当前密码', trigger: 'blur' }
  ],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码长度至少6位', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, validator: validateConfirmPassword, trigger: 'blur' }
  ]
}

const handleSubmit = async () => {
  loading.value = true
  try {
    await request({
      url: '/auth/change-password',
      method: 'POST',
      body: {
        currentPassword: formState.currentPassword,
        newPassword: formState.newPassword
      }
    })
    message.success('密码修改成功')
    setTimeout(() => {
      navigateTo('/me')
    }, 1500)
  } catch (error: any) {
    const errorMessage = error?.data?.message || error?.message || '密码修改失败'
    message.error(errorMessage)
  } finally {
    loading.value = false
  }
}

const handleCancel = () => {
  navigateTo('/me')
}
</script>

<style scoped>
.password-page {
  padding: 16px;
  height: 100%;
  min-height: 0;
  overflow-y: auto;
}

.page-title {
  text-align: center;
  margin-bottom: 16px;
  flex-shrink: 0;
}

.password-card {
  max-width: 480px;
  margin: 0 auto;
}
</style>
