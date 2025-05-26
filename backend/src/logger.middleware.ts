import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
    use(req: Request, res: Response, next: NextFunction) {
        res.on('finish', () => {
            const path = req.originalUrl;
            const origin = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
            const statusCode = res.statusCode;
            console.log(`[${new Date().toISOString()}] ${origin} -> ${path} [${statusCode}]`);
        });

        next();
    }
}