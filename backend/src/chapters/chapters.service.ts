import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ChapterDto } from './dto/chapter.dto';

@Injectable()
export class ChaptersService {
  constructor(private prisma: PrismaService) {}

  async create(courseId: string, dto: ChapterDto) {
    // Validate course exists
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
    });
    if (!course) {
      throw new NotFoundException('Course not found');
    }

    return this.prisma.chapter.create({
      data: {
        title: dto.title,
        content: dto.content,
        videoUrl: dto.videoUrl,
        position: dto.position,
        isFree: dto.isFree ?? false,
        courseId,
      },
    });
  }

  async update(courseId: string, id: string, dto: ChapterDto) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
    });
    if (!course) {
      throw new NotFoundException('Course not found');
    }

    const chapter = await this.prisma.chapter.findUnique({
      where: { id },
    });
    if (!chapter || chapter.courseId !== courseId) {
      throw new NotFoundException('Chapter not found in this course');
    }

    return this.prisma.chapter.update({
      where: { id },
      data: {
        title: dto.title,
        content: dto.content,
        videoUrl: dto.videoUrl,
        position: dto.position,
        isFree: dto.isFree ?? chapter.isFree,
      },
    });
  }

  async remove(courseId: string, id: string) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
    });
    if (!course) {
      throw new NotFoundException('Course not found');
    }

    const chapter = await this.prisma.chapter.findUnique({
      where: { id },
    });
    if (!chapter || chapter.courseId !== courseId) {
      throw new NotFoundException('Chapter not found in this course');
    }

    return this.prisma.chapter.delete({
      where: { id },
    });
  }
}
