<template>
  <view class="page login-page">
    <view class="login-container">
      <view class="login-brand">
        <text class="brand-title">众维 OA</text>
        <text class="brand-subtitle">工程企业智慧办公平台</text>
      </view>

      <view class="login-form card">
        <view class="form-header">
          <text class="form-title">账号登录</text>
        </view>

        <view class="form-body">
          <view class="input-group">
            <Icon name="person" :size="18" />
            <input
              v-model="form.username"
              type="text"
              placeholder="请输入账号"
              class="input"
            />
          </view>

          <view class="input-group">
            <Icon name="settings" :size="18" />
            <input
              v-model="form.password"
              type="password"
              placeholder="请输入密码"
              class="input"
            />
          </view>

          <button class="btn-primary" @click="handleLogin">
            <text>进入工作台</text>
            <Icon name="arrow-forward" :size="16" />
          </button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { reactive } from 'vue'
import { Icon } from '../../components/ui'
import { useUserStore } from '../../stores'
import { loginWithAccount } from '../../utils/access'

const userStore = useUserStore()
const form = reactive({ username: '', password: '' })

const handleLogin = async () => {
  try {
    const result = await loginWithAccount(form)
    userStore.setSession(result.token, result.user)
    uni.switchTab({ url: '/pages/index/index' })
  } catch (error) {
    uni.showToast({ title: error instanceof Error ? error.message : '登录失败', icon: 'none' })
  }
}
</script>

<style lang="scss" scoped>
.login-page {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 20px;
}

.login-container {
  width: 100%;
  max-width: 400px;
}

.login-brand {
  text-align: center;
  margin-bottom: 32px;
}

.brand-title {
  font-family: var(--font-display);
  font-size: 32px;
  font-weight: 800;
  color: var(--primary);
  display: block;
}

.brand-subtitle {
  font-size: 14px;
  color: var(--on-surface-variant);
  margin-top: 8px;
  display: block;
}

.login-form {
  padding: 28px;
}

.form-header {
  margin-bottom: 24px;
}

.form-title {
  font-family: var(--font-display);
  font-size: 20px;
  font-weight: 700;
  color: var(--on-surface);
}

.form-body {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.input-group {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: var(--surface-low);
  border-radius: var(--radius-md);
  color: var(--on-surface-variant);
}

.input {
  flex: 1;
  border: none;
  background: transparent;
  font-size: 15px;
  color: var(--on-surface);
}

.input::placeholder {
  color: var(--outline);
}

.btn-primary {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: 48px;
  margin-top: 8px;
  background: linear-gradient(135deg, var(--primary) 0%, var(--primary-container) 100%);
  color: var(--on-primary);
  border-radius: var(--radius-md);
  font-size: 15px;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: opacity 0.2s ease;
}

.btn-primary:active {
  opacity: 0.9;
}
</style>
