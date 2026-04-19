<template>
  <!-- BonusApprovalConfig: 临时薪资调整审批开关配置卡片 -->
  <a-card title="临时薪资调整审批" class="config-card">
    <a-spin :spinning="loading">
      <div class="form-row">
        <span class="form-label">是否需要 CEO 审批：</span>
        <template v-if="isCEO">
          <a-switch
            v-model:checked="approval_required"
            checked-children="需要"
            un-checked-children="不需要"
            data-catch="config-bonus-approval-switch"
          />
        </template>
        <template v-else>
          <span class="readonly-value">{{ approval_required ? '需要' : '不需要' }}</span>
        </template>
      </div>
      <div class="form-hint">
        开启后，财务录入的临时补贴/扣款需 CEO 审批通过后方可计入结算；关闭时直接生效，仅发送通知给
        CEO。
      </div>
      <div v-if="isCEO" class="form-actions">
        <a-button
          type="primary"
          :loading="saving"
          data-catch="config-bonus-approval-save-btn"
          @click="handleSave"
        >
          保存
        </a-button>
      </div>
    </a-spin>
  </a-card>
</template>

<script setup lang="ts">
/**
 * BonusApprovalConfig — 临时薪资调整审批开关配置区块
 * 职责: 加载并保存临时补贴/扣款的 CEO 审批开关
 * API: GET /payroll/bonus-approval-config, PUT /payroll/bonus-approval-config
 */
import { ref, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import { request } from '~/utils/http'

const props = defineProps<{
  isCEO: boolean
}>()

const loading = ref(false)
const saving = ref(false)
const approval_required = ref(false)

async function loadConfig() {
  loading.value = true
  try {
    const data = await request<{ approvalRequired: boolean }>({
      url: '/payroll/bonus-approval-config',
    })
    approval_required.value = !!data.approvalRequired
  } catch {
    approval_required.value = false
  } finally {
    loading.value = false
  }
}

async function handleSave() {
  if (!props.isCEO) return
  saving.value = true
  try {
    await request({
      url: '/payroll/bonus-approval-config',
      method: 'PUT',
      body: { approvalRequired: approval_required.value },
    })
    message.success('保存成功')
  } catch {
    message.error('保存失败')
  } finally {
    saving.value = false
  }
}

onMounted(loadConfig)
</script>
