import { IsNotEmpty, IsString, IsNumber, IsOptional, IsBoolean, IsUUID, Min, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CourseDto {
  @ApiProperty({ example: 'NestJS for Beginners' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'Learn NestJS architecture, controllers, services, and modules step by step.' })
  @IsString()
  @IsNotEmpty()
  @MinLength(10, { message: 'Description must be at least 10 characters long' })
  description: string;

  @ApiProperty({ example: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97', required: false })
  @IsString()
  @IsOptional()
  thumbnail?: string;

  @ApiProperty({ example: 150000 })
  @IsNumber()
  @IsNotEmpty()
  @Min(0, { message: 'Price cannot be negative' })
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
