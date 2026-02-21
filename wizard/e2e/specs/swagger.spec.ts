import { test } from '@playwright/test';
import { buildWizardUrl } from '../state-utils';
import { SwaggerPage } from '../page-models/swagger.page';
import { ReviewPage } from '../page-models/review.page';
import { WizardNavigationPage } from '../page-models/wizard-nav.page';

test.describe('Wizard swagger step', () => {
  test('enabling Swagger updates the review output', async ({ page }) => {
    await page.goto(buildWizardUrl());
    const reviewPage = new ReviewPage(page);
    await reviewPage.expectHeading();

    await reviewPage.clickEdit('swagger');
    const swaggerPage = new SwaggerPage(page);
    await swaggerPage.toggleEnabled();
    await swaggerPage.expectEnabled(true);
    await swaggerPage.expectPathVisible();

    const navigation = new WizardNavigationPage(page);
    await navigation.goToReview();

    await reviewPage.expectEnvContains('DISMISSIBLE_SWAGGER_ENABLED=true');
    // Default path 'docs' is not output unless includeDefaults is true
  });

  test('custom Swagger path is reflected on review screen', async ({ page }) => {
    await page.goto(buildWizardUrl());
    const reviewPage = new ReviewPage(page);
    await reviewPage.expectHeading();

    await reviewPage.clickEdit('swagger');
    const swaggerPage = new SwaggerPage(page);
    await swaggerPage.toggleEnabled();
    await swaggerPage.setPath('api-docs');

    const navigation = new WizardNavigationPage(page);
    await navigation.goToReview();

    await reviewPage.expectEnvContains('DISMISSIBLE_SWAGGER_ENABLED=true');
    await reviewPage.expectEnvContains('DISMISSIBLE_SWAGGER_PATH=api-docs');
  });

  test('disabling Swagger hides the path input', async ({ page }) => {
    await page.goto(
      buildWizardUrl({
        swagger: { enabled: true, path: 'docs' },
      }),
    );
    const reviewPage = new ReviewPage(page);
    await reviewPage.expectHeading();

    await reviewPage.clickEdit('swagger');
    const swaggerPage = new SwaggerPage(page);
    await swaggerPage.expectEnabled(true);
    await swaggerPage.expectPathVisible();

    await swaggerPage.toggleEnabled();
    await swaggerPage.expectEnabled(false);
    await swaggerPage.expectPathNotVisible();
  });
});
