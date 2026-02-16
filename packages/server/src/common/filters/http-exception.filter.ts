import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
    catch(exception: unknown, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();

        let status = HttpStatus.INTERNAL_SERVER_ERROR;
        let message = 'Internal server error';

        if (exception instanceof HttpException) {
            status = exception.getStatus();
            const responseBody: any = exception.getResponse();
            message = typeof responseBody === 'object' && responseBody.message
                ? responseBody.message
                : responseBody;
        } else if (exception instanceof Error) {
            // Handle Fabric Errors (which often come as generic Errors with messages)
            message = exception.message;
            if (message.includes('Asset') && message.includes('not found')) {
                status = HttpStatus.NOT_FOUND;
            } else if (message.includes('already exists')) {
                status = HttpStatus.CONFLICT;
            } else if (message.includes('Transfer Denied') || message.includes('Asset is LOCKED')) {
                status = HttpStatus.FORBIDDEN;
            } else {
                status = HttpStatus.BAD_REQUEST; // Default to 400 for logic errors
            }
        }

        response
            .status(status)
            .json({
                statusCode: status,
                timestamp: new Date().toISOString(),
                path: request.url,
                message: message,
            });
    }
}
