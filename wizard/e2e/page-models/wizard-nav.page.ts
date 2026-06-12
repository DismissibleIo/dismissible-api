import { expect, type Page } from '@playwright/test';

export class WizardNavigationPage {
  constructor(public readonly page: Page) {}

  async next() {
    const nextButton = this.page.getByTestId('wizard-next-button');
    await expect(nextButton).toBeVisible();
    await nextButton.click();
  }

  async goToReview() {
    const reviewHeading = this.page.getByTestId('review-heading');
    for (let remainingAttempts = 0; remainingAttempts < 12; remainingAttempts += 1) {
      if (await reviewHeading.isVisible()) {
        return;
      }
      await this.next();
    }
    await expect(reviewHeading).toBeVisible();
  }
}
