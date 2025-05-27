import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';
import * as cookieParser from 'cookie-parser'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConsoleLogger, Logger } from '@nestjs/common';
import { ArgumentOutOfRangeError } from 'rxjs';
declare const module: any;

async function bootstrap() {
  dotenv.config()
  const app = await NestFactory.create(AppModule);
  app.use(cookieParser());
  app.useLogger(new Logger())

  const config = new DocumentBuilder()
    .setTitle('NestJS Backend API')
    .setDescription(`
      ## 🚀 Comprehensive Backend API
      
      A full-featured backend API built with NestJS, featuring:
      
      ### 🔐 Authentication & Authorization
      - JWT-based authentication with Supabase
      - Role-based access control (public, user, admin)
      - HTTP-only cookie sessions
      - Multiple authentication schemes supported
      
      ### 👥 User Management
      - **Public View**: Minimal user information (id, masked email, role, verification status)
      - **Authenticated View**: Personal profile data (full email, phone, metadata, timestamps)
      - **Admin View**: Comprehensive administrative data (all fields except sensitive tokens)
      - Smart permission-based view selection
      
      ### 📁 File Storage
      - Supabase Storage integration
      - File upload with metadata tracking
      - Category-based organization (document, image, video, audio, archive)
      - Folder management and signed URLs
      - Storage analytics and statistics
      
      ### 🛡️ Security Features
      - Automatic sensitive data exclusion
      - Email masking in public views
      - Token protection (auth tokens never exposed)
      - Permission validation with graceful fallbacks
      
      ### 📊 API Features
      - Comprehensive Swagger documentation
      - Type-safe request/response schemas
      - Detailed error responses
      - Query parameter filtering and pagination
    `)
    .setVersion('1.0')
    .setContact(
      'API Support',
      'https://github.com/your-repo',
      'support@yourapi.com'
    )
    .setLicense(
      'MIT',
      'https://opensource.org/licenses/MIT'
    )
    .addServer('http://localhost:3000', 'Development Server')
    .addServer('https://your-api.com', 'Production Server')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token (obtained from /auth/login)',
        in: 'header',
      },
      'JWT-auth',
    )
    .addCookieAuth('token', {
      type: 'apiKey',
      in: 'cookie',
      name: 'token',
      description: 'Authentication cookie (automatically set by /auth/login)',
    })
    .addTag('Authentication', 'User authentication and session management')
    .addTag('Users', 'User management with role-based data views')
    .addTag('Files', 'File storage and management with Supabase Storage')
    .build();

  const documentFactory = () => SwaggerModule.createDocument(app, config, {
    operationIdFactory: (
      controllerKey: string,
      methodKey: string
    ) => methodKey
  });

  SwaggerModule.setup('api', app, documentFactory, {
    customSiteTitle: 'NestJS API Documentation',
    customfavIcon: '/favicon.ico',
    customCss: `
      .swagger-ui .topbar { display: none }
      .swagger-ui .info { margin: 20px 0 }
      .swagger-ui .info .title { color: #3b82f6 }
    `,
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      filter: true,
      showExtensions: true,
      showCommonExtensions: true,
      docExpansion: 'list',
      defaultModelsExpandDepth: 2,
      defaultModelExpandDepth: 2,
    }
  });

  await app.listen(process.env.PORT ?? 3000);

  console.log(`
🚀 Application is running on: http://localhost:${process.env.PORT ?? 3000}
📚 Swagger UI available at: http://localhost:${process.env.PORT ?? 3000}/api
  `);

  if (module.hot) {
    module.hot.accept();
    module.hot.dispose(() => app.close());
  }
}
bootstrap();
