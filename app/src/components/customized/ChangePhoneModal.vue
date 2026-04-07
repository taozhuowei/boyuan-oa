<template>
  <component
    :is="Modal"
    v-if="Modal"
    :model-value="modelValue"
    :title="currentStep < 3 ? '修改手机号' : ''"
    :width="isH5 ? '400px' : '100%'"
    :closable="currentStep !== 3"
    :mask-closable="currentStep !== 3"
    @update:model-value="handleVisibleChange"
  >
    <view class="change-phone-modal" :class="{ 'mp-fullscreen': !isH5 }">
      <!-- 步骤指示器 -->
      <view v-if="currentStep < 3" class="steps-wrapper">
        <component
          :is="Steps"
          v-if="Steps"
          :current="currentStep - 1"
          class="steps-bar"
        >
          <component :is="Step" title="验证原手机" />
          <component :is="Step" title="绑定新手机" />
          <component :is="Step" title="完成" />
        </component>
        <view v-else class="steps-fallback">
          <view
            v-for="idx in 3"
            :key="idx"
            class="fallback-step"
            :class="{ active: currentStep === idx, done: currentStep > idx }"
          >
            <text class="fallback-dot">{{ currentStep > idx ? 'V' : idx }}</text>
            <text class="fallback-label">
              {{ idx === 1 ? '验证原手机' : idx === 2 ? '绑定新手机' : '完成' }}
            </text>
          </view>
        </view>
      </view>

      <!-- Step 1: 验证原手机号 -->
      <view v-if="currentStep === 1" class="step-content">
        <view class="phone-display">
          <text class="phone-label">当前手机号</text>
          <text class="phone-value">{{ maskedCurrentPhone }}</text>
        </view>

        <view class="code-section">
          <view class="code-input-row">
            <input
              v-model="currentCode"
              class="code-input"
              type="number"
              maxlength="6"
              placeholder="请输入验证码"
              placeholder-class="placeholder"
            />
            <view
              class="send-code-btn"
              :class="{ disabled: countdown > 0 || sendingCode }"
              @click="sendCurrentCode"
            >
              <text class="btn-text">
                {{ countdown > 0 ? `${countdown}s后重发` : '发送验证码' }}
              </text>
            </view>
          </view>
        </view>

        <view
          class="action-btn"
          :class="{ disabled: !isValidCode }"
          @click="verifyCurrentCode"
        >
          <text class="btn-text">下一步</text>
        </view>
      </view>

      <!-- Step 2: 绑定新手机号 -->
      <view v-else-if="currentStep === 2" class="step-content">
        <view class="form-section">
          <label>新手机号</label>
          <input
            v-model="newPhone"
            class="field-input"
            type="tel"
            maxlength="11"
            placeholder="请输入新手机号"
            placeholder-class="placeholder"
          />
        </view>

        <view class="code-section">
          <view class="code-input-row">
            <input
              v-model="newCode"
              class="code-input"
              type="number"
              maxlength="6"
              placeholder="请输入验证码"
              placeholder-class="placeholder"
            />
            <view
              class="send-code-btn"
              :class="{ disabled: !isValidNewPhone || newCountdown > 0 || sendingNewCode }"
              @click="sendNewCode"
            >
              <text class="btn-text">
                {{ newCountdown > 0 ? `${newCountdown}s后重发` : '发送验证码' }}
              </text>
            </view>
          </view>
        </view>

        <view
          class="action-btn"
          :class="{ disabled: !isValidNewCode }"
          @click="confirmChange"
        >
          <text class="btn-text">确认修改</text>
        </view>
      </view>

      <!-- Step 3: 成功 -->
      <view v-else-if="currentStep === 3" class="success-content">
        <view class="success-icon">
          <text>V</text>
        </view>
        <text class="success-title">手机号修改成功</text>
        <text class="success-desc">您的手机号已成功更换</text>
        <view class="action-btn" @click="closeModal">
          <text class="btn-text">关闭</text>
        </view>
      </view>
    </view>
  </component>
</template>

<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from 'vue'
import { useComponent } from '../../composables/useComponent'
import { useUserStore } from '../../stores'
import { request } from '../../utils/http'

const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'success': []
}>()

// 平台检测
const isH5 = computed(() => {
  // #ifdef H5
  return true
  // #endif
  // #ifdef MP-WEIXIN || APP-PLUS
  return false
  // #endif
  return true
})

// 异步加载组件
const { Modal, Steps, Step } = useComponent(['Modal', 'Steps', 'Step'])

const userStore = useUserStore()

// 步骤状态
const currentStep = ref(1)

// Step 1 状态
const currentCode = ref('')
const countdown = ref(0)
const sendingCode = ref(false)

// Step 2 状态
const newPhone = ref('')
const newCode = ref('')
const newCountdown = ref(0)
const sendingNewCode = ref(false)
const changeToken = ref('')

// 定时器
let countdownTimer: ReturnType<typeof setInterval> | null = null
let newCountdownTimer: ReturnType<typeof setInterval> | null = null

// 计算属性
const currentPhone = computed(() => userStore.userInfo?.phone || '')

const maskedCurrentPhone = computed(() => {
  const phone = currentPhone.value
  if (!phone || phone.length !== 11) return phone || ''
  return phone.slice(0, 3) + '****' + phone.slice(7)
})

const isValidCode = computed(() => /^\d{6}$/.test(currentCode.value))
const isValidNewPhone = computed(() => /^1[3-9]\d{9}$/.test(newPhone.value))
const isValidNewCode = computed(() => /^\d{6}$/.test(newCode.value))

// 监听弹窗显示，重置状态
watch(() => props.modelValue, (visible) => {
  if (visible) {
    resetState()
  }
})

// 重置状态
const resetState = () => {
  currentStep.value = 1
  currentCode.value = ''
  newPhone.value = ''
  newCode.value = ''
  changeToken.value = ''
  countdown.value = 0
  newCountdown.value = 0
  if (countdownTimer) {
    clearInterval(countdownTimer)
    countdownTimer = null
  }
  if (newCountdownTimer) {
    clearInterval(newCountdownTimer)
    newCountdownTimer = null
  }
}

// 关闭弹窗
const closeModal = () => {
  emit('update:modelValue', false)
}

// 处理弹窗可见性变化
const handleVisibleChange = (visible: boolean) => {
  if (!visible) {
    closeModal()
  }
}

// 启动倒计时
const startCountdown = () => {
  countdown.value = 60
  if (countdownTimer) clearInterval(countdownTimer)
  countdownTimer = setInterval(() => {
    countdown.value--
    if (countdown.value <= 0 && countdownTimer) {
      clearInterval(countdownTimer)
      countdownTimer = null
    }
  }, 1000)
}

// 启动新手机号倒计时
const startNewCountdown = () => {
  newCountdown.value = 60
  if (newCountdownTimer) clearInterval(newCountdownTimer)
  newCountdownTimer = setInterval(() => {
    newCountdown.value--
    if (newCountdown.value <= 0 && newCountdownTimer) {
      clearInterval(newCountdownTimer)
      newCountdownTimer = null
    }
  }, 1000)
}

// Step 1: 发送当前手机号验证码
const sendCurrentCode = async () => {
  if (countdown.value > 0 || sendingCode.value) return
  sendingCode.value = true
  try {
    await request({
      url: '/auth/phone-change/send-current-code',
      method: 'POST',
      data: {}
    })
    uni.showToast({ title: '验证码已发送', icon: 'success' })
    startCountdown()
  } catch (err: any) {
    uni.showToast({ title: err.message || '发送失败', icon: 'none' })
  } finally {
    sendingCode.value = false
  }
}

// Step 1: 验证当前手机号验证码
const verifyCurrentCode = async () => {
  if (!isValidCode.value) return
  try {
    const res: any = await request({
      url: '/auth/phone-change/verify-current-code',
      method: 'POST',
      data: { code: currentCode.value }
    })
    changeToken.value = res.changeToken || ''
    uni.showToast({ title: '验证成功', icon: 'success' })
    currentStep.value = 2
  } catch (err: any) {
    uni.showToast({ title: err.message || '验证失败', icon: 'none' })
  }
}

// Step 2: 发送新手机号验证码
const sendNewCode = async () => {
  if (!isValidNewPhone.value || newCountdown.value > 0 || sendingNewCode.value) return
  sendingNewCode.value = true
  try {
    await request({
      url: '/auth/phone-change/send-new-code',
      method: 'POST',
      data: {
        changeToken: changeToken.value,
        newPhone: newPhone.value
      }
    })
    uni.showToast({ title: '验证码已发送', icon: 'success' })
    startNewCountdown()
  } catch (err: any) {
    uni.showToast({ title: err.message || '发送失败', icon: 'none' })
  } finally {
    sendingNewCode.value = false
  }
}

// Step 2: 确认修改
const confirmChange = async () => {
  if (!isValidNewCode.value) return
  try {
    await request({
      url: '/auth/phone-change/confirm',
      method: 'POST',
      data: {
        changeToken: changeToken.value,
        newPhone: newPhone.value,
        code: newCode.value
      }
    })
    // 更新用户信息
    userStore.setUserInfo({ phone: newPhone.value })
    currentStep.value = 3
    emit('success')
  } catch (err: any) {
    uni.showToast({ title: err.message || '修改失败', icon: 'none' })
  }
}

// 组件卸载时清理定时器
onUnmounted(() => {
  if (countdownTimer) clearInterval(countdownTimer)
  if (newCountdownTimer) clearInterval(newCountdownTimer)
})
</script>

<style lang="scss" scoped>
.change-phone-modal {
  padding: 8px 4px;

  &.mp-fullscreen {
    padding: 16px;
    min-height: 60vh;
  }
}

// 步骤指示器
.steps-wrapper {
  margin-bottom: 24px;
}

.steps-bar {
  :deep(.ant-steps) {
    .ant-steps-item-title {
      font-size: 12px;
    }
  }
}

.steps-fallback {
  display: flex;
  justify-content: space-between;
  padding: 0 16px;

  .fallback-step {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;

    .fallback-dot {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: #f0f0f0;
      border: 2px solid #d9d9d9;
      color: rgba(0, 0, 0, 0.45);
      font-size: 12px;
      font-weight: 600;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .fallback-label {
      font-size: 11px;
      color: rgba(0, 0, 0, 0.45);
    }

    &.active {
      .fallback-dot {
        background: #fff;
        border-color: var(--primary, #003466);
        color: var(--primary, #003466);
      }
      .fallback-label {
        color: rgba(0, 0, 0, 0.85);
        font-weight: 500;
      }
    }

    &.done {
      .fallback-dot {
        background: var(--primary, #003466);
        border-color: var(--primary, #003466);
        color: #fff;
      }
      .fallback-label {
        color: rgba(0, 0, 0, 0.65);
      }
    }
  }
}

// 步骤内容
.step-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

// 当前手机号显示
.phone-display {
  background: var(--surface-low, #f5f5f5);
  border-radius: 8px;
  padding: 16px;
  text-align: center;

  .phone-label {
    display: block;
    font-size: 12px;
    color: var(--on-surface-variant, #666);
    margin-bottom: 4px;
  }

  .phone-value {
    display: block;
    font-size: 18px;
    font-weight: 600;
    color: var(--on-surface, #333);
    letter-spacing: 1px;
  }
}

// 表单区域
.form-section {
  label {
    display: block;
    font-size: 13px;
    font-weight: 500;
    color: var(--on-surface-variant, #666);
    margin-bottom: 8px;
  }

  .field-input {
    width: 100%;
    height: 44px;
    padding: 0 12px;
    border: 1px solid var(--surface-high, #e0e0e0);
    border-radius: 8px;
    font-size: 15px;
    box-sizing: border-box;
    transition: border-color 0.2s;
    background: var(--surface-lowest, #fff);

    &:focus {
      border-color: var(--primary, #003466);
      outline: none;
    }
  }

  .placeholder {
    color: #bbb;
  }
}

// 验证码区域
.code-section {
  .code-input-row {
    display: flex;
    gap: 12px;
  }

  .code-input {
    flex: 1;
    height: 44px;
    padding: 0 12px;
    border: 1px solid var(--surface-high, #e0e0e0);
    border-radius: 8px;
    font-size: 15px;
    box-sizing: border-box;
    transition: border-color 0.2s;
    background: var(--surface-lowest, #fff);
    text-align: center;
    letter-spacing: 4px;

    &:focus {
      border-color: var(--primary, #003466);
      outline: none;
    }
  }

  .send-code-btn {
    flex-shrink: 0;
    width: 110px;
    height: 44px;
    background: var(--primary, #003466);
    border-radius: 8px;
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
      font-size: 13px;
      font-weight: 500;
    }
  }
}

// 操作按钮
.action-btn {
  width: 100%;
  height: 44px;
  background: var(--primary, #003466);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  margin-top: 8px;

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

// 成功页面
.success-content {
  text-align: center;
  padding: 24px 16px;

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
    font-weight: 700;
    margin: 0 auto 20px;
  }

  .success-title {
    display: block;
    font-size: 18px;
    font-weight: 600;
    color: var(--on-surface, #333);
    margin-bottom: 8px;
  }

  .success-desc {
    display: block;
    font-size: 13px;
    color: var(--on-surface-variant, #666);
    margin-bottom: 24px;
  }
}
</style>
