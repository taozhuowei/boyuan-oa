/**
 * Autotest Type Definitions
 *
 * Shared TypeScript types for the autotest tool runner engine, IPC, and Vue frontend.
 */

// =============================================================================
// Locator Types
// =============================================================================

/**
 * Discriminated union for element locator definitions.
 * Used to identify UI elements during test execution.
 */
export type LocatorDef =
  | { by: 'role'; role: string; name: string; exact?: boolean }
  | { by: 'label'; value: string; exact?: boolean }
  | { by: 'text'; value: string; exact?: boolean }
  | { by: 'placeholder'; value: string }
  | { by: 'testid'; value: string }
  | { by: 'css'; value: string };

// =============================================================================
// Assertion Types
// =============================================================================

/**
 * Discriminated union for assertion checks.
 * Defines various ways to verify application state.
 */
export type AssertCheck =
  | { type: 'url_contains' | 'url_equals'; value: string }
  | { type: 'text_visible' | 'text_absent'; value: string }
  | { type: 'element_visible' | 'element_hidden'; locator: LocatorDef }
  | { type: 'toast_contains'; value: string }
  | { type: 'http_status'; value: number }
  | { type: 'title_contains'; value: string };

// =============================================================================
// Test Step Types
// =============================================================================

/**
 * Discriminated union for test step definitions.
 * Each step represents a single action or assertion in a test case.
 */
export type TestStep =
  | { id: number; desc: string; action: 'navigate'; to: string }
  | { id: number; desc: string; action: 'click'; locator: LocatorDef }
  | { id: number; desc: string; action: 'fill'; locator: LocatorDef; value: string }
  | { id: number; desc: string; action: 'select'; locator: LocatorDef; value: string }
  | { id: number; desc: string; action: 'check' | 'uncheck'; locator: LocatorDef }
  | { id: number; desc: string; action: 'wait'; ms: number }
  | { id: number; desc: string; action: 'wait_for'; locator: LocatorDef }
  | { id: number; desc: string; action: 'assert'; check: AssertCheck }
  | { id: number; desc: string; action: 'screenshot'; label?: string }
  | {
      id: number;
      desc: string;
      action: 'api_call';
      method: string;
      endpoint: string;
      body?: Record<string, unknown>;
    }
  | {
      id: number;
      desc: string;
      action: 'parallel';
      contexts: TestStep[][];
    }
  | {
      id: number;
      desc: string;
      action: 'rapid';
      repeat: number;
      interval: number;
      step: TestStep;
    };

// =============================================================================
// Test Case Types
// =============================================================================

/**
 * Interface representing a complete test case definition.
 */
export interface TestCase {
  /** Unique identifier for the test case (e.g., 'TC-AUTH-01') */
  id: string;

  /** Human-readable title describing the test */
  title: string;

  /** Module or feature area this test belongs to */
  module: string;

  /** Priority level: P0 (critical), P1 (high), P2 (normal) */
  priority: 'P0' | 'P1' | 'P2';

  /** Optional tags for categorization and filtering */
  tags?: string[];

  /** Optional credentials for authentication */
  credentials?: { username: string; password: string };

  /** Ordered list of steps to execute */
  steps: TestStep[];

  /** Expected outcome of the test */
  expect: { result: 'pass' | 'fail'; url?: string };
}

// =============================================================================
// Status Types
// =============================================================================

/**
 * Status of an individual test step during execution.
 */
export type StepStatus = 'pending' | 'running' | 'pass' | 'fail' | 'skip';

/**
 * Status of an entire test case during execution.
 * Includes 'waiting_confirm' for human verification steps.
 */
export type CaseStatus = 'pending' | 'running' | 'pass' | 'fail' | 'skip' | 'waiting_confirm';

// =============================================================================
// Result Types
// =============================================================================

/**
 * Result of a single test step execution.
 */
export interface StepResult {
  /** Step identifier */
  stepId: number;

  /** Execution status */
  status: StepStatus;

  /** Error message if step failed */
  error?: string;

  /** Screenshot path if captured */
  screenshot?: string;

  /** Execution duration in milliseconds */
  durationMs: number;
}

/**
 * Result of an entire test case execution.
 */
export interface CaseResult {
  /** Test case identifier */
  caseId: string;

  /** Overall execution status */
  status: CaseStatus;

  /** Results for each step */
  steps: StepResult[];

  /** Human-verified result when confirmation is required */
  humanResult?: 'pass' | 'fail' | 'skip';

  /** Optional note from human reviewer */
  humanNote?: string;

  /** Unix timestamp when execution started */
  startedAt: number;

  /** Unix timestamp when execution finished (undefined if still running) */
  finishedAt?: number;
}

// =============================================================================
// IPC Event Types
// =============================================================================

/**
 * Events emitted by the test runner to the frontend.
 * Sent via WebSocket for real-time test execution updates.
 */
export type RunnerEvent =
  | { type: 'step-start'; caseId: string; stepId: number; desc: string }
  | {
      type: 'step-done';
      caseId: string;
      stepId: number;
      status: StepStatus;
      error?: string;
      screenshot?: string;
      durationMs: number;
    }
  | { type: 'case-done'; caseId: string; autoStatus: 'pass' | 'fail'; needConfirm: boolean }
  | {
      type: 'all-done';
      summary: { total: number; pass: number; fail: number; skip: number };
    }
  | { type: 'cases-loaded'; cases: Array<{ id: string; title: string; module: string; priority: 'P0' | 'P1' | 'P2'; tags?: string[]; steps: Array<{ id: number; desc: string; action: string }> }> }
  | { type: 'log'; level: 'info' | 'warn' | 'error'; message: string };

/**
 * Control messages sent from frontend to the test runner.
 * Used to control test execution flow.
 */
export type ControlMessage =
  | { type: 'resume' }
  | { type: 'next-step' }
  | { type: 'confirm'; caseId: string; result: 'pass' | 'fail' | 'skip'; note?: string }
  | { type: 'stop' }
  | { type: 'set-mode'; mode: 'case-confirm' | 'full-auto' };

// =============================================================================
// Configuration Types
// =============================================================================

/**
 * Configuration interface for the autotest tool.
 */
export interface AutotestConfig {
  /** Project name */
  name: string;

  /** Base URL for the application under test */
  base_url: string;

  /** Directory containing test case files */
  cases_dir: string;

  /** Maximum concurrent test executions (default: 1) */
  concurrency?: number;

  /** Timeout for each step in milliseconds (default: 30000) */
  step_timeout?: number;

  /** Whether to capture screenshot on each step (default: true) */
  screenshot_on_step?: boolean;
}
