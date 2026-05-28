import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CheckoutDto } from './dto/checkout.dto';
import { Role, TransactionStatus } from '@prisma/client';

@Injectable()
export class TransactionsService {
  constructor(private prisma: PrismaService) {}

  async checkout(userId: string, dto: CheckoutDto) {
    // 1. Verify course exists
    const course = await this.prisma.course.findUnique({
      where: { id: dto.courseId },
    });
    if (!course) {
      throw new NotFoundException('Course not found');
    }

    // 2. Check if already enrolled
    const enrollment = await this.prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId: dto.courseId,
        },
      },
    });
    if (enrollment) {
      throw new BadRequestException('You are already enrolled in this course');
    }

    // 3. If course is free (price = 0), enroll immediately
    if (course.price === 0) {
      return this.prisma.$transaction(async (tx) => {
        const trans = await tx.transaction.create({
          data: {
            userId,
            courseId: dto.courseId,
            amount: 0,
            status: TransactionStatus.SUCCESS,
            paymentMethod: dto.paymentMethod,
          },
        });

        await tx.enrollment.create({
          data: {
            userId,
            courseId: dto.courseId,
          },
        });

        return {
          ...trans,
          message: 'Enrolled in free course successfully',
        };
      });
    }

    // 4. Check if there's already a PENDING transaction
    const existingPending = await this.prisma.transaction.findFirst({
      where: {
        userId,
        courseId: dto.courseId,
        status: TransactionStatus.PENDING,
      },
    });
    if (existingPending) {
      return existingPending;
    }

    // 5. Create new PENDING transaction
    return this.prisma.transaction.create({
      data: {
        userId,
        courseId: dto.courseId,
        amount: course.price,
        status: TransactionStatus.PENDING,
        paymentMethod: dto.paymentMethod,
      },
    });
  }

  async pay(userId: string, id: string) {
    const transaction = await this.prisma.transaction.findUnique({
      where: { id },
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    if (transaction.userId !== userId) {
      throw new ForbiddenException('You do not own this transaction');
    }

    if (transaction.status !== TransactionStatus.PENDING) {
      throw new BadRequestException(`Transaction cannot be paid because status is ${transaction.status}`);
    }

    // Process payment atomically
    return this.prisma.$transaction(async (tx) => {
      const updatedTrans = await tx.transaction.update({
        where: { id },
        data: { status: TransactionStatus.SUCCESS },
      });

      await tx.enrollment.create({
        data: {
          userId: transaction.userId,
          courseId: transaction.courseId,
        },
      });

      return {
        ...updatedTrans,
        message: 'Course purchased successfully. Access unlocked.',
      };
    });
  }

  async findAll(userId: string, userRole: Role) {
    if (userRole === Role.ADMIN) {
      return this.prisma.transaction.findMany({
        include: {
          user: {
            select: { name: true, email: true },
          },
          course: {
            select: { title: true, price: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    }

    // Student only sees their own transactions
    return this.prisma.transaction.findMany({
      where: { userId },
      include: {
        course: {
          select: { title: true, thumbnail: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
