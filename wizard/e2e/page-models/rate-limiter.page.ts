import { expect, type Page } from '@playwright/test';

export class RateLimiterPage {
  constructor(private readonly page: Page) {}

  async toggleEnabled() {
    const toggle = this.page.getByTestId('rate-limiter-enabled-toggle');
    await toggle.click();
  }

  async expectEnabled(enabled: boolean) {
    const toggle = this.page.getByTestId('rate-limiter-enabled-toggle');
    if (enabled) {
      await expect(toggle).toBeChecked();
    } else {
      await expect(toggle).not.toBeChecked();
    }
  }

  async setPoints(points: number) {
    const input = this.page.getByTestId('rate-limiter-points-input');
    await input.fill(points.toString());
  }

  async setDuration(duration: number) {
    const input = this.page.getByTestId('rate-limiter-duration-input');
    await input.fill(duration.toString());
  }

  async setBlockDuration(blockDuration: number) {
    const input = this.page.getByTestId('rate-limiter-block-duration-input');
    await input.fill(blockDuration.toString());
  }

  async setKeyType(keyType: string) {
    const input = this.page.getByTestId('rate-limiter-key-type-input');
    await input.fill(keyType);
  }

  async selectKeyMode(label: string) {
    const select = this.page.getByTestId('rate-limiter-key-mode-select');
    await select.click();
    await this.page.getByRole('option', { name: label }).click();
  }

  async setIgnoredKeys(ignoredKeys: string) {
    const input = this.page.getByTestId('rate-limiter-ignored-keys-input');
    await input.fill(ignoredKeys);
  }

  async setPriority(priority: number) {
    const input = this.page.getByTestId('rate-limiter-priority-input');
    await input.fill(priority.toString());
  }

  async expectPointsVisible() {
    await expect(this.page.getByTestId('rate-limiter-points-input')).toBeVisible();
  }

  async expectPointsNotVisible() {
    await expect(this.page.getByTestId('rate-limiter-points-input')).not.toBeVisible();
  }
}
