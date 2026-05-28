import { IsNotEmpty, IsString, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CheckoutDto {
  @ApiProperty({ example: 'uuid-of-course' })
  @IsUUID()
  @IsNotEmpty()
  courseId: string;

  @ApiProperty({ example: 'QRIS', default: 'BANK_TRANSFER' })
  @IsString()
  @IsNotEmpty()
  paymentMethod: string;
}
