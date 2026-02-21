import type { Page } from '@playwright/test';

export class CorePage {
  constructor(private readonly page: Page) {}

  async setPort(port: number) {
    const input = this.page.getByTestId('core-port-input');
    await input.fill(port.toString());
  }
}
