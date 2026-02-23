import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.enableCors({ origin: '*' });

  const swagger_config = new DocumentBuilder()
    .setTitle('Customer Success Backend')
    .setDescription('Email ingestion (IMAP) and customer success API')
    .setVersion('1.0')
    .addTag('support-emails', 'Manage monitored email addresses')
    .addTag('emails', 'View ingested emails')
    .addTag('admin-dashboard', 'Admin analytics dashboard')
    .addTag('conversations', 'WhatsApp/Interakt conversations')
    .addTag('chat-messages', 'Chat message operations')
    .addTag('chat-templates', 'Chat template / canned response management')
    .addTag('query-assignments', 'Query assignment and agent dispatch')
    .build();

  const document = SwaggerModule.createDocument(app, swagger_config);
  SwaggerModule.setup('api/docs', app, document);

  const config_service = app.get(ConfigService);
  const port = config_service.get<number>('PORT', 3002);
  await app.listen(port);
}
bootstrap();
