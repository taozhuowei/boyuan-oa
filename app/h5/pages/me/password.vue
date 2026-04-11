<template>
  <div class="password-page">
    <h2 class="page-title">Change Password</h2>
    <a-card class="password-card">
      <a-form
        :model="formState"
        :rules="rules"
        layout="vertical"
        @finish="handleSubmit"
      >
        <a-form-item label="Current Password" name="currentPassword">
          <a-input-password
            v-model:value="formState.currentPassword"
            placeholder="Enter current password"
          />
        </a-form-item>

        <a-form-item label="New Password" name="newPassword">
          <a-input-password
            v-model:value="formState.newPassword"
            placeholder="Enter new password"
          />
        </a-form-item>

        <a-form-item label="Confirm New Password" name="confirmPassword">
          <a-input-password
            v-model:value="formState.confirmPassword"
            placeholder="Confirm new password"
          />
        </a-form-item>

        <a-form-item>
          <a-space>
            <a-button type="primary" html-type="submit" :loading="loading">
              Save
            </a-button>
            <a-button @click="handleCancel">Cancel</a-button>
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
    return Promise.reject(new Error('Please confirm your new password'))
  }
  if (value !== formState.newPassword) {
    return Promise.reject(new Error('Passwords do not match'))
  }
  return Promise.resolve()
}

const rules = {
  currentPassword: [
    { required: true, message: 'Please enter your current password', trigger: 'blur' }
  ],
  newPassword: [
    { required: true, message: 'Please enter your new password', trigger: 'blur' },
    { min: 6, message: 'Password must be at least 6 characters', trigger: 'blur' }
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
    message.success('Password changed successfully')
    setTimeout(() => {
      navigateTo('/me')
    }, 1500)
  } catch (error: any) {
    const errorMessage = error?.data?.message || error?.message || 'Failed to change password'
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
  padding: 24px;
}

.page-title {
  text-align: center;
  margin-bottom: 24px;
}

.password-card {
  max-width: 480px;
  margin: 0 auto;
}
</style>
