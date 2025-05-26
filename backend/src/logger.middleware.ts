import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
    use(req: Request, res: Response, next: NextFunction) {
        const startTime = process.hrtime();

        res.on('finish', () => {
            const [seconds, nanoseconds] = process.hrtime(startTime);
            const durationMs = (seconds * 1e3 + nanoseconds / 1e6).toFixed(2);

            const path = req.originalUrl || '';
            const originRaw = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
            const origin = String(originRaw).split(',')[0]; // Handle array or comma-separated values

            const statusCode = res.statusCode;

            // Colorize status code
            let statusColor: string;
            if (statusCode >= 500) statusColor = '\x1b[31m'; // Red
            else if (statusCode >= 400) statusColor = '\x1b[33m'; // Yellow
            else if (statusCode >= 300) statusColor = '\x1b[36m'; // Cyan
            else statusColor = '\x1b[32m'; // Green

            const resetColor = '\x1b[0m';

            console.log(
                `${new Date().toISOString()} | ` +
                `${origin.padEnd(15)} -> ` +
                `${path.padEnd(30)} | ` +
                `Status: ${statusColor}${statusCode}${resetColor} | ` +
                `Time: ${durationMs} ms`
            );
        });

        next();
    }
}