import { DismissibleItemDto } from '@dismissible/nestjs-dismissible-item';
import { DismissibleItemFactory } from '@dismissible/nestjs-dismissible-item';
import { IRequestContext } from '@dismissible/nestjs-dismissible-request';

/**
 * Shared factory instance for test helpers.
 */
const testItemFactory = new DismissibleItemFactory();

/**
 * Create a test dismissible item.
 */
export function createTestItem(overrides: Partial<DismissibleItemDto> = {}): DismissibleItemDto {
  return testItemFactory.create({
    id: overrides.id ?? 'test-item-id',
    createdAt: overrides.createdAt ?? new Date('2024-01-15T10:00:00.000Z'),
    userId: overrides.userId ?? 'test-user-id',
    dismissedAt: overrides.dismissedAt,
  });
}

/**
 * Create a test request context.
 */
export function createTestContext(overrides: Partial<IRequestContext> = {}): IRequestContext {
  return {
    requestId: 'test-request-id',
    headers: {},
    query: {},
    params: {},
    body: {},
    user: {},
    ip: '127.0.0.1',
    method: 'GET',
    url: '/test',
    protocol: 'http',
    secure: false,
    hostname: 'localhost',
    port: 3000,
    path: '/test',
    search: '',
    searchParams: {},
    origin: 'http://localhost:3000',
    referer: '',
    userAgent: 'test-agent',
    ...overrides,
  };
}

/**
 * Create a dismissed test item.
 */
export function createDismissedTestItem(
  overrides: Partial<DismissibleItemDto> = {},
): DismissibleItemDto {
  return createTestItem({
    dismissedAt: new Date('2024-01-15T12:00:00.000Z'),
    ...overrides,
  });
}
