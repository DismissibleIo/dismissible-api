import type { Page } from '@playwright/test';

export class CachePage {
  constructor(private readonly page: Page) {}

  async selectCacheType(label: string) {
    const select = this.page.getByTestId('cache-type-select');
    await select.click();
    await this.page.getByRole('option', { name: label }).click();
  }

  async fillRedisUrl(url: string) {
    const input = this.page.getByTestId('redis-url-input');
    await input.fill(url);
  }
}
