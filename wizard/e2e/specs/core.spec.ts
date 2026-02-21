import { test } from '@playwright/test';
import { buildWizardUrl } from '../state-utils';
import { CorePage } from '../page-models/core.page';
import { ReviewPage } from '../page-models/review.page';
import { WizardNavigationPage } from '../page-models/wizard-nav.page';

test.describe('Wizard core step', () => {
  test('updates the port value shown on the review output', async ({ page }) => {
    await page.goto(buildWizardUrl());
    const reviewPage = new ReviewPage(page);
    await reviewPage.expectHeading();

    await reviewPage.clickEdit('core');
    const corePage = new CorePage(page);
    await corePage.setPort(4545);

    const navigation = new WizardNavigationPage(page);
    await navigation.goToReview();

    await reviewPage.expectEnvContains('DISMISSIBLE_PORT=4545');
  });
});
