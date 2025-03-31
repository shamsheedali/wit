import { Application, Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import { NotFoundError, ApplicationError } from '../utils/http-error.util';
import { MongoError } from 'mongodb';
import log from '../utils/logger';
import HttpResponse from '../constants/response-message.constant';
import HttpStatus from '../constants/httpStatus';

export default function setupErrorHandling(app: Application) {
  // Handle 404 - Not Found (regular middleware)
  app.use((req: Request, res: Response, next: NextFunction) => {
    next(new NotFoundError(HttpResponse.PAGE_NOT_FOUND));
  });

  // Request error handler for ApplicationError
  const applicationErrorHandler: ErrorRequestHandler = (
    error: ApplicationError,
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    if (error instanceof ApplicationError) {
      log.error(error.message, error.stack);
      const statusCode = error.code ?? HttpStatus.INTERNAL_SERVER_ERROR;
      res.status(statusCode).json({ error: error.message || HttpResponse.SERVER_ERROR });
    } else {
      next(error);
    }
  };
  app.use(applicationErrorHandler);

  // Log all errors (including MongoDB errors)
  const mongoErrorHandler: ErrorRequestHandler = (
    err: Error,
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    const userString = 'unknown user';

    if (err instanceof MongoError) {
      if (err.code === 11000) {
        log.error(`${req.method} ${req.path}: MongoDB duplicate entry from ${userString}`);
      } else {
        log.error(`${req.method} ${req.path}: Unhandled MongoDB error from ${userString}. ${err.message}`);
      }
      if (!res.headersSent) {
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: HttpResponse.SERVER_ERROR });
      }
    } else {
      log.error(`${req.method} ${req.path}: Unhandled request error from ${userString}. ${err.message}`);
      next(err);
    }
  };
  app.use(mongoErrorHandler);

  // Final error handler
  const finalErrorHandler: ErrorRequestHandler = (
    err: Error,
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: err.message || HttpResponse.SERVER_ERROR });
  };
  app.use(finalErrorHandler);
}