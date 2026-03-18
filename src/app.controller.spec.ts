import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';

describe('AppController', () => {
  let controller: AppController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
    }).compile();

    controller = module.get<AppController>(AppController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getHealth', () => {
    it('should return health status', () => {
      const result = controller.getHealth();

      expect(result).toEqual(
        expect.objectContaining({
          status: 'ok',
          message: 'TOEIC AI API is running',
          version: '1.0.0',
        }),
      );
      expect(result.timestamp).toBeDefined();
    });
  });

  describe('getDetailedHealth', () => {
    it('should return detailed health information', () => {
      const result = controller.getDetailedHealth();

      expect(result.status).toBe('healthy');
      expect(result.version).toBe('1.0.0');
      expect(result.timestamp).toBeDefined();
      expect(typeof result.uptime).toBe('number');
      expect(result.uptime).toBeGreaterThanOrEqual(0);
      expect(typeof result.environment).toBe('string');
      expect(result.memory).toBeDefined();
      expect(typeof result.memory.used).toBe('string');
      expect(typeof result.memory.total).toBe('string');
      expect(result.memory.used).toMatch(/^\d+(\.\d+)? MB$/);
      expect(result.memory.total).toMatch(/^\d+(\.\d+)? MB$/);
    });
  });
});
