import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import type { Express } from 'express';
import { memoryStorage } from 'multer';
import { Roles } from '@common/decorators/roles.decorator';
import { UserInfo } from '@common/decorators/user-info.decorator';
import { UserRole } from '@common/constants/user.enum';
import { IJwtPayload } from '@common/interfaces/jwt-payload.interface';
import { CreateTimiSessionDto, TimiTextTurnDto } from './dto/timi.dto';
import { TimiService } from './timi.service';

const MAX_AUDIO_BYTES = 8 * 1024 * 1024;

@ApiTags('Learner Timi (AI Speaking Tutor)')
@ApiBearerAuth()
@Roles(UserRole.LEARNER, UserRole.ADMIN, UserRole.SUPERADMIN)
@Controller('learner/timi')
export class TimiController {
  constructor(private readonly timiService: TimiService) {}

  @Post('sessions')
  @ApiOperation({ summary: 'Tạo phiên trò chuyện 1:1 với Timi' })
  createSession(
    @Body() dto: CreateTimiSessionDto,
    @UserInfo() user: IJwtPayload,
  ) {
    return this.timiService.createSession(user.sub, dto);
  }

  @Get('sessions/:id/turns')
  @ApiOperation({ summary: 'Lấy lịch sử trò chuyện của một phiên' })
  listTurns(
    @Param('id', new ParseUUIDPipe()) id: string,
    @UserInfo() user: IJwtPayload,
  ) {
    return this.timiService.listTurns(user.sub, id);
  }

  @Delete('sessions/:id')
  @ApiOperation({ summary: 'Đóng phiên trò chuyện' })
  closeSession(
    @Param('id', new ParseUUIDPipe()) id: string,
    @UserInfo() user: IJwtPayload,
  ) {
    return this.timiService.closeSession(user.sub, id);
  }

  @Post('sessions/:id/turns/audio')
  @ApiOperation({
    summary: 'Gửi 1 lượt nói (audio) — STT + LLM + TTS',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: MAX_AUDIO_BYTES },
    }),
  )
  submitAudioTurn(
    @Param('id', new ParseUUIDPipe()) id: string,
    @UserInfo() user: IJwtPayload,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('Thiếu file audio');
    }
    return this.timiService.submitAudioTurn(user.sub, id, {
      buffer: file.buffer,
      mimeType: file.mimetype || 'audio/webm',
      filename: file.originalname || 'audio.webm',
    });
  }

  @Post('sessions/:id/turns/text')
  @ApiOperation({
    summary: 'Gửi 1 lượt bằng text (fallback khi không dùng mic)',
  })
  submitTextTurn(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: TimiTextTurnDto,
    @UserInfo() user: IJwtPayload,
  ) {
    return this.timiService.submitTextTurn(user.sub, id, dto.text);
  }
}
