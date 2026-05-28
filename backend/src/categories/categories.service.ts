import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CategoryDto } from './dto/category.dto';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CategoryDto) {
    const existing = await this.prisma.category.findUnique({
      where: { name: dto.name },
    });
    if (existing) {
      throw new ConflictException('Category with this name already exists');
    }
    return this.prisma.category.create({
      data: { name: dto.name },
    });
  }

  async findAll() {
    return this.prisma.category.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async update(id: string, dto: CategoryDto) {
    const category = await this.prisma.category.findUnique({
      where: { id },
    });
    if (!category) {
      throw new NotFoundException('Category not found');
    }
    const duplicate = await this.prisma.category.findFirst({
      where: { name: dto.name, NOT: { id } },
    });
    if (duplicate) {
      throw new ConflictException('Category with this name already exists');
    }
    return this.prisma.category.update({
      where: { id },
      data: { name: dto.name },
    });
  }

  async remove(id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
    });
    if (!category) {
      throw new NotFoundException('Category not found');
    }
    return this.prisma.category.delete({
      where: { id },
    });
  }
}
