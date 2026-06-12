import { test } from '@playwright/test';
import { buildWizardUrl } from '../state-utils';
import { ReviewPage } from '../page-models/review.page';
import { StoragePage } from '../page-models/storage.page';
import { WizardNavigationPage } from '../page-models/wizard-nav.page';

test.describe('Wizard storage step', () => {
  test('switching to PostgreSQL is reflected on the review screen', async ({ page }) => {
    await page.goto(buildWizardUrl());
    const reviewPage = new ReviewPage(page);
    await reviewPage.expectHeading();

    await reviewPage.clickEdit('storage');
    const storagePage = new StoragePage(page);
    await storagePage.selectStorageType('PostgreSQL');
    await storagePage.fillPostgresConnection('postgresql://ci-user:password@db:5432/dismissible');

    const navigation = new WizardNavigationPage(page);
    await navigation.goToReview();

    await reviewPage.expectEnvContains('DISMISSIBLE_STORAGE_TYPE=postgres');
    await reviewPage.expectEnvContains(
      'DISMISSIBLE_STORAGE_POSTGRES_CONNECTION_STRING="postgresql://ci-user:password@db:5432/dismissible"',
    );
  });
});
