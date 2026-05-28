import { Controller, Post, Body, Get, Put, Param, Delete, UseGuards, Query, Req } from '@nestjs/common';
import { CoursesService } from './courses.service';
import { CourseDto } from './dto/course.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { Request } from 'express';
import { JwtService } from '@nestjs/jwt';

@ApiTags('Courses')
@Controller('courses')
export class CoursesController {
  constructor(
    private coursesService: CoursesService,
    private jwtService: JwtService,
  ) {}

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Create a new course (Admin only)' })
  async create(@Body() dto: CourseDto) {
    return this.coursesService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all courses with optional search/filters' })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'categoryId', required: false, type: String })
  @ApiQuery({ name: 'minPrice', required: false, type: Number })
  @ApiQuery({ name: 'maxPrice', required: false, type: Number })
  async findAll(
    @Query('search') search?: string,
    @Query('categoryId') categoryId?: string,
    @Query('minPrice') minPrice?: number,
    @Query('maxPrice') maxPrice?: number,
  ) {
    return this.coursesService.findAll({ search, categoryId, minPrice, maxPrice });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a course by ID (shows unlocked/locked chapters depending on enrollment)' })
  async findOne(@Param('id') id: string, @Req() req: any) {
    const authHeader = req.headers.authorization;
    let userId: string | undefined;
    let userRole: Role | undefined;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      try {
        const payload = await this.jwtService.verifyAsync(token, {
          secret: process.env.JWT_SECRET || 'rahasia-super-aman-dan-rahasia',
        });
        userId = payload.sub;
        userRole = payload.role;
      } catch (err) {
        // Skip invalid tokens and treat user as Guest
      }
    }

    return this.coursesService.findOne(id, userId, userRole);
  }

  @Put(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Update a course (Admin only)' })
  async update(@Param('id') id: string, @Body() dto: CourseDto) {
    return this.coursesService.update(id, dto);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Delete a course (Admin only)' })
  async remove(@Param('id') id: string) {
    return this.coursesService.remove(id);
  }
}
