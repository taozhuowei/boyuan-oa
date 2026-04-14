<template>
  <a-config-provider :locale="zhCN">
  <div class="login-page">
    <div class="login-container">
      <!-- Company header -->
      <div class="company-section">
        <h1 class="company-name">众维建筑工程有限公司</h1>
        <p class="company-subtitle">企业协同管理系统</p>
      </div>

      <!-- Login card -->
      <div class="login-card">
        <a-form :model="form" layout="vertical" @finish="handleLogin">
          <a-form-item label="工号 / 手机号" name="identifier"
            :rules="[{ required: true, message: '请输入工号或手机号' }]">
            <a-input
              v-model:value="form.identifier"
              placeholder="请输入工号或手机号"
              size="large"
              :disabled="loading"
            />
          </a-form-item>

          <a-form-item label="登录密码" name="password"
            :rules="[{ required: true, message: '请输入密码' }]">
            <a-input-password
              v-model:value="form.password"
              placeholder="请输入密码"
              size="large"
              :disabled="loading"
            />
          </a-form-item>

          <a-alert v-if="errorMsg" type="error" :message="errorMsg" show-icon style="margin-bottom: 16px" data-catch="login-form-error-alert" />

          <a-form-item>
            <a-button
              type="primary"
              html-type="submit"
              size="large"
              block
              :loading="loading"
              data-catch="login-form-submit"
            >
              登 录
            </a-button>
          </a-form-item>
        </a-form>

        <div class="forgot-link" @click="navigateTo('/auth/forgot_password')">忘记密码？</div>
      </div>
    </div>

    <span class="powered-by">Powered by 博渊</span>
  </div>
  </a-config-provider>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import zhCN from 'ant-design-vue/es/locale/zh_CN'
import { loginWithAccount } from '~/utils/access'
import { useUserStore } from '~/stores/user'

definePageMeta({ layout: false })

const userStore = useUserStore()
const loading = ref(false)
const errorMsg = ref('')
const form = reactive({ identifier: '', password: '' })

async function handleLogin() {
  if (loading.value) return
  loading.value = true
  errorMsg.value = ''
  try {
    const result = await loginWithAccount({
      identifier: form.identifier,
      password: form.password
    })
    userStore.setSession(result.token, result.user)
    await navigateTo('/')
  } catch (err) {
    errorMsg.value = err instanceof Error ? err.message : '登录失败，请重试'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  width: 100%;
  background: linear-gradient(160deg, #003466 0%, #1a4b84 45%, #f0f2f5 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.login-container {
  width: 100%;
  max-width: 400px;
  padding: 0 20px;
}

.company-section {
  text-align: center;
  margin-bottom: 28px;
}

.company-name {
  font-size: 22px;
  font-weight: 700;
  color: #fff;
  margin: 0 0 6px;
}

.company-subtitle {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.75);
  margin: 0;
}

.login-card {
  background: #fff;
  border-radius: 16px;
  padding: 32px 28px 28px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.18);
}

.forgot-link {
  text-align: center;
  font-size: 13px;
  color: #003466;
  cursor: pointer;
  margin-top: 4px;
}

.powered-by {
  position: fixed;
  bottom: 20px;
  right: 24px;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.4);
}
</style>
