<template>
  <!-- ApprovalFlowConfig: 审批流配置卡片 + 节点编辑弹窗 -->
  <div>
    <a-card title="审批流配置" class="config-card">
      <a-spin :spinning="loading">
        <a-table
          :columns="FLOW_COLUMNS"
          :data-source="approval_flows"
          :pagination="false"
          row-key="id"
          size="small"
          data-catch="config-approval-flows-table"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'action' && isCEO">
              <a-button type="link" size="small" @click="openEditor(record.businessType)">
                编辑节点
              </a-button>
            </template>
          </template>
          <template #emptyText>
            <span v-if="has_error">无法加载审批流配置</span>
            <span v-else>暂无审批流配置</span>
          </template>
        </a-table>
      </a-spin>
    </a-card>

    <!-- Approval flow node editor modal -->
    <a-modal
      v-model:open="editor_open"
      :title="`编辑审批流 — ${editing_business_type}`"
      :confirm-loading="saving"
      width="640px"
      @ok="handleSave"
      @cancel="editor_open = false"
    >
      <p style="color: #999; margin-bottom: 12px">
        按从上到下顺序执行节点；保存即覆盖（旧节点软删，新节点全量插入）。
      </p>
      <div v-for="(node, idx) in editing_nodes" :key="idx" class="flow-node-row">
        <span class="node-no">#{{ idx + 1 }}</span>
        <a-input v-model:value="node.nodeName" placeholder="节点名" style="width: 130px" />
        <a-select v-model:value="node.approverType" style="width: 160px">
          <a-select-option value="DIRECT_SUPERVISOR">直系领导</a-select-option>
          <a-select-option value="ROLE">角色</a-select-option>
          <a-select-option value="DESIGNATED">指定员工</a-select-option>
        </a-select>
        <a-input
          v-model:value="node.approverRef"
          placeholder="角色code 或员工 ID"
          style="flex: 1"
        />
        <a-button type="link" danger @click="removeNode(idx)">删除</a-button>
      </div>
      <a-button type="dashed" block @click="addNode">+ 添加节点</a-button>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
/**
 * ApprovalFlowConfig — 审批流配置区块
 * 职责: 展示审批流列表；CEO 可打开编辑弹窗修改节点
 * API: GET /approval/flows, GET/PUT /approval/flows/:businessType
 */
import { ref, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import { request } from '~/utils/http'

interface ApprovalFlowItem {
  id: number
  businessType: string
  isActive: boolean
  nodeCount: number
}

interface FlowNode {
  nodeName: string
  approverType: string
  approverRef: string
  skipCondition?: string | null
}

defineProps<{
  isCEO: boolean
}>()

const BUSINESS_TYPE_LABELS: Record<string, string> = {
  LEAVE: '请假',
  OVERTIME: '加班',
  LOG: '施工日志',
  INJURY: '工伤',
  EXPENSE: '报销申请',
}

// Columns definition is stable — defined once outside reactive scope
const FLOW_COLUMNS = [
  { title: 'ID', dataIndex: 'id', key: 'id', width: 60 },
  {
    title: '业务类型',
    dataIndex: 'businessType',
    key: 'businessType',
    customRender: ({ text }: { text: string }) => BUSINESS_TYPE_LABELS[text] ?? text,
  },
  { title: '审批节点数', dataIndex: 'nodeCount', key: 'nodeCount', width: 110 },
  {
    title: '状态',
    dataIndex: 'isActive',
    key: 'isActive',
    width: 80,
    customRender: ({ text }: { text: boolean }) => (text ? '启用' : '禁用'),
  },
  { title: '操作', key: 'action', width: 100 },
]

const loading = ref(false)
const has_error = ref(false)
const approval_flows = ref<ApprovalFlowItem[]>([])

const editor_open = ref(false)
const saving = ref(false)
const editing_business_type = ref('')
const editing_nodes = ref<FlowNode[]>([])

async function loadFlows() {
  loading.value = true
  has_error.value = false
  try {
    const data = await request<
      Array<{
        flow: { id: number; businessType: string; isActive: boolean }
        nodes: unknown[]
      }>
    >({ url: '/approval/flows' })
    approval_flows.value = (data ?? []).map((item) => ({
      id: item.flow.id,
      businessType: item.flow.businessType,
      isActive: item.flow.isActive,
      nodeCount: item.nodes?.length ?? 0,
    }))
  } catch {
    approval_flows.value = []
    has_error.value = true
  } finally {
    loading.value = false
  }
}

async function openEditor(business_type: string) {
  editing_business_type.value = business_type
  editor_open.value = true
  try {
    const data = await request<{ flow: { businessType: string }; nodes: FlowNode[] }>({
      url: `/approval/flows/${business_type}`,
    })
    editing_nodes.value = (data?.nodes ?? []).map((n) => ({
      ...n,
      approverRef: n.approverRef ?? '',
    }))
  } catch {
    editing_nodes.value = []
  }
}

function addNode() {
  editing_nodes.value.push({
    nodeName: '',
    approverType: 'ROLE',
    approverRef: '',
    skipCondition: null,
  })
}

function removeNode(idx: number) {
  editing_nodes.value.splice(idx, 1)
}

async function handleSave() {
  if (editing_nodes.value.some((n) => !n.nodeName?.trim() || !n.approverType)) {
    message.warning('节点名和审批人类型必填')
    return
  }
  saving.value = true
  try {
    await request({
      url: `/approval/flows/${editing_business_type.value}`,
      method: 'PUT',
      body: { nodes: editing_nodes.value },
    })
    message.success('已保存')
    editor_open.value = false
    await loadFlows()
  } catch {
    // error handled by request interceptor
  } finally {
    saving.value = false
  }
}

onMounted(loadFlows)
</script>

<style scoped>
.flow-node-row {
  display: flex;
  gap: 8px;
  align-items: center;
  padding: 6px 0;
  border-bottom: 1px solid #f0f0f0;
}
.node-no {
  color: #999;
  width: 30px;
}
</style>
