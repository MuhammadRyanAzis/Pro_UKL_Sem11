import { Module } from '@nestjs/common';
import { QuizController } from './quiz.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [QuizController]
})
export class QuizModule {}
