import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport'
import { JwtModule } from '@nestjs/jwt';
import { JwtAuthGuard } from './jwt.auth.guard';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';

@Module({
    imports: [
        PassportModule,
        ConfigModule,
        JwtModule.registerAsync({
            useFactory: (configService: ConfigService) => {
              return {
                global: true,
                secret: configService.get<string>('JWT_SECRET'),
                signOptions: { expiresIn: 40000 },
              }
            },
            inject: [ConfigService],
          }),
    ],
    providers: [JwtAuthGuard, AuthService],
    controllers: [AuthController],
    exports: [JwtAuthGuard, JwtModule]
})
export class AuthModule {}
