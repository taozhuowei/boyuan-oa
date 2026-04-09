<template>
  <a-card v-if="isDev" title="快捷登录" size="small" style="width: 200px">
    <a-space direction="vertical" style="width: 100%">
      <a-button
        v-for="user in quickUsers"
        :key="user.username"
        size="small"
        block
        :loading="user.loading"
        @click="quickLogin(user)"
      >
        {{ user.label }}
      </a-button>
    </a-space>
  </a-card>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

const isDev = computed(() => import.meta.env.DEV)

interface QuickUser {
  username: string
  label: string
  loading: boolean
}

const quickUsers = ref<QuickUser[]>([
  { username: 'employee.demo', label: '员工', loading: false },
  { username: 'finance.demo', label: '财务', loading: false },
  { username: 'pm.demo', label: '项目经理', loading: false },
  { username: 'ceo.demo', label: 'CEO', loading: false },
  { username: 'worker.demo', label: '施工队', loading: false }
])

interface LoginResponse {
  token: string
  user: string
}

async function quickLogin(user: QuickUser) {
  user.loading = true
  try {
    const data = await $fetch<LoginResponse>('http://localhost:8080/api/auth/login', {
      method: 'POST',
      body: {
        username: user.username,
        password: '123456'
      }
    })
    useCookie('oa-token').value = data.token
    useCookie('oa-user').value = data.user
    navigateTo('/')
  } finally {
    user.loading = false
  }
}
</script>
