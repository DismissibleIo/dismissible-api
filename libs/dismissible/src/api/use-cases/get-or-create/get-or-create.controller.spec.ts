import { mock } from 'ts-jest-mocker';
import { GetOrCreateController } from './get-or-create.controller';
import { DismissibleService } from '../../../core/dismissible.service';
import { DismissibleItemMapper } from '../../dismissible-item.mapper';
import { createTestItem, createTestContext } from '../../../testing/factories';
import { ResponseService } from '../../../response';

describe('GetOrCreateController', () => {
  let controller: GetOrCreateController;
  let mockService: jest.Mocked<DismissibleService>;
  let mockResponseService: jest.Mocked<ResponseService>;
  let mapper: DismissibleItemMapper;

  beforeEach(() => {
    mockService = mock(DismissibleService);
    mockResponseService = mock(ResponseService, { failIfMockNotProvided: false });
    mockResponseService.success.mockImplementation((data) => ({ data }));
    mapper = new DismissibleItemMapper();

    controller = new GetOrCreateController(mockService, mapper, mockResponseService);
  });

  describe('getOrCreate', () => {
    it('should return item with created flag wrapped in data', async () => {
      const item = createTestItem({ id: 'test-item' });
      const context = createTestContext();

      mockService.getOrCreate.mockResolvedValue({ item, created: true });

      const result = await controller.getOrCreate('test-user-id', 'test-item', context);

      expect(result.data.itemId).toBe('test-item');
      expect(mockResponseService.success).toHaveBeenCalled();
    });
  });
});
