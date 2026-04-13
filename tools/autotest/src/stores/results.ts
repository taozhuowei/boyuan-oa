/**
 * Results Store - Manages test case results and step data
 */
import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import type { TestCase, CaseResult, CaseStatus, StepResult, StepStatus } from '../../runner/types'

export { type CaseStatus, type StepStatus }

export interface CaseWithStatus extends TestCase {
  status: CaseStatus
}

export const useResultsStore = defineStore('results', () => {
  // State
  const cases = ref<TestCase[]>([])
  const results = ref<Map<string, CaseResult>>(new Map())
  const selectedCaseId = ref<string | null>(null)
  const screenshots = ref<Map<string, string>>(new Map())

  // Getters
  const modules = computed(() => {
    const moduleMap = new Map<string, CaseWithStatus[]>()
    for (const testCase of cases.value) {
      const caseResult = results.value.get(testCase.id)
      const status = caseResult?.status ?? 'pending'
      const caseWithStatus: CaseWithStatus = { ...testCase, status }
      
      if (!moduleMap.has(testCase.module)) {
        moduleMap.set(testCase.module, [])
      }
      moduleMap.get(testCase.module)!.push(caseWithStatus)
    }
    return moduleMap
  })

  const moduleStats = computed(() => {
    const stats = new Map<string, { total: number; pass: number; fail: number; skip: number }>()
    for (const [moduleName, moduleCases] of modules.value) {
      const total = moduleCases.length
      const pass = moduleCases.filter((c) => c.status === 'pass').length
      const fail = moduleCases.filter((c) => c.status === 'fail').length
      const skip = moduleCases.filter((c) => c.status === 'skip').length
      stats.set(moduleName, { total, pass, fail, skip })
    }
    return stats
  })

  const overallStats = computed(() => {
    const total = cases.value.length
    const pass = Array.from(results.value.values()).filter((r) => r.status === 'pass').length
    const fail = Array.from(results.value.values()).filter((r) => r.status === 'fail').length
    const skip = Array.from(results.value.values()).filter((r) => r.status === 'skip').length
    const waiting = Array.from(results.value.values()).filter((r) => r.status === 'waiting_confirm').length
    return { total, pass, fail, skip, waiting }
  })

  const selectedCase = computed(() => {
    if (!selectedCaseId.value) return null
    return cases.value.find((c) => c.id === selectedCaseId.value) ?? null
  })

  const selectedCaseResult = computed(() => {
    if (!selectedCaseId.value) return null
    return results.value.get(selectedCaseId.value) ?? null
  })

  // Actions
  function setCases(newCases: TestCase[]) {
    cases.value = newCases
  }

  function selectCase(caseId: string | null) {
    selectedCaseId.value = caseId
  }

  function updateCaseStatus(caseId: string, status: CaseStatus) {
    const existing = results.value.get(caseId)
    if (existing) {
      existing.status = status
    } else {
      results.value.set(caseId, {
        caseId,
        status,
        steps: [],
        startedAt: Date.now(),
      })
    }
  }

  function updateStepResult(caseId: string, stepResult: StepResult) {
    const caseResult = results.value.get(caseId)
    if (caseResult) {
      const existingIndex = caseResult.steps.findIndex((s) => s.stepId === stepResult.stepId)
      if (existingIndex >= 0) {
        caseResult.steps[existingIndex] = stepResult
      } else {
        caseResult.steps.push(stepResult)
      }
      // Store screenshot if available
      if (stepResult.screenshot) {
        screenshots.value.set(`${caseId}-${stepResult.stepId}`, stepResult.screenshot)
      }
    } else {
      results.value.set(caseId, {
        caseId,
        status: 'running',
        steps: [stepResult],
        startedAt: Date.now(),
      })
      if (stepResult.screenshot) {
        screenshots.value.set(`${caseId}-${stepResult.stepId}`, stepResult.screenshot)
      }
    }
  }

  function setCaseWaitingConfirm(caseId: string) {
    updateCaseStatus(caseId, 'waiting_confirm')
  }

  function confirmCase(caseId: string, result: 'pass' | 'fail' | 'skip', note?: string) {
    const caseResult = results.value.get(caseId)
    if (caseResult) {
      caseResult.status = result
      caseResult.humanResult = result
      caseResult.humanNote = note
      caseResult.finishedAt = Date.now()
    }
  }

  function getStepScreenshot(caseId: string, stepId: number): string | null {
    return screenshots.value.get(`${caseId}-${stepId}`) ?? null
  }

  function clearResults() {
    results.value.clear()
    screenshots.value.clear()
    selectedCaseId.value = null
  }

  function getCaseStatus(caseId: string): CaseStatus {
    return results.value.get(caseId)?.status ?? 'pending'
  }

  return {
    cases,
    results,
    selectedCaseId,
    modules,
    moduleStats,
    overallStats,
    selectedCase,
    selectedCaseResult,
    setCases,
    selectCase,
    updateCaseStatus,
    updateStepResult,
    setCaseWaitingConfirm,
    confirmCase,
    getStepScreenshot,
    clearResults,
    getCaseStatus,
  }
})
