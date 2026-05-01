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
          <a-form-item label="企业名称" extra="用于系统标题显示，如「博渊建筑OA管理系统」">
            <a-input
              v-model:value="formState.companyName"
              placeholder="请输入企业名称（可选）"
              data-catch="setup-company-name"
            />
          </a-form-item>
          <a-form-item label="姓名" :rules="[{ required: true, message: '请输入CEO姓名' }]">
            <a-input
              v-model:value="formState.ceoName"
              placeholder="请输入CEO姓名"
              data-catch="setup-ceo-name"
            />
          </a-form-item>
          <a-form-item
            label="手机号"
            :rules="[
              { required: true, message: '请输入CEO手机号' },
              { pattern: /^1[3-9]\d{9}$/, message: '请输入有效的手机号码', trigger: 'blur' },
            ]"
          >
            <a-input
              v-model:value="formState.ceoPhone"
              placeholder="请输入CEO手机号"
              data-catch="setup-ceo-phone"
            />
          </a-form-item>
          <a-form-item label="密码" :rules="ceoPasswordRules">
            <a-input-password
              v-model:value="formState.ceoPassword"
              placeholder="请输入密码（8-64位，含字母和数字）"
              data-catch="setup-ceo-password"
            />
            <!-- Real-time password strength hints (D-F-17) -->
            <div class="strength-hints">
              <span
                :class="['hint-item', ceoPasswordChecks.length ? 'hint-ok' : 'hint-ng']"
              >
                长度 8-64 位
              </span>
              <span
                :class="['hint-item', ceoPasswordChecks.hasLetter ? 'hint-ok' : 'hint-ng']"
              >
                包含字母
              </span>
              <span
                :class="['hint-item', ceoPasswordChecks.hasDigit ? 'hint-ok' : 'hint-ng']"
              >
                包含数字
              </span>
            </div>
          </a-form-item>
          <a-form-item label="确认密码" :rules="[{ required: true, message: '请确认密码' }]">
            <a-input-password
              v-model:value="formState.ceoPasswordConfirm"
              placeholder="请再次输入密码"
            />
          </a-form-item>
        </a-form>
        <div class="step-actions">
          <a-button type="primary" data-catch="setup-step1-next" @click="goToStep(1)">
            下一步
          </a-button>
        </div>
      </div>

      <!-- Step 2: HR Account -->
      <div v-if="currentStep === 1" class="step-content">
        <h3>创建HR账号</h3>
        <a-form :model="formState" layout="vertical">
          <a-form-item label="姓名" :rules="[{ required: true, message: '请输入HR姓名' }]">
            <a-input v-model:value="formState.hrName" placeholder="请输入HR姓名" />
          </a-form-item>
          <a-form-item label="手机号" :rules="[{ required: true, message: '请输入HR手机号' }]">
            <a-input v-model:value="formState.hrPhone" placeholder="请输入HR手机号" />
          </a-form-item>
        </a-form>
        <a-alert type="info" message="初始密码为 123456，首次登录后请修改" class="info-alert" />
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
            <a-input v-model:value="formState.opsName" placeholder="请输入运营人员姓名（可选）" />
          </a-form-item>
          <a-form-item label="手机号">
            <a-input
              v-model:value="formState.opsPhone"
              placeholder="请输入运营人员手机号（可选）"
            />
          </a-form-item>
          <a-divider orientation="left">总经理</a-divider>
          <a-form-item label="姓名">
            <a-input v-model:value="formState.gmName" placeholder="请输入总经理姓名（可选）" />
          </a-form-item>
          <a-form-item label="手机号">
            <a-input v-model:value="formState.gmPhone" placeholder="请输入总经理手机号（可选）" />
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
        <a-alert v-if="submitError" type="error" :message="submitError" class="error-alert" />
        <div class="step-actions">
          <a-button @click="goToStep(2)">上一步</a-button>
          <a-button
            type="primary"
            data-catch="setup-submit-btn"
            :loading="submitting"
            @click="submitSetup"
          >
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
        <a-checkbox v-model:checked="recoverySaved">我已安全保存恢复码</a-checkbox>
        <div class="step-actions">
          <a-button type="primary" :disabled="!recoverySaved" @click="goToStep(5)">下一步</a-button>
        </div>
      </div>

      <!-- Step 6: 自定义角色（DESIGN §2.2 步骤 5）— 内嵌 RoleConfigPanel -->
      <div v-if="currentStep === 5" class="step-content">
        <h3>自定义角色</h3>
        <p class="step-hint">
          如有非内置岗位（如总监、组长等），可在此创建自定义角色并配置权限矩阵；下一步可继续，无需此步可点"跳过"。
        </p>
        <RoleConfigPanel v-model="roles" mode="wizard" />
        <div class="step-actions">
          <a-button @click="goToStep(4)">上一步</a-button>
          <a-button type="link" data-catch="setup-step6-skip" @click="skipRoles">跳过</a-button>
          <a-button type="primary" data-catch="setup-step6-next" @click="goToStep(6)">
            下一步
          </a-button>
        </div>
      </div>

      <!-- Step 7: 员工导入（DESIGN §2.2 步骤 6）— Tabs：部门 / 员工 -->
      <div v-if="currentStep === 6" class="step-content">
        <h3>组织部门 / 员工导入</h3>
        <p class="step-hint">
          先建部门树，再粘贴 CSV 批量导入员工；若已在 CSV 中包含部门列，将自动并入部门列表。
        </p>
        <a-tabs v-model:active-key="step7TabKey">
          <a-tab-pane key="dept" tab="部门管理">
            <DepartmentManager
              v-model="wizardDepartments"
              mode="wizard"
              :can-edit="true"
            />
          </a-tab-pane>
          <a-tab-pane key="emp" tab="员工导入">
            <EmployeeImportPanel v-model="employeeImport" mode="wizard" />
          </a-tab-pane>
        </a-tabs>
        <div class="step-actions">
          <a-button @click="goToStep(5)">上一步</a-button>
          <a-button type="link" data-catch="setup-step7-skip" @click="skipEmployees">跳过</a-button>
          <a-button type="primary" data-catch="setup-step7-next" @click="goToStep(7)">
            下一步
          </a-button>
        </div>
      </div>

      <!-- Step 8: 组织架构（DESIGN §2.2 步骤 7 + §3.5）— SupervisorTree -->
      <div v-if="currentStep === 7" class="step-content">
        <h3>组织架构（汇报关系）</h3>
        <p class="step-hint">
          从左侧未分配区拖拽员工到右侧 CEO 树形节点上以建立汇报关系；系统会自动校验循环汇报。
        </p>
        <SupervisorTree
          v-model="supervisors"
          :employees="supervisorEmployees"
          mode="wizard"
          :can-edit="true"
          @invalid="handleSupervisorInvalid"
        />
        <div class="step-actions">
          <a-button @click="goToStep(6)">上一步</a-button>
          <a-button type="link" data-catch="setup-step8-skip" @click="skipSupervisors">
            跳过
          </a-button>
          <a-button type="primary" data-catch="setup-step8-next" @click="goToStep(8)">
            下一步
          </a-button>
        </div>
      </div>

      <!-- Step 9: 全局配置 + 审批流（DESIGN §2.2 步骤 8-9） -->
      <!-- 由于 /config 子组件直接调 API，向导期不可复用，这里就地重写 wizard 专用面板 -->
      <div v-if="currentStep === 8" class="step-content">
        <h3>全局配置 / 审批流</h3>
        <p class="step-hint">
          配置各业务类型的审批流末端节点。
        </p>

        <a-card title="审批流末端节点" class="config-block">
          <p class="form-hint">
            为每个业务类型配置末端审批人；初始向导建议至少为请假 / 加班 / 报销三类配置。
          </p>
          <div
            v-for="flow in approvalFlowsForm"
            :key="flow.businessType"
            class="approval-flow-row"
          >
            <div class="approval-flow-header">
              <span class="approval-flow-title">
                {{ BUSINESS_TYPE_LABELS[flow.businessType] ?? flow.businessType }}
              </span>
              <a-button
                type="dashed"
                size="small"
                :data-catch="'wizard-approval-add-' + flow.businessType"
                @click="addApprovalNode(flow)"
              >
                + 添加节点
              </a-button>
            </div>
            <div v-if="flow.nodes.length === 0" class="approval-empty">
              暂无节点，点击右上角"+ 添加节点"创建。
            </div>
            <div
              v-for="(node, idx) in flow.nodes"
              :key="idx"
              class="approval-node-row"
            >
              <span class="approval-node-no">#{{ idx + 1 }}</span>
              <a-input
                v-model:value="node.nodeName"
                placeholder="节点名"
                style="width: 130px"
                :data-catch="'wizard-approval-name-' + flow.businessType + '-' + idx"
              />
              <a-select
                v-model:value="node.approverType"
                style="width: 160px"
                :options="APPROVER_TYPE_OPTIONS"
                :data-catch="'wizard-approval-type-' + flow.businessType + '-' + idx"
              />
              <a-input
                v-model:value="node.approverRef"
                placeholder="角色 code 或员工 ID"
                style="flex: 1"
                :data-catch="'wizard-approval-ref-' + flow.businessType + '-' + idx"
              />
              <a-button
                type="link"
                danger
                size="small"
                :data-catch="'wizard-approval-remove-' + flow.businessType + '-' + idx"
                @click="removeApprovalNode(flow, idx)"
              >
                删除
              </a-button>
            </div>
          </div>
        </a-card>

        <div class="step-actions">
          <a-button @click="goToStep(7)">上一步</a-button>
          <a-button type="link" data-catch="setup-step9-skip" @click="skipGlobalConfig">
            跳过
          </a-button>
          <a-button type="primary" data-catch="setup-step9-next" @click="goToStep(9)">
            下一步
          </a-button>
        </div>
      </div>

      <!-- Step 10: 数据保留期（DESIGN §2.2 步骤 10 + §10）— RetentionPanel + 完成初始化 -->
      <div v-if="currentStep === 9" class="step-content">
        <h3>数据保留期</h3>
        <p class="step-hint">
          配置薪资条 / 表单 / 操作日志等各类数据的留存年限；到期前若干天会通知 CEO 与运维。
        </p>
        <RetentionPanel v-model="retention" mode="wizard" />
        <a-alert
          v-if="finalizeError"
          type="error"
          :message="finalizeError"
          class="error-alert"
        />
        <div class="step-actions">
          <a-button @click="goToStep(8)">上一步</a-button>
          <a-button
            type="primary"
            :loading="finalizing"
            data-catch="setup-finalize-btn"
            @click="finalizeSetup"
          >
            完成初始化
          </a-button>
        </div>
      </div>
    </a-card>
  </div>
</template>

<script setup lang="ts">
/**
 * /setup/index.vue — 系统初始化向导（D-M08 重构）
 *
 * 设计依据：
 *   - DESIGN.md §2.2 系统初始化向导：step 1-10 全程不离开 /setup
 *   - DEF-SETUP-04 C2：step 5-10 通过 POST /setup/finalize 单次原子提交
 *
 * 阶段划分：
 *   Step 1-4：CEO / HR / 可选人员 / 确认  →  POST /setup/init（保持原有逻辑）
 *   Step 5  ：恢复码展示                  →  仅显示，不提交数据
 *   Step 6-10：自定义角色 / 员工导入 / 汇报关系 / 全局配置 + 审批流 / 留存期
 *               全部填入本组件 reactive state，最后由 finalizeSetup() 一次性 POST /setup/finalize
 *
 * 不变量：
 *   - Step 1-5 的现有逻辑 1:1 保留（复杂的密码强度提示 / 恢复码确认勾选 / beforeunload）
 *   - Step 6-10 内嵌 5 个共用组件（RoleConfigPanel / EmployeeImportPanel /
 *     DepartmentManager / SupervisorTree / RetentionPanel）+ 一个 wizard 专用全局配置/审批流面板
 *   - /config 现有子组件直接调 API，与 wizard 暂存语义不兼容，不可复用 → 此处就地重写
 *   - finalizeSetup 成功后才解绑 beforeunload 并跳 /login
 */
import { reactive, ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { message } from 'ant-design-vue'
import RoleConfigPanel, { type CustomRole } from '~/components/setup/RoleConfigPanel.vue'
import EmployeeImportPanel, {
  type EmployeeImportData,
} from '~/components/setup/EmployeeImportPanel.vue'
import DepartmentManager from '~/components/setup/DepartmentManager.vue'
import SupervisorTree from '~/components/setup/SupervisorTree.vue'
import RetentionPanel, { type RetentionData } from '~/components/setup/RetentionPanel.vue'

definePageMeta({
  layout: false,
})

// ────────────────────────────────────────────────────────────────────
// Step 1-4 既有数据结构（保持原状）
// ────────────────────────────────────────────────────────────────────

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

// CEO 密码实时强度提示（D-F-17）— 与原实现一致
const ceoPasswordChecks = computed(() => ({
  length: formState.ceoPassword.length >= 8 && formState.ceoPassword.length <= 64,
  hasLetter: /[a-zA-Z]/.test(formState.ceoPassword),
  hasDigit: /[0-9]/.test(formState.ceoPassword),
}))

// CEO 密码校验规则：与 D-F-17 spec 完全一致（8-64 位 + 字母 + 数字 + 不允许空格）
const ceoPasswordRules = [
  { required: true, message: '请输入密码', trigger: 'blur' },
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
  gmPhone: '',
})

// ────────────────────────────────────────────────────────────────────
// Step 6-10 reactive state（D-M08 新增）
// ────────────────────────────────────────────────────────────────────

/** Step 6：自定义角色清单；与 RoleConfigPanel v-model 双向绑定 */
const roles = ref<CustomRole[]>([])

/**
 * Step 7：员工导入数据包（CSV 解析结果）
 *
 * EmployeeImportPanel 在 wizard 模式下从 CSV 文本派生：
 *   - departments：去重的部门名扁平列表（parentId=null，sort 递增）
 *   - employees：每行一条 EmployeeImportEntry，含 tempId 与 payload
 *
 * 部门名重复合并由 finalizeSetup 时与 wizardDepartments 树合并去重一并处理。
 */
const employeeImport = ref<EmployeeImportData>({
  departments: [],
  positions: [],
  employees: [],
})

/**
 * Step 7（部门管理 Tab）：DepartmentManager v-model；嵌套树结构
 * 与 employeeImport.departments（CSV 派生扁平列表）独立，finalize 时再合并
 */
interface WizardDepartmentNode {
  id: number
  name: string
  parentId: number | null
  sort: number
  employeeCount: number
  children: WizardDepartmentNode[]
}
const wizardDepartments = ref<WizardDepartmentNode[]>([])
const step7TabKey = ref<'dept' | 'emp'>('dept')

/** Step 8：汇报关系 mappings；与 SupervisorTree v-model 双向绑定 */
interface SupervisorMapping {
  employeeTempId: string
  supervisorTempId: string | null
}
const supervisors = ref<SupervisorMapping[]>([])

/** Step 9：审批流节点编辑（wizard 专用） */
interface ApprovalFlowNodeEntry {
  nodeName: string
  approverType: 'DIRECT_SUPERVISOR' | 'ROLE' | 'DESIGNATED'
  approverRef: string
  skipCondition: string | null
}
interface ApprovalFlowEntry {
  businessType: string
  nodes: ApprovalFlowNodeEntry[]
}

/** Step 9：审批流默认骨架（5 类业务，初始为空节点列表，CEO 可逐项添加） */
const approvalFlowsForm = ref<ApprovalFlowEntry[]>([
  { businessType: 'LEAVE', nodes: [] },
  { businessType: 'OVERTIME', nodes: [] },
  { businessType: 'LOG', nodes: [] },
  { businessType: 'INJURY', nodes: [] },
  { businessType: 'EXPENSE', nodes: [] },
])

/** Step 10：数据保留策略；与 RetentionPanel v-model 双向绑定 */
const retention = ref<RetentionData>({ policies: [] })

/**
 * /setup/init 返回的 finalize 令牌；缓存到 step 10 调用 /setup/finalize 时携带
 * 仅本 SPA 会话有效；刷新页面后会丢失（前端目前没有 sessionStorage 持久化）
 */
const wizardFinalizeToken = ref('')

/** finalize 阶段：调用中 loading 与错误提示 */
const finalizing = ref(false)
const finalizeError = ref('')

// ────────────────────────────────────────────────────────────────────
// Step 9：常量选项
// ────────────────────────────────────────────────────────────────────

/** 审批人类型下拉项 */
const APPROVER_TYPE_OPTIONS = [
  { value: 'DIRECT_SUPERVISOR', label: '直系领导' },
  { value: 'ROLE', label: '角色' },
  { value: 'DESIGNATED', label: '指定员工' },
]

/** 审批流业务类型中文标签（与现网 /config ApprovalFlowConfig 一致） */
const BUSINESS_TYPE_LABELS: Record<string, string> = {
  LEAVE: '请假',
  OVERTIME: '加班',
  LOG: '施工日志',
  INJURY: '工伤',
  EXPENSE: '报销申请',
}

// ────────────────────────────────────────────────────────────────────
// Step 8 派生：把 employeeImport.employees 投影成 SupervisorTree 期望的 EmployeeBrief[]
// CEO 由前 4 步固定（formState.ceoName + roleCode='ceo'）；其余员工沿用 emp-N tempId
// ────────────────────────────────────────────────────────────────────

interface SupervisorEmployeeBrief {
  tempId: string
  name: string
  roleCode?: string
  roleName?: string
  isCeo?: boolean
}

const supervisorEmployees = computed<SupervisorEmployeeBrief[]>(() => {
  // CEO 节点固定加在最前；tempId 保留 'ceo'，与 finalize 时识别一致
  const list: SupervisorEmployeeBrief[] = []
  if (formState.ceoName.trim()) {
    list.push({
      tempId: 'ceo',
      name: formState.ceoName.trim(),
      roleCode: 'ceo',
      roleName: 'CEO',
      isCeo: true,
    })
  }
  for (const emp of employeeImport.value.employees) {
    list.push({
      tempId: emp.tempId,
      name: emp.payload.name,
      roleCode: emp.payload.roleCode,
      roleName: emp.payload.roleCode,
    })
  }
  return list
})

// ────────────────────────────────────────────────────────────────────
// Step 9：审批节点新增 / 删除
// ────────────────────────────────────────────────────────────────────

/** 在指定 businessType 末尾追加一个空节点；用户随后填写 nodeName / approverRef */
function addApprovalNode(flow: ApprovalFlowEntry): void {
  flow.nodes.push({
    nodeName: '',
    approverType: 'ROLE',
    approverRef: '',
    skipCondition: null,
  })
}

function removeApprovalNode(flow: ApprovalFlowEntry, idx: number): void {
  flow.nodes.splice(idx, 1)
}

// ────────────────────────────────────────────────────────────────────
// Step 8 invalid 提示：把组件抛出的 reason 转成中文 message.warning
// ────────────────────────────────────────────────────────────────────

function handleSupervisorInvalid(payload: {
  reason: 'CYCLE' | 'CEO_IMMUTABLE' | 'DROP_TO_GAP' | 'SELF'
  employeeTempId: string
  attemptedSupervisorTempId: string | null
}): void {
  switch (payload.reason) {
    case 'CYCLE':
      message.warning('该操作会形成循环汇报，已撤销')
      break
    case 'CEO_IMMUTABLE':
      message.warning('CEO 节点固定，不能被移动')
      break
    case 'DROP_TO_GAP':
      message.warning('请将节点拖拽到具体上级节点上，而非节点之间')
      break
    case 'SELF':
      message.warning('上级不能是自己')
      break
  }
}

// ────────────────────────────────────────────────────────────────────
// Step 1-4 校验 / 跳转（保持原有实现）
// ────────────────────────────────────────────────────────────────────

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
    if (!/^1[3-9]\d{9}$/.test(formState.ceoPhone.trim())) {
      message.error('请输入有效的手机号码')
      return false
    }
    if (!formState.ceoPassword || formState.ceoPassword.length < 8 || formState.ceoPassword.length > 64) {
      message.error('密码长度须为 8-64 位')
      return false
    }
    if (!/[a-zA-Z]/.test(formState.ceoPassword)) {
      message.error('密码须包含字母')
      return false
    }
    if (!/[0-9]/.test(formState.ceoPassword)) {
      message.error('密码须包含数字')
      return false
    }
    if (/\s/.test(formState.ceoPassword)) {
      message.error('密码不能包含空格')
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

// ────────────────────────────────────────────────────────────────────
// Step 6-9 跳过逻辑：清空对应数据后推进
// ────────────────────────────────────────────────────────────────────

/** 跳过 Step 6（自定义角色）— 清空数据并直接进入下一步 */
function skipRoles() {
  roles.value = []
  goToStep(6)
}

/** 跳过 Step 7（部门 / 员工导入）— 清空两块数据 */
function skipEmployees() {
  wizardDepartments.value = []
  employeeImport.value = { departments: [], positions: [], employees: [] }
  goToStep(7)
}

/** 跳过 Step 8（汇报关系）— 清空 mappings */
function skipSupervisors() {
  supervisors.value = []
  goToStep(8)
}

/** 跳过 Step 9（全局配置 / 审批流）— 清空 approval flows，全局表单保留默认值 */
function skipGlobalConfig() {
  approvalFlowsForm.value = approvalFlowsForm.value.map((f) => ({
    businessType: f.businessType,
    nodes: [],
  }))
  goToStep(9)
}

// ────────────────────────────────────────────────────────────────────
// /setup/init 提交（Step 4 → Step 5）
// 与原实现一致；新增对 wizardFinalizeToken 字段的缓存
// ────────────────────────────────────────────────────────────────────

interface SetupResponse {
  recoveryCode: string
  wizardFinalizeToken: string
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
    hrPhone: formState.hrPhone,
  }
  if (formState.companyName) body.companyName = formState.companyName

  if (formState.opsName) body.opsName = formState.opsName
  if (formState.opsPhone) body.opsPhone = formState.opsPhone
  if (formState.gmName) body.gmName = formState.gmName
  if (formState.gmPhone) body.gmPhone = formState.gmPhone

  try {
    const data = await $fetch<SetupResponse>('/api/setup/init', {
      method: 'POST',
      body,
    })
    recoveryCode.value = data.recoveryCode
    // 缓存 finalize 令牌；step 10 完成初始化时附带提交
    wizardFinalizeToken.value = data.wizardFinalizeToken ?? ''
    currentStep.value = 4
  } catch (error) {
    // error 是 Nuxt $fetch 抛出的 ofetch FetchError，response.status / data.message 是其结构
    const fetchError = error as { response?: { status?: number }; data?: { message?: string } }
    if (
      fetchError?.response?.status === 400 ||
      fetchError?.response?.status === 403 ||
      fetchError?.response?.status === 409
    ) {
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

// ────────────────────────────────────────────────────────────────────
// finalizeSetup：Step 10 "完成初始化"按钮处理
// 序列化所有 step 6-10 数据为 SetupFinalizeRequest 后 POST /setup/finalize
// ────────────────────────────────────────────────────────────────────

/**
 * 把 wizardDepartments 树扁平化为 SetupFinalizeRequest.DepartmentDto[]
 * 顺序：先父后子（BFS），保持 sort 字段；id 字段为 wizard 临时句柄不提交
 */
function flattenWizardDepartments(
  nodes: WizardDepartmentNode[],
): Array<{ parentId: number | null; name: string; sort: number }> {
  const result: Array<{ parentId: number | null; name: string; sort: number }> = []
  function walk(list: WizardDepartmentNode[]) {
    for (const n of list) {
      result.push({ parentId: n.parentId, name: n.name, sort: n.sort })
      if (n.children?.length) walk(n.children)
    }
  }
  walk(nodes)
  return result
}

/**
 * 过滤 approvalFlowsForm，仅提交至少有 1 个有效节点的 flow；空 flow 被跳过
 * 节点必填：nodeName + approverType；空节点视为无效
 */
function buildApprovalFlowsPayload(): Array<{
  businessType: string
  nodes: ApprovalFlowNodeEntry[]
}> {
  return approvalFlowsForm.value
    .map((flow) => ({
      businessType: flow.businessType,
      nodes: flow.nodes
        .filter((n) => n.nodeName.trim() !== '' && n.approverType.trim() !== '')
        .map((n) => ({
          nodeName: n.nodeName.trim(),
          approverType: n.approverType,
          approverRef: n.approverRef.trim(),
          skipCondition: n.skipCondition,
        })),
    }))
    .filter((f) => f.nodes.length > 0)
}

/**
 * "完成初始化"按钮处理：序列化 step 6-10 数据为 SetupFinalizeRequest，单次原子提交。
 *
 * 提交规则：
 *   - wizardFinalizeToken 必填；缺失时立即给出错误提示并阻止提交
 *   - 各 step 数据为空时对应顶层字段为 null（对应"用户跳过该步骤"语义）
 *   - 部门列表来源：DepartmentManager 的 wizardDepartments + EmployeeImportPanel CSV 派生 departments，
 *     合并去重（按 name），保留 wizardDepartments 的 parentId 链
 *   - 成功后 wizardFinalizeState 标记完成，解绑 beforeunload，跳 /login
 *   - 失败弹错误提示，按钮可再次点击重试（finalize 服务端事务回滚）
 */
async function finalizeSetup() {
  finalizing.value = true
  finalizeError.value = ''

  if (!wizardFinalizeToken.value) {
    finalizeError.value = '系统状态异常：未找到 finalize 令牌，请刷新页面重试。'
    finalizing.value = false
    return
  }

  // 部门合并：以 wizardDepartments 扁平化为基准，再补入 employeeImport.departments 中独有的部门名
  const treeDepts = flattenWizardDepartments(wizardDepartments.value)
  const treeDeptNames = new Set(treeDepts.map((d) => d.name))
  const csvExtraDepts = employeeImport.value.departments.filter(
    (d) => !treeDeptNames.has(d.name),
  )
  const mergedDepts = [
    ...treeDepts,
    ...csvExtraDepts.map((d) => ({
      parentId: d.parentId,
      name: d.name,
      sort: treeDepts.length + (d.sort ?? 0),
    })),
  ]

  // 顶层字段：空数据 → null（保持"跳过"语义）
  const employeeImportPayload =
    mergedDepts.length === 0 &&
    employeeImport.value.positions.length === 0 &&
    employeeImport.value.employees.length === 0
      ? null
      : {
          departments: mergedDepts,
          positions: employeeImport.value.positions,
          employees: employeeImport.value.employees,
        }

  const organizationPayload =
    supervisors.value.length === 0
      ? null
      : { supervisors: supervisors.value }

  const approvalFlowsPayload = buildApprovalFlowsPayload()
  const retentionPayload =
    retention.value.policies.length === 0 ? null : retention.value

  const body = {
    wizardFinalizeToken: wizardFinalizeToken.value,
    roles: roles.value.length === 0 ? null : roles.value,
    employeeImport: employeeImportPayload,
    organization: organizationPayload,
    approvalFlows: approvalFlowsPayload.length === 0 ? null : approvalFlowsPayload,
    retention: retentionPayload,
  }

  try {
    await $fetch('/api/setup/finalize', {
      method: 'POST',
      body,
    })
    message.success('系统初始化完成')

    // 标记 finalize 完成，避免后续路由守卫把用户重定向回 /setup
    const wizardFinalizeState = useState<boolean | null>('wizard-finalize-completed')
    wizardFinalizeState.value = true

    // finalize 是用户主动跳转，先解绑 beforeunload 避免拦截自身导航
    window.removeEventListener('beforeunload', handleBeforeUnload)
    navigateTo('/login')
  } catch (error) {
    const fetchError = error as {
      response?: { status?: number }
      data?: { message?: string }
    }
    const status = fetchError?.response?.status
    const msg = fetchError?.data?.message
    if (status === 401) {
      finalizeError.value = msg || '令牌无效或已过期，请刷新页面重新初始化'
    } else if (status === 409) {
      finalizeError.value = msg || '初始化向导已完成，请前往登录页'
    } else if (status === 400) {
      finalizeError.value = msg || '提交数据有误，请检查后重试'
    } else {
      finalizeError.value = msg || '网络错误，请稍后重试'
    }
  } finally {
    finalizing.value = false
  }
}

// ────────────────────────────────────────────────────────────────────
// DEF-SETUP-01：beforeunload 拦截（扩展支持 step 6-10 数据）
// ────────────────────────────────────────────────────────────────────

/**
 * DEF-SETUP-01：判断当前向导是否已有用户填写的内容
 * 任一条件成立即视为有未保存数据：
 *   - 已经离开第 1 步（currentStep > 0）
 *   - formState 中任意字符串字段非空
 *   - recoveryCode 已生成（提交成功后用户仍未完成保存）
 *   - step 6-10 任一 reactive state 非空（D-M08 新增）
 *
 * 用途：beforeunload 触发时判定是否需要拦截刷新/关闭
 */
function hasUnsavedData(): boolean {
  if (currentStep.value > 0) return true
  if (recoveryCode.value !== '') return true
  const stringFields: Array<keyof FormState> = [
    'companyName',
    'ceoName',
    'ceoPhone',
    'ceoPassword',
    'ceoPasswordConfirm',
    'hrName',
    'hrPhone',
    'opsName',
    'opsPhone',
    'gmName',
    'gmPhone',
  ]
  if (stringFields.some((key) => formState[key] !== '')) return true
  // D-M08：step 6-10 数据
  if (roles.value.length > 0) return true
  if (
    employeeImport.value.departments.length > 0 ||
    employeeImport.value.employees.length > 0 ||
    employeeImport.value.positions.length > 0
  )
    return true
  if (wizardDepartments.value.length > 0) return true
  if (supervisors.value.length > 0) return true
  if (retention.value.policies.length > 0) return true
  // approvalFlowsForm：节点数 > 0 视为已填
  if (approvalFlowsForm.value.some((f) => f.nodes.length > 0)) return true
  return false
}

/**
 * DEF-SETUP-01：beforeunload 监听器
 * 用户已开始填写向导时，刷新或关闭浏览器前触发原生确认提示。
 * 现代浏览器忽略自定义提示文本，仅展示浏览器默认信息。
 * 模块作用域定义，便于 finalizeSetup 在正常跳转前先解绑。
 */
function handleBeforeUnload(event: BeforeUnloadEvent) {
  if (hasUnsavedData()) {
    event.preventDefault()
    // 部分浏览器仍要求设置 returnValue 才会触发原生提示
    event.returnValue = ''
  }
}

onMounted(() => {
  window.addEventListener('beforeunload', handleBeforeUnload)
})

onBeforeUnmount(() => {
  window.removeEventListener('beforeunload', handleBeforeUnload)
})
</script>

<style scoped>
.setup-page {
  min-height: 100vh;
  padding: 16px;
  background: #f0f2f5;
  /* 自然流式布局：内容由上至下自然铺开 */
}

.setup-card {
  max-width: 880px;
  margin: 0 auto;
}

.setup-steps {
  margin-bottom: 32px;
}

.step-content {
  padding: 16px 0;
}

.step-content h3 {
  margin-bottom: 16px;
  text-align: center;
}

.step-hint {
  color: #666;
  margin-bottom: 16px;
  text-align: center;
  font-size: 13px;
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

/* 密码强度提示 — 未达成时灰色，达成时绿色（D-F-17） */
.strength-hints {
  display: flex;
  gap: 8px;
  margin-top: 6px;
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

/* Step 9 wizard 全局配置 / 审批流面板样式 */
.config-block {
  margin-bottom: 16px;
}

.form-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 0;
}

.form-label {
  width: 120px;
  flex-shrink: 0;
  color: #555;
}

.form-suffix {
  color: #888;
  font-size: 13px;
}

.form-hint {
  color: #888;
  font-size: 12px;
  margin-bottom: 12px;
}

.approval-flow-row {
  border-top: 1px dashed #e8e8e8;
  padding: 8px 0;
}

.approval-flow-row:first-child {
  border-top: none;
  padding-top: 0;
}

.approval-flow-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.approval-flow-title {
  font-weight: 500;
}

.approval-empty {
  color: #bbb;
  font-size: 12px;
  padding: 4px 0;
}

.approval-node-row {
  display: flex;
  gap: 8px;
  align-items: center;
  padding: 4px 0;
}

.approval-node-no {
  color: #999;
  width: 30px;
  flex-shrink: 0;
}
</style>
