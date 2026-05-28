import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CourseDto } from './dto/course.dto';
import { Role } from '@prisma/client';

@Injectable()
export class CoursesService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CourseDto) {
    // Verify category exists
    const category = await this.prisma.category.findUnique({
      where: { id: dto.categoryId },
    });
    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return this.prisma.course.create({
      data: {
        title: dto.title,
        description: dto.description,
        thumbnail: dto.thumbnail,
        price: dto.price,
        categoryId: dto.categoryId,
        isPublished: dto.isPublished ?? false,
      },
    });
  }

  async findAll(query?: { search?: string; categoryId?: string; minPrice?: number; maxPrice?: number }) {
    const where: any = {};

    if (query?.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    if (query?.categoryId) {
      where.categoryId = query.categoryId;
    }

    if (query?.minPrice !== undefined || query?.maxPrice !== undefined) {
      where.price = {};
      if (query.minPrice !== undefined) where.price.gte = Number(query.minPrice);
      if (query.maxPrice !== undefined) where.price.lte = Number(query.maxPrice);
    }

    return this.prisma.course.findMany({
      where,
      include: {
        category: true,
        _count: {
          select: { chapters: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, userId?: string, userRole?: Role) {
    const course = await this.prisma.course.findUnique({
      where: { id },
      include: {
        category: true,
        chapters: {
          orderBy: { position: 'asc' },
        },
      },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    // Check enrollment
    let isEnrolled = false;
    let progressPercentage = 0;
    let completedChapters: string[] = [];

    if (userId) {
      if (userRole === Role.ADMIN) {
        isEnrolled = true;
      } else {
        const enrollment = await this.prisma.enrollment.findUnique({
          where: {
            userId_courseId: {
              userId,
              courseId: id,
            },
          },
        });
        if (enrollment) {
          isEnrolled = true;
        }
      }

      if (isEnrolled && course.chapters.length > 0) {
        // Fetch student's progress
        const progress = await this.prisma.userProgress.findMany({
          where: {
            userId,
            chapter: { courseId: id },
            isCompleted: true,
          },
          select: { chapterId: true },
        });

        completedChapters = progress.map((p) => p.chapterId);
        progressPercentage = Math.round((completedChapters.length / course.chapters.length) * 100);
      }
    }

    // If not enrolled, mask non-free chapter details
    const chapters = course.chapters.map((chapter) => {
      if (isEnrolled || chapter.isFree) {
        return chapter;
      }
      return {
        ...chapter,
        content: 'Lock icon. Purchase course to unlock content.',
        videoUrl: null,
      };
    });

    return {
      ...course,
      chapters,
      isEnrolled,
      progressPercentage,
      completedChapters,
    };
  }

  async update(id: string, dto: CourseDto) {
    const course = await this.prisma.course.findUnique({
      where: { id },
    });
    if (!course) {
      throw new NotFoundException('Course not found');
    }

    const category = await this.prisma.category.findUnique({
      where: { id: dto.categoryId },
    });
    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return this.prisma.course.update({
      where: { id },
      data: {
        title: dto.title,
        description: dto.description,
        thumbnail: dto.thumbnail,
        price: dto.price,
        categoryId: dto.categoryId,
        isPublished: dto.isPublished ?? course.isPublished,
      },
    });
  }

  async remove(id: string) {
    const course = await this.prisma.course.findUnique({
      where: { id },
    });
    if (!course) {
      throw new NotFoundException('Course not found');
    }

    return this.prisma.course.delete({
      where: { id },
    });
  }
}
