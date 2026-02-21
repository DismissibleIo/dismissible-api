import { expect, type Page } from '@playwright/test';

export class CachePage {
  constructor(private readonly page: Page) {}

  async selectCacheType(label: string) {
    const select = this.page.getByTestId('cache-type-select');
    await select.click();
    await this.page.getByRole('option', { name: label }).click();
  }

  // Redis fields
  async fillRedisUrl(url: string) {
    const input = this.page.getByTestId('redis-url-input');
    await input.fill(url);
  }

  async fillRedisPrefix(prefix: string) {
    const input = this.page.getByTestId('redis-prefix-input');
    await input.fill(prefix);
  }

  async fillRedisTtl(ttl: number) {
    const input = this.page.getByTestId('redis-ttl-input');
    await input.fill(ttl.toString());
  }

  async toggleRedisEnableReady() {
    const toggle = this.page.getByTestId('redis-enable-ready-toggle');
    await toggle.click();
  }

  async expectRedisEnableReady(enabled: boolean) {
    const toggle = this.page.getByTestId('redis-enable-ready-toggle');
    if (enabled) {
      await expect(toggle).toBeChecked();
    } else {
      await expect(toggle).not.toBeChecked();
    }
  }

  async fillRedisMaxRetries(maxRetries: number) {
    const input = this.page.getByTestId('redis-max-retries-input');
    await input.fill(maxRetries.toString());
  }

  async fillRedisConnectionTimeout(timeout: number) {
    const input = this.page.getByTestId('redis-connection-timeout-input');
    await input.fill(timeout.toString());
  }

  async expectRedisUrlVisible() {
    await expect(this.page.getByTestId('redis-url-input')).toBeVisible();
  }

  async expectRedisUrlNotVisible() {
    await expect(this.page.getByTestId('redis-url-input')).not.toBeVisible();
  }

  // Memory cache fields
  async fillMemoryCacheMaxItems(maxItems: number) {
    const input = this.page.getByTestId('memory-cache-max-items-input');
    await input.fill(maxItems.toString());
  }

  async fillMemoryCacheTtl(ttl: number) {
    const input = this.page.getByTestId('memory-cache-ttl-input');
    await input.fill(ttl.toString());
  }

  async expectMemoryCacheMaxItemsVisible() {
    await expect(this.page.getByTestId('memory-cache-max-items-input')).toBeVisible();
  }

  async expectMemoryCacheMaxItemsNotVisible() {
    await expect(this.page.getByTestId('memory-cache-max-items-input')).not.toBeVisible();
  }
}
