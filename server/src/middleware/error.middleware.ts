import { Application, Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import { ApplicationError, NotFoundError } from '../utils/http-error.util';
import logger from '../utils/logger';
import HttpResponse from '../constants/response-message.constant';
import HttpStatus from '../constants/httpStatus';

interface ExtendedError extends Error {
  code?: number | string;
  status?: number;
  keyValue?: Record<string, unknown>;
  errors?: Record<string, { message: string }>;
  field?: string;
}

export default function setupErrorHandling(app: Application) {
  // 1. Catch unmatched routes and forward as a 404 ApplicationError
  app.use((req: Request, _res: Response, next: NextFunction) => {
    next(new NotFoundError(`${HttpResponse.PAGE_NOT_FOUND}: ${req.originalUrl}`));
  });

  // 2. Single unified global error handler
  const globalErrorHandler: ErrorRequestHandler = (
    err: ExtendedError,
    req: Request,
    res: Response,
    _next: NextFunction
  ) => {
    let statusCode: number = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string = HttpResponse.SERVER_ERROR;
    let errorCode: string = 'INTERNAL_ERROR';
    let details: unknown;

    // 1. Known operational errors thrown by controllers/services
    if (err instanceof ApplicationError) {
      statusCode = err.statusCode;
      message = err.message;
      errorCode = err.errorCode;
      details = err.details;
    }
    // 2. MongoDB duplicate key error (E11000)
    else if (err.code === 11000) {
      statusCode = HttpStatus.CONFLICT;
      errorCode = 'DUPLICATE_KEY';
      const duplicateField = err.keyValue ? Object.keys(err.keyValue)[0] : undefined;
      message = duplicateField
        ? `${duplicateField} already exists`
        : 'Duplicate entry already exists';
      if (duplicateField) {
        details = { field: duplicateField };
      }
    }
    // 3. Mongoose schema validation error
    else if (err.name === 'ValidationError' && err.errors) {
      statusCode = HttpStatus.BAD_REQUEST;
      errorCode = 'VALIDATION_ERROR';
      message = 'Validation failed';
      details = Object.entries(err.errors).map(([field, val]) => ({
        field,
        message: val.message,
      }));
    }
    // 4. Mongoose invalid ObjectId
    else if (err.name === 'CastError') {
      statusCode = HttpStatus.BAD_REQUEST;
      errorCode = 'INVALID_ID';
      message = 'Invalid ID format';
    }
    // 5. JWT errors
    else if (err.name === 'TokenExpiredError') {
      statusCode = HttpStatus.UNAUTHORIZED;
      errorCode = 'TOKEN_EXPIRED';
      message = 'Token has expired';
    } else if (err.name === 'JsonWebTokenError') {
      statusCode = HttpStatus.UNAUTHORIZED;
      errorCode = 'INVALID_TOKEN';
      message = 'Invalid authentication token';
    }
    // 6. Multer file upload errors
    else if (err.name === 'MulterError') {
      statusCode = HttpStatus.BAD_REQUEST;
      errorCode = 'FILE_UPLOAD_ERROR';
      message = err.message || 'File upload failed';
      if (err.field) {
        details = { field: err.field };
      }
    }
    // 7. Malformed JSON in request body
    else if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
      statusCode = HttpStatus.BAD_REQUEST;
      errorCode = 'INVALID_JSON';
      message = 'Malformed JSON in request body';
    }

    const logMeta = {
      requestId: req.requestId,
      method: req.method,
      path: req.originalUrl,
      statusCode,
      errorCode,
      userId: req.user?.userId || 'anonymous',
    };

    if (statusCode >= 500) {
      logger.error(err.message, { ...logMeta, stack: err.stack });
    } else {
      logger.warn(message, logMeta);
    }

    if (!res.headersSent) {
      const safeMessage =
        statusCode >= 500 && process.env.NODE_ENV === 'production'
          ? HttpResponse.SERVER_ERROR
          : message;

      res.status(statusCode).json({
        success: false,
        message: safeMessage,
        error: {
          code: errorCode,
          ...(details !== undefined && { details }),
        },
        ...(req.requestId && { requestId: req.requestId }),
      });
    }
  };

  app.use(globalErrorHandler);
}
