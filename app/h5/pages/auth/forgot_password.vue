<template>
  <!-- 忘记密码 — 4 步重置流程（无需登录，独立全屏布局）
       Step 1: 输入邮箱 → POST /auth/send-reset-code
       Step 2: 输入验证码 → POST /auth/verify-reset-code → 返回 resetToken
       Step 3: 输入新密码 → POST /auth/reset-password
       Step 4: 成功提示 → 跳转登录页 -->
  <a-config-provider :locale="zhCN">
    <div class="forgot-page">
      <div class="forgot-container">
        <div class="company-section">
          <h1 class="company-name">{{ companyName || '博渊' }}</h1>
          <p class="company-subtitle">通过绑定邮箱重置密码</p>
        </div>

        <div class="forgot-card">
          <a-steps :current="step" size="small" style="margin-bottom: 28px">
            <a-step title="邮箱" />
            <a-step title="验证码" />
            <a-step title="新密码" />
            <a-step title="完成" />
          </a-steps>

          <!-- Step 0: 输入邮箱 -->
          <template v-if="step === 0">
            <a-form layout="vertical">
              <a-form-item label="账号绑定邮箱">
                <a-input
                  v-model:value="email"
                  placeholder="请输入账号绑定的邮箱"
                  size="large"
                  :maxlength="254"
                  data-catch="forgot-email-input"
                />
              </a-form-item>
              <a-form-item>
                <a-button
                  type="primary"
                  block
                  size="large"
                  :loading="loading"
                  data-catch="forgot-send-code-btn"
                  @click="doSendCode"
                >
                  发送验证码
                </a-button>
              </a-form-item>
            </a-form>
          </template>

          <!-- Step 1: 输入验证码 -->
          <template v-if="step === 1">
            <a-form layout="vertical">
              <a-form-item :label="`已向 ${email} 发送验证码`">
                <a-input
                  v-model:value="code"
                  placeholder="请输入 6 位验证码"
                  size="large"
                  :maxlength="6"
                  data-catch="forgot-code-input"
                />
              </a-form-item>
              <a-form-item>
                <a-button
                  type="primary"
                  block
                  size="large"
                  :loading="loading"
                  data-catch="forgot-verify-code-btn"
                  @click="doVerifyCode"
                >
                  验证
                </a-button>
              </a-form-item>
              <a-form-item>
                <a-button type="link" block @click="step = 0">重新输入邮箱</a-button>
              </a-form-item>
            </a-form>
          </template>

          <!-- Step 2: 设置新密码 -->
          <template v-if="step === 2">
            <a-form layout="vertical">
              <a-form-item label="新密码">
                <a-input-password
                  v-model:value="newPassword"
                  placeholder="8-64 位，同时包含字母和数字"
                  size="large"
                  data-catch="forgot-new-password-input"
                />
              </a-form-item>
              <a-form-item label="确认新密码">
                <a-input-password
                  v-model:value="confirmPassword"
                  placeholder="再次输入新密码"
                  size="large"
                  data-catch="forgot-confirm-password-input"
                />
              </a-form-item>
              <a-form-item>
                <a-button
                  type="primary"
                  block
                  size="large"
                  :loading="loading"
                  data-catch="forgot-reset-submit-btn"
                  @click="doResetPassword"
                >
                  重置密码
                </a-button>
              </a-form-item>
            </a-form>
          </template>

          <!-- Step 3: 成功 -->
          <template v-if="step === 3">
            <div style="text-align: center; padding: 24px 0">
              <a-result status="success" title="密码重置成功" sub-title="请使用新密码登录">
                <template #extra>
                  <a-button
                    type="primary"
                    data-catch="forgot-goto-login-btn"
                    @click="navigateTo('/login')"
                  >
                    立即登录
                  </a-button>
                </template>
              </a-result>
            </div>
          </template>

          <div v-if="step < 3" style="text-align: center; margin-top: 8px">
            <a-button type="link" @click="navigateTo('/login')">返回登录</a-button>
          </div>
        </div>
      </div>
      <span class="powered-by">Powered by 博渊</span>
    </div>
  </a-config-provider>
</template>

<script setup lang="ts">
/**
 * 忘记密码 4 步流程 — auth/forgot_password.vue
 * 邮箱链路：/auth/send-reset-code → /auth/verify-reset-code → /auth/reset-password
 * 无需认证（layout: false）
 */
import { ref, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import zhCN from 'ant-design-vue/es/locale/zh_CN'

definePageMeta({ layout: false })

const step = ref(0)
const loading = ref(false)

const email = ref('')
const code = ref('')
const resetToken = ref('')
const newPassword = ref('')
const confirmPassword = ref('')

const API_BASE = '/api'

// D-F-17 密码强度规则（前端预校验），与后端 ResetPasswordRequest 保持一致
const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d)[^\s]{8,64}$/
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const { companyName, fetchIfNeeded } = useCompanyName()
onMounted(() => {
  fetchIfNeeded()
})

async function doSendCode() {
  const v = email.value.trim()
  if (!v) {
    message.warning('请输入邮箱')
    return
  }
  if (!EMAIL_REGEX.test(v)) {
    message.warning('邮箱格式不正确')
    return
  }
  loading.value = true
  try {
    await $fetch(`${API_BASE}/auth/send-reset-code`, {
      method: 'POST',
      body: { email: v },
    })
    message.success('若该邮箱已绑定账号，验证码已发送')
    step.value = 1
  } catch {
    message.error('发送失败，请稍后重试')
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
      body: { email: email.value.trim(), code: code.value.trim() },
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
  if (!PASSWORD_REGEX.test(newPassword.value)) {
    message.warning('密码须为 8-64 位，同时包含字母和数字')
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
      body: { resetToken: resetToken.value, newPassword: newPassword.value },
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
  min-height: 100vh;
  width: 100%;
  background: linear-gradient(160deg, #003466 0%, #1a4b84 45%, #f0f2f5 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  padding: 40px 16px;
}

.forgot-container {
  width: 100%;
  max-width: 440px;
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

.forgot-card {
  background: #fff;
  border-radius: 16px;
  padding: 32px 28px 28px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.18);
}

.powered-by {
  position: fixed;
  bottom: 20px;
  right: 24px;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.4);
}
</style>
