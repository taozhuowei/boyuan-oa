/**
 * Preview - Launch an empty Chromium browser for side-by-side display
 *
 * Starts a headful Chromium window at (0, 50) with 960x960 size,
 * navigates to about:blank, and keeps the process alive until killed.
 * Used by Tauri to show the browser preview on app startup.
 */

import { chromium } from 'playwright';

async function main(): Promise<void> {
  const browser = await chromium.launch({
    headless: false,
    args: [
      '--window-position=0,50',
      '--window-size=960,960',
      '--disable-infobars',
      '--no-default-browser-check',
    ],
  });

  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto('about:blank');

  console.log('[Preview] Chromium browser launched at (0, 50)');

  // Keep alive until process is killed
  await new Promise<void>(() => {});
}

void main().catch((err) => {
  console.error('[Preview] Failed to launch browser:', err);
  process.exit(1);
});
