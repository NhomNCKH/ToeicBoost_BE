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
      
      expect(result).toEqual({
        status: 'ok',
        message: 'TOEIC AI API is running',
        timestamp: expect.any(String),
        version: '1.0.0',
      });
    });
  });

  describe('getDetailedHealth', () => {
    it('should return detailed health information', () => {
      const result = controller.getDetailedHealth();
      
      expect(result).toEqual({
        status: 'healthy',
        timestamp: expect.any(String),
        uptime: expect.any(Number),
        environment: expect.any(String),
        version: '1.0.0',
        memory: {
          used: expect.any(String),
          total: expect.any(String),
        },
      });
    });
  });
});