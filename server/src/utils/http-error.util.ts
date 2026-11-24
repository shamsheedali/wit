import HttpStatus from '../constants/httpStatus';

export class ApplicationError extends Error {
  public readonly statusCode: number;
  public readonly errorCode: string;
  public readonly details?: unknown;
  public readonly isOperational: boolean = true;

  constructor(
    statusCode: number,
    message: string = 'An error occurred',
    errorCode: string = 'APPLICATION_ERROR',
    details?: unknown
  ) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.details = details;
    this.name = this.constructor.name;

    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace?.(this, this.constructor);
  }
}

export class BadRequestError extends ApplicationError {
  constructor(message: string = 'Bad request', details?: unknown) {
    super(HttpStatus.BAD_REQUEST, message, 'BAD_REQUEST', details);
  }
}

export class MissingFieldError extends ApplicationError {
  constructor(fieldName: string) {
    super(HttpStatus.BAD_REQUEST, `${fieldName} is required`, 'MISSING_FIELD', {
      field: fieldName,
    });
  }
}

export class UnauthorizedError extends ApplicationError {
  constructor(message: string = 'Unauthorized access', errorCode: string = 'UNAUTHORIZED') {
    super(HttpStatus.UNAUTHORIZED, message, errorCode);
  }
}

export class ForbiddenError extends ApplicationError {
  constructor(message: string = 'Forbidden access') {
    super(HttpStatus.FORBIDDEN, message, 'FORBIDDEN');
  }
}

export class NotFoundError extends ApplicationError {
  constructor(message: string = 'Resource not found') {
    super(HttpStatus.NOT_FOUND, message, 'NOT_FOUND');
  }
}

export class ConflictError extends ApplicationError {
  constructor(message: string = 'Resource already exists', details?: unknown) {
    super(HttpStatus.CONFLICT, message, 'CONFLICT', details);
  }
}

export class InternalError extends ApplicationError {
  constructor(message: string = 'Internal server error') {
    super(HttpStatus.INTERNAL_SERVER_ERROR, message, 'INTERNAL_ERROR');
  }
}
