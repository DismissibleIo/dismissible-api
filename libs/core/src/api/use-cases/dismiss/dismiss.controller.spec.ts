import { mock } from 'ts-jest-mocker';
import { DismissController } from './dismiss.controller';
import { DismissibleService } from '../../../core/dismissible.service';
import { DismissibleItemMapper } from '../../dismissible-item.mapper';
import { createTestItem, createTestContext } from '../../../testing/factories';
import { ResponseService } from '../../../response';

describe('DismissController', () => {
  let controller: DismissController;
  let mockService: jest.Mocked<DismissibleService>;
  let mockResponseService: jest.Mocked<ResponseService>;
  let mapper: DismissibleItemMapper;

  beforeEach(() => {
    mockService = mock(DismissibleService);
    mockResponseService = mock(ResponseService, { failIfMockNotProvided: false });
    mockResponseService.success.mockImplementation((data) => ({ data }));
    mapper = new DismissibleItemMapper();

    controller = new DismissController(mockService, mapper, mockResponseService);
  });

  describe('dismiss', () => {
    it('should return dismissed item wrapped in data', async () => {
      const item = createTestItem({
        id: 'test-item',
        dismissedAt: new Date(),
      });
      const previousItem = createTestItem({ id: 'test-item' });
      const context = createTestContext();

      mockService.dismiss.mockResolvedValue({ item, previousItem });

      const result = await controller.dismiss('test-user-id', 'test-item', context);

      expect(result.data.itemId).toBe('test-item');
      expect(mockService.dismiss).toHaveBeenCalledWith('test-item', 'test-user-id', context);
      expect(mockResponseService.success).toHaveBeenCalled();
    });
  });
});
