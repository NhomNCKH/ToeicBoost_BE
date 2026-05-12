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
    summary: 'Tạo URL pre-signed PUT để FE tải file trực tiếp lên S3',
    description:
      'Backend trả về signedPutUrl và s3Key. FE dùng signedPutUrl để PUT file trực tiếp lên S3, sau đó gọi API khác để cập nhật DB với s3Key.',
  })
  @ApiBody({ type: PresignPutDto })
  presignPut(@CurrentUser('sub') userId: string, @Body() dto: PresignPutDto) {
    return this.mediaService.presignPutMedia(
      userId,
      dto.category ?? 'media',
      dto.contentType,
      dto.fileName,
      dto.expiresInSeconds,
    );
  }

  @Post('presign-get')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Tạo URL pre-signed GET để FE xem file',
    description:
      'Dùng khi bucket hoặc object không public. FE mở bằng signedGetUrl để xem file.',
  })
  @ApiBody({ type: PresignGetDto })
  @ApiResponse({ status: 200, description: 'Tạo signed GET thành công' })
  presignGet(@CurrentUser('sub') userId: string, @Body() dto: PresignGetDto) {
    // userId hiện chưa dùng trong validate prefix; giữ để mở rộng sau
    return this.mediaService.presignGetImage(dto.s3Key, dto.expiresInSeconds);
  }

  @Post('data-url')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Đọc object S3 và trả về dạng base64 dataURL',
    description:
      'BE proxy object S3 -> base64 dataURL. Dùng cho FE inline ảnh vào DOM ' +
      'khi render html2canvas (avatar, QR chứng chỉ), tránh CORS/403 do ' +
      'bucket S3 không public hoặc thiếu CORS.',
  })
  @ApiBody({ type: PresignGetDto })
  @ApiResponse({ status: 200, description: 'Trả về dataUrl base64' })
  getDataUrl(@Body() dto: PresignGetDto) {
    return this.mediaService.getObjectAsDataUrl(dto.s3Key);
  }
}
