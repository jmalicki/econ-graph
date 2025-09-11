import { test, expect } from '@playwright/test';

test.describe('Test Sidebar Fix', () => {
  test('check if sidebar is now visible', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Take a screenshot to see what's actually visible
    await page.screenshot({ path: 'sidebar-debug.png', fullPage: true });

    // Check if sidebar is visible
    const sidebar = page.locator('[role="navigation"][aria-label="Main navigation"]');
    console.log('Sidebar visible:', await sidebar.isVisible());

    // Check if drawer paper is visible
    const drawerPaper = page.locator('.MuiDrawer-paper');
    console.log('Drawer paper visible:', await drawerPaper.isVisible());

    // Check for About button
    const aboutButton = page.getByRole('button', { name: /about/i });
    console.log('About button visible:', await aboutButton.isVisible());

    // Check for ListItemButton elements specifically
    const listItemButtons = await page.locator('.MuiListItemButton-root').all();
    console.log('ListItemButton count:', listItemButtons.length);
    for (let i = 0; i < listItemButtons.length; i++) {
      const button = listItemButtons[i];
      const text = await button.textContent();
      const isVisible = await button.isVisible();
      console.log(`  ListItemButton ${i}: "${text}" (visible: ${isVisible})`);
    }

    // Try different selectors for About
    const aboutSelectors = [
      page.getByRole('button', { name: /about/i }),
      page.getByText('About').first(),
      page.locator('[role="navigation"] >> text=About').first(),
      page.locator('.MuiListItemButton-root:has-text("About")'),
    ];

    let clicked = false;
    for (let i = 0; i < aboutSelectors.length; i++) {
      const selector = aboutSelectors[i];
      const isVisible = await selector.isVisible();
      const isClickable = await selector.isEnabled().catch(() => false);
      console.log(`Selector ${i}: visible=${isVisible}, clickable=${isClickable}`);

      if (isVisible || isClickable) {
        try {
          await selector.click({ timeout: 1000 });
          await page.waitForTimeout(500);
          if (page.url().includes('/about')) {
            console.log(`Successfully navigated to About page using selector ${i}!`);
            clicked = true;
            break;
          }
        } catch (e) {
          console.log(`Selector ${i} click failed:`, e.message);
        }
      }
    }

    if (!clicked) {
      console.log('All About selectors failed');
    }
  });
});
