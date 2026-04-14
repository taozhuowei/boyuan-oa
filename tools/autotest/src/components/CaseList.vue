<!-- CaseList: right 320px scrollable list of CaseCards -->
<template>
  <div class="case-list">
    <n-scrollbar>
      <div class="list-inner">
        <case-card
          v-for="item in casesWithStatus"
          :key="item.id"
          :case-data="item"
          :status="item.status"
          :selected="selectedCaseId === item.id"
          @click="emit('select', item.id)"
        />
      </div>
    </n-scrollbar>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { NScrollbar } from 'naive-ui'
import { useResultsStore, type CaseWithStatus } from '../stores/results'
import CaseCard from './CaseCard.vue'

const resultsStore = useResultsStore()

const casesWithStatus = computed<CaseWithStatus[]>(() => {
  return resultsStore.cases.map((c) => ({
    ...c,
    status: resultsStore.getCaseStatus(c.id),
  }))
})

const selectedCaseId = computed(() => resultsStore.selectedCaseId)

const emit = defineEmits<{
  select: [caseId: string]
}>()
</script>

<style scoped>
.case-list {
  width: 320px;
  flex: 1;
  overflow: hidden;
  background: var(--bg-0);
  border-left: 1px solid var(--line);
}

.list-inner {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px;
}
</style>
