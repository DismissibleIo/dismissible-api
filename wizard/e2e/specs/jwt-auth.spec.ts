import { test } from '@playwright/test';
import { buildWizardUrl } from '../state-utils';
import { JwtAuthPage } from '../page-models/jwt-auth.page';
import { ReviewPage } from '../page-models/review.page';
import { WizardNavigationPage } from '../page-models/wizard-nav.page';

test.describe('Wizard JWT auth step', () => {
  test('enabling JWT authentication updates the review output', async ({ page }) => {
    await page.goto(buildWizardUrl());
    const reviewPage = new ReviewPage(page);
    await reviewPage.expectHeading();

    await reviewPage.clickEdit('jwt');
    const jwtPage = new JwtAuthPage(page);
    await jwtPage.toggleEnabled();
    await jwtPage.expectEnabled(true);
    await jwtPage.expectWellKnownUrlVisible();
    await jwtPage.setWellKnownUrl('https://auth.example.com/.well-known/openid-configuration');

    const navigation = new WizardNavigationPage(page);
    await navigation.goToReview();

    await reviewPage.expectEnvContains('DISMISSIBLE_JWT_AUTH_ENABLED=true');
    await reviewPage.expectEnvContains(
      'DISMISSIBLE_JWT_AUTH_WELL_KNOWN_URL=https://auth.example.com/.well-known/openid-configuration',
    );
  });

  test('JWT authentication with issuer and audience', async ({ page }) => {
    await page.goto(buildWizardUrl());
    const reviewPage = new ReviewPage(page);
    await reviewPage.expectHeading();

    await reviewPage.clickEdit('jwt');
    const jwtPage = new JwtAuthPage(page);
    await jwtPage.toggleEnabled();
    await jwtPage.setWellKnownUrl('https://auth.example.com/.well-known/openid-configuration');
    await jwtPage.setIssuer('https://auth.example.com');
    await jwtPage.setAudience('api.example.com');

    const navigation = new WizardNavigationPage(page);
    await navigation.goToReview();

    await reviewPage.expectEnvContains('DISMISSIBLE_JWT_AUTH_ISSUER=https://auth.example.com');
    await reviewPage.expectEnvContains('DISMISSIBLE_JWT_AUTH_AUDIENCE=api.example.com');
  });

  test('JWT authentication with custom algorithms', async ({ page }) => {
    await page.goto(buildWizardUrl());
    const reviewPage = new ReviewPage(page);
    await reviewPage.expectHeading();

    await reviewPage.clickEdit('jwt');
    const jwtPage = new JwtAuthPage(page);
    await jwtPage.toggleEnabled();
    await jwtPage.setWellKnownUrl('https://auth.example.com/.well-known/openid-configuration');
    await jwtPage.setAlgorithms('RS256,ES256');

    const navigation = new WizardNavigationPage(page);
    await navigation.goToReview();

    await reviewPage.expectEnvContains('DISMISSIBLE_JWT_AUTH_ALGORITHMS="RS256,ES256"');
  });

  test('JWT authentication with custom cache and timeout settings', async ({ page }) => {
    await page.goto(buildWizardUrl());
    const reviewPage = new ReviewPage(page);
    await reviewPage.expectHeading();

    await reviewPage.clickEdit('jwt');
    const jwtPage = new JwtAuthPage(page);
    await jwtPage.toggleEnabled();
    await jwtPage.setWellKnownUrl('https://auth.example.com/.well-known/openid-configuration');
    await jwtPage.setJwksCacheDuration(300000);
    await jwtPage.setRequestTimeout(15000);
    await jwtPage.setPriority(-50);

    const navigation = new WizardNavigationPage(page);
    await navigation.goToReview();

    await reviewPage.expectEnvContains('DISMISSIBLE_JWT_AUTH_JWKS_CACHE_DURATION=300000');
    await reviewPage.expectEnvContains('DISMISSIBLE_JWT_AUTH_REQUEST_TIMEOUT=15000');
    await reviewPage.expectEnvContains('DISMISSIBLE_JWT_AUTH_PRIORITY=-50');
  });

  test('JWT authentication with user ID matching', async ({ page }) => {
    await page.goto(buildWizardUrl());
    const reviewPage = new ReviewPage(page);
    await reviewPage.expectHeading();

    await reviewPage.clickEdit('jwt');
    const jwtPage = new JwtAuthPage(page);
    await jwtPage.toggleEnabled();
    await jwtPage.setWellKnownUrl('https://auth.example.com/.well-known/openid-configuration');
    await jwtPage.expectUserIdClaimVisible();
    await jwtPage.setUserIdClaim('user_id');

    const navigation = new WizardNavigationPage(page);
    await navigation.goToReview();

    // matchUserId is true by default, so it's not output
    // userIdClaim 'user_id' is non-default (default is 'sub'), so it IS output
    await reviewPage.expectEnvContains('DISMISSIBLE_JWT_AUTH_USER_ID_CLAIM=user_id');
  });

  test('JWT authentication with regex user ID matching', async ({ page }) => {
    await page.goto(buildWizardUrl());
    const reviewPage = new ReviewPage(page);
    await reviewPage.expectHeading();

    await reviewPage.clickEdit('jwt');
    const jwtPage = new JwtAuthPage(page);
    await jwtPage.toggleEnabled();
    await jwtPage.setWellKnownUrl('https://auth.example.com/.well-known/openid-configuration');
    await jwtPage.selectUserIdMatchType('Regex Match');
    await jwtPage.expectUserIdMatchRegexVisible();
    await jwtPage.setUserIdMatchRegex('^(.+)@example\\.com$');

    const navigation = new WizardNavigationPage(page);
    await navigation.goToReview();

    await reviewPage.expectEnvContains('DISMISSIBLE_JWT_AUTH_USER_ID_MATCH_TYPE=regex');
    await reviewPage.expectEnvContains('DISMISSIBLE_JWT_AUTH_USER_ID_MATCH_REGEX=');
  });

  test('disabling user ID matching hides user ID fields', async ({ page }) => {
    await page.goto(
      buildWizardUrl({
        jwtAuth: {
          enabled: true,
          wellKnownUrl: 'https://auth.example.com/.well-known/openid-configuration',
          matchUserId: true,
          userIdClaim: 'sub',
          algorithms: 'RS256',
          jwksCacheDuration: 600000,
          requestTimeout: 30000,
          priority: -100,
          userIdMatchType: 'exact',
        },
      }),
    );
    const reviewPage = new ReviewPage(page);
    await reviewPage.expectHeading();

    await reviewPage.clickEdit('jwt');
    const jwtPage = new JwtAuthPage(page);
    await jwtPage.expectUserIdClaimVisible();
    await jwtPage.toggleMatchUserId();
    await jwtPage.expectUserIdClaimNotVisible();
  });
});
