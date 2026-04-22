<template>
  <!-- Change password page — two-step email verification flow (D-F-16 + D-F-17)
       Step 1: Send verification code to bound email
       Step 2: Enter code + new password (with real-time strength indicator) -->
  <div class="password-page">
    <h2 class="page-title">修改密码</h2>
    <a-card class="password-card">
      <a-steps :current="currentStep" size="small" style="margin-bottom: 24px">
        <a-step title="发送验证码" />
        <a-step title="设置新密码" />
      </a-steps>

      <!-- Step 1: send reset code to bound email -->
      <div v-if="currentStep === 0" class="step-content">
        <p class="step-hint">点击"发送验证码"，系统将向您绑定的邮箱发送 6 位验证码。</p>
        <a-form layout="vertical">
          <a-form-item>
            <a-button
              type="primary"
              :loading="sending"
              :disabled="countdown > 0"
              data-catch="me-password-send-code"
              @click="handleSendCode"
            >
              {{ countdown > 0 ? `${countdown}s 后重新发送` : '发送验证码' }}
            </a-button>
            <span v-if="codeSent" class="sent-tip">验证码已发送至绑定邮箱</span>
          </a-form-item>
        </a-form>
        <div class="step-actions">
          <a-button @click="handleCancel">取消</a-button>
          <a-button type="primary" :disabled="!codeSent" @click="currentStep = 1">
            下一步
          </a-button>
        </div>
      </div>

      <!-- Step 2: enter code + new password -->
      <div v-if="currentStep === 1" class="step-content">
        <a-form :model="formState" layout="vertical" @finish="handleSubmit">
          <a-form-item
            label="验证码"
            name="code"
            :rules="[{ required: true, message: '请输入验证码', trigger: 'blur' }]"
          >
            <a-input
              v-model:value="formState.code"
              placeholder="请输入6位验证码"
              :maxlength="6"
              data-catch="me-password-code-input"
            />
          </a-form-item>

          <a-form-item label="新密码" name="newPassword" :rules="newPasswordRules">
            <a-input-password
              v-model:value="formState.newPassword"
              placeholder="请输入新密码"
              data-catch="me-password-new-input"
            />
          </a-form-item>

          <!-- Real-time password strength indicator (D-F-17) -->
          <div class="strength-hints">
            <div :class="['hint-item', strengthChecks.length ? 'hint-ok' : 'hint-ng']">
              长度 8-64 位
            </div>
            <div :class="['hint-item', strengthChecks.hasLetter ? 'hint-ok' : 'hint-ng']">
              包含字母
            </div>
            <div :class="['hint-item', strengthChecks.hasDigit ? 'hint-ok' : 'hint-ng']">
              包含数字
            </div>
          </div>

          <a-form-item
            label="确认新密码"
            name="confirmPassword"
            :rules="confirmPasswordRules"
          >
            <a-input-password
              v-model:value="formState.confirmPassword"
              placeholder="请再次输入新密码"
              data-catch="me-password-confirm-input"
            />
          </a-form-item>

          <a-form-item>
            <a-space>
              <a-button @click="currentStep = 0">上一步</a-button>
              <a-button
                type="primary"
                html-type="submit"
                :loading="loading"
                data-catch="me-password-submit"
              >
                确认修改
              </a-button>
            </a-space>
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

definePageMeta({
  layout: 'default',
})

const userStore = useUserStore()
const currentStep = ref(0)
const codeSent = ref(false)
const sending = ref(false)
const countdown = ref(0)
const loading = ref(false)

let countdownTimer: ReturnType<typeof setInterval> | null = null

interface FormState {
  code: string
  newPassword: string
  confirmPassword: string
}

const formState = reactive<FormState>({
  code: '',
  newPassword: '',
  confirmPassword: '',
})

// Real-time password strength checks — used by strength indicator and validation rules
const strengthChecks = computed(() => ({
  length: formState.newPassword.length >= 8 && formState.newPassword.length <= 64,
  hasLetter: /[a-zA-Z]/.test(formState.newPassword),
  hasDigit: /[0-9]/.test(formState.newPassword),
  noSpace: !/\s/.test(formState.newPassword),
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
      if (value !== formState.newPassword) return Promise.reject(new Error('两次输入的密码不一致'))
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

async function handleSendCode() {
  sending.value = true
  try {
    await request({
      url: '/auth/password/send-reset-code',
      method: 'POST',
      body: {},
    })
    codeSent.value = true
    startCountdown()
    message.success('验证码已发送至绑定邮箱')
  } catch (err: unknown) {
    const fetchError = err as { data?: { message?: string } }
    message.error(fetchError?.data?.message || '发送失败，请稍后重试')
  } finally {
    sending.value = false
  }
}

async function handleSubmit() {
  loading.value = true
  try {
    await request({
      url: '/auth/password/verify-reset',
      method: 'POST',
      body: {
        code: formState.code,
        newPassword: formState.newPassword,
      },
    })
    message.success('密码已修改，请重新登录')
    userStore.logout()
    setTimeout(() => {
      navigateTo('/login')
    }, 1500)
  } catch (err: unknown) {
    const fetchError = err as { data?: { message?: string } }
    message.error(fetchError?.data?.message || '修改失败，请检查验证码是否正确')
  } finally {
    loading.value = false
  }
}

function handleCancel() {
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

.step-content {
  padding: 8px 0;
}

.step-hint {
  color: #666;
  margin-bottom: 16px;
}

.step-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 16px;
}

.sent-tip {
  margin-left: 12px;
  color: #52c41a;
  font-size: 13px;
}

/* Password strength indicator — grey when not met, green when met */
.strength-hints {
  display: flex;
  gap: 12px;
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
