import { expect, type Page } from '@playwright/test';

export class JwtAuthPage {
  constructor(private readonly page: Page) {}

  async toggleEnabled() {
    const toggle = this.page.getByTestId('jwt-enabled-toggle');
    await toggle.click();
  }

  async expectEnabled(enabled: boolean) {
    const toggle = this.page.getByTestId('jwt-enabled-toggle');
    if (enabled) {
      await expect(toggle).toBeChecked();
    } else {
      await expect(toggle).not.toBeChecked();
    }
  }

  async setWellKnownUrl(url: string) {
    const input = this.page.getByTestId('jwt-wellknown-url-input');
    await input.fill(url);
  }

  async setIssuer(issuer: string) {
    const input = this.page.getByTestId('jwt-issuer-input');
    await input.fill(issuer);
  }

  async setAudience(audience: string) {
    const input = this.page.getByTestId('jwt-audience-input');
    await input.fill(audience);
  }

  async setAlgorithms(algorithms: string) {
    const input = this.page.getByTestId('jwt-algorithms-input');
    await input.fill(algorithms);
  }

  async setJwksCacheDuration(duration: number) {
    const input = this.page.getByTestId('jwt-jwks-cache-duration-input');
    await input.fill(duration.toString());
  }

  async setRequestTimeout(timeout: number) {
    const input = this.page.getByTestId('jwt-request-timeout-input');
    await input.fill(timeout.toString());
  }

  async setPriority(priority: number) {
    const input = this.page.getByTestId('jwt-priority-input');
    await input.fill(priority.toString());
  }

  async toggleMatchUserId() {
    const toggle = this.page.getByTestId('jwt-match-user-id-toggle');
    await toggle.click();
  }

  async setUserIdClaim(claim: string) {
    const input = this.page.getByTestId('jwt-user-id-claim-input');
    await input.fill(claim);
  }

  async selectUserIdMatchType(label: string) {
    const select = this.page.getByTestId('jwt-user-id-match-type-select');
    await select.click();
    await this.page.getByRole('option', { name: label }).click();
  }

  async setUserIdMatchRegex(regex: string) {
    const input = this.page.getByTestId('jwt-user-id-match-regex-input');
    await input.fill(regex);
  }

  async expectWellKnownUrlVisible() {
    await expect(this.page.getByTestId('jwt-wellknown-url-input')).toBeVisible();
  }

  async expectWellKnownUrlNotVisible() {
    await expect(this.page.getByTestId('jwt-wellknown-url-input')).not.toBeVisible();
  }

  async expectUserIdClaimVisible() {
    await expect(this.page.getByTestId('jwt-user-id-claim-input')).toBeVisible();
  }

  async expectUserIdClaimNotVisible() {
    await expect(this.page.getByTestId('jwt-user-id-claim-input')).not.toBeVisible();
  }

  async expectUserIdMatchRegexVisible() {
    await expect(this.page.getByTestId('jwt-user-id-match-regex-input')).toBeVisible();
  }

  async expectUserIdMatchRegexNotVisible() {
    await expect(this.page.getByTestId('jwt-user-id-match-regex-input')).not.toBeVisible();
  }
}
