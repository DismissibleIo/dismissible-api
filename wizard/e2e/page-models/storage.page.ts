import type { Page } from '@playwright/test';

export class StoragePage {
  constructor(private readonly page: Page) {}

  async selectStorageType(label: string) {
    const select = this.page.getByTestId('storage-type-select');
    await select.click();
    await this.page.getByRole('option', { name: label }).click();
  }

  async fillPostgresConnection(connectionString: string) {
    const input = this.page.getByTestId('postgres-connection-input');
    await input.fill(connectionString);
  }
}
