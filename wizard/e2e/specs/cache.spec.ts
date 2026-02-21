import { test } from '@playwright/test';
import { buildWizardUrl } from '../state-utils';
import { CachePage } from '../page-models/cache.page';
import { ReviewPage } from '../page-models/review.page';
import { WizardNavigationPage } from '../page-models/wizard-nav.page';

test.describe('Wizard cache step', () => {
  test.describe('No cache', () => {
    test('no cache is the default (cache section not output)', async ({ page }) => {
      await page.goto(buildWizardUrl());
      const reviewPage = new ReviewPage(page);
      await reviewPage.expectHeading();

      // When cache is 'none', the cache section is not output at all
      await reviewPage.expectEnvNotContains('# Cache Settings');
    });
  });

  test.describe('Memory cache', () => {
    test('enabling Memory cache updates the review output', async ({ page }) => {
      await page.goto(buildWizardUrl());
      const reviewPage = new ReviewPage(page);
      await reviewPage.expectHeading();

      await reviewPage.clickEdit('cache');
      const cachePage = new CachePage(page);
      await cachePage.selectCacheType('Memory Cache');
      await cachePage.expectMemoryCacheMaxItemsVisible();

      const navigation = new WizardNavigationPage(page);
      await navigation.goToReview();

      await reviewPage.expectEnvContains('DISMISSIBLE_CACHE_TYPE=memory');
    });

    test('custom max items for memory cache', async ({ page }) => {
      await page.goto(buildWizardUrl());
      const reviewPage = new ReviewPage(page);
      await reviewPage.expectHeading();

      await reviewPage.clickEdit('cache');
      const cachePage = new CachePage(page);
      await cachePage.selectCacheType('Memory Cache');
      await cachePage.fillMemoryCacheMaxItems(10000);

      const navigation = new WizardNavigationPage(page);
      await navigation.goToReview();

      await reviewPage.expectEnvContains('DISMISSIBLE_CACHE_MEMORY_MAX_ITEMS=10000');
    });

    test('custom TTL for memory cache', async ({ page }) => {
      await page.goto(buildWizardUrl());
      const reviewPage = new ReviewPage(page);
      await reviewPage.expectHeading();

      await reviewPage.clickEdit('cache');
      const cachePage = new CachePage(page);
      await cachePage.selectCacheType('Memory Cache');
      await cachePage.fillMemoryCacheTtl(3600000);

      const navigation = new WizardNavigationPage(page);
      await navigation.goToReview();

      await reviewPage.expectEnvContains('DISMISSIBLE_CACHE_MEMORY_TTL_MS=3600000');
    });
  });

  test.describe('Redis cache', () => {
    test('enabling Redis cache updates the review output', async ({ page }) => {
      await page.goto(buildWizardUrl());
      const reviewPage = new ReviewPage(page);
      await reviewPage.expectHeading();

      await reviewPage.clickEdit('cache');
      const cachePage = new CachePage(page);
      await cachePage.selectCacheType('Redis Cache');
      await cachePage.expectRedisUrlVisible();
      await cachePage.fillRedisUrl('redis://localhost:6379');

      const navigation = new WizardNavigationPage(page);
      await navigation.goToReview();

      await reviewPage.expectEnvContains('DISMISSIBLE_CACHE_TYPE=redis');
      await reviewPage.expectEnvContains('DISMISSIBLE_CACHE_REDIS_URL=redis://localhost:6379');
    });

    test('custom Redis prefix is reflected on review screen', async ({ page }) => {
      await page.goto(buildWizardUrl());
      const reviewPage = new ReviewPage(page);
      await reviewPage.expectHeading();

      await reviewPage.clickEdit('cache');
      const cachePage = new CachePage(page);
      await cachePage.selectCacheType('Redis Cache');
      await cachePage.fillRedisUrl('redis://localhost:6379');
      await cachePage.fillRedisPrefix('myapp-cache-');

      const navigation = new WizardNavigationPage(page);
      await navigation.goToReview();

      await reviewPage.expectEnvContains('DISMISSIBLE_CACHE_REDIS_KEY_PREFIX=myapp-cache-');
    });

    test('custom Redis TTL is reflected on review screen', async ({ page }) => {
      await page.goto(buildWizardUrl());
      const reviewPage = new ReviewPage(page);
      await reviewPage.expectHeading();

      await reviewPage.clickEdit('cache');
      const cachePage = new CachePage(page);
      await cachePage.selectCacheType('Redis Cache');
      await cachePage.fillRedisUrl('redis://localhost:6379');
      await cachePage.fillRedisTtl(7200000);

      const navigation = new WizardNavigationPage(page);
      await navigation.goToReview();

      await reviewPage.expectEnvContains('DISMISSIBLE_CACHE_REDIS_TTL_MS=7200000');
    });

    test('disabling Redis ready check is reflected on review screen', async ({ page }) => {
      await page.goto(buildWizardUrl());
      const reviewPage = new ReviewPage(page);
      await reviewPage.expectHeading();

      await reviewPage.clickEdit('cache');
      const cachePage = new CachePage(page);
      await cachePage.selectCacheType('Redis Cache');
      await cachePage.fillRedisUrl('redis://localhost:6379');
      await cachePage.expectRedisEnableReady(true);
      await cachePage.toggleRedisEnableReady();
      await cachePage.expectRedisEnableReady(false);

      const navigation = new WizardNavigationPage(page);
      await navigation.goToReview();

      await reviewPage.expectEnvContains('DISMISSIBLE_CACHE_REDIS_ENABLE_READY_CHECK=false');
    });

    test('custom Redis max retries is reflected on review screen', async ({ page }) => {
      await page.goto(buildWizardUrl());
      const reviewPage = new ReviewPage(page);
      await reviewPage.expectHeading();

      await reviewPage.clickEdit('cache');
      const cachePage = new CachePage(page);
      await cachePage.selectCacheType('Redis Cache');
      await cachePage.fillRedisUrl('redis://localhost:6379');
      await cachePage.fillRedisMaxRetries(5);

      const navigation = new WizardNavigationPage(page);
      await navigation.goToReview();

      await reviewPage.expectEnvContains('DISMISSIBLE_CACHE_REDIS_MAX_RETRIES=5');
    });

    test('custom Redis connection timeout is reflected on review screen', async ({ page }) => {
      await page.goto(buildWizardUrl());
      const reviewPage = new ReviewPage(page);
      await reviewPage.expectHeading();

      await reviewPage.clickEdit('cache');
      const cachePage = new CachePage(page);
      await cachePage.selectCacheType('Redis Cache');
      await cachePage.fillRedisUrl('redis://localhost:6379');
      await cachePage.fillRedisConnectionTimeout(10000);

      const navigation = new WizardNavigationPage(page);
      await navigation.goToReview();

      await reviewPage.expectEnvContains('DISMISSIBLE_CACHE_REDIS_CONNECTION_TIMEOUT_MS=10000');
    });
  });

  test.describe('Cache type switching', () => {
    test('switching cache type hides/shows appropriate fields', async ({ page }) => {
      await page.goto(buildWizardUrl());
      const reviewPage = new ReviewPage(page);
      await reviewPage.expectHeading();

      await reviewPage.clickEdit('cache');
      const cachePage = new CachePage(page);

      // No cache by default - no additional fields
      await cachePage.expectRedisUrlNotVisible();
      await cachePage.expectMemoryCacheMaxItemsNotVisible();

      // Switch to Memory Cache
      await cachePage.selectCacheType('Memory Cache');
      await cachePage.expectRedisUrlNotVisible();
      await cachePage.expectMemoryCacheMaxItemsVisible();

      // Switch to Redis Cache
      await cachePage.selectCacheType('Redis Cache');
      await cachePage.expectRedisUrlVisible();
      await cachePage.expectMemoryCacheMaxItemsNotVisible();

      // Switch back to No Cache
      await cachePage.selectCacheType('No Cache');
      await cachePage.expectRedisUrlNotVisible();
      await cachePage.expectMemoryCacheMaxItemsNotVisible();
    });
  });
});
