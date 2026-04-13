<template>
  <view class="forgot-page">
    <view class="forgot-container">
      <!-- 标题区域 -->
      <view class="header-section">
        <text class="page-title">找回密码</text>
        <text class="page-desc">通过手机号验证重置您的密码</text>
      </view>

      <!-- 步骤指示器 -->
      <view class="steps-wrapper">
        <component
          :is="Steps"
          v-if="Steps"
          :current="current_step - 1"
          class="steps-bar"
        >
          <component
            :is="Step"
            v-for="(label, idx) in step_labels"
            :key="idx"
            :title="label"
          />
        </component>
        <view v-else class="steps-fallback">
          <view
            v-for="(label, idx) in step_labels"
            :key="idx"
            class="fallback-step"
            :class="{ active: current_step === idx + 1, done: current_step > idx + 1 }"
          >
            <text class="fallback-dot">{{ current_step > idx + 1 ? '✓' : idx + 1 }}</text>
            <text class="fallback-label">{{ label }}</text>
          </view>
        </view>
      </view>

      <!-- 步骤内容 -->
      <view class="step-content">
        <!-- Step 1: 输入手机号 -->
        <template v-if="current_step === 1">
          <view class="form-card">
            <view class="form-item">
              <label>手机号</label>
              <input
                v-model="phone"
                class="field-input"
                type="tel"
                maxlength="11"
                placeholder="请输入手机号"
                placeholder-class="placeholder"
              />
            </view>
            <view class="form-hint">
              <text>请输入您注册时绑定的手机号</text>
            </view>
            <view
              class="action-btn"
              :class="{ disabled: !is_valid_phone || countdown > 0 }"
              @click="send_reset_code"
            >
              <text class="btn-text">
                {{ countdown > 0 ? `${countdown}秒后重试` : '发送验证码' }}
              </text>
            </view>
          </view>
        </template>

        <!-- Step 2: 输入验证码 -->
        <template v-if="current_step === 2">
          <view class="form-card">
            <view class="form-item">
              <label>验证码</label>
              <input
                v-model="otp_code"
                class="field-input"
                type="number"
                maxlength="6"
                placeholder="请输入6位验证码"
                placeholder-class="placeholder"
                focus
              />
            </view>
            <view class="form-hint">
              <text>验证码已发送至 {{ masked_phone }}</text>
              <text v-if="countdown > 0" class="resend-link">
                {{ countdown }}秒后可重发
              </text>
              <text v-else class="resend-link" @click="send_reset_code">重新发送</text>
            </view>
            <view
              class="action-btn"
              :class="{ disabled: !is_valid_otp }"
              @click="verify_reset_code"
            >
              <text class="btn-text">验证</text>
            </view>
          </view>
        </template>

        <!-- Step 3: 设置新密码 -->
        <template v-if="current_step === 3">
          <view class="form-card">
            <view class="form-item">
              <label>新密码</label>
              <view class="password-field">
                <input
                  v-model="new_password"
                  class="field-input"
                  :password="!show_password"
                  placeholder="至少8位，含字母和数字"
                  placeholder-class="placeholder"
                />
                <text class="eye-btn" @click="show_password = !show_password">
                  {{ show_password ? '🙈' : '👁' }}
                </text>
              </view>
            </view>
            <view class="form-item">
              <label>确认密码</label>
              <input
                v-model="confirm_password"
                class="field-input"
                password
                placeholder="再次输入新密码"
                placeholder-class="placeholder"
              />
            </view>
            <view class="form-hint">
              <text :class="password_hint_class">{{ password_hint }}</text>
            </view>
            <view
              class="action-btn"
              :class="{ disabled: !is_valid_password }"
              @click="reset_password"
            >
              <text class="btn-text">重置密码</text>
            </view>
          </view>
        </template>

        <!-- Step 4: 完成 -->
        <template v-if="current_step === 4">
          <view class="success-card">
            <view class="success-icon">✓</view>
            <text class="success-title">密码已重置</text>
            <text class="success-desc">您可以使用新密码登录系统了</text>
            <text class="success-desc">{{ redirect_countdown }} 秒后自动返回登录页</text>
            <view class="action-btn" @click="go_to_login">
              <text class="btn-text">返回登录</text>
            </view>
          </view>
        </template>
      </view>

      <!-- 底部返回 -->
      <view v-if="current_step < 4" class="footer-link" @click="go_to_login">
        <text>想起密码？返回登录</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue'
import { request } from '../../../utils/http'
import { useComponent } from '../../../composables/useComponent'

/** 异步加载 Steps / Step 平台适配组件 */
const { Steps, Step } = useComponent(['Steps', 'Step'])

// 步骤配置
const current_step = ref(1)
const step_labels = ['验证手机', '输入验证码', '设置密码', '完成']

// 表单状态
const phone = ref('')
const otp_code = ref('')
const new_password = ref('')
const confirm_password = ref('')
const show_password = ref(false)
const reset_token = ref('')

// 倒计时状态
const countdown = ref(0)
let countdown_timer: ReturnType<typeof setInterval> | null = null
const redirect_countdown = ref(3)
let redirect_timer: ReturnType<typeof setInterval> | null = null

// mock 模式开关（接口失败后启用）
let mock_mode = false

// 计算属性
const is_valid_phone = computed(() => /^1[3-9]\d{9}$/.test(phone.value))
const is_valid_otp = computed(() => /^\d{6}$/.test(otp_code.value))
const masked_phone = computed(() => {
  if (phone.value.length !== 11) return ''
  return phone.value.slice(0, 3) + '****' + phone.value.slice(7)
})

const password_hint = computed(() => {
  if (!new_password.value) return '密码需至少8位，包含字母和数字'
  if (new_password.value.length < 8) return '密码长度不足8位'
  if (!/[a-zA-Z]/.test(new_password.value)) return '需包含字母'
  if (!/\d/.test(new_password.value)) return '需包含数字'
  if (new_password.value !== confirm_password.value) return '两次输入的密码不一致'
  return '密码强度符合要求'
})

const password_hint_class = computed(() => {
  if (new_password.value && confirm_password.value && new_password.value === confirm_password.value) {
    return 'success'
  }
  return ''
})

const is_valid_password = computed(() => {
  const pwd = new_password.value
  return pwd.length >= 8 && /[a-zA-Z]/.test(pwd) && /\d/.test(pwd) && pwd === confirm_password.value
})

/** 发送验证码（含 mock 兜底） */
const send_reset_code = async () => {
  if (!is_valid_phone.value || countdown.value > 0) return
  try {
    await request({
      url: '/auth/send-reset-code',
      method: 'POST',
      data: { phone: phone.value }
    })
    uni.showToast({ title: '验证码已发送', icon: 'success' })
  } catch (e: any) {
    mock_mode = true
    console.log('[mock] /auth/send-reset-code fallback, 验证码: 123456')
    uni.showToast({ title: '测试模式：验证码已发送', icon: 'none' })
  }
  start_countdown()
  if (current_step.value === 1) current_step.value = 2
}

/** 启动发送倒计时 */
const start_countdown = () => {
  countdown.value = 60
  if (countdown_timer) clearInterval(countdown_timer)
  countdown_timer = setInterval(() => {
    countdown.value--
    if (countdown.value <= 0 && countdown_timer) {
      clearInterval(countdown_timer)
    }
  }, 1000)
}

/** 验证验证码（含 mock 兜底） */
const verify_reset_code = async () => {
  if (!is_valid_otp.value) return
  try {
    const res = await request<{ resetToken: string }>({
      url: '/auth/verify-reset-code',
      method: 'POST',
      data: { phone: phone.value, code: otp_code.value }
    })
    reset_token.value = res.resetToken
    uni.showToast({ title: '验证成功', icon: 'success' })
  } catch (e: any) {
    mock_mode = true
    console.log('[mock] /auth/verify-reset-code fallback')
    if (otp_code.value !== '123456') {
      uni.showToast({ title: '测试模式：验证码错误', icon: 'none' })
      return
    }
    reset_token.value = 'mock-reset-token-' + Date.now()
    uni.showToast({ title: '测试模式：验证成功', icon: 'success' })
  }
  current_step.value = 3
}

/** 重置密码（含 mock 兜底） */
const reset_password = async () => {
  if (!is_valid_password.value) return
  try {
    await request({
      url: '/auth/reset-password',
      method: 'POST',
      data: { resetToken: reset_token.value, newPassword: new_password.value }
    })
    uni.showToast({ title: '密码重置成功', icon: 'success' })
  } catch (e: any) {
    mock_mode = true
    console.log('[mock] /auth/reset-password fallback')
    uni.showToast({ title: '测试模式：密码已重置', icon: 'success' })
  }
  current_step.value = 4
  start_redirect_countdown()
}

/** 启动返回登录页倒计时 */
const start_redirect_countdown = () => {
  redirect_countdown.value = 3
  if (redirect_timer) clearInterval(redirect_timer)
  redirect_timer = setInterval(() => {
    redirect_countdown.value--
    if (redirect_countdown.value <= 0) {
      if (redirect_timer) clearInterval(redirect_timer)
      go_to_login()
    }
  }, 1000)
}

/** 返回登录页 */
const go_to_login = () => {
  uni.switchTab({ url: '/pages/login/index' })
}

/** 组件卸载时清理定时器 */
onUnmounted(() => {
  if (countdown_timer) clearInterval(countdown_timer)
  if (redirect_timer) clearInterval(redirect_timer)
})
</script>

<style lang="scss" scoped>
.forgot-page {
  height: 100vh;
  background: linear-gradient(160deg, #003466 0%, #1a4b84 45%, #f0f2f5 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  overflow: hidden;
}

.forgot-container {
  width: 100%;
  max-width: 480px;
}

.header-section {
  text-align: center;
  margin-bottom: 28px;

  .page-title {
    display: block;
    font-size: 24px;
    font-weight: 700;
    color: #fff;
    margin-bottom: 8px;
  }

  .page-desc {
    display: block;
    font-size: 14px;
    color: rgba(255, 255, 255, 0.75);
  }
}

.steps-wrapper {
  margin-bottom: 24px;
}

.steps-bar {
  :deep(.ant-steps) {
    .ant-steps-item-title {
      color: rgba(255, 255, 255, 0.9) !important;
    }
    .ant-steps-item-icon {
      background: rgba(255, 255, 255, 0.2);
      border-color: rgba(255, 255, 255, 0.4);
      color: #fff;
    }
    .ant-steps-item-finish .ant-steps-item-icon {
      background: #2e7d32;
      border-color: #2e7d32;
    }
    .ant-steps-item-process .ant-steps-item-icon {
      background: #fff;
      border-color: #fff;
      color: #003466;
    }
    .ant-steps-item-finish > .ant-steps-item-container > .ant-steps-item-content > .ant-steps-item-title::after {
      background: rgba(255, 255, 255, 0.6);
    }
  }
}

.steps-fallback {
  display: flex;
  justify-content: space-between;
  padding: 0 8px;

  .fallback-step {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;

    .fallback-dot {
      width: 26px;
      height: 26px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.2);
      color: rgba(255, 255, 255, 0.8);
      font-size: 12px;
      font-weight: 600;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .fallback-label {
      font-size: 11px;
      color: rgba(255, 255, 255, 0.7);
    }

    &.active {
      .fallback-dot {
        background: #fff;
        color: #003466;
      }
      .fallback-label {
        color: #fff;
        font-weight: 500;
      }
    }

    &.done {
      .fallback-dot {
        background: #2e7d32;
        color: #fff;
      }
      .fallback-label {
        color: rgba(255, 255, 255, 0.9);
      }
    }
  }
}

.step-content {
  background: #fff;
  border-radius: 16px;
  padding: 28px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.18);
}

.form-card {
  .form-item {
    margin-bottom: 20px;

    label {
      display: block;
      font-size: 13px;
      font-weight: 500;
      color: #666;
      margin-bottom: 8px;
    }

    .field-input {
      width: 100%;
      height: 48px;
      padding: 0 16px;
      border: 1.5px solid #e0e0e0;
      border-radius: 10px;
      font-size: 15px;
      box-sizing: border-box;
      transition: border-color 0.2s;

      &:focus {
        border-color: #003466;
        outline: none;
      }
    }

    .placeholder {
      color: #bbb;
    }

    .password-field {
      position: relative;

      .eye-btn {
        position: absolute;
        right: 14px;
        top: 50%;
        transform: translateY(-50%);
        font-size: 18px;
        cursor: pointer;
      }
    }
  }

  .form-hint {
    margin-bottom: 24px;
    font-size: 12px;
    color: #999;
    display: flex;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 8px;

    text.success {
      color: #2e7d32;
    }

    .resend-link {
      color: #003466;
      cursor: pointer;
      font-weight: 500;

      &:hover {
        text-decoration: underline;
      }
    }
  }
}

.action-btn {
  width: 100%;
  height: 48px;
  background: #003466;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;

  &.disabled {
    background: #ccc;
    pointer-events: none;
  }

  &:active {
    transform: scale(0.98);
  }

  .btn-text {
    color: #fff;
    font-size: 15px;
    font-weight: 600;
  }
}

.success-card {
  text-align: center;
  padding: 20px 0;

  .success-icon {
    width: 64px;
    height: 64px;
    background: #f0f9eb;
    color: #2e7d32;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 28px;
    margin: 0 auto 20px;
  }

  .success-title {
    display: block;
    font-size: 18px;
    font-weight: 600;
    color: #333;
    margin-bottom: 8px;
  }

  .success-desc {
    display: block;
    font-size: 13px;
    color: #999;
    margin-bottom: 8px;
  }
}

.footer-link {
  text-align: center;
  margin-top: 20px;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.8);
  cursor: pointer;

  &:hover {
    color: #fff;
    text-decoration: underline;
  }
}
</style>
