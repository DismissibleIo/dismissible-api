import { test } from '@playwright/test';
import { buildWizardUrl } from '../state-utils';
import { RateLimiterPage } from '../page-models/rate-limiter.page';
import { ReviewPage } from '../page-models/review.page';
import { WizardNavigationPage } from '../page-models/wizard-nav.page';

test.describe('Wizard rate limiter step', () => {
  test('enabling rate limiter updates the review output', async ({ page }) => {
    await page.goto(buildWizardUrl());
    const reviewPage = new ReviewPage(page);
    await reviewPage.expectHeading();

    await reviewPage.clickEdit('rate-limiter');
    const rateLimiterPage = new RateLimiterPage(page);
    await rateLimiterPage.toggleEnabled();
    await rateLimiterPage.expectEnabled(true);
    await rateLimiterPage.expectPointsVisible();

    const navigation = new WizardNavigationPage(page);
    await navigation.goToReview();

    await reviewPage.expectEnvContains('DISMISSIBLE_RATE_LIMITER_ENABLED=true');
  });

  test('custom rate limiter points and duration', async ({ page }) => {
    await page.goto(buildWizardUrl());
    const reviewPage = new ReviewPage(page);
    await reviewPage.expectHeading();

    await reviewPage.clickEdit('rate-limiter');
    const rateLimiterPage = new RateLimiterPage(page);
    await rateLimiterPage.toggleEnabled();
    await rateLimiterPage.setPoints(500);
    await rateLimiterPage.setDuration(60);

    const navigation = new WizardNavigationPage(page);
    await navigation.goToReview();

    await reviewPage.expectEnvContains('DISMISSIBLE_RATE_LIMITER_POINTS=500');
    await reviewPage.expectEnvContains('DISMISSIBLE_RATE_LIMITER_DURATION=60');
  });

  test('custom block duration is reflected on review screen', async ({ page }) => {
    await page.goto(buildWizardUrl());
    const reviewPage = new ReviewPage(page);
    await reviewPage.expectHeading();

    await reviewPage.clickEdit('rate-limiter');
    const rateLimiterPage = new RateLimiterPage(page);
    await rateLimiterPage.toggleEnabled();
    await rateLimiterPage.setBlockDuration(120);

    const navigation = new WizardNavigationPage(page);
    await navigation.goToReview();

    await reviewPage.expectEnvContains('DISMISSIBLE_RATE_LIMITER_BLOCK_DURATION=120');
  });

  test('custom key type is reflected on review screen', async ({ page }) => {
    await page.goto(buildWizardUrl());
    const reviewPage = new ReviewPage(page);
    await reviewPage.expectHeading();

    await reviewPage.clickEdit('rate-limiter');
    const rateLimiterPage = new RateLimiterPage(page);
    await rateLimiterPage.toggleEnabled();
    await rateLimiterPage.setKeyType('ip,user-agent');

    const navigation = new WizardNavigationPage(page);
    await navigation.goToReview();

    await reviewPage.expectEnvContains('DISMISSIBLE_RATE_LIMITER_KEY_TYPE="ip,user-agent"');
  });

  test('changing key mode to And is reflected on review screen', async ({ page }) => {
    await page.goto(buildWizardUrl());
    const reviewPage = new ReviewPage(page);
    await reviewPage.expectHeading();

    await reviewPage.clickEdit('rate-limiter');
    const rateLimiterPage = new RateLimiterPage(page);
    await rateLimiterPage.toggleEnabled();
    await rateLimiterPage.selectKeyMode('And (combine all keys into one)');

    const navigation = new WizardNavigationPage(page);
    await navigation.goToReview();

    await reviewPage.expectEnvContains('DISMISSIBLE_RATE_LIMITER_KEY_MODE=and');
  });

  test('changing key mode to Or is reflected on review screen', async ({ page }) => {
    await page.goto(buildWizardUrl());
    const reviewPage = new ReviewPage(page);
    await reviewPage.expectHeading();

    await reviewPage.clickEdit('rate-limiter');
    const rateLimiterPage = new RateLimiterPage(page);
    await rateLimiterPage.toggleEnabled();
    await rateLimiterPage.selectKeyMode('Or (use first available key)');

    const navigation = new WizardNavigationPage(page);
    await navigation.goToReview();

    await reviewPage.expectEnvContains('DISMISSIBLE_RATE_LIMITER_KEY_MODE=or');
  });

  test('setting ignored keys is reflected on review screen', async ({ page }) => {
    await page.goto(buildWizardUrl());
    const reviewPage = new ReviewPage(page);
    await reviewPage.expectHeading();

    await reviewPage.clickEdit('rate-limiter');
    const rateLimiterPage = new RateLimiterPage(page);
    await rateLimiterPage.toggleEnabled();
    await rateLimiterPage.setIgnoredKeys('localhost,127.0.0.1');

    const navigation = new WizardNavigationPage(page);
    await navigation.goToReview();

    await reviewPage.expectEnvContains(
      'DISMISSIBLE_RATE_LIMITER_IGNORED_KEYS="localhost,127.0.0.1"',
    );
  });

  test('custom hook priority is reflected on review screen', async ({ page }) => {
    await page.goto(buildWizardUrl());
    const reviewPage = new ReviewPage(page);
    await reviewPage.expectHeading();

    await reviewPage.clickEdit('rate-limiter');
    const rateLimiterPage = new RateLimiterPage(page);
    await rateLimiterPage.toggleEnabled();
    await rateLimiterPage.setPriority(-200);

    const navigation = new WizardNavigationPage(page);
    await navigation.goToReview();

    await reviewPage.expectEnvContains('DISMISSIBLE_RATE_LIMITER_PRIORITY=-200');
  });

  test('disabling rate limiter hides configuration fields', async ({ page }) => {
    await page.goto(
      buildWizardUrl({
        rateLimiter: {
          enabled: true,
          points: 1000,
          duration: 1,
          blockDuration: 60,
          keyType: 'ip,origin,referrer',
          keyMode: 'any',
          priority: -101,
        },
      }),
    );
    const reviewPage = new ReviewPage(page);
    await reviewPage.expectHeading();

    await reviewPage.clickEdit('rate-limiter');
    const rateLimiterPage = new RateLimiterPage(page);
    await rateLimiterPage.expectEnabled(true);
    await rateLimiterPage.expectPointsVisible();

    await rateLimiterPage.toggleEnabled();
    await rateLimiterPage.expectEnabled(false);
    await rateLimiterPage.expectPointsNotVisible();
  });
});
