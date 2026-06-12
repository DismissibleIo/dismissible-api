import { test } from '@playwright/test';
import { buildWizardUrl } from '../state-utils';
import { CachePage } from '../page-models/cache.page';
import { ReviewPage } from '../page-models/review.page';
import { WizardNavigationPage } from '../page-models/wizard-nav.page';

test.describe('Wizard cache step', () => {
  test('enabling Redis cache updates the review output', async ({ page }) => {
    await page.goto(buildWizardUrl());
    const reviewPage = new ReviewPage(page);
    await reviewPage.expectHeading();

    await reviewPage.clickEdit('cache');
    const cachePage = new CachePage(page);
    await cachePage.selectCacheType('Redis Cache');
    await cachePage.fillRedisUrl('redis://localhost:6379');

    const navigation = new WizardNavigationPage(page);
    await navigation.goToReview();

    await reviewPage.expectEnvContains('DISMISSIBLE_CACHE_TYPE=redis');
    await reviewPage.expectEnvContains('DISMISSIBLE_CACHE_REDIS_URL=redis://localhost:6379');
  });
});
