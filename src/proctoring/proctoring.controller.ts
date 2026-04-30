// src/proctoring/proctoring.controller.ts
import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { IJwtPayload } from '../common/interfaces/jwt-payload.interface';
import { GetViolationsQueryDto } from './dto/get-violations-query.dto';
import { ReportViolationDto } from './dto/report-violation.dto';
import { ProctoringService } from './proctoring.service';

interface RequestWithUser extends Request {
  user: IJwtPayload;
}

@Controller('proctoring')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProctoringController {
  constructor(private readonly proctoringService: ProctoringService) {}

  @Get('status/:userId/:examId')
  async getStatus(
    @Param('userId') userId: string,
    @Param('examId') examIdentifier: string,
    @Req() req: RequestWithUser,
  ) {
    if (!userId || !examIdentifier) {
      throw new BadRequestException('userId and examId are required');
    }

    if (!this.canAccessUserProctoring(req.user, userId)) {
      throw new ForbiddenException('You are not allowed to access this status');
    }

    return this.proctoringService.getStatus(userId, examIdentifier);
  }

  @Get('violations/:userId/:examId')
  @Roles('admin', 'proctor')
  async getViolations(
    @Param('userId') userId: string,
    @Param('examId') examIdentifier: string,
    @Query() queryDto: GetViolationsQueryDto,
  ) {
    if (!userId || !examIdentifier) {
      throw new BadRequestException('userId and examId are required');
    }

    const result = await this.proctoringService.getViolationHistoryPaginated(
      userId,
      examIdentifier,
      queryDto.limit,
      queryDto.offset,
    );

    return {
      total: result.total,
      limit: queryDto.limit,
      offset: queryDto.offset,
      data: result.data,
    };
  }

  @Get('violations')
  @Roles('admin', 'proctor')
  async listViolations(@Query() queryDto: GetViolationsQueryDto) {
    const result = await this.proctoringService.listViolationHistoryPaginated(
      queryDto.limit,
      queryDto.offset,
      {
        userId: queryDto.userId,
        examId: queryDto.examId,
      },
    );

    return {
      total: result.total,
      limit: queryDto.limit,
      offset: queryDto.offset,
      data: result.data,
    };
  }

  @Post('report-violation')
  async reportViolation(@Body() dto: ReportViolationDto) {
    if (
      !dto.userId ||
      (!dto.examId && !dto.examAttemptId) ||
      !dto.violations ||
      dto.violations.length === 0
    ) {
      throw new BadRequestException('Invalid violation report');
    }

    await this.proctoringService.handleViolation({
      user_id: dto.userId,
      exam_id: dto.examId,
      exam_attempt_id: dto.examAttemptId,
      violations: dto.violations,
      timestamp: dto.timestamp ?? new Date().toISOString(),
    });

    return {
      success: true,
      message: 'Violation reported successfully',
    };
  }

  private canAccessUserProctoring(user: IJwtPayload, targetUserId: string): boolean {
    if (!user) {
      return false;
    }

    if (user.sub === targetUserId) {
      return true;
    }

    const roles = new Set(user.roles?.length ? user.roles : [user.role]);
    return (
      roles.has('superadmin') || roles.has('admin') || roles.has('proctor')
    );
  }
}
