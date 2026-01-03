import { DismissibleItemFactory } from './dismissible-item.factory';
import { DismissibleItemDto } from './dismissible-item';

describe('DismissibleItemFactory', () => {
  let factory: DismissibleItemFactory;

  beforeEach(() => {
    factory = new DismissibleItemFactory();
  });

  describe('create', () => {
    it('should create a DismissibleItemDto instance', () => {
      const item = factory.create({
        id: 'test-id',
        createdAt: new Date('2024-01-15T10:00:00.000Z'),
        userId: 'test-user-id',
      });

      expect(item).toBeInstanceOf(DismissibleItemDto);
      expect(item.id).toBe('test-id');
      expect(item.createdAt).toEqual(new Date('2024-01-15T10:00:00.000Z'));
      expect(item.userId).toBe('test-user-id');
    });

    it('should handle optional properties when undefined', () => {
      const item = factory.create({
        id: 'test-id',
        createdAt: new Date('2024-01-15T10:00:00.000Z'),
        userId: 'test-user-id',
        dismissedAt: undefined,
      });

      expect(item.id).toBe('test-id');
      expect(item.createdAt).toEqual(new Date('2024-01-15T10:00:00.000Z'));
      expect(item.userId).toBe('test-user-id');
      expect(item.dismissedAt).toBeUndefined();
    });

    it('should include optional properties when provided', () => {
      const item = factory.create({
        id: 'test-id',
        createdAt: new Date('2024-01-15T10:00:00.000Z'),
        userId: 'user-123',
        dismissedAt: new Date('2024-01-15T12:00:00.000Z'),
      });

      expect(item.userId).toBe('user-123');
      expect(item.dismissedAt).toEqual(new Date('2024-01-15T12:00:00.000Z'));
    });
  });

  describe('clone', () => {
    it('should create an identical copy of an item', () => {
      const original = factory.create({
        id: 'test-id',
        createdAt: new Date('2024-01-15T10:00:00.000Z'),
        userId: 'user-123',
      });

      const cloned = factory.clone(original);

      expect(cloned).toBeInstanceOf(DismissibleItemDto);
      expect(cloned).toEqual(original);
      expect(cloned).not.toBe(original); // Different object reference
    });
  });

  describe('createDismissed', () => {
    it('should create a dismissed version with dismissedAt set', () => {
      const original = factory.create({
        id: 'test-id',
        createdAt: new Date('2024-01-15T10:00:00.000Z'),
        userId: 'user-123',
      });

      const dismissed = factory.createDismissed(original, new Date('2024-01-15T12:00:00.000Z'));

      expect(dismissed).toBeInstanceOf(DismissibleItemDto);
      expect(dismissed.id).toBe(original.id);
      expect(dismissed.createdAt).toEqual(original.createdAt);
      expect(dismissed.userId).toBe(original.userId);
      expect(dismissed.dismissedAt).toEqual(new Date('2024-01-15T12:00:00.000Z'));
    });
  });

  describe('createRestored', () => {
    it('should create a restored version without dismissedAt', () => {
      const dismissed = factory.create({
        id: 'test-id',
        createdAt: new Date('2024-01-15T10:00:00.000Z'),
        userId: 'user-123',
        dismissedAt: new Date('2024-01-15T12:00:00.000Z'),
      });

      const restored = factory.createRestored(dismissed);

      expect(restored).toBeInstanceOf(DismissibleItemDto);
      expect(restored.id).toBe(dismissed.id);
      expect(restored.createdAt).toEqual(dismissed.createdAt);
      expect(restored.userId).toBe(dismissed.userId);
      expect(restored.dismissedAt).toBeUndefined();
    });
  });
});
