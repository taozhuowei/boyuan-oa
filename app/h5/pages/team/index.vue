<template>
  <div class="team-page">
    <h2 class="page-title">团队成员 · 本部门</h2>
    <a-card>
      <a-table
        data-catch="team-table"
        :columns="columns"
        :data-source="members"
        :loading="loading"
        :pagination="false"
        row-key="id"
        size="small"
        :customRow="() => ({ 'data-catch': 'team-member-row' }) as any"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'roleCode'">
            {{ roleLabel(record.roleCode) }}
          </template>
          <template v-if="column.key === 'employeeType'">
            {{ employeeTypeLabel(record.employeeType) }}
          </template>
          <template v-if="column.key === 'thisMonthLeaveDays'">
            {{ record.thisMonthLeaveDays }} 天
          </template>
          <template v-if="column.key === 'thisMonthOvertimeHours'">
            {{ record.thisMonthOvertimeHours }} 小时
          </template>
          <template v-if="column.key === 'accountStatus'">
            <a-tag :color="record.accountStatus === 'ACTIVE' ? 'success' : 'default'">
              {{ record.accountStatus === 'ACTIVE' ? '在职' : '停用' }}
            </a-tag>
          </template>
          <template v-if="column.key === 'action'">
            <span class="text-muted">—</span>
          </template>
        </template>
        <template #emptyText>
          <a-empty description="暂无团队成员" />
        </template>
      </a-table>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { request } from '~/utils/http'

interface TeamMember {
  id: number
  name: string
  roleCode: string
  employeeType: string
  accountStatus: string
  thisMonthLeaveDays: number
  thisMonthOvertimeHours: number
}

const loading = ref(false)
const members = ref<TeamMember[]>([])

const columns = [
  { title: '姓名', dataIndex: 'name', key: 'name' },
  { title: '角色/类型', key: 'roleCode' },
  { title: '员工类型', key: 'employeeType' },
  { title: '本月请假', key: 'thisMonthLeaveDays' },
  { title: '本月加班', key: 'thisMonthOvertimeHours' },
  { title: '状态', key: 'accountStatus', width: 90 },
  { title: '操作', key: 'action', width: 80 },
]

function roleLabel(code: string): string {
  const map: Record<string, string> = {
    employee: '员工',
    department_manager: '部门经理',
    worker: '劳工',
    project_manager: '项目经理',
    finance: '财务',
    hr: '人力资源',
    ceo: '首席经营者',
  }
  return map[code] ?? code
}

function employeeTypeLabel(type: string): string {
  if (type === 'OFFICE') return '办公室'
  if (type === 'LABOR') return '劳工'
  return type
}

async function loadMembers() {
  loading.value = true
  try {
    const data = await request<TeamMember[]>({ url: '/team/members' })
    members.value = data ?? []
  } catch {
    members.value = []
  } finally {
    loading.value = false
  }
}

onMounted(loadMembers)
</script>

<style scoped>
.team-page {
  /* flow */
}
.page-title {
  font-size: 20px;
  font-weight: 600;
  margin: 0 0 16px 0;
  color: #003466;
}
.text-muted {
  color: #999;
}
</style>
