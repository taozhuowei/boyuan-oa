<template>
  <!-- Employee management — searchable table of all employees (CEO/finance/PM only) -->
  <div class="employees-page">
    <h2 class="page-title">员工管理</h2>

    <a-card>
      <!-- Search bar -->
      <div class="search-bar">
        <a-input
          v-model:value="keyword"
          placeholder="搜索姓名/部门/岗位"
          style="width: 280px"
          allow-clear
          @press-enter="onSearch"
        />
        <a-button type="primary" @click="onSearch">搜索</a-button>
      </div>

      <a-table
        :columns="columns"
        :data-source="employees"
        :loading="loading"
        :pagination="{
          current: page + 1,
          pageSize: pageSize,
          total: totalElements,
          showTotal: (t: number) => `共 ${t} 人`,
          onChange: onPageChange
        }"
        row-key="id"
        size="small"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'entryDate'">
            {{ record.entryDate ?? '—' }}
          </template>
          <template v-if="column.key === 'accountStatus'">
            <a-tag :color="record.accountStatus === 'ACTIVE' ? 'success' : 'default'">
              {{ record.accountStatus === 'ACTIVE' ? '在职' : '停用' }}
            </a-tag>
          </template>
          <template v-if="column.key === 'action'">
            <a-button type="link" size="small" @click="openDetail(record as Employee)">详情</a-button>
          </template>
        </template>
      </a-table>
    </a-card>

    <!-- 员工详情弹窗 — 使用列表已加载的数据，无需额外 API 请求 -->
    <a-modal
      v-model:open="showDetail"
      :title="`员工详情 — ${detailRecord?.name ?? ''}`"
      :footer="null"
      width="480px"
    >
      <a-descriptions
        v-if="detailRecord"
        bordered
        size="small"
        :column="1"
      >
        <a-descriptions-item label="姓名">{{ detailRecord.name }}</a-descriptions-item>
        <a-descriptions-item label="部门">{{ detailRecord.departmentName ?? '—' }}</a-descriptions-item>
        <a-descriptions-item label="角色">{{ detailRecord.roleName ?? '—' }}</a-descriptions-item>
        <a-descriptions-item label="员工类型">
          {{ detailRecord.employeeType === 'LABOR' ? '劳工' : '正式员工' }}
        </a-descriptions-item>
        <a-descriptions-item label="入职日期">{{ detailRecord.entryDate ?? '—' }}</a-descriptions-item>
        <a-descriptions-item label="账号状态">
          <a-tag :color="detailRecord.accountStatus === 'ACTIVE' ? 'success' : 'default'">
            {{ detailRecord.accountStatus === 'ACTIVE' ? '在职' : '停用' }}
          </a-tag>
        </a-descriptions-item>
      </a-descriptions>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { request } from '~/utils/http'

interface Employee {
  id: number
  name: string
  departmentName: string
  roleName: string
  employeeType: string
  accountStatus: string
  entryDate: string | null
}

const loading = ref(false)
const employees = ref<Employee[]>([])
const keyword = ref('')
const page = ref(0)
const pageSize = ref(20)
const totalElements = ref(0)

// 员工详情弹窗 — 使用列表数据，避免跳转到不存在的详情页
const showDetail = ref(false)
const detailRecord = ref<Employee | null>(null)

function openDetail(record: Employee) {
  detailRecord.value = record
  showDetail.value = true
}

const columns = [
  { title: '姓名', dataIndex: 'name', key: 'name' },
  { title: '部门', dataIndex: 'departmentName', key: 'departmentName' },
  { title: '角色', dataIndex: 'roleName', key: 'roleName' },
  { title: '入职日期', key: 'entryDate' },
  { title: '状态', key: 'accountStatus', width: 80 },
  { title: '操作', key: 'action', width: 80 }
]

async function loadEmployees() {
  loading.value = true
  try {
    const params = new URLSearchParams({
      page: String(page.value),
      size: String(pageSize.value)
    })
    if (keyword.value.trim()) {
      params.set('keyword', keyword.value.trim())
    }
    const data = await request<{ content: Employee[]; totalElements: number }>({
      url: `/employees?${params}`
    })
    employees.value = data.content ?? []
    totalElements.value = data.totalElements ?? 0
  } catch {
    employees.value = []
    totalElements.value = 0
  } finally {
    loading.value = false
  }
}

function onSearch() {
  page.value = 0
  loadEmployees()
}

function onPageChange(p: number) {
  page.value = p - 1
  loadEmployees()
}

onMounted(loadEmployees)
</script>

<style scoped>
.employees-page {
  /* Flow layout: natural top-to-bottom content flow */
}

.page-title {
  font-size: 20px;
  font-weight: 600;
  margin: 0 0 16px 0;
  color: #003466;
}

.search-bar {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}
</style>
