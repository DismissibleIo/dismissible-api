import { expect, type Page } from '@playwright/test';

export class StoragePage {
  constructor(private readonly page: Page) {}

  async selectStorageType(label: string) {
    const select = this.page.getByTestId('storage-type-select');
    await select.click();
    await this.page.getByRole('option', { name: label }).click();
  }

  // PostgreSQL fields
  async fillPostgresConnection(connectionString: string) {
    const input = this.page.getByTestId('postgres-connection-input');
    await input.fill(connectionString);
  }

  async expectPostgresConnectionVisible() {
    await expect(this.page.getByTestId('postgres-connection-input')).toBeVisible();
  }

  async expectPostgresConnectionNotVisible() {
    await expect(this.page.getByTestId('postgres-connection-input')).not.toBeVisible();
  }

  // DynamoDB fields
  async fillDynamoDbTable(tableName: string) {
    const input = this.page.getByTestId('dynamodb-table-input');
    await input.fill(tableName);
  }

  async fillDynamoDbRegion(region: string) {
    const input = this.page.getByTestId('dynamodb-region-input');
    await input.fill(region);
  }

  async fillDynamoDbAccessKey(accessKey: string) {
    const input = this.page.getByTestId('dynamodb-access-key-input');
    await input.fill(accessKey);
  }

  async fillDynamoDbSecretKey(secretKey: string) {
    const input = this.page.getByTestId('dynamodb-secret-key-input');
    await input.fill(secretKey);
  }

  async fillDynamoDbSessionToken(sessionToken: string) {
    const input = this.page.getByTestId('dynamodb-session-token-input');
    await input.fill(sessionToken);
  }

  async fillDynamoDbEndpoint(endpoint: string) {
    const input = this.page.getByTestId('dynamodb-endpoint-input');
    await input.fill(endpoint);
  }

  async expectDynamoDbTableVisible() {
    await expect(this.page.getByTestId('dynamodb-table-input')).toBeVisible();
  }

  async expectDynamoDbTableNotVisible() {
    await expect(this.page.getByTestId('dynamodb-table-input')).not.toBeVisible();
  }

  // Memory storage fields
  async fillMemoryMaxItems(maxItems: number) {
    const input = this.page.getByTestId('memory-max-items-input');
    await input.fill(maxItems.toString());
  }

  async fillMemoryTtl(ttl: number) {
    const input = this.page.getByTestId('memory-ttl-input');
    await input.fill(ttl.toString());
  }

  async expectMemoryMaxItemsVisible() {
    await expect(this.page.getByTestId('memory-max-items-input')).toBeVisible();
  }

  async expectMemoryMaxItemsNotVisible() {
    await expect(this.page.getByTestId('memory-max-items-input')).not.toBeVisible();
  }

  // Run setup toggle
  async toggleRunSetup() {
    const toggle = this.page.getByTestId('storage-run-setup-toggle');
    await toggle.click();
  }

  async expectRunSetup(enabled: boolean) {
    const toggle = this.page.getByTestId('storage-run-setup-toggle');
    if (enabled) {
      await expect(toggle).toBeChecked();
    } else {
      await expect(toggle).not.toBeChecked();
    }
  }
}
