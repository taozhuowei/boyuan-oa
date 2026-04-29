<template>
  <!--
    /directory — 通讯录批量导入页（运营态）

    本页功能完全由 <EmployeeImportPanel mode="operation"> 承担三步式 UI；
    本页仅负责：
      1) 接收 panel 的 change 事件并分发到 /directory/import-preview / import-apply 两个 API
      2) 调用结果反馈：成功时调 panelRef.applyPreviewResult / applyImportResult 推进步骤
                     失败时 message.error 并调 setPreviewLoading(false)/setImportLoading(false)
                     回滚 loading 状态
  -->
  <div class="directory-import-page">
    <h2 class="page-title">通讯录导入</h2>
    <EmployeeImportPanel
      ref="panelRef"
      v-model="importModel"
      mode="operation"
      @change="handlePanelChange"
    />
  </div>
</template>

<script setup lang="ts">
/**
 * /directory 通讯录批量导入页面（运营态）
 *
 * 设计依据：D-M08 初始化向导改造（DEF-SETUP-04 C2）—— /directory 与 /setup 步骤 6 共用
 * <EmployeeImportPanel /> 组件，确保两处行为一致。
 *
 * 本页职责：
 *   - 接收子组件 change 事件，将 preview / apply 转化为后端 API 请求
 *   - 调用 panelRef 暴露的方法（applyPreviewResult / applyImportResult /
 *     setPreviewLoading / setImportLoading）来同步组件状态
 *
 * 本页不负责：
 *   - CSV 解析（已下沉到 EmployeeImportPanel.parseCsvInput）
 *   - 预览 / 表格 / 步骤切换（由 panel 承担）
 *
 * 权限：CEO / HR（沿用 /directory 既有权限策略，未在此处新增改动）。
 */
import { ref } from 'vue'
import { message } from 'ant-design-vue'
import EmployeeImportPanel, {
  type EmployeeImportData,
  type PreviewResponse,
  type ChangePayload,
} from '~/components/setup/EmployeeImportPanel.vue'
import { request } from '~/utils/http'

/**
 * 子组件实例引用；操作模式下父组件需调用其暴露的方法回填预览结果或推进步骤。
 * 类型沿用组件内部 defineExpose 的字段集合。
 */
const panelRef = ref<{
  applyPreviewResult: (resp: PreviewResponse) => void
  applyImportResult: (msg: string) => void
  setPreviewLoading: (loading: boolean) => void
  setImportLoading: (loading: boolean) => void
} | null>(null)

/**
 * v-model 占位结构；运营模式下面板不会主动写入 modelValue，
 * 此处保持 EmployeeImportData 形状以满足 props 类型契约。
 */
const importModel = ref<EmployeeImportData>({
  departments: [],
  positions: [],
  employees: [],
})

/**
 * 处理子面板 change 事件。
 *
 * action 路由：
 *   - preview-request：调用 POST /directory/import-preview 获取后端预览结果，回填给 panel
 *   - apply-request  ：调用 POST /directory/import-apply 提交所选行号；成功后通知 panel 推进 Step 3
 *   - apply-done     ：仅日志意义，运营态实际后端确认已通过 apply-request 处理；此处忽略
 *   - reset          ：本页无外部缓存需要清理；忽略即可
 *
 * @param payload EmployeeImportPanel 透出的事件载荷
 */
async function handlePanelChange(payload: ChangePayload): Promise<void> {
  if (payload.action === 'preview-request' && payload.records) {
    try {
      const data = await request<PreviewResponse>({
        url: '/directory/import-preview',
        method: 'POST',
        body: { records: payload.records },
      })
      panelRef.value?.applyPreviewResult(data)
    } catch {
      message.error('预览失败，请重试')
    } finally {
      panelRef.value?.setPreviewLoading(false)
    }
    return
  }

  if (payload.action === 'apply-request' && payload.indices) {
    try {
      const result = await request<string>({
        url: '/directory/import-apply',
        method: 'POST',
        body: { selectedIndices: payload.indices },
      })
      panelRef.value?.applyImportResult(result)
    } catch {
      message.error('导入失败，请重试')
      panelRef.value?.setImportLoading(false)
    }
    return
  }

  // apply-done / reset：本页无副作用需求，故不做处理（panel 内部已自治）
}
</script>

<style scoped>
.directory-import-page {
  /* 自然流式布局 */
}

.page-title {
  font-size: 20px;
  font-weight: 600;
  margin: 0 0 16px 0;
  color: #003466;
}
</style>
