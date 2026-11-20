import { Application, Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import { MongoError } from 'mongodb';
import { ApplicationError, NotFoundError } from '../utils/http-error.util';
import logger from '../utils/logger';
import HttpResponse from '../constants/response-message.constant';
import HttpStatus from '../constants/httpStatus';

export default function setupErrorHandling(app: Application) {
  // 1. Catch unmatched routes and forward as a 404 ApplicationError
  app.use((req: Request, _res: Response, next: NextFunction) => {
    next(new NotFoundError(`${HttpResponse.PAGE_NOT_FOUND}: ${req.originalUrl}`));
  });

  // 2. Single unified global error handler
  const globalErrorHandler: ErrorRequestHandler = (
    err: Error,
    req: Request,
    res: Response,
    _next: NextFunction
  ) => {
    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string = HttpResponse.SERVER_ERROR;

    // Known operational errors (400, 401, 403, 404, etc.)
    if (err instanceof ApplicationError) {
      statusCode = err.code;
      message = err.message;
    }
    // MongoDB duplicate key error (e.g., duplicate email/username)
    else if (err instanceof MongoError && err.code === 11000) {
      statusCode = HttpStatus.CONFLICT;
      message = 'Duplicate entry already exists';
    }
    // Mongoose invalid ObjectId (e.g., /api/game/not-a-valid-id)
    else if (err.name === 'CastError') {
      statusCode = HttpStatus.BAD_REQUEST;
      message = 'Invalid ID format';
    }

    const logMeta = {
      requestId: req.requestId,
      method: req.method,
      path: req.originalUrl,
      statusCode,
      userId: req.user?.userId || 'anonymous',
    };

    // 5xx = Server bug (log full stack trace as error)
    // 4xx = Client mistake (log as warn, no need to spam stack traces)
    if (statusCode >= 500) {
      logger.error(err.message, { ...logMeta, stack: err.stack });
    } else {
      logger.warn(message, logMeta);
    }

    if (!res.headersSent) {
      res.status(statusCode).json({
        success: false,
        error: {
          message:
            statusCode >= 500 && process.env.NODE_ENV === 'production'
              ? HttpResponse.SERVER_ERROR
              : message,
          requestId: req.requestId,
        },
      });
    }
  };

  app.use(globalErrorHandler);
}
