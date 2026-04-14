<template>
  <section class="case-list-shell">
    <header class="case-list-head">
      <div>
        <span class="eyebrow">TEST CASES</span>
        <strong>{{ resultsStore.cases.length }}</strong>
      </div>
      <span class="stats">
        {{ resultsStore.overallStats.pass }}/{{ resultsStore.overallStats.fail }}/{{ resultsStore.overallStats.total }}
      </span>
    </header>

    <n-scrollbar ref="scrollbar" class="case-list-scroll">
      <div class="case-list-inner">
        <div
          v-for="item in casesWithStatus"
          :key="item.id"
          :ref="(element) => setCardRef(item.id, element)"
        >
          <CaseCard
            :case-data="item"
            :status="item.status"
            :selected="item.id === resultsStore.selectedCaseId"
            :confirm-note="runnerStore.confirmNote"
            @select="selectCase"
            @confirm="confirmCase"
            @update-note="runnerStore.setConfirmNote"
          />
        </div>
      </div>
    </n-scrollbar>
  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { NScrollbar } from 'naive-ui'
import CaseCard from './CaseCard.vue'
import { useResultsStore } from '../stores/results'
import { useRunnerStore } from '../stores/runner'

const resultsStore = useResultsStore()
const runnerStore = useRunnerStore()
const scrollbar = ref<any>(null)
const cardRefs = new Map<string, Element>()

const casesWithStatus = computed(() =>
  resultsStore.cases.map((case_item) => ({
    ...case_item,
    status: resultsStore.getCaseStatus(case_item.id),
  }))
)

function setCardRef(case_id: string, element: Element | { $el?: Element } | null): void {
  const resolved = element instanceof Element ? element : element?.$el || null
  if (resolved) {
    cardRefs.set(case_id, resolved)
  } else {
    cardRefs.delete(case_id)
  }
}

function selectCase(case_id: string): void {
  resultsStore.selectCase(case_id)
}

function confirmCase(result: 'pass' | 'fail'): void {
  runnerStore.confirmSelectedCase(result)
}

async function centerSelectedCard(case_id: string | null): Promise<void> {
  if (!case_id) {
    return
  }

  await nextTick()
  const element = cardRefs.get(case_id) as HTMLElement | undefined
  if (element) {
    element.scrollIntoView({
      block: 'center',
      behavior: 'smooth',
    })
  }
}

watch(
  () => resultsStore.selectedCaseId,
  (case_id) => {
    void centerSelectedCard(case_id)
  }
)
</script>

<style scoped>
.case-list-shell {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  background: rgba(11, 13, 16, 0.92);
  border-left: 1px solid var(--line);
}

.case-list-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 14px 10px;
  border-bottom: 1px solid var(--line);
}

.eyebrow {
  display: block;
  color: var(--text-3);
  font-size: 11px;
  letter-spacing: 0.14em;
  font-family: 'JetBrains Mono', 'SF Mono', Consolas, monospace;
}

.case-list-head strong {
  display: block;
  margin-top: 4px;
  font-size: 20px;
}

.stats {
  color: var(--text-2);
  font-family: 'JetBrains Mono', 'SF Mono', Consolas, monospace;
  font-size: 12px;
}

.case-list-scroll {
  flex: 1;
  min-height: 0;
}

.case-list-inner {
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
</style>
