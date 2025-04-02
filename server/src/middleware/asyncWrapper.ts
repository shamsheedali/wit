import { Request, Response, NextFunction } from 'express';
import { ApplicationError } from '../utils/http-error.util';
import HttpStatus from '../constants/httpStatus';
import log from '../utils/logger';

export default function asyncWrap(controller: CallableFunction) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await controller(req, res, next);
    } catch (error) {
      // If the error is already an ApplicationError, pass it through
      if (error instanceof ApplicationError) {
        next(error);
      } else {
        // Wrap unhandled errors in ApplicationError for consistency
        const wrappedError = new ApplicationError(
          HttpStatus.INTERNAL_SERVER_ERROR,
          error instanceof Error ? error.message : 'Unknown error occurred'
        );
        log.error('Unhandled controller error', error instanceof Error ? error.stack : error);
        next(wrappedError);
      }
    }
  };
}
