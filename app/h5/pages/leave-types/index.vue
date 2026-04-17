<template>
  <!-- Leave Type Management — HR-only CRUD for leave type definitions -->
  <div class="leave-types-page">
    <h2 class="page-title">假期配额管理</h2>

    <a-card title="假期类型" class="section-card">
      <template #extra>
        <a-button
          v-if="isHR"
          type="primary"
          size="small"
          data-catch="leave-types-create-btn"
          @click="openAdd"
        >
          新建假期类型
        </a-button>
      </template>
      <a-table
        data-catch="leave-types-table"
        :columns="columns"
        :data-source="leaveTypes"
        :loading="loading"
        :pagination="false"
        row-key="id"
        size="small"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'deductionRate'">
            {{ (record.deductionRate * 100).toFixed(0) + '%' }}
          </template>
          <template v-if="column.key === 'deductionBasis'">
            {{ deductionBasisMap[record.deductionBasis] ?? record.deductionBasis }}
          </template>
          <template v-if="column.key === 'isSystem'">
            <a-tag :color="record.isSystem ? 'green' : 'default'">{{ record.isSystem ? '是' : '否' }}</a-tag>
          </template>
          <template v-if="column.key === 'isEnabled'">
            <a-tag :color="record.isEnabled ? 'green' : 'default'">{{ record.isEnabled ? '启用' : '停用' }}</a-tag>
          </template>
          <template v-if="column.key === 'action'">
            <a-space>
              <a-button v-if="isHR" type="link" size="small" @click="openEdit(record as LeaveType)">编辑</a-button>
              <a-popconfirm
                v-if="isHR && !record.isSystem"
                title="确定删除该假期类型吗？"
                @confirm="handleDelete(record.id)"
              >
                <a-button type="link" danger size="small">删除</a-button>
              </a-popconfirm>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-card>

    <!-- Add/Edit Modal -->
    <a-modal
      v-model:open="modalVisible"
      :title="modalTitle"
      data-catch="leave-types-modal"
      :confirm-loading="saving"
      @ok="handleSave"
      @cancel="modalVisible = false"
    >
      <a-form :model="form" layout="vertical">
        <a-form-item label="代码" required>
          <a-input v-model:value="form.code" placeholder="请输入代码" :disabled="isEdit" />
        </a-form-item>
        <a-form-item label="假种名称" required>
          <a-input v-model:value="form.name" placeholder="请输入假种名称" />
        </a-form-item>
        <a-form-item label="年度配额(天)">
          <a-input-number v-model:value="form.quotaDays" :min="0" style="width: 100%" />
        </a-form-item>
        <a-form-item label="扣款比例">
          <a-input-number
            v-model:value="form.deductionRate"
            :min="0"
            :max="1"
            :step="0.1"
            :precision="2"
            style="width: 100%"
          />
        </a-form-item>
        <a-form-item label="扣款基准">
          <a-select v-model:value="form.deductionBasis" style="width: 100%">
            <a-select-option value="DAILY_SALARY">日薪</a-select-option>
            <a-select-option value="MONTHLY_SALARY">月薪</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item v-if="isEdit" label="是否启用">
          <a-switch v-model:checked="form.isEnabled" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, reactive } from 'vue'
import { message } from 'ant-design-vue'
import { request } from '~/utils/http'
import { useUserStore } from '~/stores/user'

interface LeaveType {
  id: number
  code: string
  name: string
  quotaDays: number
  deductionRate: number
  deductionBasis: 'DAILY_SALARY' | 'MONTHLY_SALARY'
  isSystem: boolean
  isEnabled: boolean
}

const userStore = useUserStore()
const isHR = computed(() => userStore.userInfo?.role === 'hr')

const leaveTypes = ref<LeaveType[]>([])
const loading = ref(false)
const modalVisible = ref(false)
const isEdit = ref(false)
const saving = ref(false)
const editingId = ref<number | null>(null)

const form = reactive({
  code: '',
  name: '',
  quotaDays: 0,
  deductionRate: 1.0,
  deductionBasis: 'DAILY_SALARY' as 'DAILY_SALARY' | 'MONTHLY_SALARY',
  isEnabled: true
})

const modalTitle = computed(() => (isEdit.value ? '编辑假期类型' : '新增假期类型'))

const columns = [
  { title: '假种名称', dataIndex: 'name', key: 'name' },
  { title: '代码', dataIndex: 'code', key: 'code', width: 140 },
  { title: '年度配额(天)', dataIndex: 'quotaDays', key: 'quotaDays', width: 120 },
  { title: '扣款比例', key: 'deductionRate', width: 100 },
  { title: '扣款基准', key: 'deductionBasis', width: 100 },
  { title: '系统内置', key: 'isSystem', width: 100 },
  { title: '状态', key: 'isEnabled', width: 90 },
  { title: '操作', key: 'action', width: 140 }
]

const deductionBasisMap: Record<string, string> = {
  DAILY_SALARY: '日薪',
  MONTHLY_SALARY: '月薪'
}

async function loadTypes() {
  loading.value = true
  try {
    const data = await request<LeaveType[]>({ url: '/config/leave-types/all' })
    leaveTypes.value = data ?? []
  } catch {
    leaveTypes.value = []
  } finally {
    loading.value = false
  }
}

function openAdd() {
  isEdit.value = false
  editingId.value = null
  form.code = ''
  form.name = ''
  form.quotaDays = 0
  form.deductionRate = 1.0
  form.deductionBasis = 'DAILY_SALARY'
  form.isEnabled = true
  modalVisible.value = true
}

function openEdit(record: LeaveType) {
  isEdit.value = true
  editingId.value = record.id
  form.code = record.code
  form.name = record.name
  form.quotaDays = record.quotaDays
  form.deductionRate = record.deductionRate
  form.deductionBasis = record.deductionBasis
  form.isEnabled = record.isEnabled
  modalVisible.value = true
}

async function handleSave() {
  if (!form.name.trim()) {
    message.error('请输入假种名称')
    return
  }
  if (!isEdit.value && !form.code.trim()) {
    message.error('请输入代码')
    return
  }
  saving.value = true
  try {
    const payload = {
      code: form.code.trim(),
      name: form.name.trim(),
      quotaDays: form.quotaDays,
      deductionRate: form.deductionRate,
      deductionBasis: form.deductionBasis,
      isEnabled: form.isEnabled
    }
    if (isEdit.value && editingId.value != null) {
      await request({
        url: `/config/leave-types/${editingId.value}`,
        method: 'PUT',
        body: payload
      })
    } else {
      await request({
        url: '/config/leave-types',
        method: 'POST',
        body: payload
      })
    }
    message.success('保存成功')
    modalVisible.value = false
    await loadTypes()
  } catch {
    // handled by request util
  } finally {
    saving.value = false
  }
}

async function handleDelete(id: number) {
  try {
    await request({ url: `/config/leave-types/${id}`, method: 'DELETE' })
    message.success('已删除')
    await loadTypes()
  } catch {
    // handled by request util
  }
}

onMounted(loadTypes)
</script>

<style scoped>
.leave-types-page {
  /* natural flow */
}

.page-title {
  font-size: 20px;
  font-weight: 600;
  margin: 0 0 16px 0;
  color: #003466;
}

.section-card {
  margin-bottom: 16px;
}
</style>
