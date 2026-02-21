import { expect, type Page } from '@playwright/test';

export class SwaggerPage {
  constructor(private readonly page: Page) {}

  async toggleEnabled() {
    const toggle = this.page.getByTestId('swagger-enabled-toggle');
    await toggle.click();
  }

  async expectEnabled(enabled: boolean) {
    const toggle = this.page.getByTestId('swagger-enabled-toggle');
    if (enabled) {
      await expect(toggle).toBeChecked();
    } else {
      await expect(toggle).not.toBeChecked();
    }
  }

  async setPath(path: string) {
    const input = this.page.getByTestId('swagger-path-input');
    await input.fill(path);
  }

  async expectPathVisible() {
    await expect(this.page.getByTestId('swagger-path-input')).toBeVisible();
  }

  async expectPathNotVisible() {
    await expect(this.page.getByTestId('swagger-path-input')).not.toBeVisible();
  }
}
