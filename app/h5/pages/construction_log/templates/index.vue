<template>
  <!-- 工作项模板管理页（PM/CEO 专用）
       数据来源：GET /api/work-item-templates
                POST / PUT / DELETE / POST /{id}/derive -->
  <div class="templates-page">
    <div
      class="page-header"
      style="
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 16px;
      "
    >
      <h2 class="page-title" style="margin: 0">工作项模板</h2>
      <a-button type="primary" @click="openCreate">+ 新建模板</a-button>
    </div>

    <a-spin :spinning="loading">
      <a-card v-if="templates.length === 0 && !loading">
        <a-empty description="暂无模板" />
      </a-card>
      <a-table
        v-else
        :data-source="templates"
        :columns="columns"
        :pagination="false"
        row-key="id"
        size="middle"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'items'">
            <a-tag
              v-for="item in (record.items || []).slice(0, 3)"
              :key="item.name"
              style="margin: 2px"
            >
              {{ item.name }}
            </a-tag>
            <span v-if="(record.items || []).length > 3" style="color: #999">
              +{{ record.items.length - 3 }}
            </span>
          </template>
          <template v-if="column.key === 'derivedFrom'">
            <span v-if="record.derivedFrom" style="color: #666">
              派生自 #{{ record.derivedFrom }}
            </span>
            <span v-else style="color: #999">—</span>
          </template>
          <template v-if="column.key === 'action'">
            <a-space>
              <a-button type="link" size="small" @click="openEdit(record as Template)">
                编辑
              </a-button>
              <a-button type="link" size="small" @click="openDerive(record as Template)">
                派生
              </a-button>
              <a-popconfirm title="确认删除此模板？" @confirm="doDelete(record.id)">
                <a-button type="link" size="small" danger>删除</a-button>
              </a-popconfirm>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-spin>

    <!-- 新建/编辑模板弹窗 -->
    <a-modal
      v-model:open="showModal"
      :title="modalTitle"
      @ok="doSave"
      :confirm-loading="saving"
      @cancel="resetModal"
      width="600px"
    >
      <a-form :model="modalForm" layout="vertical">
        <a-form-item label="模板名称" required>
          <a-input v-model:value="modalForm.name" placeholder="请输入模板名称" />
        </a-form-item>
        <a-form-item label="工作项列表">
          <a-button size="small" style="margin-bottom: 8px" @click="addModalItem">
            + 添加工作项
          </a-button>
          <div
            v-for="(item, idx) in modalForm.items"
            :key="idx"
            style="display: flex; gap: 8px; margin-bottom: 6px"
          >
            <a-input v-model:value="item.name" placeholder="名称" style="flex: 1" />
            <a-input v-model:value="item.defaultUnit" placeholder="单位" style="width: 80px" />
            <a-button type="link" danger size="small" @click="removeModalItem(idx)">删除</a-button>
          </div>
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
/**
 * 工作项模板管理 — construction_log/templates/index.vue
 * PM/CEO 管理模板：CRUD + 派生
 */
import { ref, computed, onMounted } from 'vue'
import { request } from '~/utils/http'
import { message } from 'ant-design-vue'

interface TemplateItem {
  name: string
  defaultUnit: string
}

interface Template {
  id: number
  name: string
  projectId: number | null
  createdBy: number
  items: TemplateItem[]
  derivedFrom: number | null
  createdAt: string
}

const loading = ref(false)
const saving = ref(false)
const templates = ref<Template[]>([])

const showModal = ref(false)
const editingId = ref<number | null>(null)
const derivingFrom = ref<number | null>(null)
const modalForm = ref({ name: '', items: [] as TemplateItem[] })

const modalTitle = computed(() => {
  if (derivingFrom.value) return '派生模板'
  return editingId.value ? '编辑模板' : '新建模板'
})

const columns = [
  { title: 'ID', dataIndex: 'id', key: 'id', width: 60 },
  { title: '模板名称', dataIndex: 'name', key: 'name' },
  { title: '工作项', key: 'items' },
  { title: '派生来源', key: 'derivedFrom', width: 120 },
  { title: '操作', key: 'action', width: 180 },
]

function addModalItem() {
  modalForm.value.items.push({ name: '', defaultUnit: '' })
}

function removeModalItem(idx: number) {
  modalForm.value.items.splice(idx, 1)
}

function openCreate() {
  editingId.value = null
  derivingFrom.value = null
  modalForm.value = { name: '', items: [] }
  showModal.value = true
}

function openEdit(tmpl: Template) {
  editingId.value = tmpl.id
  derivingFrom.value = null
  modalForm.value = {
    name: tmpl.name,
    items: (tmpl.items || []).map((it) => ({ name: it.name, defaultUnit: it.defaultUnit })),
  }
  showModal.value = true
}

function openDerive(tmpl: Template) {
  editingId.value = null
  derivingFrom.value = tmpl.id
  modalForm.value = {
    name: tmpl.name + '（副本）',
    items: (tmpl.items || []).map((it) => ({ name: it.name, defaultUnit: it.defaultUnit })),
  }
  showModal.value = true
}

function resetModal() {
  editingId.value = null
  derivingFrom.value = null
  modalForm.value = { name: '', items: [] }
}

async function loadTemplates() {
  loading.value = true
  try {
    templates.value = await request<Template[]>({ url: '/work-item-templates', method: 'GET' })
  } catch {
    message.error('加载失败')
  } finally {
    loading.value = false
  }
}

async function doSave() {
  if (!modalForm.value.name.trim()) {
    message.warning('模板名称不能为空')
    return
  }
  saving.value = true
  try {
    const payload = { name: modalForm.value.name, items: modalForm.value.items }

    if (derivingFrom.value) {
      await request({
        url: `/work-item-templates/${derivingFrom.value}/derive`,
        method: 'POST',
        body: payload,
      })
      message.success('派生模板已创建')
    } else if (editingId.value) {
      await request({
        url: `/work-item-templates/${editingId.value}`,
        method: 'PUT',
        body: payload,
      })
      message.success('已更新')
    } else {
      await request({ url: '/work-item-templates', method: 'POST', body: payload })
      message.success('模板已创建')
    }
    showModal.value = false
    resetModal()
    await loadTemplates()
  } catch {
    message.error('操作失败')
  } finally {
    saving.value = false
  }
}

async function doDelete(id: number) {
  try {
    await request({ url: `/work-item-templates/${id}`, method: 'DELETE' })
    message.success('已删除')
    await loadTemplates()
  } catch {
    message.error('删除失败')
  }
}

onMounted(() => loadTemplates())
</script>

<style scoped>
.templates-page {
  /* Flow layout: natural top-to-bottom content flow */
}

.page-title {
  font-size: 20px;
  font-weight: 600;
  color: #003466;
  margin: 0 0 16px 0;
}

/* Removed flex constraints to allow natural content flow */
</style>
