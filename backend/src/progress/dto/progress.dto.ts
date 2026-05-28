import { IsBoolean, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ProgressDto {
  @ApiProperty({ example: true })
  @IsBoolean()
  @IsNotEmpty()
  isCompleted: boolean;
}
