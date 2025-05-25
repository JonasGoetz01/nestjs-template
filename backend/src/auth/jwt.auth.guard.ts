import { ExecutionContext, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from '@nestjs/passport'
import * as jwt from 'jsonwebtoken';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
    constructor(private readonly configService: ConfigService) {
        super();
    }

    canActivate(context: ExecutionContext): boolean {
        const request = context.switchToHttp().getRequest();
        const token = request.cookies['token'];
        if (!token) {
            return false;
        }
        try {
            const decoded = jwt.verify(token, this.configService.get<string>('JWT_SECRET') ?? '');
            if (!decoded) {
                return false;
            }
            request.user = decoded;
            return true;
        } catch (error) {
            return false;
        }
    }
}