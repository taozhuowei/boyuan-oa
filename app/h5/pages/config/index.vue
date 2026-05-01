<template>
  <!-- 系统配置页: 汇聚各配置区块，CEO 可编辑，其他角色只读 -->
  <div class="config-page">
    <h2 class="page-title">系统配置</h2>

    <div class="cards-container">
      <ApprovalFlowConfig :is-c-e-o="isCEO" />
      <CompanyInfo :is-c-e-o="isCEO" />
      <RetentionConfig :is-c-e-o="isCEO" />
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * config/index.vue — 系统配置父页面
 * 职责: 页面布局 + 角色判断，将具体配置区块委托给各 sections/ 子组件
 * 数据来源: useUserStore().userInfo.role
 */
import { computed } from 'vue'
import { useUserStore } from '~/stores/user'
import ApprovalFlowConfig from './sections/ApprovalFlowConfig.vue'
import CompanyInfo from './sections/CompanyInfo.vue'
import RetentionConfig from './sections/RetentionConfig.vue'

const user_store = useUserStore()
const isCEO = computed(() => user_store.userInfo?.role === 'ceo')
</script>

<style scoped>
.config-page {
  /* Flow layout: natural top-to-bottom content flow */
}

.page-title {
  font-size: 20px;
  font-weight: 600;
  margin: 0 0 16px 0;
  color: #003466;
}

.cards-container {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

/* Shared card sizing — consumed by all section components via :deep() or global .config-card */
:deep(.config-card) {
  flex: 1;
  min-width: 320px;
  min-height: 200px;
}

:deep(.form-row) {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
}

:deep(.form-label) {
  width: 100px;
  color: #666;
}

:deep(.readonly-value) {
  color: #333;
  font-weight: 500;
}

:deep(.form-actions) {
  margin-top: 24px;
}

:deep(.form-hint) {
  color: #999;
  font-size: 12px;
  margin: 4px 0 0 116px;
  max-width: 420px;
  line-height: 1.5;
}
</style>
