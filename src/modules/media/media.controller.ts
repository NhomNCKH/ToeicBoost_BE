import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PresignPutDto } from '@modules/media/dto/presign-put.dto';
import { MediaService } from './media.service';
import { PresignGetDto } from '@modules/media/dto/presign-get.dto';

@ApiTags('Media')
@ApiBearerAuth()
@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post('upload')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Tạo pre-signed PUT URL để FE upload thẳng lên S3',
    description:
      'Backend trả về signedPutUrl và s3Key. FE dùng signedPutUrl để PUT file trực tiếp lên S3. Sau đó module riêng sẽ cập nhật DB với s3Key.',
  })
  @ApiBody({ type: PresignPutDto })
  presignPut(
    @CurrentUser('sub') userId: string,
    @Body() dto: PresignPutDto,
  ) {
    return this.mediaService.presignPutImage(
      userId,
      dto.category ?? 'image',
      dto.contentType,
      dto.fileName,
      dto.expiresInSeconds,
    );
  }

  @Post('presign-get')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Tạo pre-signed GET URL để FE xem ảnh',
    description:
      'Dùng khi bucket/object không public. FE mở bằng signedGetUrl để xem ảnh.',
  })
  @ApiBody({ type: PresignGetDto })
  @ApiResponse({ status: 200, description: 'Tạo signed GET thành công' })
  presignGet(@CurrentUser('sub') userId: string, @Body() dto: PresignGetDto) {
    // userId hiện không dùng trong validate prefix; giữ để mở rộng sau
    return this.mediaService.presignGetImage(dto.s3Key, dto.expiresInSeconds);
  }
}

