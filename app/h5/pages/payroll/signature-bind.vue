<template>
  <div class="signature-bind-page">
    <h2 class="page-title">签名绑定</h2>

    <!-- 步骤条 -->
    <a-steps :current="currentStep" class="steps">
      <a-step title="绘制签名" description="在画布上签名" />
      <a-step title="设置 PIN" description="4-6位数字密码" />
      <a-step title="完成绑定" description="提交保存" />
    </a-steps>

    <!-- 已绑定状态 -->
    <div v-if="isBound" class="bound-state">
      <a-result status="success" data-catch="signature-success" title="您已完成签名绑定">
        <template #extra>
          <p class="bound-hint">如需更换签名，可点击下方按钮重新绑定</p>
          <a-button type="primary" @click="handleRebind">重新绑定</a-button>
        </template>
      </a-result>
    </div>

    <!-- 步骤 1: 绘制签名 -->
    <div v-else-if="currentStep === 0" class="step-content">
      <a-card title="请在手写区域绘制您的签名" class="signature-card">
        <SignatureCanvas
          ref="signatureCanvasRef"
          data-catch="signature-canvas"
          :width="400"
          :height="200"
          stroke-color="#003466"
          :stroke-width="3"
          bg-color="#ffffff"
          @confirm="onSignatureConfirm"
        />
        <p class="hint-text">提示：请使用鼠标或手指在上方区域书写签名</p>
      </a-card>
    </div>

    <!-- 步骤 2: 设置 PIN -->
    <div v-else-if="currentStep === 1" class="step-content">
      <a-card title="设置 PIN 码" class="pin-card">
        <a-form layout="vertical" class="pin-form">
          <a-form-item
            label="PIN 码"
            :validate-status="pinError ? 'error' : ''"
            :help="pinError"
          >
            <a-input
              v-model:value="pinForm.pin"
              type="password"
              placeholder="请输入4-6位数字 PIN 码"
              maxlength="6"
              @input="onPinInput"
            />
          </a-form-item>
          <a-form-item
            label="确认 PIN 码"
            :validate-status="confirmPinError ? 'error' : ''"
            :help="confirmPinError"
          >
            <a-input
              v-model:value="pinForm.confirmPin"
              type="password"
              placeholder="请再次输入 PIN 码"
              maxlength="6"
              @input="onConfirmPinInput"
            />
          </a-form-item>
        </a-form>
        <div class="form-actions">
          <a-button @click="goBackToSignature">返回上一步</a-button>
          <a-button type="primary" :disabled="!isPinValid" @click="goToSubmit">
            下一步
          </a-button>
        </div>
      </a-card>
    </div>

    <!-- 步骤 3: 提交 -->
    <div v-else-if="currentStep === 2" class="step-content">
      <a-card title="确认提交" class="submit-card">
        <a-descriptions bordered :column="1" size="small">
          <a-descriptions-item label="签名预览">
            <img :src="signatureImage" alt="签名预览" class="signature-preview" />
          </a-descriptions-item>
          <a-descriptions-item label="PIN 码">
            <span class="pin-mask">{{ '•'.repeat(pinForm.pin.length) }}</span>
          </a-descriptions-item>
        </a-descriptions>
        <div class="form-actions">
          <a-button @click="goBackToPin">返回修改</a-button>
          <a-button type="primary" data-catch="signature-submit" :loading="submitting" @click="handleSubmit">
            确认绑定
          </a-button>
        </div>
      </a-card>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * SignatureBindPage — 员工签名绑定页面
 * 用途：员工绑定手写签名并设置 PIN 码，用于后续工资条确认
 * 流程：检查绑定状态 → 绘制签名 → 设置 PIN → 提交绑定
 *
 * 页面路由: /payroll/signature-bind
 */
import { ref, computed, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import { request } from '~/utils/http'
import SignatureCanvas from '~/components/customized/SignatureCanvas/index.vue'

/** 签名 Canvas 组件引用 */
const signatureCanvasRef = ref<InstanceType<typeof SignatureCanvas> | null>(null)

/** 当前步骤（0: 绘制签名, 1: 设置 PIN, 2: 提交确认） */
const currentStep = ref(0)

/** 是否已绑定签名 */
const isBound = ref(false)

/** 是否正在提交 */
const submitting = ref(false)

/** 签名图片 base64 */
const signatureImage = ref('')

/** PIN 表单数据 */
const pinForm = ref<{
  pin: string
  confirmPin: string
}>({
  pin: '',
  confirmPin: '',
})

/** PIN 输入错误提示 */
const pinError = ref('')

/** 确认 PIN 输入错误提示 */
const confirmPinError = ref('')

/**
 * 页面挂载时检查绑定状态
 */
onMounted(async () => {
  await checkBindStatus()
})

/**
 * 检查用户签名绑定状态
 * GET /signature/status
 */
async function checkBindStatus(): Promise<void> {
  try {
    const res = await request<{ bound: boolean }>({
      url: '/signature/status',
      method: 'GET',
    })
    isBound.value = res.bound
  } catch (e: unknown) {
    const err = e as { data?: { message?: string } }
    message.error(err.data?.message ?? '获取绑定状态失败')
  }
}

/**
 * 处理重新绑定按钮点击
 */
function handleRebind(): void {
  isBound.value = false
  currentStep.value = 0
  signatureImage.value = ''
  pinForm.value = { pin: '', confirmPin: '' }
  pinError.value = ''
  confirmPinError.value = ''
  // 延迟清空画布，确保组件已渲染
  setTimeout(() => {
    signatureCanvasRef.value?.clear()
  }, 0)
}

/**
 * 签名确认回调
 * @param base64 - 签名的 base64 图片数据
 */
function onSignatureConfirm(base64: string): void {
  if (!base64 || base64.length < 100) {
    message.warning('请先绘制签名')
    return
  }
  signatureImage.value = base64
  currentStep.value = 1
}

/**
 * PIN 码输入处理（只允许数字）
 */
function onPinInput(): void {
  const raw = pinForm.value.pin.replace(/\D/g, '')
  pinForm.value.pin = raw.slice(0, 6)
  validatePin()
}

/**
 * 确认 PIN 码输入处理（只允许数字）
 */
function onConfirmPinInput(): void {
  const raw = pinForm.value.confirmPin.replace(/\D/g, '')
  pinForm.value.confirmPin = raw.slice(0, 6)
  validateConfirmPin()
}

/**
 * 验证 PIN 码格式
 * @returns 是否有效
 */
function validatePin(): boolean {
  const pin = pinForm.value.pin
  if (!pin) {
    pinError.value = ''
    return false
  }
  if (pin.length < 4 || pin.length > 6) {
    pinError.value = 'PIN 码必须为 4-6 位数字'
    return false
  }
  pinError.value = ''
  return true
}

/**
 * 验证确认 PIN 码
 * @returns 是否有效
 */
function validateConfirmPin(): boolean {
  const { pin, confirmPin } = pinForm.value
  if (!confirmPin) {
    confirmPinError.value = ''
    return false
  }
  if (confirmPin !== pin) {
    confirmPinError.value = '两次输入的 PIN 码不一致'
    return false
  }
  confirmPinError.value = ''
  return true
}

/**
 * 检查 PIN 码是否全部有效
 */
const isPinValid = computed(() => {
  const { pin, confirmPin } = pinForm.value
  const isPinValid = pin.length >= 4 && pin.length <= 6 && /^\d+$/.test(pin)
  const isConfirmValid = confirmPin === pin && confirmPin.length >= 4
  return isPinValid && isConfirmValid && !pinError.value && !confirmPinError.value
})

/**
 * 返回签名步骤
 */
function goBackToSignature(): void {
  currentStep.value = 0
}

/**
 * 进入提交步骤
 */
function goToSubmit(): void {
  if (!isPinValid.value) return
  currentStep.value = 2
}

/**
 * 返回 PIN 设置步骤
 */
function goBackToPin(): void {
  currentStep.value = 1
}

/**
 * 提交签名绑定
 * POST /signature/bind
 */
async function handleSubmit(): Promise<void> {
  if (!signatureImage.value || !pinForm.value.pin) {
    message.error('签名或 PIN 码不完整')
    return
  }

  submitting.value = true
  try {
    await request({
      url: '/signature/bind',
      method: 'POST',
      body: {
        signatureImage: signatureImage.value,
        pin: pinForm.value.pin,
      },
    })
    message.success('签名绑定成功')
    // 绑定成功后设置为已绑定状态
    isBound.value = true
    currentStep.value = 0
  } catch (e: unknown) {
    const err = e as { data?: { message?: string }; statusCode?: number }
    if (err.statusCode === 400) {
      message.error(err.data?.message ?? '请求参数错误')
    } else {
      message.error(err.data?.message ?? '绑定失败，请重试')
    }
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.signature-bind-page {
  padding: 16px;
  max-width: 800px;
  margin: 0 auto;
  height: 100%;
  min-height: 0;
  overflow-y: auto;
}

.page-title {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 24px;
  text-align: center;
}

.steps {
  margin-bottom: 32px;
}

.step-content {
  display: flex;
  justify-content: center;
}

.signature-card {
  width: 100%;
  max-width: 480px;
}

.pin-card,
.submit-card {
  width: 100%;
  max-width: 400px;
}

.hint-text {
  margin-top: 12px;
  color: #666;
  font-size: 13px;
  text-align: center;
}

.pin-form {
  margin-top: 8px;
}

.form-actions {
  display: flex;
  justify-content: center;
  gap: 16px;
  margin-top: 24px;
}

.signature-preview {
  max-width: 300px;
  max-height: 100px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  background-color: #fff;
}

.pin-mask {
  font-size: 20px;
  color: #666;
  letter-spacing: 4px;
}

.bound-state {
  margin-top: 48px;
}

.bound-hint {
  color: #666;
  font-size: 14px;
  margin-bottom: 16px;
}

@media (max-width: 576px) {
  .signature-bind-page {
    padding: 12px;
  }

  .steps {
    margin-bottom: 24px;
  }

  .signature-preview {
    max-width: 100%;
  }
}
</style>
