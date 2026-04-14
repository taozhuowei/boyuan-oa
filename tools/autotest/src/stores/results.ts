import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type { CaseResult, CaseStatus, StepResult, TestCase } from '../../runner/types'

export interface CaseWithStatus extends TestCase {
  status: CaseStatus
}

export const useResultsStore = defineStore('results', () => {
  const cases = ref<TestCase[]>([])
  const results = ref<Map<string, CaseResult>>(new Map())
  const selectedCaseId = ref<string | null>(null)
  const screenshots = ref<Map<string, string>>(new Map())

  const selectedCase = computed(() => {
    if (!selectedCaseId.value) {
      return null
    }
    return cases.value.find((case_item) => case_item.id === selectedCaseId.value) || null
  })

  const selectedCaseResult = computed(() => {
    if (!selectedCaseId.value) {
      return null
    }
    return results.value.get(selectedCaseId.value) || null
  })

  const overallStats = computed(() => {
    const values = Array.from(results.value.values())
    return {
      total: cases.value.length,
      pass: values.filter((result) => (result.humanResult ?? result.status) === 'pass').length,
      fail: values.filter((result) => (result.humanResult ?? result.status) === 'fail').length,
      skip: values.filter((result) => (result.humanResult ?? result.status) === 'skip').length,
      waiting: values.filter((result) => result.status === 'waiting_confirm').length,
    }
  })

  function setCases(new_cases: TestCase[]): void {
    cases.value = new_cases
    results.value = new Map()
    screenshots.value = new Map()
    selectedCaseId.value = new_cases[0]?.id || null
  }

  function clearResults(): void {
    results.value = new Map()
    screenshots.value = new Map()
  }

  function resetAll(): void {
    cases.value = []
    clearResults()
    selectedCaseId.value = null
  }

  function selectCase(case_id: string | null): void {
    selectedCaseId.value = case_id
  }

  function ensureCaseResult(case_id: string): CaseResult {
    const existing = results.value.get(case_id)
    if (existing) {
      return existing
    }

    const created: CaseResult = {
      caseId: case_id,
      status: 'pending',
      steps: [],
      startedAt: Date.now(),
    }
    results.value.set(case_id, created)
    return created
  }

  function updateCaseStatus(case_id: string, status: CaseStatus, auto_status?: 'pass' | 'fail'): void {
    const case_result = ensureCaseResult(case_id)
    case_result.status = status
    case_result.autoStatus = auto_status
    if (status === 'running' && !case_result.startedAt) {
      case_result.startedAt = Date.now()
    }
    if (status === 'pass' || status === 'fail' || status === 'skip') {
      case_result.finishedAt = Date.now()
    }
  }

  function updateStepResult(case_id: string, step_result: StepResult): void {
    const case_result = ensureCaseResult(case_id)
    const existing_index = case_result.steps.findIndex((item) => item.stepId === step_result.stepId)
    if (existing_index >= 0) {
      case_result.steps[existing_index] = step_result
    } else {
      case_result.steps.push(step_result)
    }

    case_result.status = step_result.status === 'fail' ? 'fail' : 'running'

    if (step_result.screenshot) {
      screenshots.value.set(`${case_id}-${step_result.stepId}`, step_result.screenshot)
    }
  }

  function confirmCase(case_id: string, result: 'pass' | 'fail' | 'skip', note?: string): void {
    const case_result = ensureCaseResult(case_id)
    case_result.status = result
    case_result.humanResult = result
    case_result.humanNote = note
    case_result.finishedAt = Date.now()
  }

  function getCaseStatus(case_id: string): CaseStatus {
    return results.value.get(case_id)?.status || 'pending'
  }

  function getStepScreenshot(case_id: string, step_id: number): string | null {
    return screenshots.value.get(`${case_id}-${step_id}`) || null
  }

  return {
    cases,
    results,
    selectedCaseId,
    selectedCase,
    selectedCaseResult,
    overallStats,
    setCases,
    clearResults,
    resetAll,
    selectCase,
    updateCaseStatus,
    updateStepResult,
    confirmCase,
    getCaseStatus,
    getStepScreenshot,
  }
})
