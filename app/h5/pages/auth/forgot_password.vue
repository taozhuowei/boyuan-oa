<template>
  <!-- 忘记密码 — 4步重置流程（无需登录，独立布局）
       Step 1: 输入手机号 → POST /auth/send-reset-code
       Step 2: 输入验证码 → POST /auth/verify-reset-code → 返回 resetToken
       Step 3: 输入新密码 → POST /auth/reset-password
       Step 4: 成功提示 → 跳转登录页 -->
  <a-config-provider :locale="zhCN">
  <div class="forgot-page">
    <div class="forgot-card">
      <h2 class="forgot-title">重置密码</h2>

      <!-- 步骤指示器 -->
      <a-steps :current="step" size="small" style="margin-bottom: 32px;">
        <a-step title="手机号" />
        <a-step title="验证码" />
        <a-step title="新密码" />
        <a-step title="完成" />
      </a-steps>

      <!-- Step 0: 输入手机号 -->
      <template v-if="step === 0">
        <a-form layout="vertical">
          <a-form-item label="注册手机号">
            <a-input
              v-model:value="phone"
              placeholder="请输入账号绑定的手机号"
              size="large"
              :maxlength="11"
            />
          </a-form-item>
          <a-form-item>
            <a-button type="primary" block size="large" :loading="loading" @click="doSendCode">
              发送验证码
            </a-button>
          </a-form-item>
        </a-form>
      </template>

      <!-- Step 1: 输入验证码 -->
      <template v-if="step === 1">
        <a-form layout="vertical">
          <a-form-item :label="`已向 ${phone} 发送验证码`">
            <a-input
              v-model:value="code"
              placeholder="请输入 6 位验证码"
              size="large"
              :maxlength="6"
            />
          </a-form-item>
          <a-form-item>
            <a-button type="primary" block size="large" :loading="loading" @click="doVerifyCode">
              验证
            </a-button>
          </a-form-item>
          <a-form-item>
            <a-button type="link" block @click="step = 0">重新输入手机号</a-button>
          </a-form-item>
        </a-form>
      </template>

      <!-- Step 2: 设置新密码 -->
      <template v-if="step === 2">
        <a-form layout="vertical">
          <a-form-item label="新密码">
            <a-input-password
              v-model:value="newPassword"
              placeholder="请输入新密码（至少6位）"
              size="large"
            />
          </a-form-item>
          <a-form-item label="确认新密码">
            <a-input-password
              v-model:value="confirmPassword"
              placeholder="再次输入新密码"
              size="large"
            />
          </a-form-item>
          <a-form-item>
            <a-button type="primary" block size="large" :loading="loading" @click="doResetPassword">
              重置密码
            </a-button>
          </a-form-item>
        </a-form>
      </template>

      <!-- Step 3: 成功 -->
      <template v-if="step === 3">
        <div style="text-align: center; padding: 24px 0;">
          <a-result
            status="success"
            title="密码重置成功"
            sub-title="请使用新密码登录"
          >
            <template #extra>
              <a-button type="primary" @click="navigateTo('/login')">立即登录</a-button>
            </template>
          </a-result>
        </div>
      </template>

      <!-- 返回登录 -->
      <div v-if="step < 3" style="text-align: center; margin-top: 8px;">
        <a-button type="link" @click="navigateTo('/login')">返回登录</a-button>
      </div>
    </div>
  </div>
  </a-config-provider>
</template>

<script setup lang="ts">
/**
 * 忘记密码 4 步流程 — auth/forgot_password.vue
 * 接口：POST /auth/send-reset-code / /auth/verify-reset-code / /auth/reset-password
 * 无需认证（layout: false）
 */
import { ref } from 'vue'
import { message } from 'ant-design-vue'
import zhCN from 'ant-design-vue/es/locale/zh_CN'

definePageMeta({ layout: false })

const step = ref(0)
const loading = ref(false)

const phone = ref('')
const code = ref('')
const resetToken = ref('')
const newPassword = ref('')
const confirmPassword = ref('')

const API_BASE = '/api'

async function doSendCode() {
  if (!phone.value.trim()) {
    message.warning('请输入手机号')
    return
  }
  loading.value = true
  try {
    await $fetch(`${API_BASE}/auth/send-reset-code`, {
      method: 'POST',
      body: { phone: phone.value.trim() }
    })
    message.success('验证码已发送')
    step.value = 1
  } catch {
    message.error('发送失败，请检查手机号')
  } finally {
    loading.value = false
  }
}

async function doVerifyCode() {
  if (!code.value.trim()) {
    message.warning('请输入验证码')
    return
  }
  loading.value = true
  try {
    const res = await $fetch<{ resetToken: string }>(`${API_BASE}/auth/verify-reset-code`, {
      method: 'POST',
      body: { phone: phone.value.trim(), code: code.value.trim() }
    })
    resetToken.value = res.resetToken
    message.success('验证通过')
    step.value = 2
  } catch {
    message.error('验证码不正确或已过期')
  } finally {
    loading.value = false
  }
}

async function doResetPassword() {
  if (!newPassword.value) {
    message.warning('请输入新密码')
    return
  }
  if (newPassword.value.length < 6) {
    message.warning('密码至少 6 位')
    return
  }
  if (newPassword.value !== confirmPassword.value) {
    message.warning('两次密码不一致')
    return
  }
  loading.value = true
  try {
    await $fetch(`${API_BASE}/auth/reset-password`, {
      method: 'POST',
      body: { resetToken: resetToken.value, newPassword: newPassword.value }
    })
    step.value = 3
  } catch {
    message.error('重置失败，请重新操作')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.forgot-page {
  height: 100%;
  min-height: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f0f2f5;
}

.forgot-card {
  background: #fff;
  border-radius: 8px;
  padding: 40px 48px;
  width: 420px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.08);
}

.forgot-title {
  text-align: center;
  font-size: 22px;
  font-weight: 600;
  color: #003466;
  margin-bottom: 24px;
}
</style>
