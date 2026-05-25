import {
  Body,
  Controller,
  Delete,
  FileTypeValidator,
  Get,
  MaxFileSizeValidator,
  Param,
  ParseFilePipe,
  ParseUUIDPipe,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import type { JwtUserPayload } from '../auth/types/jwt-user-payload';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { UserRole } from '../database/entities';
import { BlogService, type BlogImageUploadFile } from './blog.service';
import { CreateBlogPostDto } from './dto/create-blog-post.dto';
import { UpdateBlogPostDto } from './dto/update-blog-post.dto';
import { UpdateBlogPostScheduleDto } from './dto/update-blog-post-schedule.dto';

const BLOG_IMAGE_MAX_BYTES = 5 * 1024 * 1024;

@Controller('blog')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class BlogController {
  constructor(private readonly blogService: BlogService) {}

  @Post('posts/images')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.CONTENT_ADMIN)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: BLOG_IMAGE_MAX_BYTES },
    }),
  )
  uploadPostImage(
    @CurrentUser() user: JwtUserPayload,
    @UploadedFile(
      new ParseFilePipe({
        fileIsRequired: true,
        validators: [
          new MaxFileSizeValidator({ maxSize: BLOG_IMAGE_MAX_BYTES }),
          new FileTypeValidator({
            fileType: new RegExp(
              '^(image/jpeg|image/jpg|image/pjpeg|image/png|image/webp|application/octet-stream)$',
            ),
          }),
        ],
      }),
    )
    file: BlogImageUploadFile,
  ) {
    return this.blogService.uploadBlogImage(user, file);
  }

  @Post('posts')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.CONTENT_ADMIN)
  create(@CurrentUser() user: JwtUserPayload, @Body() dto: CreateBlogPostDto) {
    return this.blogService.create(user, dto);
  }

  @Get('posts')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.CONTENT_ADMIN)
  list(@CurrentUser() user: JwtUserPayload) {
    return this.blogService.listAdmin(user);
  }

  @Patch('posts/:id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.CONTENT_ADMIN)
  update(
    @CurrentUser() user: JwtUserPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateBlogPostDto,
  ) {
    return this.blogService.update(user, id, dto);
  }

  @Delete('posts/:id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.CONTENT_ADMIN)
  delete(
    @CurrentUser() user: JwtUserPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.blogService.delete(user, id);
  }

  @Patch('posts/:id/schedule')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.CONTENT_ADMIN)
  reschedule(
    @CurrentUser() user: JwtUserPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateBlogPostScheduleDto,
  ) {
    return this.blogService.rescheduleBlogPost(user, id, dto.scheduledAt);
  }
}
