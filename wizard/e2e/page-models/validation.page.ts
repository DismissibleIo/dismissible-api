import { expect, type Page } from '@playwright/test';

export class ValidationPage {
  constructor(private readonly page: Page) {}

  async toggleDisableErrorMessages() {
    const toggle = this.page.getByTestId('validation-disable-error-messages-toggle');
    await toggle.click();
  }

  async expectDisableErrorMessages(enabled: boolean) {
    const toggle = this.page.getByTestId('validation-disable-error-messages-toggle');
    if (enabled) {
      await expect(toggle).toBeChecked();
    } else {
      await expect(toggle).not.toBeChecked();
    }
  }

  async toggleWhitelist() {
    const toggle = this.page.getByTestId('validation-whitelist-toggle');
    await toggle.click();
  }

  async expectWhitelist(enabled: boolean) {
    const toggle = this.page.getByTestId('validation-whitelist-toggle');
    if (enabled) {
      await expect(toggle).toBeChecked();
    } else {
      await expect(toggle).not.toBeChecked();
    }
  }

  async toggleForbidNonWhitelisted() {
    const toggle = this.page.getByTestId('validation-forbid-non-whitelisted-toggle');
    await toggle.click();
  }

  async expectForbidNonWhitelisted(enabled: boolean) {
    const toggle = this.page.getByTestId('validation-forbid-non-whitelisted-toggle');
    if (enabled) {
      await expect(toggle).toBeChecked();
    } else {
      await expect(toggle).not.toBeChecked();
    }
  }

  async toggleTransform() {
    const toggle = this.page.getByTestId('validation-transform-toggle');
    await toggle.click();
  }

  async expectTransform(enabled: boolean) {
    const toggle = this.page.getByTestId('validation-transform-toggle');
    if (enabled) {
      await expect(toggle).toBeChecked();
    } else {
      await expect(toggle).not.toBeChecked();
    }
  }
}
