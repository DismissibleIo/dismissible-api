import { HealthController } from './health.controller';

describe('HealthController', () => {
  let controller: HealthController;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-01-20T15:30:00.000Z'));
    controller = new HealthController();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('getHealth', () => {
    it('should return the exact response from service', () => {
      const result = controller.getHealth();

      expect(result.status).toBe('ok');
      expect(result.timestamp).toBe('2024-01-20T15:30:00.000Z');
    });
  });
});
