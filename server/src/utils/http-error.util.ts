import HttpStatus from '../constants/httpStatus';

export class ApplicationError extends Error {
  public readonly code: number;

  constructor(code: number, message: string = 'An error occurred') {
    super(message);
    this.code = code;
    this.name = this.constructor.name; // Set error name for identification
    Object.setPrototypeOf(this, ApplicationError.prototype);
    Error.captureStackTrace?.(this, this.constructor); // Preserve stack trace
  }
}

export class NotFoundError extends ApplicationError {
  constructor(message: string = 'Resource not found') {
    super(HttpStatus.NOT_FOUND, message);
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

export class BadRequestError extends ApplicationError {
  constructor(message: string = 'Bad request') {
    super(HttpStatus.BAD_REQUEST, message);
    Object.setPrototypeOf(this, BadRequestError.prototype);
  }
}

export class UnauthorizedError extends ApplicationError {
  constructor(message: string = 'Unauthorized access') {
    super(HttpStatus.UNAUTHORIZED, message);
    Object.setPrototypeOf(this, UnauthorizedError.prototype);
  }
}

export class ForbiddenError extends ApplicationError {
  constructor(message: string = 'Forbidden access') {
    super(HttpStatus.FORBIDDEN, message);
    Object.setPrototypeOf(this, ForbiddenError.prototype);
  }
}

export class MissingFieldError extends BadRequestError {
  constructor(fieldName: string) {
    super(`${fieldName} is required`);
    Object.setPrototypeOf(this, MissingFieldError.prototype);
  }
}

export class InternalError extends ApplicationError {
  constructor(message: string = 'Internal server error') {
    super(HttpStatus.INTERNAL_SERVER_ERROR, message);
    Object.setPrototypeOf(this, InternalError.prototype);
  }
}