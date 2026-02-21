import { expect, type Page } from '@playwright/test';

export type EditableStep =
  | 'core'
  | 'storage'
  | 'cache'
  | 'swagger'
  | 'jwt'
  | 'cors'
  | 'helmet'
  | 'validation'
  | 'rate-limiter';

export class ReviewPage {
  constructor(private readonly page: Page) {}

  async expectHeading() {
    await expect(this.page.getByTestId('review-heading')).toBeVisible();
  }

  async clickEdit(step: EditableStep) {
    const button = this.page.getByTestId(`review-edit-${step}`);
    await expect(button).toBeVisible();
    await button.click();
  }

  async expectEnvContains(value: string) {
    await expect(this.page.getByTestId('review-env-output')).toContainText(value, {
      timeout: 5000,
    });
  }

  async expectEnvNotContains(value: string) {
    await expect(this.page.getByTestId('review-env-output')).not.toContainText(value, {
      timeout: 5000,
    });
  }

  async expectDockerContains(value: string) {
    await expect(this.page.getByTestId('review-docker-output')).toContainText(value, {
      timeout: 5000,
    });
  }

  async expectDockerNotContains(value: string) {
    await expect(this.page.getByTestId('review-docker-output')).not.toContainText(value, {
      timeout: 5000,
    });
  }

  async getEnvText(): Promise<string> {
    return (await this.page.getByTestId('review-env-output').innerText()).trim();
  }

  async getDockerText(): Promise<string> {
    return (await this.page.getByTestId('review-docker-output').innerText()).trim();
  }
}
