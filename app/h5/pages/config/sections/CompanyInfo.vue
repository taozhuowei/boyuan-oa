<template>
  <!-- CompanyInfo: 企业信息配置卡片 (企业名称) -->
  <a-card title="企业信息" class="config-card">
    <a-spin :spinning="loading">
      <div class="form-row">
        <span class="form-label">企业名称：</span>
        <template v-if="isCEO">
          <a-input
            v-model:value="company_name"
            style="width: 240px"
            placeholder="请输入企业名称"
            data-catch="config-company-name-input"
          />
        </template>
        <template v-else>
          <span class="readonly-value">{{ company_name || '—' }}</span>
        </template>
      </div>
      <div v-if="isCEO" class="form-actions">
        <a-button
          type="primary"
          :loading="saving"
          data-catch="config-company-name-save-btn"
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
 * CompanyInfo — 企业信息配置区块
 * 职责: 加载并保存企业名称；保存后同步更新侧边栏 Logo 所用的 Nuxt shared state
 * API: GET /config/company-name, PUT /config/company-name
 * shared state key: 'company-name' (来源: useState in Nuxt 3)
 */
import { ref, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import { request } from '~/utils/http'

const props = defineProps<{
  isCEO: boolean
}>()

const loading = ref(false)
const saving = ref(false)
const company_name = ref<string>('')

async function loadConfig() {
  loading.value = true
  try {
    const data = await request<{ companyName: string | null }>({ url: '/config/company-name' })
    company_name.value = data.companyName ?? ''
  } catch {
    // keep empty default; non-critical
  } finally {
    loading.value = false
  }
}

async function handleSave() {
  if (!props.isCEO) return
  saving.value = true
  try {
    await request({
      url: '/config/company-name',
      method: 'PUT',
      body: { companyName: company_name.value },
    })
    message.success('企业名称已保存')
    // Sync sidebar logo — Nuxt shared state key mirrors layout default.vue usage
    const shared_company_name = useState<string | null>('company-name')
    shared_company_name.value = company_name.value || null
  } catch {
    message.error('保存失败')
  } finally {
    saving.value = false
  }
}

onMounted(loadConfig)
</script>
