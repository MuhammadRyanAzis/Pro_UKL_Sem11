import { Controller, Post, Body, Get, Param, UseGuards } from '@nestjs/common';
import { ProgressService } from './progress.service';
import { ProgressDto } from './dto/progress.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Progress')
@Controller('courses/:courseId')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class ProgressController {
  constructor(private progressService: ProgressService) {}

  @Post('chapters/:chapterId/progress')
  @ApiOperation({ summary: 'Update progress of a chapter (complete/uncomplete)' })
  async updateProgress(
    @GetUser('sub') userId: string,
    @Param('courseId') courseId: string,
    @Param('chapterId') chapterId: string,
    @Body() dto: ProgressDto,
  ) {
    return this.progressService.updateProgress(userId, courseId, chapterId, dto.isCompleted);
  }

  @Get('progress')
  @ApiOperation({ summary: 'Get current student progress for a course' })
  async getProgress(@GetUser('sub') userId: string, @Param('courseId') courseId: string) {
    return this.progressService.getProgress(userId, courseId);
  }
}
