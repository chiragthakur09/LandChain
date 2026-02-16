
import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
    catch(exception: unknown, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();

        let status = HttpStatus.INTERNAL_SERVER_ERROR;
        let message = 'Internal server error';
        let errorCode = 'INTERNAL_ERROR';

        if (exception instanceof HttpException) {
            status = exception.getStatus();
            const responseBody: any = exception.getResponse();
            message = responseBody.message || exception.message;
            errorCode = responseBody.error || 'HTTP_ERROR';
        } else if (exception instanceof Error) {
            // Fabric Errors often come as generic Errors but with specific strings
            if (exception.message.includes('Usage Error') || exception.message.includes('Usage error')) {
                status = HttpStatus.BAD_REQUEST;
                errorCode = 'CHAINCODE_USAGE_ERROR';
            } else if (exception.message.includes('Asset not found')) {
                status = HttpStatus.NOT_FOUND;
                errorCode = 'ASSET_NOT_FOUND';
            }
            message = exception.message;
        }

        response
            .status(status)
            .json({
                statusCode: status,
                timestamp: new Date().toISOString(),
                path: request.url,
                errorCode: errorCode,
                message: message,
            });
    }
}
