import { Controller, Post, Body, Get, Param, UseGuards } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { CheckoutDto } from './dto/checkout.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { Role } from '@prisma/client';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Transactions')
@Controller('transactions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class TransactionsController {
  constructor(private transactionsService: TransactionsService) {}

  @Post('checkout')
  @ApiOperation({ summary: 'Initiate a checkout for a course' })
  async checkout(@GetUser('sub') userId: string, @Body() dto: CheckoutDto) {
    return this.transactionsService.checkout(userId, dto);
  }

  @Post(':id/pay')
  @ApiOperation({ summary: 'Simulate payment for a pending transaction' })
  async pay(@GetUser('sub') userId: string, @Param('id') id: string) {
    return this.transactionsService.pay(userId, id);
  }

  @Get()
  @ApiOperation({ summary: 'Get transaction history (Admin sees all, Student sees their own)' })
  async findAll(@GetUser('sub') userId: string, @GetUser('role') role: Role) {
    return this.transactionsService.findAll(userId, role);
  }
}
