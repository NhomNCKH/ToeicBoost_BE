import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public } from './common/decorators/public.decorator';

@ApiTags('Health Check')
@Controller()
export class AppController {
  @Public()
  @Get()
  @ApiOperation({
    summary: 'Health check endpoint',
    description: 'Simple health check to verify API is running',
  })
  @ApiResponse({
    status: 200,
    description: 'API is healthy',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'ok' },
        message: { type: 'string', example: 'TOEIC AI API is running' },
        timestamp: { type: 'string', example: '2026-03-18T14:30:00.000Z' },
        version: { type: 'string', example: '1.0.0' },
      },
    },
  })
  getHealth() {
    return {
      status: 'ok',
      message: 'TOEIC AI API is running',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    };
  }

  @Public()
  @Get('health')
  @ApiOperation({
    summary: 'Detailed health check',
    description: 'Detailed health check with system information',
  })
  @ApiResponse({
    status: 200,
    description: 'Detailed health information',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'healthy' },
        timestamp: { type: 'string', example: '2026-03-18T14:30:00.000Z' },
        uptime: { type: 'number', example: 3600.123 },
        environment: { type: 'string', example: 'development' },
        version: { type: 'string', example: '1.0.0' },
        memory: {
          type: 'object',
          properties: {
            used: { type: 'string', example: '45.2 MB' },
            total: { type: 'string', example: '128 MB' },
          },
        },
      },
    },
  })
  getDetailedHealth() {
    const memoryUsage = process.memoryUsage();
    
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: '1.0.0',
      memory: {
        used: `${Math.round(memoryUsage.heapUsed / 1024 / 1024 * 100) / 100} MB`,
        total: `${Math.round(memoryUsage.heapTotal / 1024 / 1024 * 100) / 100} MB`,
      },
    };
  }
}