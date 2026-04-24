<template>
  <!-- First-login account setup page (D-F-23)
       Shown when user has no bound email or is using the default password.
       Two-step flow: bind email → set new password.
       Prevents access to other pages until both steps are complete. -->
  <div class="setup-account-page">
    <a-card title="完善账号安全" class="setup-account-card">
      <a-steps :current="currentStep" size="small" style="margin-bottom: 32px">
        <a-step title="绑定邮箱" />
        <a-step title="设置密码" />
      </a-steps>

      <!-- Step 1: bind email with verification code -->
      <div v-if="currentStep === 0" class="step-content">
        <p class="step-desc">请先绑定您的邮箱，以便后续找回密码。</p>
        <a-form :model="step1Form" layout="vertical">
          <a-form-item label="邮箱地址" name="email" :rules="emailRules">
            <a-input
              v-model:value="step1Form.email"
              placeholder="请输入您的邮箱"
              data-catch="setup-account-email-input"
            />
          </a-form-item>
          <a-form-item label="验证码" name="code">
            <a-input-group compact>
              <a-input
                v-model:value="step1Form.code"
                placeholder="请输入6位验证码"
                :maxlength="6"
                style="width: calc(100% - 130px)"
                data-catch="setup-account-code-input"
              />
              <a-button
                :loading="sendingCode"
                :disabled="countdown > 0 || !step1Form.email"
                style="width: 130px"
                @click="handleSendBindCode"
              >
                {{ countdown > 0 ? `${countdown}s 后重发` : '发送验证码' }}
              </a-button>
            </a-input-group>
          </a-form-item>
          <a-form-item>
            <a-button
              type="primary"
              :loading="bindingEmail"
              data-catch="setup-account-bind-btn"
              @click="handleBindEmail"
            >
              确认绑定
            </a-button>
          </a-form-item>
        </a-form>
      </div>

      <!-- Step 2: set new password with strength indicator -->
      <div v-if="currentStep === 1" class="step-content">
        <p class="step-desc">请设置一个新密码，完成后即可正常使用系统。</p>
        <a-form :model="step2Form" layout="vertical" @finish="handleSetPassword">
          <a-form-item label="新密码" name="newPassword" :rules="newPasswordRules">
            <a-input-password
              v-model:value="step2Form.newPassword"
              placeholder="请输入新密码（8-64位，含字母和数字）"
              data-catch="setup-account-password-input"
            />
          </a-form-item>

          <!-- Real-time password strength indicator (D-F-17) -->
          <div class="strength-hints">
            <span :class="['hint-item', strengthChecks.length ? 'hint-ok' : 'hint-ng']">
              长度 8-64 位
            </span>
            <span :class="['hint-item', strengthChecks.hasLetter ? 'hint-ok' : 'hint-ng']">
              包含字母
            </span>
            <span :class="['hint-item', strengthChecks.hasDigit ? 'hint-ok' : 'hint-ng']">
              包含数字
            </span>
          </div>

          <a-form-item
            label="确认新密码"
            name="confirmPassword"
            :rules="confirmPasswordRules"
          >
            <a-input-password
              v-model:value="step2Form.confirmPassword"
              placeholder="请再次输入新密码"
              data-catch="setup-account-confirm-input"
            />
          </a-form-item>

          <a-form-item>
            <a-button
              type="primary"
              html-type="submit"
              :loading="settingPassword"
              data-catch="setup-account-password-submit"
            >
              完成设置
            </a-button>
          </a-form-item>
        </a-form>
      </div>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, computed } from 'vue'
import { message } from 'ant-design-vue'
import { request } from '~/utils/http'
import { useUserStore } from '~/stores/user'

// This page uses no layout so that route-guarded users cannot see the normal shell
definePageMeta({
  layout: false,
})

const userStore = useUserStore()
const currentStep = ref(0)
const sendingCode = ref(false)
const bindingEmail = ref(false)
const settingPassword = ref(false)
const countdown = ref(0)
let countdownTimer: ReturnType<typeof setInterval> | null = null

interface Step1Form {
  email: string
  code: string
}

interface Step2Form {
  newPassword: string
  confirmPassword: string
}

const step1Form = reactive<Step1Form>({ email: '', code: '' })
const step2Form = reactive<Step2Form>({ newPassword: '', confirmPassword: '' })

// Email format validation
const emailRules = [
  { required: true, message: '请输入邮箱地址', trigger: 'blur' },
  { type: 'email' as const, message: '请输入有效的邮箱地址', trigger: 'blur' },
]

// Password strength computed checks (D-F-17)
const strengthChecks = computed(() => ({
  length: step2Form.newPassword.length >= 8 && step2Form.newPassword.length <= 64,
  hasLetter: /[a-zA-Z]/.test(step2Form.newPassword),
  hasDigit: /[0-9]/.test(step2Form.newPassword),
}))

const newPasswordRules = [
  { required: true, message: '请输入新密码', trigger: 'blur' },
  {
    validator: (_rule: unknown, value: string) => {
      if (!value) return Promise.resolve()
      if (value.length < 8 || value.length > 64)
        return Promise.reject(new Error('密码长度须为 8-64 位'))
      if (!/[a-zA-Z]/.test(value)) return Promise.reject(new Error('密码须包含字母'))
      if (!/[0-9]/.test(value)) return Promise.reject(new Error('密码须包含数字'))
      if (/\s/.test(value)) return Promise.reject(new Error('密码不能包含空格'))
      return Promise.resolve()
    },
    trigger: 'blur',
  },
]

const confirmPasswordRules = [
  {
    validator: (_rule: unknown, value: string) => {
      if (!value) return Promise.reject(new Error('请确认新密码'))
      if (value !== step2Form.newPassword) return Promise.reject(new Error('两次输入的密码不一致'))
      return Promise.resolve()
    },
    trigger: 'blur',
  },
]

function startCountdown() {
  countdown.value = 60
  countdownTimer = setInterval(() => {
    countdown.value -= 1
    if (countdown.value <= 0 && countdownTimer) {
      clearInterval(countdownTimer)
      countdownTimer = null
    }
  }, 1000)
}

async function handleSendBindCode() {
  if (!step1Form.email) {
    message.warning('请先填写邮箱地址')
    return
  }
  sendingCode.value = true
  try {
    await request({
      url: '/auth/email/send-bind-code',
      method: 'POST',
      body: { email: step1Form.email },
    })
    startCountdown()
    message.success('验证码已发送至邮箱')
  } catch (err: unknown) {
    const fetchError = err as { data?: { message?: string } }
    message.error(fetchError?.data?.message || '发送失败，请稍后重试')
  } finally {
    sendingCode.value = false
  }
}

async function handleBindEmail() {
  if (!step1Form.email) {
    message.warning('请填写邮箱地址')
    return
  }
  if (!step1Form.code) {
    message.warning('请填写验证码')
    return
  }
  bindingEmail.value = true
  try {
    await request({
      url: '/auth/email/verify-bind',
      method: 'POST',
      body: { email: step1Form.email, code: step1Form.code },
    })
    message.success('邮箱绑定成功')
    // 同步到 cookie，避免 auth.global.ts 按 email===null 仍重定向回 /setup-account
    userStore.setUserInfo({ email: step1Form.email })
    currentStep.value = 1
  } catch (err: unknown) {
    const fetchError = err as { data?: { message?: string } }
    message.error(fetchError?.data?.message || '绑定失败，请检查验证码是否正确')
  } finally {
    bindingEmail.value = false
  }
}

async function handleSetPassword() {
  settingPassword.value = true
  try {
    await request({
      url: '/auth/password/first-login-set',
      method: 'POST',
      body: { newPassword: step2Form.newPassword },
    })
    message.success('密码设置成功，即将跳转工作台')
    // Clear default-password flag in user session so guard stops redirecting
    userStore.setUserInfo({ isDefaultPassword: false })
    setTimeout(() => {
      navigateTo('/')
    }, 1200)
  } catch (err: unknown) {
    const fetchError = err as { data?: { message?: string } }
    message.error(fetchError?.data?.message || '密码设置失败，请重试')
  } finally {
    settingPassword.value = false
  }
}
</script>

<style scoped>
.setup-account-page {
  min-height: 100vh;
  padding: 40px 16px;
  background: #f0f2f5;
  display: flex;
  align-items: flex-start;
  justify-content: center;
}

.setup-account-card {
  width: 100%;
  max-width: 480px;
}

.step-content {
  padding: 8px 0;
}

.step-desc {
  color: #666;
  margin-bottom: 20px;
}

/* Password strength indicator (D-F-17) */
.strength-hints {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.hint-item {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 4px;
}

.hint-ng {
  color: #999;
  background: #f5f5f5;
}

.hint-ok {
  color: #52c41a;
  background: #f6ffed;
}
</style>
