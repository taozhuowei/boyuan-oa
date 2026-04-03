<template>
  <view class="forgot-page">
    <view class="forgot-container">
      <!-- 标题区域 -->
      <view class="header-section">
        <text class="page-title">找回密码</text>
        <text class="page-desc">通过手机号验证重置您的密码</text>
      </view>

      <!-- 步骤指示器 -->
      <view class="steps-bar">
        <view 
          v-for="step in 4" 
          :key="step"
          class="step"
          :class="{ 
            active: currentStep === step, 
            done: currentStep > step 
          }"
        >
          <view class="step-dot">{{ currentStep > step ? '✓' : step }}</view>
          <text class="step-label">{{ stepLabels[step - 1] }}</text>
        </view>
        <view class="step-line" :style="lineStyle" />
      </view>

      <!-- 步骤内容 -->
      <view class="step-content">
        <!-- Step 1: 验证手机号 -->
        <template v-if="currentStep === 1">
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
              :class="{ disabled: !isValidPhone || countdown > 0 }"
              @click="sendCode"
            >
              <text class="btn-text">
                {{ countdown > 0 ? `${countdown}秒后重试` : '发送验证码' }}
              </text>
            </view>
          </view>
        </template>

        <!-- Step 2: 输入验证码 -->
        <template v-if="currentStep === 2">
          <view class="form-card">
            <view class="form-item">
              <label>验证码</label>
              <input
                v-model="otpCode"
                class="field-input"
                type="number"
                maxlength="6"
                placeholder="请输入6位验证码"
                placeholder-class="placeholder"
                focus
              />
            </view>
            <view class="form-hint">
              <text>验证码已发送至 {{ maskedPhone }}</text>
              <text v-if="countdown > 0" class="resend-link" @click="sendCode">
                {{ countdown }}秒后可重发
              </text>
              <text v-else class="resend-link" @click="sendCode">重新发送</text>
            </view>
            <view 
              class="action-btn"
              :class="{ disabled: !isValidOtp }"
              @click="verifyCode"
            >
              <text class="btn-text">验证</text>
            </view>
          </view>
        </template>

        <!-- Step 3: 设置新密码 -->
        <template v-if="currentStep === 3">
          <view class="form-card">
            <view class="form-item">
              <label>新密码</label>
              <view class="password-field">
                <input
                  v-model="newPassword"
                  class="field-input"
                  :password="!showPassword"
                  placeholder="至少8位，含字母和数字"
                  placeholder-class="placeholder"
                />
                <text class="eye-btn" @click="showPassword = !showPassword">
                  {{ showPassword ? '🙈' : '👁' }}
                </text>
              </view>
            </view>
            <view class="form-item">
              <label>确认密码</label>
              <input
                v-model="confirmPassword"
                class="field-input"
                password
                placeholder="再次输入新密码"
                placeholder-class="placeholder"
              />
            </view>
            <view class="form-hint">
              <text :class="passwordHintClass">{{ passwordHint }}</text>
            </view>
            <view 
              class="action-btn"
              :class="{ disabled: !isValidPassword }"
              @click="resetPassword"
            >
              <text class="btn-text">确认修改</text>
            </view>
          </view>
        </template>

        <!-- Step 4: 完成 -->
        <template v-if="currentStep === 4">
          <view class="success-card">
            <view class="success-icon">✓</view>
            <text class="success-title">密码已重置</text>
            <text class="success-desc">您可以使用新密码登录系统了</text>
            <view class="action-btn" @click="goToLogin">
              <text class="btn-text">返回登录</text>
            </view>
          </view>
        </template>
      </view>

      <!-- 底部返回 -->
      <view v-if="currentStep < 4" class="footer-link" @click="goToLogin">
        <text>想起密码？返回登录</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue'
import { request } from '../../utils/http'

// 步骤
const currentStep = ref(1)
const stepLabels = ['验证手机', '输入验证码', '设置密码', '完成']

// 表单数据
const phone = ref('')
const otpCode = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const showPassword = ref(false)

// 倒计时
const countdown = ref(0)
let countdownTimer: ReturnType<typeof setInterval> | null = null

// 计算属性
const isValidPhone = computed(() => /^1[3-9]\d{9}$/.test(phone.value))
const isValidOtp = computed(() => /^\d{6}$/.test(otpCode.value))
const maskedPhone = computed(() => {
  if (phone.value.length !== 11) return ''
  return phone.value.slice(0, 3) + '****' + phone.value.slice(7)
})

const passwordHint = computed(() => {
  if (!newPassword.value) return '密码需至少8位，包含字母和数字'
  if (newPassword.value.length < 8) return '密码长度不足8位'
  if (!/[a-zA-Z]/.test(newPassword.value)) return '需包含字母'
  if (!/\d/.test(newPassword.value)) return '需包含数字'
  if (newPassword.value !== confirmPassword.value) return '两次输入的密码不一致'
  return '密码强度符合要求'
})

const passwordHintClass = computed(() => {
  if (newPassword.value && confirmPassword.value && newPassword.value === confirmPassword.value) {
    return 'success'
  }
  return ''
})

const isValidPassword = computed(() => {
  const pwd = newPassword.value
  return pwd.length >= 8 
    && /[a-zA-Z]/.test(pwd) 
    && /\d/.test(pwd)
    && pwd === confirmPassword.value
})

const lineStyle = computed(() => {
  const progress = ((currentStep.value - 1) / 3) * 100
  return { width: `${progress}%` }
})

// 发送验证码
const sendCode = async () => {
  if (!isValidPhone.value || countdown.value > 0) return
  
  try {
    await request({
      url: '/auth/send-reset-code',
      method: 'POST',
      data: { phone: phone.value }
    })
    uni.showToast({ title: '验证码已发送', icon: 'success' })
    startCountdown()
    if (currentStep.value === 1) {
      currentStep.value = 2
    }
  } catch (e) {
    uni.showToast({ title: '发送失败，请重试', icon: 'none' })
  }
}

// 开始倒计时
const startCountdown = () => {
  countdown.value = 60
  if (countdownTimer) clearInterval(countdownTimer)
  countdownTimer = setInterval(() => {
    countdown.value--
    if (countdown.value <= 0) {
      if (countdownTimer) clearInterval(countdownTimer)
    }
  }, 1000)
}

// 验证验证码
const verifyCode = async () => {
  if (!isValidOtp.value) return
  
  try {
    await request({
      url: '/auth/verify-reset-code',
      method: 'POST',
      data: { 
        phone: phone.value,
        code: otpCode.value 
      }
    })
    uni.showToast({ title: '验证成功', icon: 'success' })
    currentStep.value = 3
  } catch (e) {
    uni.showToast({ title: '验证码错误', icon: 'none' })
  }
}

// 重置密码
const resetPassword = async () => {
  if (!isValidPassword.value) return
  
  try {
    await request({
      url: '/auth/reset-password',
      method: 'POST',
      data: {
        phone: phone.value,
        code: otpCode.value,
        newPassword: newPassword.value
      }
    })
    uni.showToast({ title: '密码重置成功', icon: 'success' })
    currentStep.value = 4
  } catch (e) {
    uni.showToast({ title: '重置失败，请重试', icon: 'none' })
  }
}

// 返回登录
const goToLogin = () => {
  uni.switchTab({ url: '/pages/login/index' })
}

// 清理定时器
onUnmounted(() => {
  if (countdownTimer) clearInterval(countdownTimer)
})
</script>

<style lang="scss" scoped>
.forgot-page {
  min-height: 100vh;
  background: linear-gradient(160deg, #003466 0%, #1a4b84 45%, #f0f2f5 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.forgot-container {
  width: 100%;
  max-width: 420px;
}

// 标题区域
.header-section {
  text-align: center;
  margin-bottom: 32px;

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

// 步骤条
.steps-bar {
  display: flex;
  justify-content: space-between;
  position: relative;
  margin-bottom: 32px;
  padding: 0 8px;

  .step-line {
    position: absolute;
    top: 12px;
    left: 24px;
    right: 24px;
    height: 2px;
    background: rgba(255, 255, 255, 0.3);
    z-index: 0;

    &::after {
      content: '';
      position: absolute;
      left: 0;
      top: 0;
      height: 100%;
      background: #fff;
      transition: width 0.3s;
    }
  }

  .step {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    z-index: 1;

    .step-dot {
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
      transition: all 0.3s;
    }

    .step-label {
      font-size: 11px;
      color: rgba(255, 255, 255, 0.7);
      transition: all 0.3s;
    }

    &.active {
      .step-dot {
        background: #fff;
        color: #003466;
        transform: scale(1.1);
      }
      .step-label {
        color: #fff;
        font-weight: 500;
      }
    }

    &.done {
      .step-dot {
        background: #2e7d32;
        color: #fff;
      }
      .step-label {
        color: rgba(255, 255, 255, 0.9);
      }
    }
  }
}

// 步骤内容
.step-content {
  background: #fff;
  border-radius: 16px;
  padding: 32px 28px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.18);
}

// 表单卡片
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

// 操作按钮
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

// 成功卡片
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
    margin-bottom: 28px;
  }
}

// 底部链接
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
