import { Controller, Post, Get, Body, Req, UseGuards } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('quiz')
@UseGuards(JwtAuthGuard)
export class QuizController {
  constructor(private prisma: PrismaService) {}

  @Post()
  async saveScore(@Req() req: any, @Body() body: { chapterId: string; score: number }) {
    const userId = req.user.userId;

    return this.prisma.quizResult.upsert({
      where: { userId_chapterId: { userId, chapterId: body.chapterId } },
      update: { score: body.score },
      create: { userId, chapterId: body.chapterId, score: body.score }
    });
  }

  @Get('me')
  async getMyScores(@Req() req: any) {
    return this.prisma.quizResult.findMany({
      where: { userId: req.user.userId },
      include: {
        chapter: {
          select: { title: true, course: { select: { title: true } } }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }
}
