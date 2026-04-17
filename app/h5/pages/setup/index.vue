<template>
  <div class="setup-page">
    <a-card title="系统初始化向导" class="setup-card">
      <a-steps :current="currentStep" direction="horizontal" class="setup-steps" size="small">
        <a-step title="CEO" data-catch="setup-step-indicator-1" />
        <a-step title="HR" />
        <a-step title="运维 / 总经理" />
        <a-step title="确认" />
        <a-step title="恢复码" />
        <a-step title="自定义角色" />
        <a-step title="员工导入" />
        <a-step title="组织架构" />
        <a-step title="审批流 / 全局" />
        <a-step title="留存期" />
      </a-steps>

      <!-- Step 1: CEO Account -->
      <div v-if="currentStep === 0" class="step-content">
        <h3>创建CEO账号</h3>
        <a-form :model="formState" layout="vertical">
          <a-form-item
            label="企业名称"
            extra="用于系统标题显示，如「博渊建筑OA管理系统」"
          >
            <a-input
              v-model:value="formState.companyName"
              placeholder="请输入企业名称（可选）"
              data-catch="setup-company-name"
            />
          </a-form-item>
          <a-form-item
            label="姓名"
            :rules="[{ required: true, message: '请输入CEO姓名' }]"
          >
            <a-input
              v-model:value="formState.ceoName"
              placeholder="请输入CEO姓名"
              data-catch="setup-ceo-name"
            />
          </a-form-item>
          <a-form-item
            label="手机号"
            :rules="[{ required: true, message: '请输入CEO手机号' }]"
          >
            <a-input
              v-model:value="formState.ceoPhone"
              placeholder="请输入CEO手机号"
              data-catch="setup-ceo-phone"
            />
          </a-form-item>
          <a-form-item
            label="密码"
            :rules="[{ required: true, message: '请输入密码' }]"
          >
            <a-input-password
              v-model:value="formState.ceoPassword"
              placeholder="请输入密码（至少8位）"
              data-catch="setup-ceo-password"
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
          <a-button type="primary" data-catch="setup-step1-next" @click="goToStep(1)">下一步</a-button>
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
        <pre class="recovery-code" data-catch="setup-recovery-code">{{ recoveryCode }}</pre>
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
            @click="goToStep(5)"
          >
            下一步
          </a-button>
        </div>
      </div>

      <!-- Step 6: 自定义角色（设计 §2.2 步骤 5） -->
      <div v-if="currentStep === 5" class="step-content">
        <h3>自定义角色</h3>
        <p style="color: #666;">如有非内置岗位（如总监、组长等），可在角色管理中创建自定义角色并分配权限矩阵（4 级 × 6 模块）。</p>
        <a-button @click="navigateTo('/role')" type="primary">前往角色管理</a-button>
        <div class="step-actions">
          <a-button @click="goToStep(4)">上一步</a-button>
          <a-button type="link" @click="goToStep(6)">跳过</a-button>
          <a-button type="primary" @click="goToStep(6)">下一步</a-button>
        </div>
      </div>

      <!-- Step 7: 员工导入（设计 §2.2 步骤 6） -->
      <div v-if="currentStep === 6" class="step-content">
        <h3>员工批量导入</h3>
        <p style="color: #666;">通过 CSV 粘贴批量录入员工档案；财务可在通讯录导入页完成。</p>
        <a-button @click="navigateTo('/directory')" type="primary">前往通讯录导入</a-button>
        <div class="step-actions">
          <a-button @click="goToStep(5)">上一步</a-button>
          <a-button type="link" @click="goToStep(7)">跳过</a-button>
          <a-button type="primary" @click="goToStep(7)">下一步</a-button>
        </div>
      </div>

      <!-- Step 8: 组织架构（设计 §2.2 步骤 7 + §3.5） -->
      <div v-if="currentStep === 7" class="step-content">
        <h3>组织架构</h3>
        <p style="color: #666;">在组织架构页配置部门树并通过拖拽确定汇报关系（系统自动校验循环汇报）。</p>
        <a-button @click="navigateTo('/org')" type="primary">前往组织架构</a-button>
        <div class="step-actions">
          <a-button @click="goToStep(6)">上一步</a-button>
          <a-button type="link" @click="goToStep(8)">跳过</a-button>
          <a-button type="primary" @click="goToStep(8)">下一步</a-button>
        </div>
      </div>

      <!-- Step 9: 全局配置 + 审批流（设计 §2.2 步骤 8-9） -->
      <div v-if="currentStep === 8" class="step-content">
        <h3>全局配置 / 审批流</h3>
        <p style="color: #666;">在系统配置页设置考勤计量单位、临时薪资调整审批开关，并按业务类型编辑审批流末端节点（总经理/CEO 等）。</p>
        <a-button @click="navigateTo('/config')" type="primary">前往系统配置</a-button>
        <div class="step-actions">
          <a-button @click="goToStep(7)">上一步</a-button>
          <a-button type="link" @click="goToStep(9)">跳过</a-button>
          <a-button type="primary" @click="goToStep(9)">下一步</a-button>
        </div>
      </div>

      <!-- Step 10: 数据保留期（设计 §2.2 步骤 10 + §10） -->
      <div v-if="currentStep === 9" class="step-content">
        <h3>数据保留期</h3>
        <p style="color: #666;">设置薪资条 / 表单 / 操作日志等各类数据的留存年限；到期前 30 天会通知 CEO 与运维。</p>
        <a-button @click="navigateTo('/retention')" type="primary">前往数据保留</a-button>
        <div class="step-actions">
          <a-button @click="goToStep(8)">上一步</a-button>
          <a-button type="primary" @click="finishSetup">完成初始化</a-button>
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
  companyName: string
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
  companyName: '',
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
  if (formState.companyName) body.companyName = formState.companyName

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
  } catch (error) {
    // error is an ofetch FetchError from Nuxt's $fetch; response.status and data.message are ofetch-specific fields
    const fetchError = error as { response?: { status?: number }; data?: { message?: string } }
    if (fetchError?.response?.status === 400 || fetchError?.response?.status === 403 || fetchError?.response?.status === 409) {
      submitError.value = fetchError?.data?.message || '提交失败，请检查输入'
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
  padding: 16px;
  background: #f0f2f5;
  /* Flow layout: natural top-to-bottom content flow */
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
