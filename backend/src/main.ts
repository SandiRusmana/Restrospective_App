import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import express from 'express';
import { AppModule } from './app.module';

let cachedServer: express.Express;

async function bootstrapServer(expressInstance: express.Express) {
  const app = await NestFactory.create(
    AppModule,
    new ExpressAdapter(expressInstance),
  );

  // Set Prefix Global API (/api/...)
  app.setGlobalPrefix('api');

  // Setup Global Validation Pipe (class-validator)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Enable CORS untuk koneksi dari Frontend React
  app.enableCors({
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  await app.init();
  return app;
}

// Local standalone server boot (ketika bukan di Vercel Serverless)
async function bootstrapLocal() {
  const server = express();
  const app = await bootstrapServer(server);
  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 3000);

  await app.listen(port);
  console.log(`Backend NestJS berjalan di port ${port} dengan prefix /api`);
}

if (!process.env.VERCEL) {
  bootstrapLocal();
}

// Serverless Handler untuk Vercel
export default async function handler(req: any, res: any) {
  if (!cachedServer) {
    cachedServer = express();
    await bootstrapServer(cachedServer);
  }
  return cachedServer(req, res);
}

