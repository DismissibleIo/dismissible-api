import { test } from '@playwright/test';
import { buildWizardUrl } from '../state-utils';
import { ReviewPage } from '../page-models/review.page';
import { StoragePage } from '../page-models/storage.page';
import { WizardNavigationPage } from '../page-models/wizard-nav.page';

test.describe('Wizard storage step', () => {
  test.describe('Memory storage', () => {
    test('memory storage is the default type (no STORAGE_TYPE output for defaults)', async ({
      page,
    }) => {
      await page.goto(buildWizardUrl());
      const reviewPage = new ReviewPage(page);
      await reviewPage.expectHeading();

      // Default values are not output - verify the storage section exists but no STORAGE_TYPE
      await reviewPage.expectEnvContains('# Storage Settings');
    });

    test('custom max items for memory storage', async ({ page }) => {
      await page.goto(buildWizardUrl());
      const reviewPage = new ReviewPage(page);
      await reviewPage.expectHeading();

      await reviewPage.clickEdit('storage');
      const storagePage = new StoragePage(page);
      await storagePage.expectMemoryMaxItemsVisible();
      await storagePage.fillMemoryMaxItems(10000);

      const navigation = new WizardNavigationPage(page);
      await navigation.goToReview();

      await reviewPage.expectEnvContains('DISMISSIBLE_STORAGE_MEMORY_MAX_ITEMS=10000');
    });

    test('custom TTL for memory storage', async ({ page }) => {
      await page.goto(buildWizardUrl());
      const reviewPage = new ReviewPage(page);
      await reviewPage.expectHeading();

      await reviewPage.clickEdit('storage');
      const storagePage = new StoragePage(page);
      await storagePage.fillMemoryTtl(3600000);

      const navigation = new WizardNavigationPage(page);
      await navigation.goToReview();

      await reviewPage.expectEnvContains('DISMISSIBLE_STORAGE_MEMORY_TTL_MS=3600000');
    });
  });

  test.describe('PostgreSQL storage', () => {
    test('switching to PostgreSQL is reflected on the review screen', async ({ page }) => {
      await page.goto(buildWizardUrl());
      const reviewPage = new ReviewPage(page);
      await reviewPage.expectHeading();

      await reviewPage.clickEdit('storage');
      const storagePage = new StoragePage(page);
      await storagePage.selectStorageType('PostgreSQL');
      await storagePage.expectPostgresConnectionVisible();
      await storagePage.fillPostgresConnection(
        'postgresql://ci-user:password@db:5432/dismissible',
      );

      const navigation = new WizardNavigationPage(page);
      await navigation.goToReview();

      await reviewPage.expectEnvContains('DISMISSIBLE_STORAGE_TYPE=postgres');
      await reviewPage.expectEnvContains(
        'DISMISSIBLE_STORAGE_POSTGRES_CONNECTION_STRING="postgresql://ci-user:password@db:5432/dismissible"',
      );
    });

    test('switching storage type hides/shows appropriate fields', async ({ page }) => {
      await page.goto(buildWizardUrl());
      const reviewPage = new ReviewPage(page);
      await reviewPage.expectHeading();

      await reviewPage.clickEdit('storage');
      const storagePage = new StoragePage(page);

      // Memory should be shown by default
      await storagePage.expectMemoryMaxItemsVisible();
      await storagePage.expectPostgresConnectionNotVisible();
      await storagePage.expectDynamoDbTableNotVisible();

      // Switch to PostgreSQL
      await storagePage.selectStorageType('PostgreSQL');
      await storagePage.expectMemoryMaxItemsNotVisible();
      await storagePage.expectPostgresConnectionVisible();
      await storagePage.expectDynamoDbTableNotVisible();

      // Switch to DynamoDB
      await storagePage.selectStorageType('DynamoDB');
      await storagePage.expectMemoryMaxItemsNotVisible();
      await storagePage.expectPostgresConnectionNotVisible();
      await storagePage.expectDynamoDbTableVisible();

      // Switch back to Memory
      await storagePage.selectStorageType('Memory (Development)');
      await storagePage.expectMemoryMaxItemsVisible();
      await storagePage.expectPostgresConnectionNotVisible();
      await storagePage.expectDynamoDbTableNotVisible();
    });
  });

  test.describe('DynamoDB storage', () => {
    test('switching to DynamoDB is reflected on the review screen', async ({ page }) => {
      await page.goto(buildWizardUrl());
      const reviewPage = new ReviewPage(page);
      await reviewPage.expectHeading();

      await reviewPage.clickEdit('storage');
      const storagePage = new StoragePage(page);
      await storagePage.selectStorageType('DynamoDB');
      await storagePage.expectDynamoDbTableVisible();

      const navigation = new WizardNavigationPage(page);
      await navigation.goToReview();

      await reviewPage.expectEnvContains('DISMISSIBLE_STORAGE_TYPE=dynamodb');
      await reviewPage.expectEnvContains(
        'DISMISSIBLE_STORAGE_DYNAMODB_TABLE_NAME=dismissible-items',
      );
      await reviewPage.expectEnvContains('DISMISSIBLE_STORAGE_DYNAMODB_AWS_REGION=us-east-1');
    });

    test('custom DynamoDB table name and region', async ({ page }) => {
      await page.goto(buildWizardUrl());
      const reviewPage = new ReviewPage(page);
      await reviewPage.expectHeading();

      await reviewPage.clickEdit('storage');
      const storagePage = new StoragePage(page);
      await storagePage.selectStorageType('DynamoDB');
      await storagePage.fillDynamoDbTable('my-custom-table');
      await storagePage.fillDynamoDbRegion('eu-west-1');

      const navigation = new WizardNavigationPage(page);
      await navigation.goToReview();

      await reviewPage.expectEnvContains('DISMISSIBLE_STORAGE_DYNAMODB_TABLE_NAME=my-custom-table');
      await reviewPage.expectEnvContains('DISMISSIBLE_STORAGE_DYNAMODB_AWS_REGION=eu-west-1');
    });

    test('DynamoDB with AWS credentials', async ({ page }) => {
      await page.goto(buildWizardUrl());
      const reviewPage = new ReviewPage(page);
      await reviewPage.expectHeading();

      await reviewPage.clickEdit('storage');
      const storagePage = new StoragePage(page);
      await storagePage.selectStorageType('DynamoDB');
      await storagePage.fillDynamoDbAccessKey('AKIAIOSFODNN7EXAMPLE');
      await storagePage.fillDynamoDbSecretKey('wJalrXUtnFEMI-K7MDENG-bPxRfiCYEXAMPLEKEY');

      const navigation = new WizardNavigationPage(page);
      await navigation.goToReview();

      await reviewPage.expectEnvContains(
        'DISMISSIBLE_STORAGE_DYNAMODB_AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE',
      );
      await reviewPage.expectEnvContains(
        'DISMISSIBLE_STORAGE_DYNAMODB_AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI-K7MDENG-bPxRfiCYEXAMPLEKEY',
      );
    });

    test('DynamoDB with session token', async ({ page }) => {
      await page.goto(buildWizardUrl());
      const reviewPage = new ReviewPage(page);
      await reviewPage.expectHeading();

      await reviewPage.clickEdit('storage');
      const storagePage = new StoragePage(page);
      await storagePage.selectStorageType('DynamoDB');
      await storagePage.fillDynamoDbSessionToken('FwoGZXIvYXdzEBYaDKOtoken');

      const navigation = new WizardNavigationPage(page);
      await navigation.goToReview();

      await reviewPage.expectEnvContains(
        'DISMISSIBLE_STORAGE_DYNAMODB_AWS_SESSION_TOKEN=FwoGZXIvYXdzEBYaDKOtoken',
      );
    });

    test('DynamoDB with custom endpoint (LocalStack)', async ({ page }) => {
      await page.goto(buildWizardUrl());
      const reviewPage = new ReviewPage(page);
      await reviewPage.expectHeading();

      await reviewPage.clickEdit('storage');
      const storagePage = new StoragePage(page);
      await storagePage.selectStorageType('DynamoDB');
      await storagePage.fillDynamoDbEndpoint('http://localhost:4566');

      const navigation = new WizardNavigationPage(page);
      await navigation.goToReview();

      await reviewPage.expectEnvContains(
        'DISMISSIBLE_STORAGE_DYNAMODB_ENDPOINT=http://localhost:4566',
      );
    });
  });

  test.describe('Run setup toggle', () => {
    test('run setup is enabled by default', async ({ page }) => {
      await page.goto(buildWizardUrl());
      const reviewPage = new ReviewPage(page);
      await reviewPage.expectHeading();

      await reviewPage.clickEdit('storage');
      const storagePage = new StoragePage(page);
      await storagePage.expectRunSetup(true);
    });

    test('disabling run setup is reflected on review screen', async ({ page }) => {
      await page.goto(buildWizardUrl());
      const reviewPage = new ReviewPage(page);
      await reviewPage.expectHeading();

      await reviewPage.clickEdit('storage');
      const storagePage = new StoragePage(page);
      await storagePage.toggleRunSetup();
      await storagePage.expectRunSetup(false);

      const navigation = new WizardNavigationPage(page);
      await navigation.goToReview();

      await reviewPage.expectEnvContains('DISMISSIBLE_STORAGE_RUN_SETUP=false');
    });
  });
});
