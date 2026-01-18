import { mock, Mock } from 'ts-jest-mocker';
import { BatchGetOrCreateController } from './batch-get-or-create.controller';
import { DismissibleService } from '../../../core/dismissible.service';
import { DismissibleItemMapper } from '../../dismissible-item.mapper';
import { createTestItem, createTestContext } from '../../../testing/factories';
import { ResponseService } from '../../../response';

describe('BatchGetOrCreateController', () => {
  let controller: BatchGetOrCreateController;
  let mockService: Mock<DismissibleService>;
  let mockResponseService: Mock<ResponseService>;
  let mapper: DismissibleItemMapper;

  beforeEach(() => {
    mockService = mock(DismissibleService);
    mockResponseService = mock(ResponseService, { failIfMockNotProvided: false });
    mockResponseService.success.mockImplementation((data) => ({ data }));
    mapper = new DismissibleItemMapper();

    controller = new BatchGetOrCreateController(mockService, mapper, mockResponseService);
  });

  describe('batchGetOrCreate', () => {
    it('should return items wrapped in data', async () => {
      const item1 = createTestItem({ id: 'item-1' });
      const item2 = createTestItem({ id: 'item-2' });
      const context = createTestContext();

      mockService.batchGetOrCreate.mockResolvedValue({
        items: [item1, item2],
        retrievedItems: [item1],
        createdItems: [item2],
      });

      const result = await controller.batchGetOrCreate(
        'test-user-id',
        { items: ['item-1', 'item-2'] },
        context,
      );

      expect(result.data).toHaveLength(2);
      expect(result.data[0].itemId).toBe('item-1');
      expect(result.data[1].itemId).toBe('item-2');
      expect(mockResponseService.success).toHaveBeenCalled();
      expect(mockService.batchGetOrCreate).toHaveBeenCalledWith(
        ['item-1', 'item-2'],
        'test-user-id',
        context,
      );
    });

    it('should handle single item request', async () => {
      const item = createTestItem({ id: 'single-item' });
      const context = createTestContext();

      mockService.batchGetOrCreate.mockResolvedValue({
        items: [item],
        retrievedItems: [],
        createdItems: [item],
      });

      const result = await controller.batchGetOrCreate(
        'test-user-id',
        { items: ['single-item'] },
        context,
      );

      expect(result.data).toHaveLength(1);
      expect(result.data[0].itemId).toBe('single-item');
    });
  });
});
