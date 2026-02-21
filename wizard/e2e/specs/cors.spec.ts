import { test } from '@playwright/test';
import { buildWizardUrl } from '../state-utils';
import { CorsPage } from '../page-models/cors.page';
import { ReviewPage } from '../page-models/review.page';
import { WizardNavigationPage } from '../page-models/wizard-nav.page';

test.describe('Wizard CORS step', () => {
  test('enabling CORS updates the review output', async ({ page }) => {
    await page.goto(buildWizardUrl());
    const reviewPage = new ReviewPage(page);
    await reviewPage.expectHeading();

    await reviewPage.clickEdit('cors');
    const corsPage = new CorsPage(page);
    await corsPage.toggleEnabled();
    await corsPage.expectEnabled(true);
    await corsPage.expectOriginsVisible();

    const navigation = new WizardNavigationPage(page);
    await navigation.goToReview();

    await reviewPage.expectEnvContains('DISMISSIBLE_CORS_ENABLED=true');
  });

  test('CORS with custom origins', async ({ page }) => {
    await page.goto(buildWizardUrl());
    const reviewPage = new ReviewPage(page);
    await reviewPage.expectHeading();

    await reviewPage.clickEdit('cors');
    const corsPage = new CorsPage(page);
    await corsPage.toggleEnabled();
    await corsPage.setOrigins('https://example.com,https://app.example.com');

    const navigation = new WizardNavigationPage(page);
    await navigation.goToReview();

    await reviewPage.expectEnvContains(
      'DISMISSIBLE_CORS_ORIGINS="https://example.com,https://app.example.com"',
    );
  });

  test('CORS with custom methods', async ({ page }) => {
    await page.goto(buildWizardUrl());
    const reviewPage = new ReviewPage(page);
    await reviewPage.expectHeading();

    await reviewPage.clickEdit('cors');
    const corsPage = new CorsPage(page);
    await corsPage.toggleEnabled();
    await corsPage.setMethods('GET,POST,PUT,DELETE,PATCH');

    const navigation = new WizardNavigationPage(page);
    await navigation.goToReview();

    await reviewPage.expectEnvContains('DISMISSIBLE_CORS_METHODS="GET,POST,PUT,DELETE,PATCH"');
  });

  test('CORS with custom allowed headers', async ({ page }) => {
    await page.goto(buildWizardUrl());
    const reviewPage = new ReviewPage(page);
    await reviewPage.expectHeading();

    await reviewPage.clickEdit('cors');
    const corsPage = new CorsPage(page);
    await corsPage.toggleEnabled();
    await corsPage.setAllowedHeaders('Content-Type,Authorization,X-Custom-Header');

    const navigation = new WizardNavigationPage(page);
    await navigation.goToReview();

    await reviewPage.expectEnvContains(
      'DISMISSIBLE_CORS_ALLOWED_HEADERS="Content-Type,Authorization,X-Custom-Header"',
    );
  });

  test('CORS with credentials disabled', async ({ page }) => {
    await page.goto(buildWizardUrl());
    const reviewPage = new ReviewPage(page);
    await reviewPage.expectHeading();

    await reviewPage.clickEdit('cors');
    const corsPage = new CorsPage(page);
    await corsPage.toggleEnabled();
    await corsPage.toggleCredentials();
    await corsPage.expectCredentials(false);

    const navigation = new WizardNavigationPage(page);
    await navigation.goToReview();

    await reviewPage.expectEnvContains('DISMISSIBLE_CORS_CREDENTIALS=false');
  });

  test('CORS with custom max age', async ({ page }) => {
    await page.goto(buildWizardUrl());
    const reviewPage = new ReviewPage(page);
    await reviewPage.expectHeading();

    await reviewPage.clickEdit('cors');
    const corsPage = new CorsPage(page);
    await corsPage.toggleEnabled();
    await corsPage.setMaxAge(3600);

    const navigation = new WizardNavigationPage(page);
    await navigation.goToReview();

    await reviewPage.expectEnvContains('DISMISSIBLE_CORS_MAX_AGE=3600');
  });

  test('disabling CORS hides the configuration fields', async ({ page }) => {
    await page.goto(
      buildWizardUrl({
        cors: {
          enabled: true,
          methods: 'GET,POST,DELETE,OPTIONS',
          allowedHeaders: 'Content-Type,Authorization,x-request-id',
          credentials: true,
          maxAge: 86400,
        },
      }),
    );
    const reviewPage = new ReviewPage(page);
    await reviewPage.expectHeading();

    await reviewPage.clickEdit('cors');
    const corsPage = new CorsPage(page);
    await corsPage.expectEnabled(true);
    await corsPage.expectOriginsVisible();

    await corsPage.toggleEnabled();
    await corsPage.expectEnabled(false);
    await corsPage.expectOriginsNotVisible();
  });
});
