<template>
  <div class="setup-page">
    <a-card title="系统初始化向导" class="setup-card">
      <a-steps :current="currentStep" direction="horizontal" class="setup-steps">
        <a-step title="创建CEO账号" />
        <a-step title="创建HR账号" />
        <a-step title="可选人员配置" />
        <a-step title="确认信息" />
        <a-step title="恢复码" />
      </a-steps>

      <!-- Step 1: CEO Account -->
      <div v-if="currentStep === 0" class="step-content">
        <h3>创建CEO账号</h3>
        <a-form :model="formState" layout="vertical">
          <a-form-item
            label="姓名"
            :rules="[{ required: true, message: '请输入CEO姓名' }]"
          >
            <a-input
              v-model:value="formState.ceoName"
              placeholder="请输入CEO姓名"
            />
          </a-form-item>
          <a-form-item
            label="手机号"
            :rules="[{ required: true, message: '请输入CEO手机号' }]"
          >
            <a-input
              v-model:value="formState.ceoPhone"
              placeholder="请输入CEO手机号"
            />
          </a-form-item>
          <a-form-item
            label="密码"
            :rules="[{ required: true, message: '请输入密码' }]"
          >
            <a-input-password
              v-model:value="formState.ceoPassword"
              placeholder="请输入密码（至少8位）"
            />
          </a-form-item>
          <a-form-item
            label="确认密码"
            :rules="[{ required: true, message: '请确认密码' }]"
          >
            <a-input-password
              v-model:value="formState.ceoPasswordConfirm"
              placeholder="请再次输入密码"
            />
          </a-form-item>
        </a-form>
        <div class="step-actions">
          <a-button type="primary" @click="goToStep(1)">下一步</a-button>
        </div>
      </div>

      <!-- Step 2: HR Account -->
      <div v-if="currentStep === 1" class="step-content">
        <h3>创建HR账号</h3>
        <a-form :model="formState" layout="vertical">
          <a-form-item
            label="姓名"
            :rules="[{ required: true, message: '请输入HR姓名' }]"
          >
            <a-input
              v-model:value="formState.hrName"
              placeholder="请输入HR姓名"
            />
          </a-form-item>
          <a-form-item
            label="手机号"
            :rules="[{ required: true, message: '请输入HR手机号' }]"
          >
            <a-input
              v-model:value="formState.hrPhone"
              placeholder="请输入HR手机号"
            />
          </a-form-item>
        </a-form>
        <a-alert
          type="info"
          message="初始密码为 123456，首次登录后请修改"
          class="info-alert"
        />
        <div class="step-actions">
          <a-button @click="goToStep(0)">上一步</a-button>
          <a-button type="primary" @click="goToStep(2)">下一步</a-button>
        </div>
      </div>

      <!-- Step 3: Optional Staff -->
      <div v-if="currentStep === 2" class="step-content">
        <h3>可选人员配置</h3>
        <a-form :model="formState" layout="vertical">
          <a-divider orientation="left">运营人员</a-divider>
          <a-form-item label="姓名">
            <a-input
              v-model:value="formState.opsName"
              placeholder="请输入运营人员姓名（可选）"
            />
          </a-form-item>
          <a-form-item label="手机号">
            <a-input
              v-model:value="formState.opsPhone"
              placeholder="请输入运营人员手机号（可选）"
            />
          </a-form-item>
          <a-divider orientation="left">总经理</a-divider>
          <a-form-item label="姓名">
            <a-input
              v-model:value="formState.gmName"
              placeholder="请输入总经理姓名（可选）"
            />
          </a-form-item>
          <a-form-item label="手机号">
            <a-input
              v-model:value="formState.gmPhone"
              placeholder="请输入总经理手机号（可选）"
            />
          </a-form-item>
        </a-form>
        <div class="step-actions">
          <a-button @click="goToStep(1)">上一步</a-button>
          <a-button type="link" @click="skipOptional">跳过</a-button>
          <a-button type="primary" @click="goToStep(3)">下一步</a-button>
        </div>
      </div>

      <!-- Step 4: Confirm -->
      <div v-if="currentStep === 3" class="step-content">
        <h3>确认信息</h3>
        <a-descriptions bordered :column="1">
          <a-descriptions-item label="CEO姓名">
            {{ formState.ceoName }}
          </a-descriptions-item>
          <a-descriptions-item label="CEO手机号">
            {{ formState.ceoPhone }}
          </a-descriptions-item>
          <a-descriptions-item label="HR姓名">
            {{ formState.hrName }}
          </a-descriptions-item>
          <a-descriptions-item label="HR手机号">
            {{ formState.hrPhone }}
          </a-descriptions-item>
          <a-descriptions-item label="运营人员">
            {{ formState.opsName || '-' }} {{ formState.opsPhone ? `(${formState.opsPhone})` : '' }}
          </a-descriptions-item>
          <a-descriptions-item label="总经理">
            {{ formState.gmName || '-' }} {{ formState.gmPhone ? `(${formState.gmPhone})` : '' }}
          </a-descriptions-item>
        </a-descriptions>
        <a-alert
          v-if="submitError"
          type="error"
          :message="submitError"
          class="error-alert"
        />
        <div class="step-actions">
          <a-button @click="goToStep(2)">上一步</a-button>
          <a-button type="primary" :loading="submitting" @click="submitSetup">
            提交
          </a-button>
        </div>
      </div>

      <!-- Step 5: Recovery Code -->
      <div v-if="currentStep === 4" class="step-content">
        <h3>恢复码</h3>
        <pre class="recovery-code">{{ recoveryCode }}</pre>
        <a-button class="copy-btn" @click="copyRecoveryCode">复制</a-button>
        <a-alert
          type="warning"
          message="此恢复码仅显示一次，请务必妥善保管！"
          class="warning-alert"
        />
        <a-checkbox v-model:checked="recoverySaved">
          我已安全保存恢复码
        </a-checkbox>
        <div class="step-actions">
          <a-button
            type="primary"
            :disabled="!recoverySaved"
            @click="finishSetup"
          >
            完成
          </a-button>
        </div>
      </div>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { message } from 'ant-design-vue'

definePageMeta({
  layout: false
})

interface FormState {
  ceoName: string
  ceoPhone: string
  ceoPassword: string
  ceoPasswordConfirm: string
  hrName: string
  hrPhone: string
  opsName: string
  opsPhone: string
  gmName: string
  gmPhone: string
}

const currentStep = ref(0)
const submitting = ref(false)
const submitError = ref('')
const recoveryCode = ref('')
const recoverySaved = ref(false)

const formState = reactive<FormState>({
  ceoName: '',
  ceoPhone: '',
  ceoPassword: '',
  ceoPasswordConfirm: '',
  hrName: '',
  hrPhone: '',
  opsName: '',
  opsPhone: '',
  gmName: '',
  gmPhone: ''
})

function validateStep(step: number): boolean {
  if (step === 0) {
    if (!formState.ceoName.trim()) {
      message.error('请输入CEO姓名')
      return false
    }
    if (!formState.ceoPhone.trim()) {
      message.error('请输入CEO手机号')
      return false
    }
    if (!formState.ceoPassword || formState.ceoPassword.length < 8) {
      message.error('密码至少8位')
      return false
    }
    if (formState.ceoPassword !== formState.ceoPasswordConfirm) {
      message.error('两次输入的密码不一致')
      return false
    }
  }
  if (step === 1) {
    if (!formState.hrName.trim()) {
      message.error('请输入HR姓名')
      return false
    }
    if (!formState.hrPhone.trim()) {
      message.error('请输入HR手机号')
      return false
    }
  }
  return true
}

function goToStep(step: number) {
  if (step > currentStep.value && !validateStep(currentStep.value)) {
    return
  }
  currentStep.value = step
}

function skipOptional() {
  formState.opsName = ''
  formState.opsPhone = ''
  formState.gmName = ''
  formState.gmPhone = ''
  goToStep(3)
}

interface SetupResponse {
  recoveryCode: string
  message: string
}

async function submitSetup() {
  submitting.value = true
  submitError.value = ''

  const body: Record<string, string> = {
    ceoName: formState.ceoName,
    ceoPhone: formState.ceoPhone,
    ceoPassword: formState.ceoPassword,
    hrName: formState.hrName,
    hrPhone: formState.hrPhone
  }

  if (formState.opsName) body.opsName = formState.opsName
  if (formState.opsPhone) body.opsPhone = formState.opsPhone
  if (formState.gmName) body.gmName = formState.gmName
  if (formState.gmPhone) body.gmPhone = formState.gmPhone

  try {
    const data = await $fetch<SetupResponse>('/api/setup/init', {
      method: 'POST',
      body
    })
    recoveryCode.value = data.recoveryCode
    currentStep.value = 4
  } catch (error: any) {
    if (error?.response?.status === 400 || error?.response?.status === 403 || error?.response?.status === 409) {
      submitError.value = error?.data?.message || '提交失败，请检查输入'
    } else {
      submitError.value = '网络错误，请重试'
    }
  } finally {
    submitting.value = false
  }
}

function copyRecoveryCode() {
  navigator.clipboard.writeText(recoveryCode.value).then(() => {
    message.success('已复制到剪贴板')
  })
}

function finishSetup() {
  navigateTo('/login')
}
</script>

<style scoped>
.setup-page {
  min-height: 100vh;
  padding: 24px;
  background: #f0f2f5;
}

.setup-card {
  max-width: 600px;
  margin: 0 auto;
}

.setup-steps {
  margin-bottom: 32px;
}

.step-content {
  padding: 16px 0;
}

.step-content h3 {
  margin-bottom: 24px;
  text-align: center;
}

.step-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
  margin-top: 24px;
}

.info-alert {
  margin: 16px 0;
}

.error-alert {
  margin: 16px 0;
}

.warning-alert {
  margin: 16px 0;
}

.recovery-code {
  padding: 16px;
  background: #f6ffed;
  border: 1px solid #b7eb8f;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  font-size: 16px;
  word-break: break-all;
  white-space: pre-wrap;
}

.copy-btn {
  margin-top: 8px;
}
</style>
