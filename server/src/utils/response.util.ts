import { Response } from 'express';
import HttpStatus from '../constants/httpStatus';

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface ApiSuccessResponse<T> {
  success: true;
  message?: string;
  data: T;
  meta?: PaginationMeta;
  requestId?: string;
}

const getRequestId = (res: Response): string | undefined => {
  const headerId = res.getHeader('X-Request-Id');
  if (typeof headerId === 'string') return headerId;
  return (res.req as { requestId?: string } | undefined)?.requestId;
};

export const sendSuccess = <T>(
  res: Response,
  data: T,
  message?: string,
  statusCode: number = HttpStatus.OK
): Response<ApiSuccessResponse<T>> => {
  const requestId = getRequestId(res);

  return res.status(statusCode).json({
    success: true,
    ...(message && { message }),
    data,
    ...(requestId && { requestId }),
  });
};

export const sendCreated = <T>(
  res: Response,
  data: T,
  message = 'Resource created successfully'
): Response<ApiSuccessResponse<T>> => {
  return sendSuccess(res, data, message, HttpStatus.CREATED);
};

export const sendPaginated = <T>(
  res: Response,
  data: T[],
  pagination: { total: number; page: number; limit: number },
  message?: string
): Response<ApiSuccessResponse<T[]>> => {
  const { total, page, limit } = pagination;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const requestId = getRequestId(res);

  return res.status(HttpStatus.OK).json({
    success: true,
    ...(message && { message }),
    data,
    meta: {
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
    ...(requestId && { requestId }),
  });
};
