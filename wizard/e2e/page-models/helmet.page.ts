import { expect, type Page } from '@playwright/test';

export class HelmetPage {
  constructor(private readonly page: Page) {}

  async toggleEnabled() {
    const toggle = this.page.getByTestId('helmet-enabled-toggle');
    await toggle.click();
  }

  async expectEnabled(enabled: boolean) {
    const toggle = this.page.getByTestId('helmet-enabled-toggle');
    if (enabled) {
      await expect(toggle).toBeChecked();
    } else {
      await expect(toggle).not.toBeChecked();
    }
  }

  async toggleCsp() {
    const toggle = this.page.getByTestId('helmet-csp-toggle');
    await toggle.click();
  }

  async expectCsp(enabled: boolean) {
    const toggle = this.page.getByTestId('helmet-csp-toggle');
    if (enabled) {
      await expect(toggle).toBeChecked();
    } else {
      await expect(toggle).not.toBeChecked();
    }
  }

  async toggleCoep() {
    const toggle = this.page.getByTestId('helmet-coep-toggle');
    await toggle.click();
  }

  async expectCoep(enabled: boolean) {
    const toggle = this.page.getByTestId('helmet-coep-toggle');
    if (enabled) {
      await expect(toggle).toBeChecked();
    } else {
      await expect(toggle).not.toBeChecked();
    }
  }

  async setHstsMaxAge(maxAge: number) {
    const input = this.page.getByTestId('helmet-hsts-max-age-input');
    await input.fill(maxAge.toString());
  }

  async toggleHstsIncludeSubdomains() {
    const toggle = this.page.getByTestId('helmet-hsts-include-subdomains-toggle');
    await toggle.click();
  }

  async expectHstsIncludeSubdomains(enabled: boolean) {
    const toggle = this.page.getByTestId('helmet-hsts-include-subdomains-toggle');
    if (enabled) {
      await expect(toggle).toBeChecked();
    } else {
      await expect(toggle).not.toBeChecked();
    }
  }

  async toggleHstsPreload() {
    const toggle = this.page.getByTestId('helmet-hsts-preload-toggle');
    await toggle.click();
  }

  async expectHstsPreload(enabled: boolean) {
    const toggle = this.page.getByTestId('helmet-hsts-preload-toggle');
    if (enabled) {
      await expect(toggle).toBeChecked();
    } else {
      await expect(toggle).not.toBeChecked();
    }
  }

  async expectCspVisible() {
    await expect(this.page.getByTestId('helmet-csp-toggle')).toBeVisible();
  }

  async expectCspNotVisible() {
    await expect(this.page.getByTestId('helmet-csp-toggle')).not.toBeVisible();
  }
}
