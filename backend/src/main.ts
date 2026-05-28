import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as dotenv from 'dotenv';

dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS
  app.enableCors({
    origin: true, // or specify frontend URL like http://localhost:3000
    credentials: true,
  });

  // Set global API prefix
  app.setGlobalPrefix('api');

  // Configure global validation pipes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  // Setup Swagger OpenAPI Document
  const config = new DocumentBuilder()
    .setTitle('DevAcademy E-Learning API')
    .setDescription('The API documentation for DevAcademy (EduCode) Premium Coding E-Learning Platform')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
    
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 8000;
  await app.listen(port);
  console.log(`🚀 NestJS Backend running on: http://localhost:${port}/api`);
  console.log(`📄 Swagger API Documentation available at: http://localhost:${port}/api/docs`);
}
bootstrap();
