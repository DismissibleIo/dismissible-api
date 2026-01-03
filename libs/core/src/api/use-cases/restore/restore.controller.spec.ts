import { mock, Mock } from 'ts-jest-mocker';
import { RestoreController } from './restore.controller';
import { DismissibleService } from '../../../core/dismissible.service';
import { DismissibleItemMapper } from '../../dismissible-item.mapper';
import { createTestItem, createTestContext } from '../../../testing/factories';
import { ResponseService } from '../../../response';

describe('RestoreController', () => {
  let controller: RestoreController;
  let mockService: Mock<DismissibleService>;
  let mockResponseService: Mock<ResponseService>;
  let mapper: DismissibleItemMapper;

  beforeEach(() => {
    mockService = mock(DismissibleService);
    mockResponseService = mock(ResponseService, { failIfMockNotProvided: false });
    mockResponseService.success.mockImplementation((data) => ({ data }));
    mapper = new DismissibleItemMapper();

    controller = new RestoreController(mockService, mapper, mockResponseService);
  });

  describe('restore', () => {
    it('should return restored item wrapped in data', async () => {
      const item = createTestItem({ id: 'test-item' });
      const previousItem = createTestItem({
        id: 'test-item',
        dismissedAt: new Date(),
      });
      const context = createTestContext();

      mockService.restore.mockResolvedValue({ item, previousItem });

      const result = await controller.restore('test-user-id', 'test-item', context);

      expect(result.data.itemId).toBe('test-item');
      expect(mockService.restore).toHaveBeenCalledWith('test-item', 'test-user-id', context);
      expect(mockResponseService.success).toHaveBeenCalled();
    });
  });
});
