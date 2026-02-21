import { test } from '@playwright/test';
import { buildWizardUrl } from '../state-utils';
import { ValidationPage } from '../page-models/validation.page';
import { ReviewPage } from '../page-models/review.page';
import { WizardNavigationPage } from '../page-models/wizard-nav.page';

test.describe('Wizard validation step', () => {
  test('all validation options are enabled by default', async ({ page }) => {
    await page.goto(buildWizardUrl());
    const reviewPage = new ReviewPage(page);
    await reviewPage.expectHeading();

    await reviewPage.clickEdit('validation');
    const validationPage = new ValidationPage(page);
    await validationPage.expectDisableErrorMessages(true);
    await validationPage.expectWhitelist(true);
    await validationPage.expectForbidNonWhitelisted(true);
    await validationPage.expectTransform(true);
  });

  test('disabling error messages is reflected on review screen', async ({ page }) => {
    await page.goto(buildWizardUrl());
    const reviewPage = new ReviewPage(page);
    await reviewPage.expectHeading();

    await reviewPage.clickEdit('validation');
    const validationPage = new ValidationPage(page);
    await validationPage.toggleDisableErrorMessages();
    await validationPage.expectDisableErrorMessages(false);

    const navigation = new WizardNavigationPage(page);
    await navigation.goToReview();

    await reviewPage.expectEnvContains('DISMISSIBLE_VALIDATION_DISABLE_ERROR_MESSAGES=false');
  });

  test('disabling whitelist is reflected on review screen', async ({ page }) => {
    await page.goto(buildWizardUrl());
    const reviewPage = new ReviewPage(page);
    await reviewPage.expectHeading();

    await reviewPage.clickEdit('validation');
    const validationPage = new ValidationPage(page);
    await validationPage.toggleWhitelist();
    await validationPage.expectWhitelist(false);

    const navigation = new WizardNavigationPage(page);
    await navigation.goToReview();

    await reviewPage.expectEnvContains('DISMISSIBLE_VALIDATION_WHITELIST=false');
  });

  test('disabling forbid non-whitelisted is reflected on review screen', async ({ page }) => {
    await page.goto(buildWizardUrl());
    const reviewPage = new ReviewPage(page);
    await reviewPage.expectHeading();

    await reviewPage.clickEdit('validation');
    const validationPage = new ValidationPage(page);
    await validationPage.toggleForbidNonWhitelisted();
    await validationPage.expectForbidNonWhitelisted(false);

    const navigation = new WizardNavigationPage(page);
    await navigation.goToReview();

    await reviewPage.expectEnvContains('DISMISSIBLE_VALIDATION_FORBID_NON_WHITELISTED=false');
  });

  test('disabling transform is reflected on review screen', async ({ page }) => {
    await page.goto(buildWizardUrl());
    const reviewPage = new ReviewPage(page);
    await reviewPage.expectHeading();

    await reviewPage.clickEdit('validation');
    const validationPage = new ValidationPage(page);
    await validationPage.toggleTransform();
    await validationPage.expectTransform(false);

    const navigation = new WizardNavigationPage(page);
    await navigation.goToReview();

    await reviewPage.expectEnvContains('DISMISSIBLE_VALIDATION_TRANSFORM=false');
  });

  test('disabling all validation options is reflected on review screen', async ({ page }) => {
    await page.goto(buildWizardUrl());
    const reviewPage = new ReviewPage(page);
    await reviewPage.expectHeading();

    await reviewPage.clickEdit('validation');
    const validationPage = new ValidationPage(page);
    await validationPage.toggleDisableErrorMessages();
    await validationPage.toggleWhitelist();
    await validationPage.toggleForbidNonWhitelisted();
    await validationPage.toggleTransform();

    const navigation = new WizardNavigationPage(page);
    await navigation.goToReview();

    await reviewPage.expectEnvContains('DISMISSIBLE_VALIDATION_DISABLE_ERROR_MESSAGES=false');
    await reviewPage.expectEnvContains('DISMISSIBLE_VALIDATION_WHITELIST=false');
    await reviewPage.expectEnvContains('DISMISSIBLE_VALIDATION_FORBID_NON_WHITELISTED=false');
    await reviewPage.expectEnvContains('DISMISSIBLE_VALIDATION_TRANSFORM=false');
  });
});
