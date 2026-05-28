import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProgressService {
  constructor(private prisma: PrismaService) {}

  async updateProgress(userId: string, courseId: string, chapterId: string, isCompleted: boolean) {
    // 1. Verify enrollment
    const enrollment = await this.prisma.enrollment.findUnique({
      where: {
        userId_courseId: { userId, courseId },
      },
    });
    if (!enrollment) {
      throw new ForbiddenException('You must be enrolled in this course to track progress');
    }

    // 2. Verify chapter exists and belongs to course
    const chapter = await this.prisma.chapter.findUnique({
      where: { id: chapterId },
    });
    if (!chapter || chapter.courseId !== courseId) {
      throw new NotFoundException('Chapter not found in this course');
    }

    // 3. Upsert progress
    await this.prisma.userProgress.upsert({
      where: { userId_chapterId: { userId, chapterId } },
      update: { isCompleted },
      create: { userId, chapterId, isCompleted },
    });

    // 4. Calculate total progress
    return this.getProgress(userId, courseId);
  }

  async getProgress(userId: string, courseId: string) {
    // Check enrollment
    const enrollment = await this.prisma.enrollment.findUnique({
      where: {
        userId_courseId: { userId, courseId },
      },
    });
    if (!enrollment) {
      throw new ForbiddenException('You must be enrolled in this course to view progress');
    }

    const totalChapters = await this.prisma.chapter.count({
      where: { courseId },
    });

    if (totalChapters === 0) {
      return {
        completedChapters: [],
        progressPercentage: 0,
      };
    }

    const completed = await this.prisma.userProgress.findMany({
      where: {
        userId,
        chapter: { courseId },
        isCompleted: true,
      },
      select: { chapterId: true },
    });

    const completedIds = completed.map((c) => c.chapterId);
    const progressPercentage = Math.round((completedIds.length / totalChapters) * 100);

    return {
      completedChapters: completedIds,
      progressPercentage,
    };
  }
}
