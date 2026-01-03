import { DismissibleItemMapper } from './dismissible-item.mapper';
import { createTestItem, createDismissedTestItem } from '../testing/factories';

describe('DismissibleItemMapper', () => {
  let mapper: DismissibleItemMapper;

  beforeEach(() => {
    mapper = new DismissibleItemMapper();
  });

  describe('toResponseDto', () => {
    it('should convert basic item to DTO', () => {
      const item = createTestItem({
        id: 'test-item',
        userId: 'test-user-id',
        createdAt: new Date('2024-01-15T10:00:00.000Z'),
      });

      const dto = mapper.toResponseDto(item);

      expect(dto.itemId).toBe('test-item');
      expect(dto.userId).toBe('test-user-id');
      expect(dto.createdAt).toBe('2024-01-15T10:00:00.000Z');
      expect(dto.dismissedAt).toBeUndefined();
    });

    it('should convert dates to ISO strings', () => {
      const item = createDismissedTestItem({
        id: 'test-item',
        createdAt: new Date('2024-01-15T10:00:00.000Z'),
        dismissedAt: new Date('2024-01-15T12:00:00.000Z'),
      });

      const dto = mapper.toResponseDto(item);

      expect(dto.createdAt).toBe('2024-01-15T10:00:00.000Z');
      expect(dto.dismissedAt).toBe('2024-01-15T12:00:00.000Z');
    });

    it('should include userId in DTO', () => {
      const item = createTestItem({
        id: 'test-item',
        userId: 'user-123',
      });

      const dto = mapper.toResponseDto(item);

      expect(dto.userId).toBe('user-123');
    });
  });
});
