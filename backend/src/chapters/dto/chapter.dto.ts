import { IsNotEmpty, IsString, IsNumber, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChapterDto {
  @ApiProperty({ example: 'Introduction to NestJS CLI' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'In this chapter, you will learn how to initialize projects with Nest CLI.', required: false })
  @IsString()
  @IsOptional()
  content?: string;

  @ApiProperty({ example: 'https://www.youtube.com/embed/dQw4w9WgXcQ', required: false })
  @IsString()
  @IsOptional()
  videoUrl?: string;

  @ApiProperty({ example: 1 })
  @IsNumber()
  @IsNotEmpty()
  position: number;

  @ApiProperty({ example: false, default: false, required: false })
  @IsBoolean()
  @IsOptional()
  isFree?: boolean;
}
