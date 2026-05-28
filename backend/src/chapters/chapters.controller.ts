import { Controller, Post, Body, Put, Param, Delete, UseGuards } from '@nestjs/common';
import { ChaptersService } from './chapters.service';
import { ChapterDto } from './dto/chapter.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Chapters')
@Controller('courses/:courseId/chapters')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class ChaptersController {
  constructor(private chaptersService: ChaptersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new chapter for a course (Admin only)' })
  async create(@Param('courseId') courseId: string, @Body() dto: ChapterDto) {
    return this.chaptersService.create(courseId, dto);
  }

  @Put(':chapterId')
  @ApiOperation({ summary: 'Update a chapter inside a course (Admin only)' })
  async update(
    @Param('courseId') courseId: string,
    @Param('chapterId') chapterId: string,
    @Body() dto: ChapterDto,
  ) {
    return this.chaptersService.update(courseId, chapterId, dto);
  }

  @Delete(':chapterId')
  @ApiOperation({ summary: 'Delete a chapter from a course (Admin only)' })
  async remove(@Param('courseId') courseId: string, @Param('chapterId') chapterId: string) {
    return this.chaptersService.remove(courseId, chapterId);
  }
}
