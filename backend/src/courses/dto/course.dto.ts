import { IsNotEmpty, IsString, IsNumber, IsOptional, IsBoolean, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CourseDto {
  @ApiProperty({ example: 'NestJS for Beginners' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'Learn NestJS architecture, controllers, services, and modules step by step.' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ example: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97', required: false })
  @IsString()
  @IsOptional()
  thumbnail?: string;

  @ApiProperty({ example: 150000 })
  @IsNumber()
  @IsNotEmpty()
  price: number;

  @ApiProperty({ example: 'uuid-of-category' })
  @IsUUID()
  @IsNotEmpty()
  categoryId: string;

  @ApiProperty({ example: true, required: false, default: false })
  @IsBoolean()
  @IsOptional()
  isPublished?: boolean;
}
