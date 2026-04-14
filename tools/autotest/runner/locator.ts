import type { Page, Locator } from 'playwright';
import type { LocatorDef } from './types.js';

/**
 * Resolves a LocatorDef to a Playwright Locator.
 *
 * This function maps high-level locator definitions to Playwright's built-in
 * locator methods. Each strategy is designed for specific use cases to improve
 * test maintainability and resilience to DOM changes.
 *
 * Locator Strategies:
 *
 * - 'role': Uses ARIA role and accessible name. This is the **preferred** strategy
 *   as it mirrors how users and assistive technologies perceive the page.
 *   Example: `{ by: 'role', role: 'button', name: 'Submit' }`
 *
 * - 'label': Finds form elements by their associated label text.
 *   Useful for form inputs where the label is the primary identifier.
 *   Example: `{ by: 'label', value: 'Email Address' }`
 *
 * - 'text': Finds elements by their visible text content.
 *   Use sparingly as text can change frequently; prefer 'role' when possible.
 *   Example: `{ by: 'text', value: 'Welcome back', exact: false }`
 *
 * - 'placeholder': Finds input elements by their placeholder attribute.
 *   Useful when labels are not present but placeholders are descriptive.
 *   Example: `{ by: 'placeholder', value: 'Enter your username' }`
 *
 * - 'testid': Finds elements by their data-testid attribute.
 *   Use when semantic locators are not viable or for testing-specific hooks.
 *   Example: `{ by: 'testid', value: 'user-profile-menu' }`
 *
 * - 'css': Uses raw CSS selectors. This is the most fragile strategy and
 *   should be used as a last resort when no other strategy is viable.
 *   Example: `{ by: 'css', value: '.header > nav:first-child' }`
 *
 * @param page - The Playwright Page instance
 * @param loc - The locator definition specifying the strategy and parameters
 * @returns A Playwright Locator instance
 * @throws Error if the locator strategy is unknown
 */
export function resolve(page: Page, loc: LocatorDef): Locator {
  switch (loc.by) {
    case 'role':
      return page.getByRole(loc.role as any, { name: loc.name, exact: loc.exact });

    case 'label':
      return page.getByLabel(loc.value, { exact: loc.exact });

    case 'text':
      return page.getByText(loc.value, { exact: loc.exact });

    case 'placeholder':
      return page.getByPlaceholder(loc.value);

    case 'testid':
      return page.getByTestId(loc.value);

    case 'catch':
      return page.locator(`[data-catch="${loc.value}"]`);

    case 'css':
      return page.locator(loc.value);

    default:
      throw new Error(`Unknown locator strategy: ${(loc as any).by}`);
  }
}
