import { expect, type Page } from '@playwright/test';

export class CorsPage {
  constructor(private readonly page: Page) {}

  async toggleEnabled() {
    const toggle = this.page.getByTestId('cors-enabled-toggle');
    await toggle.click();
  }

  async expectEnabled(enabled: boolean) {
    const toggle = this.page.getByTestId('cors-enabled-toggle');
    if (enabled) {
      await expect(toggle).toBeChecked();
    } else {
      await expect(toggle).not.toBeChecked();
    }
  }

  async setOrigins(origins: string) {
    const input = this.page.getByTestId('cors-origins-input');
    await input.fill(origins);
  }

  async setMethods(methods: string) {
    const input = this.page.getByTestId('cors-methods-input');
    await input.fill(methods);
  }

  async setAllowedHeaders(headers: string) {
    const input = this.page.getByTestId('cors-allowed-headers-input');
    await input.fill(headers);
  }

  async toggleCredentials() {
    const toggle = this.page.getByTestId('cors-credentials-toggle');
    await toggle.click();
  }

  async expectCredentials(enabled: boolean) {
    const toggle = this.page.getByTestId('cors-credentials-toggle');
    if (enabled) {
      await expect(toggle).toBeChecked();
    } else {
      await expect(toggle).not.toBeChecked();
    }
  }

  async setMaxAge(maxAge: number) {
    const input = this.page.getByTestId('cors-max-age-input');
    await input.fill(maxAge.toString());
  }

  async expectOriginsVisible() {
    await expect(this.page.getByTestId('cors-origins-input')).toBeVisible();
  }

  async expectOriginsNotVisible() {
    await expect(this.page.getByTestId('cors-origins-input')).not.toBeVisible();
  }
}
